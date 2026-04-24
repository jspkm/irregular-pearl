// Dedicated composer panel that mounts below the drafting-mode banner when
// the URL carries ?compose=<request_id>. Lists the sender's existing drafts
// on the request and provides a unified "+ Add draft" flow that picks kind
// and opens the matching form.
//
// v1 supports the three body-only kinds (performer's note, interpretive
// school, piece description). Landmark drafts can be proposed via the
// propose_draft RPC but are not surfaced in this composer yet; see the
// CHANGELOG for the v1 scope note.

import { useCallback, useEffect, useState } from 'react';
import {
  type DraftKind,
  type OutboxDraft,
  deleteOutboxDraft,
  fetchSenderDraftsForRequest,
  proposeDraft,
  updateOutboxDraft,
} from '../lib/contributionDrafts';
import { hasSupabase, supabase } from '../lib/supabase';

interface Props {
  pieceId: string;
}

const COMPOSABLE_KINDS: DraftKind[] = ['performers_note', 'interpretive_school', 'piece_description'];

const KIND_LABEL: Record<DraftKind, string> = {
  performers_note: "Performer's note",
  interpretive_school: 'Interpretive school',
  piece_description: 'Piece description',
  landmark: 'Landmark',
};

function readComposeRequestIdFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const raw = params.get('compose');
  return raw && /^[0-9a-f-]{8,}$/i.test(raw) ? raw : null;
}

function previewBody(kind: DraftKind, payload: Record<string, unknown>): string {
  if (kind === 'interpretive_school') {
    const name = typeof payload.name === 'string' ? payload.name : '';
    const body = typeof payload.body === 'string' ? payload.body : '';
    return name ? `${name} — ${body}` : body;
  }
  if (kind === 'landmark') {
    const label = typeof payload.label === 'string' ? payload.label : '';
    const desc = typeof payload.description === 'string' ? payload.description : '';
    return desc ? `${label} — ${desc}` : label;
  }
  return typeof payload.body === 'string' ? payload.body : '';
}

type EditState =
  | { mode: 'none' }
  | { mode: 'new'; kind: DraftKind }
  | { mode: 'edit'; draft: OutboxDraft };

type ConfirmRemove = { draftId: string } | null;

