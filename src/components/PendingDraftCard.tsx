// Pending-draft proposal card rendered inline on the recipient's piece page.
// Used by PerformersNotes / InterpretiveSchools / SignedPieceDescription /
// StructuralLandmarks when a sent draft of the matching kind is addressed
// to the current viewer.
//
// Four actions per draft (PR 2 spec):
//   - Accept as-is: act_on_draft('accept_as_is')
//   - Edit & accept: open inline editor pre-loaded with payload, then
//                    act_on_draft('edit_and_accept', { ...edited })
//   - Decline:      act_on_draft('decline')
//   - Add to Todo:  dismiss_draft_inline (card disappears from inline view,
//                                          persists on /messages Drafts tab — PR 3)
//
// Edit form is per-kind:
//   performers_note + piece_description: textarea (body)
//   interpretive_school:                 name + textarea (body)
//   landmark:                            label + description + measure range
//
// The card surfaces soft toasts for the two race conditions act_on_draft
// reports back: draft_no_longer_available (sender deleted) and
// draft_already_dispositioned (another tab acted first). On either, the
// card hides itself and tells the parent via onResolved so the list
// re-renders without it.

import { useState } from 'react';
import {
  actOnDraft,
  dismissDraftInline,
  type DraftKind,
  type PendingDraft,
} from '../lib/contributionDrafts';

interface Props {
  draft: PendingDraft;
  /** Called with a soft-toast message and the draft id whenever the card
   * resolves (acted, dismissed, or auto-removed due to a race). The parent
   * removes the draft from its local state and may show the toast. */
  onResolved: (draftId: string, toast: string | null) => void;
}

