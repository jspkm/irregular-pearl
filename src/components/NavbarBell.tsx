// Navbar bell — un-cleared notifications count + popover list. Poll-only
// for Slice A (no realtime subscription). Listens to a `notifications:changed`
// window event so components that mutate notifications can trigger a
// refresh without reaching into this component.
//
// Only renders when the viewer is signed in; invisible to anon.

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase, hasSupabase } from '../lib/supabase';
import { SUBJECT_CONFIG, isSubjectTable, type SubjectTable } from '../lib/contributorSubjects';

interface NotificationRow {
  id: string;
  body: string;
  link_path: string;
  subject_table: string;
  subject_id: string;
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
  const [hasQueueAccess, setHasQueueAccess] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    if (!hasSupabase) { setSignedIn(false); return; }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { setSignedIn(false); setItems([]); setHasQueueAccess(false); return; }
    setSignedIn(true);

    // Queue access: active signed contributors only. Non-contributors get
    // a reduced popover (no "Open queue" footer, since the queue page just
    // tells them they don't belong there).
    const { data: profile } = await supabase
      .from('users')
      .select('is_contributor, contributor_active')
      .eq('id', session.user.id)
      .single();
    const canQueue = Boolean(
      (profile as { is_contributor?: boolean; contributor_active?: boolean } | null)?.is_contributor &&
        (profile as { is_contributor?: boolean; contributor_active?: boolean } | null)?.contributor_active,
    );
    setHasQueueAccess(canQueue);

    const { data: notifRows } = await supabase
      .from('notifications')
      .select('id, body, link_path, subject_table, subject_id, created_at')
      .is('cleared_at', null)
      .order('created_at', { ascending: false });
    if (!notifRows || notifRows.length === 0) { setItems([]); return; }

    // Batch-fetch subjects per subject_table (O(tables) round trips). Every
    // supported subject table has a `piece_id` column, so the projection is
    // uniform.
    const idsByTable = new Map<SubjectTable, string[]>();
    for (const n of notifRows) {
      if (!isSubjectTable(n.subject_table)) continue;
      const arr = idsByTable.get(n.subject_table) ?? [];
      arr.push(n.subject_id);
      idsByTable.set(n.subject_table, arr);
    }

    const subjectResults = await Promise.all(
      [...idsByTable.entries()].map(([table, ids]) =>
        supabase.from(SUBJECT_CONFIG[table].table).select('id, piece_id').in('id', ids),
      ),
    );
    const pieceIdBySubjectKey = new Map<string, string>();
    const pieceIdSet = new Set<string>();
    for (const [idx, [table]] of [...idsByTable.entries()].entries()) {
      const res = subjectResults[idx];
      for (const row of (res.data ?? []) as { id: string; piece_id: string }[]) {
        pieceIdBySubjectKey.set(`${table}:${row.id}`, row.piece_id);
        pieceIdSet.add(row.piece_id);
      }
    }

    const { data: piecesData } = pieceIdSet.size
      ? await supabase.from('pieces').select('id, title, catalog_number').in('id', [...pieceIdSet])
      : { data: [] };
    const pieceById = new Map((piecesData ?? []).map((p) => [p.id, p as PieceRef]));

    setItems(
      notifRows.map((n) => {
        const pieceId = pieceIdBySubjectKey.get(`${n.subject_table}:${n.subject_id}`);
        return { ...n, piece: pieceId ? pieceById.get(pieceId) ?? null : null };
      }),
    );
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
                      <a
                        href={n.link_path}
                        className="block px-4 py-3 text-sm text-ink no-underline hover:bg-bg-tint"
                        onClick={() => setOpen(false)}
                      >
                        {pieceLabel && (
                          <div className="font-display text-[15px] leading-tight mb-0.5">{pieceLabel}</div>
                        )}
                        <div className="text-xs text-muted leading-snug">{n.body}</div>
                      </a>
                    </li>
                  );
                })}
              </ul>
              {hasQueueAccess && (
                <div className="px-4 py-2 border-t-[0.5px] border-border bg-bg-tint">
                  <a
                    href="/notifications"
                    className="text-xs text-accent no-underline hover:underline"
                    onClick={() => setOpen(false)}
                  >
                    Open queue &rarr;
                  </a>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
