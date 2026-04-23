// Recipient's Drafts tab on /notifications. Lists every undecided pending
// contribution_request_draft addressed to the current viewer across all
// pieces — including ones they previously hit "Add to Todo" on the piece
// page (those have inline_dismissed_at stamped but are still pending).
//
// Per plan §4.4: each row shows piece title + composer, sender, kind label,
// body preview, and four actions inline (Accept as-is / Edit & accept /
// Decline). "Add to Todo" is hidden because this IS the Todos screen.
// "Open piece page →" is a link out for context.
//
// Reuses PendingDraftCard for the body + action UI. The card already
// handles the inline editor, error toasts, and lifecycle/race conditions.
// This component adds the per-row piece header + sign-in / empty-state copy.

import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, hasSupabase } from '../lib/supabase';
import { fetchPendingDraftsForViewer, type PendingDraft, type DraftKind } from '../lib/contributionDrafts';
import PendingDraftCard from './PendingDraftCard';

type Status = 'loading' | 'unauthed' | 'ready';

const KIND_LABEL: Record<DraftKind, string> = {
  performers_note: "Performer's note",
  interpretive_school: 'Interpretive school',
  piece_description: 'Piece description',
  landmark: 'Landmark',
};

export default function RecipientDraftsTab() {
  const [status, setStatus] = useState<Status>('loading');
  const [drafts, setDrafts] = useState<PendingDraft[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!hasSupabase) {
      setStatus('unauthed');
      setDrafts([]);
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      setStatus('unauthed');
      setDrafts([]);
      return;
    }
    const all = await fetchPendingDraftsForViewer();
    setDrafts(all);
    setStatus('ready');
  }, []);

  useEffect(() => {
    void refetch();
    if (!hasSupabase) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, _s: Session | null) => {
      void refetch();
    });
    return () => subscription.unsubscribe();
  }, [refetch]);

  // Auto-clear toast after 4s
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  function handleResolved(draftId: string, message: string | null) {
    setDrafts((prev) => prev.filter((d) => d.draftId !== draftId));
    if (message) setToast(message);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('notifications:changed'));
    }
  }

  if (status === 'loading') {
    return <div className="drafts-tab-empty">Loading…</div>;
  }
  if (status === 'unauthed') {
    return (
      <div className="drafts-tab-empty">
        Sign in to see drafts that have been proposed for you.
      </div>
    );
  }

  if (drafts.length === 0) {
    return (
      <div className="drafts-tab-empty">
        Nothing in your inbox. Anyone you've collaborated with would land their
        proposed drafts here.
      </div>
    );
  }

  return (
    <div className="drafts-tab">
      {error && (
        <div role="alert" className="drafts-tab-error">{error}</div>
      )}
      {toast && (
        <div role="status" className="pending-draft-toast">{toast}</div>
      )}
      <ul className="drafts-tab-list">
        {drafts.map((d) => (
          <li key={d.draftId} className="drafts-tab-row">
            <div className="drafts-tab-row-head">
              <span className="drafts-tab-kind">{KIND_LABEL[d.kind]}</span>
              {d.piece && (
                <>
                  <span className="drafts-tab-sep" aria-hidden="true">·</span>
                  <a className="drafts-tab-piece" href={`/piece/${d.piece.id}`}>
                    {d.piece.title}
                  </a>
                  {d.piece.composerName && (
                    <span className="drafts-tab-composer"> — {d.piece.composerName}</span>
                  )}
                </>
              )}
            </div>
            <PendingDraftCard
              draft={d}
              onResolved={handleResolved}
              trailingAction={
                d.piece && (
                  <a href={`/piece/${d.piece.id}`} className="pending-draft-trailing-link">
                    Open piece page →
                  </a>
                )
              }
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
