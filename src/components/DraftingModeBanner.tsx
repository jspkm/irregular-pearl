// Sticky drafting-mode banner shown at the top of a piece page when the
// URL carries ?compose=<request_id> AND the viewer is the sender of that
// outbox request AND the viewer still has staff role.
//
// Three actions: Send drafts (stamps sent_at, fires recipient notification,
// redirects to /piece/[slug]), Save & exit (redirects to /piece/[slug]
// without mutating the outbox), Delete request (opens inline confirm chip,
// cascades drafts). Delete affordance confirms inline rather than via a
// native dialog.
//
// Disabled states:
//   - recipient deleted (recipient_id IS NULL on the request) → Send disabled
//   - viewer demoted from staff → all mutation buttons disabled with an
//     explanation strip; Save & exit still works (it's a navigation, not a
//     mutation).

import { useCallback, useEffect, useState } from 'react';
import { supabase, hasSupabase } from '../lib/supabase';
import {
  deleteOutboxRequest,
  fetchOutboxRequest,
  fetchSenderDraftsForRequest,
  sendRequest,
  type OutboxRequest,
  type OutboxDraft,
} from '../lib/contributionDrafts';

interface Props {
  pieceId: string;
}

type Status = 'loading' | 'hidden' | 'ready';

function readComposeRequestIdFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const raw = params.get('compose');
  if (!raw) return null;
  // Basic UUID sanity; server-side RPC validates authoritatively.
  return /^[0-9a-f-]{8,}$/i.test(raw) ? raw : null;
}

