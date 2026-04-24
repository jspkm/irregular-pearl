// Per-section inline composer. Renders at the top of each body-only section
// (PerformersNotes, InterpretiveSchools, SignedPieceDescription) when the
// sender is in drafting mode. Three visual states:
//
//   1. No draft yet + not composing → "+ Propose a <kind>" button.
//   2. Composing a new draft → inline form (body textarea, or name+body for
//      interpretive school), [Add draft] [Cancel].
//   3. Existing draft + not editing → distinctive dashed-border card with
//      preview body, [Edit] and [Remove] (inline confirm chip on remove).
//   4. Editing existing draft → form pre-loaded, [Save draft] [Cancel].
//
// The form takes a `renderFields` prop so interpretive_school can add its
// name + tempo_cues fields above the shared body textarea.

import { useState, type ReactNode } from 'react';
import type { DraftKind, OutboxDraft } from '../lib/contributionDrafts';
import {
  KIND_ARTICLE,
  KIND_LABEL,
  rowsToTempoCues,
  tempoCuesToRows,
  type TempoRow,
} from '../lib/draftKinds';
import { useComposeDraft } from '../lib/useComposeDraft';
import TempoCuesEditor from './TempoCuesEditor';
import TempoCuesDisplay from './TempoCuesDisplay';

function previewBody(kind: DraftKind, payload: Record<string, unknown>): string {
  if (kind === 'interpretive_school') {
    const name = typeof payload.name === 'string' ? payload.name : '';
    const body = typeof payload.body === 'string' ? payload.body : '';
    return name ? `${name} — ${body}` : body;
  }
  return typeof payload.body === 'string' ? payload.body : '';
}

interface Props {
  pieceId: string;
  kind: DraftKind;
  /** Called when compose mode resolves — lets the parent hide its normal
   * self-author entry so only one "add" affordance is visible. */
  onEnabledChange?: (enabled: boolean) => void;
}

