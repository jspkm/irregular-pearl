// Row-based editor for interpretive_school tempo_cues.
//
// Rendered as (section name → tempo value) pairs with a note-symbol palette
// that inserts glyphs at the caret of the most recently focused value input.
// Used by both the sender's compose block (ComposeDraftBlock) and the
// recipient's Edit & accept form (PendingDraftCard) — a single editor so
// future tweaks land in one place.

import { useRef, useState } from 'react';
import type { TempoRow } from '../lib/draftKinds';

// Music symbols commonly used in tempo indications. Whole/half notes live on
// the Unicode supplementary plane (𝅝, 𝅗𝅥) — if a font in the wild doesn't
// carry them, quarters / eighths / dotted variants cover the common cases.
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

interface Props {
  rows: TempoRow[];
  onChange: (rows: TempoRow[]) => void;
}

export default function TempoCuesEditor({ rows, onChange }: Props) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [focusedIdx, setFocusedIdx] = useState<number | null>(null);

  function updateRow(i: number, patch: Partial<TempoRow>) {
    onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
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
    const next = el.value.slice(0, start) + glyph + el.value.slice(end);
    updateRow(focusedIdx, { value: next });
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