export default function DraftingModeBanner({ pieceId }: Props) {
  const [status, setStatus] = useState<Status>('loading');
  const [request, setRequest] = useState<OutboxRequest | null>(null);
  const [drafts, setDrafts] = useState<OutboxDraft[]>([]);
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [isStaff, setIsStaff] = useState<boolean | null>(null);
  const [busy, setBusy] = useState<null | 'send' | 'delete' | 'save'>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetchDrafts = useCallback(async (requestId: string) => {
    const rows = await fetchSenderDraftsForRequest(requestId);
    setDrafts(rows);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!hasSupabase) { setStatus('hidden'); return; }
      const composeId = readComposeRequestIdFromUrl();
      if (!composeId) { setStatus('hidden'); return; }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { if (!cancelled) setStatus('hidden'); return; }
      if (cancelled) return;
      setViewerId(session.user.id);

      const { data: profile } = await supabase
        .from('users').select('role').eq('id', session.user.id).single();
      if (cancelled) return;
      const role = (profile as { role?: string } | null)?.role ?? null;
      const staff = role === 'admin' || role === 'moderator';
      setIsStaff(staff);

      const req = await fetchOutboxRequest(composeId);
      if (cancelled) return;
      // Banner only shows for: matching piece + current viewer is sender +
      // outbox state. Sender's RLS already scopes readable rows to their own.
      if (!req || req.pieceId !== pieceId || req.senderId !== session.user.id || req.sentAt !== null) {
        setStatus('hidden');
        return;
      }
      setRequest(req);
      await refetchDrafts(composeId);
      if (cancelled) return;
      setStatus('ready');
    }

    void load();

    // Other surfaces on the page fire notifications:changed when they mutate
    // drafts; refresh the count in sync so the banner reflects what's ready
    // to send.
    function onChange() {
      if (!request) return;
      void refetchDrafts(request.id);
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('drafts:changed', onChange);
    }
    return () => {
      cancelled = true;
      if (typeof window !== 'undefined') {
        window.removeEventListener('drafts:changed', onChange);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pieceId]);

  async function handleSend() {
    if (!request || busy) return;
    setBusy('send');
    setError(null);
    const { errorMessage } = await sendRequest(request.id);
    setBusy(null);
    if (errorMessage) { setError(errorMessage); return; }
    // Redirect back to the piece without ?compose so the banner unmounts.
    window.location.href = `/piece/${pieceId}`;
  }

  function handleSaveAndExit() {
    if (busy) return;
    setBusy('save');
    window.location.href = `/piece/${pieceId}`;
  }

  async function handleDelete() {
    if (!request || busy) return;
    setBusy('delete');
    setError(null);
    const { errorMessage } = await deleteOutboxRequest(request.id);
    setBusy(null);
    if (errorMessage) { setError(errorMessage); setConfirmDelete(false); return; }
    window.location.href = `/`;
  }

  if (status !== 'ready' || !request) return null;

  const hasRecipient = request.recipientId !== null;
  const demoted = isStaff === false;
  const sendDisabled = !hasRecipient || demoted || busy !== null;
  const deleteDisabled = demoted || busy !== null;
  const draftCount = drafts.length;
  const recipientName = request.recipientDisplayName ?? (hasRecipient ? '(unknown)' : '(deleted user)');
  const sendLabel = busy === 'send'
    ? 'Sending…'
    : draftCount === 0
      ? 'Send (0 drafts)'
      : `Send (${draftCount} draft${draftCount === 1 ? '' : 's'})`;

  return (
    <div
      className="dm-banner"
      role="region"
      aria-label="Drafting mode"
    >
      <div className="dm-banner-inner">
        <div className="dm-banner-lede">
          <span className="dm-pencil" aria-hidden="true">✎</span>
          <span className="dm-text">
            Drafting for <strong>{recipientName}</strong>
            <span className="dm-count">
              {draftCount === 0 ? ' · no drafts yet' : ` · ${draftCount} draft${draftCount === 1 ? '' : 's'}`}
            </span>
          </span>
        </div>
        <div className="dm-actions">
          {!hasRecipient && (
            <span className="dm-warning" role="status">
              Recipient no longer exists — delete this request to start over.
            </span>
          )}
          {demoted && (
            <span className="dm-warning" role="status">
              You no longer have staff role. This outbox is read-only.
            </span>
          )}
          <button
            type="button"
            onClick={handleSend}
            disabled={sendDisabled}
            className="dm-btn dm-btn-primary"
          >
            {sendLabel}
          </button>
          <button
            type="button"
            onClick={handleSaveAndExit}
            disabled={busy !== null}
            className="dm-btn dm-btn-ghost"
          >
            Save &amp; exit
          </button>
          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              disabled={deleteDisabled}
              className="dm-btn dm-btn-danger"
            >
              Delete request
            </button>
          ) : (
            <span className="dm-confirm">
              Delete this request{draftCount > 0 ? ` and ${draftCount} draft${draftCount === 1 ? '' : 's'}` : ''}?
              <button
                type="button"
                onClick={handleDelete}
                disabled={busy !== null}
                className="dm-btn dm-btn-danger dm-btn-sm"
              >
                {busy === 'delete' ? 'Deleting…' : 'Delete'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={busy !== null}
                className="dm-btn dm-btn-ghost dm-btn-sm"
              >
                Cancel
              </button>
            </span>
          )}
        </div>
      </div>
      {error && (
        <div className="dm-error" role="alert">
          {error}
        </div>
      )}
      <style>{`
        .dm-banner {
          position: sticky;
          top: 0;
          z-index: 40;
          background: var(--accent-soft, #F0E9F4);
          border-bottom: 0.5px solid var(--accent, #6B4E7C);
          padding: 10px 20px;
          font-family: var(--font-sans);
        }
        .dm-banner-inner {
          max-width: 960px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        .dm-banner-lede {
          flex: 1 1 auto;
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--ink, #1A1A1A);
          font-size: 14px;
        }
        .dm-pencil {
          color: var(--accent, #6B4E7C);
          font-size: 16px;
        }
        .dm-text strong { font-weight: 600; }
        .dm-count { color: var(--muted, #6F6F6F); }
        .dm-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .dm-warning {
          font-size: 12px;
          color: #8A5A00;
          background: #FFF5E0;
          padding: 4px 8px;
          border-radius: 4px;
          border: 0.5px solid #E0C48A;
        }
        .dm-btn {
          font-family: inherit;
          font-size: 13px;
          font-weight: 500;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          transition: background-color 120ms ease, border-color 120ms ease, color 120ms ease;
          border: 0.5px solid transparent;
        }
        .dm-btn-sm {
          font-size: 12px;
          padding: 4px 8px;
        }
        .dm-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .dm-btn-primary {
          background: var(--accent, #6B4E7C);
          color: #fff;
          border-color: var(--accent, #6B4E7C);
        }
        .dm-btn-primary:hover:not(:disabled) { background: #563c66; }
        .dm-btn-ghost {
          background: transparent;
          color: var(--ink, #1A1A1A);
          border-color: var(--border-strong, #CFCCC5);
        }
        .dm-btn-ghost:hover:not(:disabled) { background: rgba(0,0,0,0.04); }
        .dm-btn-danger {
          background: transparent;
          color: #A32D2D;
          border-color: #E4B5B5;
        }
        .dm-btn-danger:hover:not(:disabled) {
          background: #FAE5E5;
        }
        .dm-confirm {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--ink, #1A1A1A);
        }
        .dm-error {
          max-width: 960px;
          margin: 8px auto 0;
          font-size: 13px;
          color: #A32D2D;
        }
      `}</style>
    </div>
  );
}
