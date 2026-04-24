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

import { useRef, useState, type ReactNode } from 'react';
import type { DraftKind, OutboxDraft } from '../lib/contributionDrafts';
import { useComposeDraft } from '../lib/useComposeDraft';

const KIND_ARTICLE: Record<DraftKind, string> = {
  performers_note: 'a',
  interpretive_school: 'an',
  piece_description: 'a',
  landmark: 'a',
};

const KIND_LABEL: Record<DraftKind, string> = {
  performers_note: "performer's note",
  interpretive_school: 'interpretive school',
  piece_description: 'piece description',
  landmark: 'landmark',
};

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
          {kind === 'interpretive_school' && (() => {
            const cues = myDraft.payload.tempo_cues;
            if (!cues || typeof cues !== 'object' || Array.isArray(cues)) return null;
            const entries = Object.entries(cues as Record<string, unknown>).filter(
              ([, v]) => typeof v === 'string' && v.trim().length > 0,
            );
            if (entries.length === 0) return null;
            return (
              <div className="compose-block-tempo">
                <span className="compose-block-tempo-label">Tempo cues</span>
                <ul className="compose-block-tempo-list">
                  {entries.map(([section, value]) => (
                    <li key={section}>
                      <span className="compose-block-tempo-section">{section}</span>
                      <span className="compose-block-tempo-value">{value as string}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })()}
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
        .compose-block-tempo {
          margin: 0 0 10px;
          padding: 8px 10px;
          border-radius: 6px;
          background: var(--surface, #FAF8F4);
          border: 0.5px solid var(--border-strong, #CFCCC5);
        }
        html[data-theme="dark"] .compose-block-tempo {
          background: rgba(255, 255, 255, 0.03);
        }
        .compose-block-tempo-label {
          display: block;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--muted, #6F6F6F);
          margin-bottom: 4px;
        }
        .compose-block-tempo-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-wrap: wrap;
          gap: 4px 16px;
        }
        .compose-block-tempo-list li {
          display: inline-flex;
          align-items: baseline;
          gap: 8px;
          font-size: 13px;
        }
        .compose-block-tempo-section {
          font-family: var(--font-sans);
          color: var(--muted, #6F6F6F);
          font-style: italic;
        }
        .compose-block-tempo-value {
          font-family: var(--font-serif);
          color: var(--ink, #1A1A1A);
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

interface TempoRow {
  section: string;
  value: string;
}

function tempoCuesToRows(raw: unknown): TempoRow[] {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return [];
  const out: TempoRow[] = [];
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    out.push({ section: k, value: typeof v === 'string' ? v : String(v ?? '') });
  }
  return out;
}

function rowsToTempoCues(rows: TempoRow[]): Record<string, string> | null {
  const obj: Record<string, string> = {};
  let any = false;
  for (const r of rows) {
    const s = r.section.trim();
    const v = r.value.trim();
    if (!s || !v) continue;
    obj[s] = v;
    any = true;
  }
  return any ? obj : null;
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

// Music symbols commonly used in tempo indications. Insertion goes into the
// tempo-value input that was most recently focused. Keys are duration names,
// values are the Unicode glyph to insert.
const NOTE_SYMBOLS: { label: string; glyph: string; aria: string }[] = [
  { label: 'whole', glyph: '𝅝', aria: 'whole note' },
  { label: 'half', glyph: '𝅗𝅥', aria: 'half note' },
  { label: 'dotted half', glyph: '𝅗𝅥.', aria: 'dotted half note' },
  { label: 'quarter', glyph: '♩', aria: 'quarter note' },
  { label: 'dotted quarter', glyph: '♩.', aria: 'dotted quarter note' },
  { label: 'eighth', glyph: '♪', aria: 'eighth note' },
  { label: 'two eighths', glyph: '♫', aria: 'beamed eighth notes' },
  { label: 'sixteenth', glyph: '♬', aria: 'beamed sixteenth notes' },
  { label: '=', glyph: ' = ', aria: 'equals' },
];

function TempoCuesEditor({
  rows,
  onChange,
}: {
  rows: TempoRow[];
  onChange: (rows: TempoRow[]) => void;
}) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [focusedIdx, setFocusedIdx] = useState<number | null>(null);

  function updateRow(i: number, patch: Partial<TempoRow>) {
    const next = rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r));
    onChange(next);
  }
  function removeRow(i: number) {
    onChange(rows.filter((_, idx) => idx !== i));
  }
  function addRow() {
    onChange([...rows, { section: '', value: '' }]);
    // Focus the new value input after React renders it.
    requestAnimationFrame(() => {
      const newIdx = rows.length;
      inputRefs.current[newIdx]?.focus();
      setFocusedIdx(newIdx);
    });
  }
  function insertGlyph(glyph: string) {
    if (focusedIdx === null) return;
    const el = inputRefs.current[focusedIdx];
    if (!el) return;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const before = el.value.slice(0, start);
    const after = el.value.slice(end);
    const next = before + glyph + after;
    updateRow(focusedIdx, { value: next });
    // Restore caret position to after the inserted glyph.
    requestAnimationFrame(() => {
      el.focus();
      const caret = start + glyph.length;
      el.setSelectionRange(caret, caret);
    });
  }

  return (
    <div className="tempo-editor">
      {rows.length === 0 && (
        <p className="tempo-editor-empty">
          No tempo cues yet. Add one per section (e.g. <em>prelude</em>) and
          use the palette below to drop in note values.
        </p>
      )}
      {rows.length > 0 && (
        <ul className="tempo-editor-rows">
          {rows.map((row, i) => (
            <li key={i} className="tempo-editor-row">
              <input
                type="text"
                className="tempo-editor-section"
                placeholder="section"
                value={row.section}
                onChange={(e) => updateRow(i, { section: e.target.value })}
              />
              <span className="tempo-editor-sep" aria-hidden="true">→</span>
              <input
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                className="tempo-editor-value"
                placeholder="♩ = 60"
                value={row.value}
                onChange={(e) => updateRow(i, { value: e.target.value })}
                onFocus={() => setFocusedIdx(i)}
              />
              <button
                type="button"
                className="tempo-editor-remove"
                onClick={() => removeRow(i)}
                aria-label={`Remove ${row.section || 'this'} row`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="tempo-editor-palette" role="toolbar" aria-label="Insert music symbols">
        <span className="tempo-editor-palette-label">Insert:</span>
        {NOTE_SYMBOLS.map((s) => (
          <button
            key={s.label}
            type="button"
            className="tempo-editor-palette-btn"
            title={s.label}
            aria-label={`Insert ${s.aria}`}
            disabled={focusedIdx === null && rows.length > 0}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => insertGlyph(s.glyph)}
          >
            {s.glyph.trim() === '=' ? '=' : s.glyph}
          </button>
        ))}
      </div>

      <button type="button" className="tempo-editor-add" onClick={addRow}>
        + Add section
      </button>

      <style>{`
        .tempo-editor {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 4px;
        }
        .tempo-editor-empty {
          margin: 0;
          font-size: 12px;
          color: var(--muted, #6F6F6F);
          font-style: italic;
        }
        .tempo-editor-rows {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .tempo-editor-row {
          display: grid;
          grid-template-columns: 1fr auto 1.3fr auto;
          align-items: center;
          gap: 8px;
        }
        .tempo-editor-section,
        .tempo-editor-value {
          width: 100%;
          box-sizing: border-box;
          font-family: var(--font-sans);
          font-size: 13px;
          color: var(--ink, #1A1A1A);
          background: var(--bg, #FFFFFF);
          border: 0.5px solid var(--border-strong, #CFCCC5);
          border-radius: 6px;
          padding: 6px 10px;
        }
        html[data-theme="dark"] .tempo-editor-section,
        html[data-theme="dark"] .tempo-editor-value {
          background: rgba(255, 255, 255, 0.04);
        }
        .tempo-editor-value {
          font-size: 15px;
          font-family: var(--font-serif);
        }
        .tempo-editor-sep {
          color: var(--muted, #6F6F6F);
          font-size: 12px;
        }
        .tempo-editor-remove {
          font-family: inherit;
          font-size: 16px;
          line-height: 1;
          width: 28px;
          height: 28px;
          padding: 0;
          border-radius: 6px;
          border: 0.5px solid var(--border-strong, #CFCCC5);
          background: transparent;
          color: var(--muted, #6F6F6F);
          cursor: pointer;
        }
        .tempo-editor-remove:hover {
          color: var(--color-error, #A32D2D);
          border-color: var(--color-error, #A32D2D);
        }
        .tempo-editor-palette {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 4px;
          padding: 6px 8px;
          background: var(--surface, #FAF8F4);
          border: 0.5px solid var(--border-strong, #CFCCC5);
          border-radius: 6px;
        }
        html[data-theme="dark"] .tempo-editor-palette {
          background: rgba(255, 255, 255, 0.04);
        }
        .tempo-editor-palette-label {
          font-size: 11px;
          color: var(--muted, #6F6F6F);
          margin-right: 4px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .tempo-editor-palette-btn {
          font-family: var(--font-serif);
          font-size: 17px;
          line-height: 1;
          min-width: 32px;
          height: 28px;
          padding: 0 6px;
          border-radius: 6px;
          border: 0.5px solid var(--border-strong, #CFCCC5);
          background: var(--bg, #FFFFFF);
          color: var(--ink, #1A1A1A);
          cursor: pointer;
        }
        html[data-theme="dark"] .tempo-editor-palette-btn {
          background: rgba(255, 255, 255, 0.08);
        }
        .tempo-editor-palette-btn:hover:not(:disabled) {
          border-color: var(--accent, #6B4E7C);
          color: var(--accent, #6B4E7C);
        }
        .tempo-editor-palette-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .tempo-editor-add {
          align-self: flex-start;
          font-family: var(--font-sans);
          font-size: 12px;
          padding: 5px 10px;
          border-radius: 6px;
          border: 0.5px dashed var(--border-strong, #CFCCC5);
          background: transparent;
          color: var(--muted, #6F6F6F);
          cursor: pointer;
        }
        .tempo-editor-add:hover {
          color: var(--accent, #6B4E7C);
          border-color: var(--accent, #6B4E7C);
        }
      `}</style>
    </div>
  );
}