export default function ComposeDraftBlock({ pieceId, kind, onEnabledChange }: Props) {
  const { enabled, ready, myDraft, busy, error, propose, update, remove, clearError } =
    useComposeDraft({ pieceId, kind });
  const [composing, setComposing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  if (ready && onEnabledChange) onEnabledChange(enabled);

  if (!enabled) return null;

  const kindLabel = KIND_LABEL[kind];

  return (
    <div className="compose-block" data-compose-kind={kind}>
      {error && (
        <div role="alert" className="compose-block-error">
          {error}{' '}
          <button type="button" className="compose-block-dismiss" onClick={clearError}>
            dismiss
          </button>
        </div>
      )}

      {myDraft && !editing && (
        <div className="compose-block-card">
          <div className="compose-block-kicker">
            ✎ Your proposed {kindLabel} · will send when you click Send drafts
          </div>
          <div className="compose-block-body">{previewBody(kind, myDraft.payload)}</div>
          {kind === 'interpretive_school' && <TempoCuesDisplay raw={myDraft.payload.tempo_cues} />}
          <div className="compose-block-actions">
            {!confirmRemove ? (
              <>
                <button type="button" className="compose-block-btn" disabled={busy} onClick={() => setEditing(true)}>
                  Edit
                </button>
                <button
                  type="button"
                  className="compose-block-btn compose-block-btn-danger"
                  disabled={busy}
                  onClick={() => setConfirmRemove(true)}
                >
                  Remove
                </button>
              </>
            ) : (
              <span className="compose-block-confirm">
                Remove this draft?
                <button
                  type="button"
                  className="compose-block-btn compose-block-btn-danger"
                  disabled={busy}
                  onClick={async () => {
                    const ok = await remove();
                    if (ok) setConfirmRemove(false);
                  }}
                >
                  Yes, remove
                </button>
                <button
                  type="button"
                  className="compose-block-btn"
                  disabled={busy}
                  onClick={() => setConfirmRemove(false)}
                >
                  Cancel
                </button>
              </span>
            )}
          </div>
        </div>
      )}

      {myDraft && editing && (
        <DraftForm
          kind={kind}
          initial={myDraft.payload}
          submitting={busy}
          onCancel={() => setEditing(false)}
          onSubmit={async (payload) => {
            const ok = await update(payload);
            if (ok) setEditing(false);
          }}
          submitLabel="Save draft"
        />
      )}

      {!myDraft && composing && (
        <DraftForm
          kind={kind}
          initial={null}
          submitting={busy}
          onCancel={() => setComposing(false)}
          onSubmit={async (payload) => {
            const ok = await propose(payload);
            if (ok) setComposing(false);
          }}
          submitLabel="Add draft"
        />
      )}

      {!myDraft && !composing && (
        <button
          type="button"
          className="compose-block-propose"
          onClick={() => { clearError(); setComposing(true); }}
        >
          + Propose {KIND_ARTICLE[kind]} {kindLabel} for the recipient
        </button>
      )}

      <style>{`
        .compose-block {
          margin-bottom: 24px;
          padding: 14px 16px;
          background: var(--accent-soft, #F0E9F4);
          border: 0.5px solid var(--accent, #6B4E7C);
          border-radius: 10px;
          font-family: var(--font-sans);
        }
        html[data-theme="dark"] .compose-block {
          background: rgba(107, 78, 124, 0.15);
        }
        .compose-block-error {
          margin-bottom: 10px;
          padding: 6px 10px;
          border-radius: 6px;
          background: var(--color-error-bg, #F7E4E4);
          color: var(--color-error, #A32D2D);
          border: 0.5px solid var(--color-error, #A32D2D);
          font-size: 12px;
        }
        .compose-block-dismiss {
          margin-left: 8px;
          background: transparent;
          border: 0;
          color: inherit;
          text-decoration: underline;
          cursor: pointer;
          font: inherit;
        }
        .compose-block-card {
          padding: 10px 12px;
          border: 0.5px dashed var(--accent, #6B4E7C);
          border-radius: 8px;
          background: var(--bg, #FFFFFF);
          color: var(--ink, #1A1A1A);
        }
        html[data-theme="dark"] .compose-block-card {
          background: var(--bg);
          color: var(--ink);
        }
        .compose-block-kicker {
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--accent, #6B4E7C);
          margin-bottom: 8px;
        }
        .compose-block-body {
          font-family: var(--font-serif);
          font-size: 15px;
          line-height: 1.55;
          color: var(--ink, #1A1A1A);
          white-space: pre-wrap;
          margin-bottom: 10px;
        }
        .compose-block-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          align-items: center;
        }
        .compose-block-confirm {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--ink, #1A1A1A);
        }
        .compose-block-btn {
          font-family: inherit;
          font-size: 12px;
          padding: 4px 10px;
          border-radius: 6px;
          border: 0.5px solid var(--border-strong, #CFCCC5);
          background: transparent;
          color: var(--ink, #1A1A1A);
          cursor: pointer;
        }
        .compose-block-btn:hover:not(:disabled) {
          border-color: var(--accent, #6B4E7C);
          color: var(--accent, #6B4E7C);
        }
        .compose-block-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .compose-block-btn-danger {
          color: var(--color-error, #A32D2D);
          border-color: var(--color-error, #A32D2D);
        }
        .compose-block-btn-danger:hover:not(:disabled) {
          background: var(--color-error-bg, #FAE5E5);
        }
        .compose-block-propose {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: inherit;
          font-size: 13px;
          font-weight: 500;
          padding: 7px 14px;
          border-radius: 6px;
          border: 0.5px dashed var(--accent, #6B4E7C);
          background: transparent;
          color: var(--accent, #6B4E7C);
          cursor: pointer;
        }
        .compose-block-propose:hover {
          background: var(--accent, #6B4E7C);
          color: var(--bg, #FFFFFF);
        }
      `}</style>
    </div>
  );
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

  const [body, setBody] = useState(initBody);
  const [name, setName] = useState(initName);
  const [tempoRows, setTempoRows] = useState<TempoRow[]>(
    () => tempoCuesToRows(props.initial?.tempo_cues),
  );

  function submit() {
    if (props.kind === 'interpretive_school') {
      const payload: Record<string, unknown> = { name: name.trim(), body };
      const cues = rowsToTempoCues(tempoRows);
      if (cues) payload.tempo_cues = cues;
      props.onSubmit(payload);
      return;
    }
    props.onSubmit({ body });
  }

  const valid = props.kind === 'interpretive_school'
    ? body.trim().length > 0 && name.trim().length > 0
    : body.trim().length > 0;

  const placeholder =
    props.kind === 'performers_note'
      ? "Write the note the way you'd want to read it on another musician's piece page."
      : props.kind === 'piece_description'
        ? 'An editorial essay on the piece, in your voice.'
        : 'What defines this interpretive school? What are its hallmarks?';

  return (
    <div className="compose-form">
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
          <label>Tempo cues (optional)</label>
          <TempoCuesEditor rows={tempoRows} onChange={setTempoRows} />
        </>
      )}
      <label>Body</label>
      <textarea
        rows={props.kind === 'piece_description' ? 8 : 6}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder}
      />
      <div className="compose-form-actions">
        <button
          type="button"
          className="compose-form-submit"
          onClick={submit}
          disabled={!valid || props.submitting}
        >
          {props.submitting ? 'Saving…' : props.submitLabel}
        </button>
        <button
          type="button"
          className="compose-block-btn"
          onClick={props.onCancel}
          disabled={props.submitting}
        >
          Cancel
        </button>
      </div>
      <style>{`
        .compose-form { display: flex; flex-direction: column; gap: 2px; }
        .compose-form label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--muted, #6F6F6F);
          margin: 8px 0 4px;
        }
        .compose-form input,
        .compose-form textarea {
          width: 100%;
          box-sizing: border-box;
          font-family: var(--font-serif);
          font-size: 15px;
          line-height: 1.55;
          color: var(--ink, #1A1A1A);
          background: var(--bg, #FFFFFF);
          border: 0.5px solid var(--border-strong, #CFCCC5);
          border-radius: 6px;
          padding: 8px 10px;
        }
        .compose-form input[type="text"] {
          font-family: var(--font-sans);
          font-size: 13px;
        }
        html[data-theme="dark"] .compose-form input,
        html[data-theme="dark"] .compose-form textarea {
          background: rgba(255, 255, 255, 0.04);
        }
        .compose-form input:focus,
        .compose-form textarea:focus {
          outline: none;
          border-color: var(--accent, #6B4E7C);
        }
        .compose-form-error {
          margin-top: 8px;
          padding: 6px 10px;
          border-radius: 6px;
          background: var(--color-error-bg, #F7E4E4);
          color: var(--color-error, #A32D2D);
          font-size: 12px;
          border: 0.5px solid var(--color-error, #A32D2D);
        }
        .compose-form-actions {
          display: flex;
          gap: 8px;
          margin-top: 10px;
        }
        .compose-form-submit {
          font-family: inherit;
          font-size: 13px;
          font-weight: 500;
          padding: 7px 14px;
          border-radius: 6px;
          border: 0;
          background: var(--accent, #6B4E7C);
          color: #FFFFFF;
          cursor: pointer;
        }
        .compose-form-submit:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </div>
  );
}
