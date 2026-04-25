// Navbar bell — un-cleared notifications count + direct link to the
// Messages page. Poll-only for Slice A (no realtime subscription). Listens
// to a `notifications:changed` window event so components that mutate
// notifications can trigger a refresh without reaching into this component.
//
// Only renders when the viewer is signed in; invisible to anon.

import { useCallback, useEffect, useState } from 'react';
import { supabase, hasSupabase } from '../lib/supabase';

/** Badge-text rule per plan: hidden at 0, exact 1–9, "9+" at 10+. */
export function bellBadgeText(count: number): string | null {
  if (count <= 0) return null;
  if (count > 9) return '9+';
  return String(count);
}

// Bell acknowledgement: clicking the bell counts as "I've seen the bell
// for now" across all current items. Stamped in localStorage so subsequent
// loads hide anything created before the last interaction. Device-local
// by design — clicking on the laptop doesn't clear the phone's bell, which
// matches the bell's semantics (it's a surface for the current session,
// not a persistent inbox). The real inbox is the Messages page.
const BELL_LAST_VIEWED_KEY = 'ip.bell.lastViewedAt';

function readBellLastViewed(): string | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage.getItem(BELL_LAST_VIEWED_KEY) : null;
  } catch {
    return null;
  }
}

function writeBellLastViewed(iso: string) {
  try {
    if (typeof window !== 'undefined') window.localStorage.setItem(BELL_LAST_VIEWED_KEY, iso);
  } catch {
    // Storage may be disabled; bell still works, just won't auto-clear.
  }
}

export default function NavbarBell() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [createdAts, setCreatedAts] = useState<string[]>([]);
  const [lastViewedAt, setLastViewedAt] = useState<string | null>(() => readBellLastViewed());

  const refresh = useCallback(async () => {
    if (!hasSupabase) { setSignedIn(false); return; }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { setSignedIn(false); setCreatedAts([]); return; }
    setSignedIn(true);

    const { data: notifRows } = await supabase
      .from('notifications')
      .select('created_at')
      .is('cleared_at', null)
      .order('created_at', { ascending: false });
    setCreatedAts((notifRows ?? []).map((n) => n.created_at as string));
  }, []);

  useEffect(() => {
    void refresh();
    const onVis = () => { if (document.visibilityState === 'visible') void refresh(); };
    const onEvent = () => { void refresh(); };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('notifications:changed', onEvent);

    // Refresh on auth-state changes so the bell appears immediately after
    // sign-in (and disappears on sign-out) instead of waiting for the next
    // visibilitychange / notifications:changed event.
    const authSub = hasSupabase
      ? supabase.auth.onAuthStateChange(() => { void refresh(); }).data.subscription
      : null;

    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('notifications:changed', onEvent);
      authSub?.unsubscribe();
    };
  }, [refresh]);

  // Invisible when not signed in (loading or anon).
  if (signedIn !== true) return null;

  // Filter by the bell acknowledgement watermark: anything created before
  // the last bell interaction is considered "seen" in the bell context and
  // hidden from the count. The underlying notifications are still live on
  // the Messages page.
  const count = lastViewedAt
    ? createdAts.filter((c) => c > lastViewedAt).length
    : createdAts.length;
  const badgeText = bellBadgeText(count);

  function acknowledgeBell() {
    const now = new Date().toISOString();
    writeBellLastViewed(now);
    setLastViewedAt(now);
  }

  return (
    <a
      href="/notifications"
      aria-label={badgeText ? `Notifications (${badgeText})` : 'Notifications'}
      onClick={acknowledgeBell}
      className="relative inline-flex items-center text-ink hover:text-accent transition-colors no-underline"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
      {badgeText && (
        <span
          aria-hidden="true"
          className="absolute -top-1 -right-1.5 min-w-[16px] h-[16px] px-1 text-[10px] leading-[16px] text-center rounded-full font-medium"
          style={{ background: 'var(--color-accent)', color: 'var(--color-bg)' }}
        >
          {badgeText}
        </span>
      )}
    </a>
  );
}
