// Component-level tests for the navbar bell. The bell now renders as a
// direct link to the Messages page (no popover). These tests pin that
// contract so it can't silently regress back to a dialog.

import { GlobalRegistrator } from '@happy-dom/global-registrator';
if (!globalThis.document) GlobalRegistrator.register();
import { afterEach, beforeEach, describe, test, expect, mock } from 'bun:test';
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

mock.module('../lib/supabase', () => ({
  supabase: supabaseStub,
  hasSupabase: true,
}));

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