export default function ComposeDraftsPanel({ pieceId }: Props) {
  const [requestId, setRequestId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [gated, setGated] = useState(true);
  const [drafts, setDrafts] = useState<OutboxDraft[]>([]);
  const [editState, setEditState] = useState<EditState>({ mode: 'none' });
  const [confirmRemove, setConfirmRemove] = useState<ConfirmRemove>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async (rid: string) => {
    const rows = await fetchSenderDraftsForRequest(rid);
    setDrafts(rows);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!hasSupabase) { setGated(true); setReady(true); return; }
      const rid = readComposeRequestIdFromUrl();
      if (!rid) { setGated(true); setReady(true); return; }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { if (!cancelled) { setGated(true); setReady(true); } return; }

      const { data: profile } = await supabase
        .from('users').select('role').eq('id', session.user.id).single();
      const role = (profile as { role?: string } | null)?.role ?? null;
      if (role !== 'admin' && role !== 'moderator') {
        if (!cancelled) { setGated(true); setReady(true); }
        return;
      }

      const { data: req } = await supabase
        .from('contribution_requests')
        .select('sender_id, piece_id, sent_at')
        .eq('id', rid)
        .maybeSingle();
      if (cancelled) return;
      const r = req as { sender_id?: string; piece_id?: string; sent_at?: string | null } | null;
      if (!r || r.sender_id !== session.user.id || r.piece_id !== pieceId || r.sent_at !== null) {
        setGated(true); setReady(true); return;
      }

      setRequestId(rid);
      await refresh(rid);
      if (cancelled) return;
      setGated(false);
      setReady(true);
    }

    void init();
    return () => { cancelled = true; };
  }, [pieceId, refresh]);

  function fireDraftsChanged() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('drafts:changed'));
    }
  }

  async function handleConfirmRemove(draft: OutboxDraft) {
    if (!requestId || busy) return;
    setBusy(true);
    setError(null);
    const { errorMessage } = await deleteOutboxDraft(draft.id);
    setBusy(false);
    setConfirmRemove(null);
    if (errorMessage) { setError(errorMessage); return; }
    await refresh(requestId);
    fireDraftsChanged();
  }

  async function handleSubmitNew(kind: DraftKind, payload: Record<string, unknown>) {
    if (!requestId || busy) return;
    setBusy(true);
    setError(null);
    const { errorMessage } = await proposeDraft(requestId, kind, payload);
    setBusy(false);
    if (errorMessage) { setError(mapSubmitError(errorMessage)); return; }
    setEditState({ mode: 'none' });
    await refresh(requestId);
    fireDraftsChanged();
  }

  async function handleSubmitEdit(draft: OutboxDraft, payload: Record<string, unknown>) {
    if (!requestId || busy) return;
    setBusy(true);
    setError(null);
    const { errorMessage } = await updateOutboxDraft(draft.id, payload);
    setBusy(false);
    if (errorMessage) { setError(mapSubmitError(errorMessage)); return; }
    setEditState({ mode: 'none' });
    await refresh(requestId);
    fireDraftsChanged();
  }

  if (!ready || gated || !requestId) return null;

  const existingKinds = new Set(drafts.map((d) => d.kind));
  const availableKinds = COMPOSABLE_KINDS.filter((k) => !existingKinds.has(k));

  return (
    <section className="compose-panel" aria-label="Compose drafts for the recipient">
      <header className="compose-panel-header">
        <h2>Drafts to send</h2>
        <p className="compose-panel-hint">
          These are suggestions for the recipient. Each draft is proposed with
          their byline in mind — they&apos;ll see your body and can accept it
          as-is, edit and accept, or decline.
        </p>
      </header>

      {error && (
        <div role="alert" className="compose-panel-error">
          {error}
        </div>
      )}

      {drafts.length === 0 && (
        <p className="compose-panel-empty">
          No drafts yet. Add one below, or send just the request (no drafts).
        </p>
      )}

      {drafts.length > 0 && (
        <ul className="compose-drafts-list">
          {drafts.map((d) => {
            const isEditing = editState.mode === 'edit' && editState.draft.id === d.id;
            if (isEditing) {
              return (
                <li key={d.id} className="compose-draft-card compose-draft-editing">
                  <div className="compose-draft-kind">{KIND_LABEL[d.kind]}</div>
                  <DraftForm
                    kind={d.kind}
                    initial={d.payload}
                    submitting={busy}
                    onCancel={() => setEditState({ mode: 'none' })}
                    onSubmit={(payload) => handleSubmitEdit(d, payload)}
                    submitLabel="Save draft"
                  />
                </li>
              );
            }
            const isConfirming = confirmRemove?.draftId === d.id;
            return (
              <li key={d.id} className="compose-draft-card">
                <div className="compose-draft-kind">{KIND_LABEL[d.kind]}</div>
                <div className="compose-draft-body">{previewBody(d.kind, d.payload)}</div>
                <div className="compose-draft-actions">
                  {!isConfirming ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setEditState({ mode: 'edit', draft: d })}
                        disabled={busy}
                        className="compose-draft-btn"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmRemove({ draftId: d.id })}
                        disabled={busy}
                        className="compose-draft-btn compose-draft-btn-danger"
                      >
                        Remove
                      </button>
                    </>
                  ) : (
                    <span className="compose-confirm-chip">
                      Remove this draft?
                      <button
                        type="button"
                        onClick={() => handleConfirmRemove(d)}
                        disabled={busy}
                        className="compose-draft-btn compose-draft-btn-danger"
                      >
                        Yes, remove
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmRemove(null)}
                        disabled={busy}
                        className="compose-draft-btn"
                      >
                        Cancel
                      </button>
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {editState.mode === 'new' && (
        <div className="compose-draft-new">
          <div className="compose-draft-kind">{KIND_LABEL[editState.kind]}</div>
          <DraftForm
            kind={editState.kind}
            initial={null}
            submitting={busy}
            onCancel={() => setEditState({ mode: 'none' })}
            onSubmit={(payload) => handleSubmitNew(editState.kind, payload)}
            submitLabel="Add draft"
          />
        </div>
      )}

      {editState.mode === 'none' && availableKinds.length > 0 && (
        <div className="compose-draft-add-row">
          <span className="compose-draft-add-label">Add a draft:</span>
          {availableKinds.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => { setError(null); setEditState({ mode: 'new', kind: k }); }}
              className="compose-draft-btn"
              disabled={busy}
            >
              + {KIND_LABEL[k]}
            </button>
          ))}
        </div>
      )}

      {editState.mode === 'none' && availableKinds.length === 0 && drafts.length > 0 && (
        <p className="compose-panel-hint">
          One draft per kind per request. Edit or remove a draft above to add
          another kind.
        </p>
      )}

      <style>{`
        .compose-panel {
          max-width: 880px;
          margin: 16px auto 24px;
          padding: 16px 20px;
          background: var(--surface, #FAF8F4);
          border: 0.5px solid var(--border-strong, #CFCCC5);
          border-radius: 10px;
          font-family: var(--font-sans);
        }
        .compose-panel-header h2 {
          font-family: var(--font-display, var(--font-serif));
          font-size: 18px;
          margin: 0 0 4px;
          color: var(--ink);
        }
        .compose-panel-hint {
          margin: 0 0 12px;
          font-size: 12px;
          color: var(--muted);
        }
        .compose-panel-empty {
          margin: 8px 0 12px;
          font-size: 13px;
          color: var(--muted);
          font-style: italic;
        }
        .compose-panel-error {
          margin: 8px 0 12px;
          padding: 6px 10px;
          border-radius: 6px;
          background: #F7E4E4;
          color: #A32D2D;
          font-size: 12px;
          border: 0.5px solid #E4B5B5;
        }
        .compose-drafts-list {
          list-style: none;
          padding: 0;
          margin: 0 0 12px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .compose-draft-card {
          padding: 10px 12px;
          background: var(--bg, #fff);
          border: 0.5px dashed var(--accent, #6B4E7C);
          border-radius: 8px;
          display: grid;
          grid-template-columns: 1fr auto;
          column-gap: 12px;
          align-items: start;
        }
        .compose-draft-editing {
          grid-template-columns: 1fr;
        }
        .compose-draft-kind {
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--accent, #6B4E7C);
          grid-column: 1 / -1;
          margin-bottom: 4px;
        }
        .compose-draft-body {
          font-family: var(--font-serif);
          font-size: 14px;
          color: var(--ink);
          white-space: pre-wrap;
          line-height: 1.55;
        }
        .compose-draft-actions {
          display: flex;
          flex-direction: column;
          gap: 4px;
          align-items: end;
        }
        .compose-confirm-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--ink);
        }
        .compose-draft-add-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          padding-top: 10px;
          border-top: 0.5px solid var(--border-strong, #CFCCC5);
        }
        .compose-draft-add-label {
          font-size: 13px;
          color: var(--muted);
        }
        .compose-draft-btn {
          font-family: inherit;
          font-size: 12px;
          padding: 4px 10px;
          border-radius: 6px;
          border: 0.5px solid var(--border-strong, #CFCCC5);
          background: transparent;
          color: var(--ink);
          cursor: pointer;
        }
        .compose-draft-btn:hover:not(:disabled) {
          border-color: var(--accent);
          color: var(--accent);
        }
        .compose-draft-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .compose-draft-btn-danger {
          color: #A32D2D;
          border-color: #E4B5B5;
        }
        .compose-draft-btn-danger:hover:not(:disabled) {
          background: #FAE5E5;
          color: #7a1d1d;
        }
        .compose-draft-form textarea,
        .compose-draft-form input {
          width: 100%;
          font-family: var(--font-serif);
          font-size: 14px;
          color: var(--ink);
          background: transparent;
          border: 0.5px solid var(--border-strong, #CFCCC5);
          border-radius: 6px;
          padding: 8px 10px;
          box-sizing: border-box;
        }
        .compose-draft-form input[type=text] {
          font-family: var(--font-sans);
          font-size: 13px;
        }
        .compose-draft-form label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--muted);
          display: block;
          margin: 8px 0 4px;
        }
        .compose-draft-form-actions {
          display: flex;
          gap: 8px;
          margin-top: 10px;
        }
        .compose-draft-submit {
          font-family: inherit;
          font-size: 12px;
          padding: 6px 12px;
          border-radius: 6px;
          background: var(--accent, #6B4E7C);
          color: #fff;
          border: 0;
          cursor: pointer;
        }
        .compose-draft-submit:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </section>
  );
}

function mapSubmitError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('a draft of this kind already exists')) {
    return 'You already have a draft of this kind on this request. Edit it instead.';
  }
  if (m.includes('already sent')) {
    return 'This request was already sent in another tab.';
  }
  if (m.includes('payload.body required')) return 'Body is required.';
  if (m.includes('payload.name required')) return 'Name is required.';
  if (m.includes('exceeds 40000')) return 'Body too long (40,000 character limit).';
  if (m.includes('exceeds 200')) return 'Name too long (200 character limit).';
  return message;
}

interface FormProps {
  kind: DraftKind;
  initial: Record<string, unknown> | null;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (payload: Record<string, unknown>) => void;
  submitLabel: string;
}

function DraftForm(props: FormProps) {
  const initBody = typeof props.initial?.body === 'string' ? (props.initial!.body as string) : '';
  const initName = typeof props.initial?.name === 'string' ? (props.initial!.name as string) : '';
  const initTempoCues = props.initial?.tempo_cues && typeof props.initial.tempo_cues === 'object'
    ? JSON.stringify(props.initial.tempo_cues, null, 2)
    : '';

  const [body, setBody] = useState(initBody);
  const [name, setName] = useState(initName);
  const [tempoCues, setTempoCues] = useState(initTempoCues);

  const [parseErr, setParseErr] = useState<string | null>(null);

  function submit() {
    setParseErr(null);
    if (props.kind === 'interpretive_school') {
      const payload: Record<string, unknown> = { name: name.trim(), body };
      if (tempoCues.trim()) {
        try {
          payload.tempo_cues = JSON.parse(tempoCues);
        } catch {
          setParseErr('Tempo cues must be valid JSON.');
          return;
        }
      }
      props.onSubmit(payload);
      return;
    }
    props.onSubmit({ body });
  }

  const valid = props.kind === 'interpretive_school'
    ? body.trim().length > 0 && name.trim().length > 0
    : body.trim().length > 0;

  return (
    <div className="compose-draft-form">
      {props.kind === 'interpretive_school' && (
        <>
          <label>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Baroque authentic"
            maxLength={200}
          />
          <label>Tempo cues (optional JSON)</label>
          <textarea
            rows={3}
            value={tempoCues}
            onChange={(e) => setTempoCues(e.target.value)}
            placeholder='{"prelude": "♩ = 60"}'
          />
        </>
      )}
      <label>Body</label>
      <textarea
        rows={props.kind === 'piece_description' ? 8 : 6}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={
          props.kind === 'performers_note'
            ? "Write the note the way you'd want to read it on another musician's piece page."
            : props.kind === 'piece_description'
              ? 'An editorial essay on the piece, in your voice.'
              : 'What defines this interpretive school? What are its hallmarks?'
        }
      />
      {parseErr && (
        <div className="compose-panel-error" role="alert">{parseErr}</div>
      )}
      <div className="compose-draft-form-actions">
        <button
          type="button"
          onClick={submit}
          disabled={!valid || props.submitting}
          className="compose-draft-submit"
        >
          {props.submitting ? 'Saving…' : props.submitLabel}
        </button>
        <button
          type="button"
          onClick={props.onCancel}
          disabled={props.submitting}
          className="compose-draft-btn"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
