// Component-level tests for the navbar bell. The bell now renders as a
// direct link to the Messages page (no popover). These tests pin that
// contract so it can't silently regress back to a dialog.

import { GlobalRegistrator } from '@happy-dom/global-registrator';
if (!globalThis.document) GlobalRegistrator.register();
import { afterAll, afterEach, beforeEach, describe, test, expect, mock } from 'bun:test';
import * as realSupabaseModule from '../lib/supabase';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';

const BELL_LAST_VIEWED_KEY = 'ip.bell.lastViewedAt';

// In-memory mock for the supabase client. Each test seeds these before
// importing the component (via dynamic import in the test body).
type NotifRow = { created_at: string };
const supabaseState: {
  session: { user: { id: string } } | null;
  notifications: NotifRow[];
} = {
  session: null,
  notifications: [],
};

const supabaseStub = {
  auth: {
    getSession: async () => ({ data: { session: supabaseState.session } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
  },
  from: (_table: string) => ({
    select: (_cols: string) => ({
      is: (_col: string, _val: null) => ({
        order: async (_col: string, _opts: unknown) => ({
          data: supabaseState.notifications,
        }),
      }),
    }),
  }),
};

// Bun's mock.module patches the module registry process-wide and is never
// rolled back on its own, so a stub installed here leaks into every test file
// that loads afterwards. This stub only implements from().select().is()
// .order(), so any later file calling .select().eq() got
// "eq is not a function" — which is what took out pieces.test.ts,
// StartContributionButton, RequestContributionDialog and
// SignedPieceDifficulty in full-suite runs while they all passed standalone.
//
// Capture the real module (safe to import: `supabase` is a lazy Proxy that
// falls back to a placeholder client when env vars are absent) and put it
// back once this file's tests are done.
const realSupabase = { ...realSupabaseModule };

mock.module('../lib/supabase', () => ({
  supabase: supabaseStub,
  hasSupabase: true,
}));

afterAll(() => {
  mock.module('../lib/supabase', () => realSupabase);
});

describe('NavbarBell', () => {
  beforeEach(() => {
    supabaseState.session = { user: { id: 'user-1' } };
    supabaseState.notifications = [];
    window.localStorage.clear();
  });
  afterEach(() => cleanup());

  test('hides for anon viewers', async () => {
    supabaseState.session = null;
    const { default: NavbarBell } = await import('./NavbarBell');
    const { container } = render(<NavbarBell />);
    // Anon: nothing rendered. Wait one tick for the async getSession() to
    // resolve and the component to re-render with signedIn=false.
    await new Promise((r) => setTimeout(r, 50));
    expect(container.querySelector('a[aria-label^="Notifications"]')).toBeNull();
    expect(container.querySelector('button[aria-label^="Notifications"]')).toBeNull();
  });

  test('signed-in: renders as a link to /notifications, not a button', async () => {
    const { default: NavbarBell } = await import('./NavbarBell');
    const { container } = render(<NavbarBell />);
    const link = await waitFor(() => {
      const el = container.querySelector('a[aria-label^="Notifications"]');
      if (!el) throw new Error('bell link not yet rendered');
      return el as HTMLAnchorElement;
    });
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe('/notifications');
    // No dialog/popover surface anywhere.
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(container.querySelector('button[aria-label^="Notifications"]')).toBeNull();
  });

  test('badge reflects unviewed-notification count', async () => {
    supabaseState.notifications = [
      { created_at: '2026-01-03T00:00:00Z' },
      { created_at: '2026-01-02T00:00:00Z' },
      { created_at: '2026-01-01T00:00:00Z' },
    ];
    const { default: NavbarBell } = await import('./NavbarBell');
    const { container } = render(<NavbarBell />);
    await waitFor(() => {
      const badge = container.querySelector('a[aria-label^="Notifications"] span');
      if (!badge) throw new Error('badge not yet rendered');
      expect(badge.textContent).toBe('3');
    });
    expect(container.querySelector('a[aria-label^="Notifications"]')?.getAttribute('aria-label')).toBe(
      'Notifications (3)',
    );
  });

  test('clicking the bell stamps the ack watermark in localStorage', async () => {
    supabaseState.notifications = [{ created_at: '2026-01-01T00:00:00Z' }];
    const { default: NavbarBell } = await import('./NavbarBell');
    const { container } = render(<NavbarBell />);
    const link = await waitFor(() => {
      const el = container.querySelector('a[aria-label^="Notifications"]');
      if (!el) throw new Error('bell link not yet rendered');
      return el as HTMLAnchorElement;
    });

    expect(window.localStorage.getItem(BELL_LAST_VIEWED_KEY)).toBeNull();
    fireEvent.click(link);
    const stamp = window.localStorage.getItem(BELL_LAST_VIEWED_KEY);
    expect(stamp).toBeTruthy();
    // Stamp is a valid ISO timestamp.
    expect(Number.isNaN(Date.parse(stamp!))).toBe(false);
  });
});