export default function PendingDraftCard({ draft, onResolved }: Props) {
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit-form local state (initialized from payload when the editor opens).
  const [editBody, setEditBody] = useState('');
  const [editName, setEditName] = useState('');
  const [editLabel, setEditLabel] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editMeasureStart, setEditMeasureStart] = useState('');
  const [editMeasureEnd, setEditMeasureEnd] = useState('');

  const senderName = draft.sender.displayName ?? 'Someone';
  const bodyPreview = renderBodyPreview(draft);

  function openEditor() {
    const p = draft.payload;
    setEditBody(typeof p.body === 'string' ? p.body : '');
    setEditName(typeof p.name === 'string' ? p.name : '');
    setEditLabel(typeof p.label === 'string' ? p.label : '');
    setEditDescription(typeof p.description === 'string' ? p.description : '');
    setEditMeasureStart(typeof p.measure_start === 'number' ? String(p.measure_start) : '');
    setEditMeasureEnd(
      typeof p.measure_end === 'number' && p.measure_end !== null ? String(p.measure_end) : '',
    );
    setError(null);
    setEditing(true);
  }

  function buildEditedPayload(): Record<string, unknown> | null {
    const p = { ...draft.payload };
    if (draft.kind === 'performers_note' || draft.kind === 'piece_description') {
      if (editBody.trim().length === 0) {
        setError('Body required.');
        return null;
      }
      return { ...p, body: editBody };
    }
    if (draft.kind === 'interpretive_school') {
      if (editName.trim().length === 0) { setError('Name required.'); return null; }
      if (editBody.trim().length === 0) { setError('Body required.'); return null; }
      return { ...p, name: editName, body: editBody };
    }
    if (draft.kind === 'landmark') {
      if (editLabel.trim().length === 0) { setError('Label required.'); return null; }
      const ms = parseInt(editMeasureStart, 10);
      if (Number.isNaN(ms) || ms < 1) { setError('Measure start must be ≥ 1.'); return null; }
      const me = editMeasureEnd.trim() === '' ? null : parseInt(editMeasureEnd, 10);
      if (me !== null && (Number.isNaN(me) || me < ms)) {
        setError('Measure end must be ≥ measure start.');
        return null;
      }
      return {
        ...p,
        label: editLabel,
        description: editDescription.trim() === '' ? null : editDescription,
        measure_start: ms,
        measure_end: me,
      };
    }
    return null;
  }

  async function handleAction(action: 'accept_as_is' | 'edit_and_accept' | 'decline') {
    let payloadOverride: Record<string, unknown> | undefined;
    if (action === 'edit_and_accept') {
      const built = buildEditedPayload();
      if (!built) return;
      payloadOverride = built;
    }
    setBusy(true);
    setError(null);
    const result = await actOnDraft(draft.draftId, action, payloadOverride);
    setBusy(false);
    if (result.errorCode) {
      // Both race conditions auto-remove the card; the soft toast tells the user why.
      const toast =
        result.errorCode === 'draft_already_dispositioned'
          ? 'You already responded to this proposal.'
          : result.errorCode === 'draft_no_longer_available'
          ? `${senderName} retracted this proposal.`
          : `Could not ${humanize(action)}. Try again.`;
      // For "unknown" errors, keep the card visible so the user can retry.
      if (result.errorCode === 'unknown') {
        setError(toast);
        return;
      }
      onResolved(draft.draftId, toast);
      return;
    }
    const toast =
      action === 'accept_as_is'
        ? 'Accepted. Published under your byline.'
        : action === 'edit_and_accept'
        ? 'Saved. Published under your byline.'
        : 'Declined.';
    onResolved(draft.draftId, toast);
  }

  async function handleAddToTodo() {
    setBusy(true);
    setError(null);
    const result = await dismissDraftInline(draft.draftId);
    setBusy(false);
    if (result.errorCode && result.errorCode !== 'unknown') {
      onResolved(draft.draftId, null);
      return;
    }
    if (result.errorCode === 'unknown') {
      setError('Could not save for later. Try again.');
      return;
    }
    onResolved(draft.draftId, 'Saved to your Drafts tab.');
  }

  return (
    <div className="pending-draft" data-kind={draft.kind}>
      <div className="pending-draft-kicker">
        <span className="pending-draft-spark" aria-hidden="true">✦</span>
        <span>Proposed by {senderName}</span>
      </div>

      {!editing && (
        <div className="pending-draft-body">{bodyPreview}</div>
      )}

      {editing && (
        <div className="pending-draft-editor">
          {(draft.kind === 'interpretive_school') && (
            <label className="pending-draft-field">
              <span className="pending-draft-label">Name</span>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                disabled={busy}
                maxLength={200}
              />
            </label>
          )}
          {draft.kind === 'landmark' && (
            <>
              <label className="pending-draft-field">
                <span className="pending-draft-label">Label</span>
                <input
                  type="text"
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  disabled={busy}
                  maxLength={60}
                />
              </label>
              <div className="pending-draft-row">
                <label className="pending-draft-field">
                  <span className="pending-draft-label">m.</span>
                  <input
                    type="number"
                    value={editMeasureStart}
                    onChange={(e) => setEditMeasureStart(e.target.value)}
                    disabled={busy}
                    min={1}
                  />
                </label>
                <label className="pending-draft-field">
                  <span className="pending-draft-label">– m.</span>
                  <input
                    type="number"
                    value={editMeasureEnd}
                    onChange={(e) => setEditMeasureEnd(e.target.value)}
                    disabled={busy}
                    min={1}
                    placeholder="(none)"
                  />
                </label>
              </div>
              <label className="pending-draft-field">
                <span className="pending-draft-label">Description (optional)</span>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  disabled={busy}
                  maxLength={4000}
                  rows={2}
                />
              </label>
            </>
          )}
          {draft.kind !== 'landmark' && (
            <label className="pending-draft-field">
              <span className="pending-draft-label">
                {draft.kind === 'interpretive_school' ? 'Description' : 'Body'}
              </span>
              <textarea
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                disabled={busy}
                rows={6}
              />
            </label>
          )}
        </div>
      )}

      {error && (
        <div role="alert" className="pending-draft-error">
          {error}
        </div>
      )}

      <div className="pending-draft-actions">
        {!editing && (
          <>
            <button
              type="button"
              className="pending-draft-btn primary"
              disabled={busy}
              onClick={() => handleAction('accept_as_is')}
            >
              Accept as-is
            </button>
            <button
              type="button"
              className="pending-draft-btn"
              disabled={busy}
              onClick={openEditor}
            >
              Edit & accept
            </button>
            <button
              type="button"
              className="pending-draft-btn"
              disabled={busy}
              onClick={() => handleAction('decline')}
            >
              Decline
            </button>
            <button
              type="button"
              className="pending-draft-btn"
              disabled={busy}
              onClick={handleAddToTodo}
            >
              Add to Todo
            </button>
          </>
        )}
        {editing && (
          <>
            <button
              type="button"
              className="pending-draft-btn primary"
              disabled={busy}
              onClick={() => handleAction('edit_and_accept')}
            >
              {busy ? 'Saving…' : 'Save & accept'}
            </button>
            <button
              type="button"
              className="pending-draft-btn"
              disabled={busy}
              onClick={() => { setEditing(false); setError(null); }}
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function renderBodyPreview(draft: PendingDraft) {
  const p = draft.payload;
  if (draft.kind === 'landmark') {
    const label = typeof p.label === 'string' ? p.label : '(unlabeled)';
    const ms = typeof p.measure_start === 'number' ? p.measure_start : null;
    const me = typeof p.measure_end === 'number' ? p.measure_end : null;
    const range = ms === null ? '' : me === null ? `m. ${ms}` : `m. ${ms}–${me}`;
    const desc = typeof p.description === 'string' ? p.description : '';
    return (
      <>
        <div className="pending-draft-landmark-head">
          <span className="pending-draft-landmark-label">{label}</span>
          {range && <span className="pending-draft-landmark-range">{range}</span>}
        </div>
        {desc && <div className="pending-draft-landmark-desc">{desc}</div>}
      </>
    );
  }
  if (draft.kind === 'interpretive_school') {
    const name = typeof p.name === 'string' ? p.name : '(unnamed)';
    const body = typeof p.body === 'string' ? p.body : '';
    return (
      <>
        <div className="pending-draft-school-name">{name}</div>
        <div className="pending-draft-prose">{body}</div>
      </>
    );
  }
  // performers_note + piece_description: just body
  const body = typeof p.body === 'string' ? p.body : '';
  return <div className="pending-draft-prose">{body}</div>;
}

function humanize(action: 'accept_as_is' | 'edit_and_accept' | 'decline'): string {
  if (action === 'accept_as_is') return 'accept';
  if (action === 'edit_and_accept') return 'save';
  return 'decline';
}

export type { DraftKind };
