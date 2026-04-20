// Navbar bell — un-cleared notifications count + popover list. Poll-only
// for Slice A (no realtime subscription). Listens to a `notifications:changed`
// window event so components that mutate notifications can trigger a
// refresh without reaching into this component.
//
// Only renders when the viewer is signed in; invisible to anon.

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase, hasSupabase } from '../lib/supabase';

interface NotificationRow {
  id: string;
  body: string;
  link_path: string;
  performers_note_id: string;
  created_at: string;
}

interface PieceRef {
  id: string;
  title: string;
  catalog_number: string | null;
}

interface NotificationItem extends NotificationRow {
  piece: PieceRef | null;
}

/** Badge-text rule per plan: hidden at 0, exact 1–9, "9+" at 10+. */
export function bellBadgeText(count: number): string | null {
  if (count <= 0) return null;
  if (count > 9) return '9+';
  return String(count);
}

export default function NavbarBell() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    if (!hasSupabase) { setSignedIn(false); return; }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { setSignedIn(false); setItems([]); return; }
    setSignedIn(true);

    const { data: notifRows } = await supabase
      .from('notifications')
      .select('id, body, link_path, performers_note_id, created_at')
      .is('cleared_at', null)
      .order('created_at', { ascending: false });
    if (!notifRows || notifRows.length === 0) { setItems([]); return; }

    // Join to piece via the note → piece_id link. Two round trips so we
    // keep PostgREST happy across the composite FKs.
    const noteIds = [...new Set(notifRows.map((n) => n.performers_note_id))];
    const { data: notesData } = await supabase
      .from('performers_notes')
      .select('id, piece_id')
      .in('id', noteIds);
    const pieceIds = [...new Set((notesData ?? []).map((n) => n.piece_id))];
    const { data: piecesData } = pieceIds.length
      ? await supabase.from('pieces').select('id, title, catalog_number').in('id', pieceIds)
      : { data: [] };

    const pieceByNoteId = new Map<string, PieceRef>();
    const pieceIdByNoteId = new Map((notesData ?? []).map((n) => [n.id, n.piece_id]));
    const pieceById = new Map((piecesData ?? []).map((p) => [p.id, p as PieceRef]));
    for (const [noteId, pieceId] of pieceIdByNoteId) {
      const piece = pieceById.get(pieceId);
      if (piece) pieceByNoteId.set(noteId, piece);
    }

    setItems(notifRows.map((n) => ({ ...n, piece: pieceByNoteId.get(n.performers_note_id) ?? null })));
  }, []);

  useEffect(() => {
    void refresh();
    const onVis = () => { if (document.visibilityState === 'visible') void refresh(); };
    const onEvent = () => { void refresh(); };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('notifications:changed', onEvent);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('notifications:changed', onEvent);
    };
  }, [refresh]);

  // Close popover on outside click / escape
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  async function handleClearOne(id: string) {
    setBusy(true);
    const { error } = await supabase.rpc('clear_notification', { p_notification_id: id });
    setBusy(false);
    if (!error) {
      setItems((prev) => prev.filter((n) => n.id !== id));
      window.dispatchEvent(new Event('notifications:changed'));
    }
  }

  async function handleClearAll() {
    setBusy(true);
    const { error } = await supabase.rpc('clear_all_notifications');
    setBusy(false);
    if (!error) {
      setItems([]);
      setOpen(false);
      window.dispatchEvent(new Event('notifications:changed'));
    }
  }

  // Invisible when not signed in (loading or anon).
  if (signedIn !== true) return null;

  const count = items.length;
  const badgeText = bellBadgeText(count);

  return (
    <div ref={containerRef} className="relative inline-flex">
      <button
        type="button"
        aria-label={badgeText ? `Notifications (${badgeText})` : 'Notifications'}
        onClick={() => setOpen((o) => !o)}
        className="bg-transparent border-0 p-0 text-ink hover:text-accent transition-colors cursor-pointer inline-flex items-center relative"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {badgeText && (
          <span
            aria-hidden="true"
            className="absolute -top-1 -right-1.5 min-w-[16px] h-[16px] px-1 text-[10px] leading-[16px] text-center rounded-full font-medium"
            style={{ background: 'var(--color-accent)', color: '#FFFFFF' }}
          >
            {badgeText}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-[320px] max-w-[calc(100vw-32px)] rounded-xl bg-surface border-[0.5px] border-border shadow-md overflow-hidden z-50"
          role="dialog"
          aria-label="Notifications"
        >
          <div className="px-4 py-3 border-b-[0.5px] border-border">
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] uppercase tracking-wider font-medium" style={{ color: 'var(--color-accent)' }}>
                Notifications
              </span>
              <span className="text-[11px] text-tertiary">
                {count === 0 ? 'All clear' : `${count} waiting`}
              </span>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-muted">Nothing waiting.</div>
          ) : (
            <>
              <ul className="max-h-[360px] overflow-y-auto">
                {items.map((n) => {
                  const pieceLabel = n.piece
                    ? `${n.piece.title}${n.piece.catalog_number ? ` (${n.piece.catalog_number})` : ''}`
                    : null;
                  return (
                    <li key={n.id} className="border-b-[0.5px] border-border last:border-b-0">
                      <div className="px-4 py-3">
                        <a
                          href={n.link_path}
                          className="block text-sm text-ink no-underline hover:underline"
                          onClick={() => setOpen(false)}
                        >
                          {pieceLabel && (
                            <div className="font-display text-[15px] leading-tight mb-0.5">{pieceLabel}</div>
                          )}
                          <div className="text-xs text-muted leading-snug">{n.body}</div>
                        </a>
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleClearOne(n.id)}
                            disabled={busy}
                            className="text-[11px] text-tertiary hover:text-ink underline underline-offset-2 disabled:opacity-50"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="px-4 py-2 border-t-[0.5px] border-border bg-bg-tint flex items-center justify-between">
                <a
                  href="/notifications"
                  className="text-xs text-accent no-underline hover:underline"
                  onClick={() => setOpen(false)}
                >
                  Open queue &rarr;
                </a>
                <button
                  type="button"
                  onClick={handleClearAll}
                  disabled={busy}
                  className="text-[11px] text-tertiary hover:text-ink underline underline-offset-2 disabled:opacity-50"
                >
                  {busy ? 'Clearing…' : 'Clear all'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
