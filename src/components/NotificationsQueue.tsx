// Messages list on /notifications. Renders contribution_request messages
// (someone asked you to contribute to piece X). The recipient opens the
// piece, publishes (or the request auto-clears via the publish trigger), or
// dismisses the request.
//
// As of PR 5, the old draft-approval queue is retired. Staff no longer drafts
// signed content under a contributor's byline via the admin pages; instead
// they use the drafting-mode banner on the piece page. Draft-style items
// now live in the Open items tab (RecipientDraftsTab).
//
// The source of truth for "what is pending" remains notifications —
// un-cleared rows with subject_table='contribution_requests' render as
// message cards here.

import { useEffect, useState, useCallback } from 'react';
import { supabase, hasSupabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

type Status = 'loading' | 'unauthed' | 'ready';

interface ContributionRequestMessage {
  notificationId: string;
  requestId: string;
  pieceId: string;
  pieceTitle: string;
  composerName: string;
  catalogNumber: string | null;
  senderName: string;
  note: string | null;
  createdAt: string;
}

export default function NotificationsQueue() {
  const [status, setStatus] = useState<Status>('loading');
  const [isStaff, setIsStaff] = useState(false);
  const [messages, setMessages] = useState<ContributionRequestMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadQueue = useCallback(async (session: Session) => {
    setError(null);

    const { data: profileRow, error: profileErr } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();
    if (profileErr) {
      setError(profileErr.message);
      return;
    }
    const role = (profileRow as { role?: string } | null)?.role;
    setIsStaff(role === 'moderator' || role === 'admin');

    const { data: notifs, error: notifErr } = await supabase
      .from('notifications')
      .select('id, subject_table, subject_id, created_at')
      .is('cleared_at', null)
      .eq('subject_table', 'contribution_requests')
      .order('created_at', { ascending: false });
    if (notifErr) {
      setError(notifErr.message);
      return;
    }
    if (!notifs || notifs.length === 0) {
      setMessages([]);
      setStatus('ready');
      return;
    }

    const contribRequestIds = notifs.map((n) => n.subject_id as string);

    const { data: crRows, error: crErr } = await supabase
      .from('contribution_requests')
      .select('id, piece_id, sender_id, note, created_at')
      .in('id', contribRequestIds);
    if (crErr) {
      setError(crErr.message);
      return;
    }
    const crList = (crRows ?? []) as {
      id: string;
      piece_id: string;
      sender_id: string;
      note: string | null;
      created_at: string;
    }[];

    const senderIds = [...new Set(crList.map((r) => r.sender_id))];
    const pieceIdsForMsgs = [...new Set(crList.map((r) => r.piece_id))];
    const [sendersRes, piecesForMsgsRes] = await Promise.all([
      senderIds.length
        ? supabase.from('users').select('id, display_name').in('id', senderIds)
        : Promise.resolve({ data: [], error: null }),
      pieceIdsForMsgs.length
        ? supabase
            .from('pieces')
            .select('id, title, composer_name, catalog_number')
            .in('id', pieceIdsForMsgs)
        : Promise.resolve({ data: [], error: null }),
    ]);
    const senderById = new Map(
      ((sendersRes.data ?? []) as { id: string; display_name: string }[]).map((u) => [u.id, u.display_name]),
    );
    const pieceForMsgsById = new Map(
      (
        (piecesForMsgsRes.data ?? []) as {
          id: string;
          title: string;
          composer_name: string;
          catalog_number: string | null;
        }[]
      ).map((p) => [p.id, p]),
    );
    const crById = new Map(crList.map((r) => [r.id, r]));

    const msgs: ContributionRequestMessage[] = notifs
      .flatMap((n) => {
        const cr = crById.get(n.subject_id as string);
        if (!cr) return [];
        const piece = pieceForMsgsById.get(cr.piece_id);
        if (!piece) return [];
        return [
          {
            notificationId: n.id as string,
            requestId: cr.id,
            pieceId: cr.piece_id,
            pieceTitle: piece.title,
            composerName: piece.composer_name,
            catalogNumber: piece.catalog_number ?? null,
            senderName: senderById.get(cr.sender_id) ?? 'Someone',
            note: cr.note,
            createdAt: cr.created_at,
          },
        ];
      });

    setMessages(msgs);
    setStatus('ready');
  }, []);

  useEffect(() => {
    if (!hasSupabase) { setStatus('unauthed'); return; }
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { setStatus('unauthed'); return; }
      void loadQueue(session);
    });
  }, [loadQueue]);

  if (status === 'loading') {
    return <div className="text-sm text-muted font-body">Loading…</div>;
  }
  if (status === 'unauthed') {
    return (
      <div className="font-body">
        <h1 className="text-2xl font-display text-ink mb-3">Messages</h1>
        <p className="text-sm text-muted">You need to be signed in to see your messages.</p>
      </div>
    );
  }

  return (
    <div className="font-body">
      <h1 className="text-[28px] font-display text-ink mb-8 tracking-tight">Messages</h1>

      {error && (
        <div className="mb-6 rounded-lg border-[0.5px] border-error bg-error-bg px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      {messages.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="space-y-4">
          {messages.map((m) => (
            <MessageCard
              key={`msg:${m.notificationId}`}
              m={m}
              canDismiss={!isStaff}
              onDismissed={(requestId) =>
                setMessages((rows) => rows.filter((r) => r.requestId !== requestId))
              }
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function MessageCard({
  m,
  canDismiss,
  onDismissed,
}: {
  m: ContributionRequestMessage;
  canDismiss: boolean;
  onDismissed: (requestId: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleDismiss() {
    setBusy(true);
    setErr(null);
    const { error } = await supabase.rpc('dismiss_contribution_request', {
      p_request_id: m.requestId,
    });
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('notifications:changed'));
    onDismissed(m.requestId);
  }

  return (
    <li className="rounded-xl border-[0.5px] border-border bg-surface p-5">
      <div
        className="text-[11px] font-medium tracking-[0.08em] uppercase mb-4"
        style={{ color: 'var(--color-accent)' }}
      >
        Contribution request
      </div>

      <div className="pb-4 mb-5 border-b-[0.5px] border-border">
        <div className="flex items-baseline flex-wrap gap-x-3 gap-y-1">
          <a
            href={`/piece/${m.pieceId}`}
            className="font-display text-[22px] text-ink leading-tight tracking-tight no-underline hover:underline"
          >
            {m.pieceTitle}
          </a>
          {m.catalogNumber && (
            <span className="text-[11px] font-mono text-tertiary tracking-wide">
              {m.catalogNumber}
            </span>
          )}
        </div>
        <div className="mt-1 text-sm text-muted">
          by <span className="text-ink">{m.composerName}</span>
        </div>
      </div>

      <div className="text-sm text-ink font-body mb-2">
        <span className="font-medium">{m.senderName}</span>
        <span className="text-muted"> asked you to contribute.</span>
      </div>
      <div className="text-[11px] text-tertiary mb-4">{formatTimestamp(m.createdAt)}</div>

      {m.note && (
        <div
          className="pl-[18px] border-l-2 font-display text-[15px] text-ink leading-[1.68] whitespace-pre-wrap italic mb-2"
          style={{ borderLeftColor: 'var(--color-accent)' }}
        >
          &ldquo;{m.note}&rdquo;
        </div>
      )}

      {err && (
        <div className="mt-3 text-xs text-error" role="alert">
          {err}
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <a
          href={`/piece/${m.pieceId}`}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-ink text-bg text-sm font-medium rounded-lg hover:opacity-90 transition-opacity no-underline"
        >
          Open piece <span aria-hidden="true">→</span>
        </a>
        {canDismiss && (
          <button
            type="button"
            onClick={handleDismiss}
            disabled={busy}
            className="inline-flex items-center px-4 py-2 bg-transparent text-muted text-sm font-medium border-[0.5px] border-border-strong rounded-lg hover:text-ink hover:border-ink disabled:opacity-50 transition-colors"
          >
            {busy ? 'Dismissing…' : 'Dismiss'}
          </button>
        )}
      </div>
    </li>
  );
}

function EmptyState() {
  return (
    <div className="border-[0.5px] border-border bg-surface rounded-xl px-6 py-10 text-center">
      <p className="text-sm text-muted">No messages.</p>
    </div>
  );
}
