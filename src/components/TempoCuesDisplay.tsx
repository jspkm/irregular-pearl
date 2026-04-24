// Read-only tempo_cues list shown on any card that renders an
// interpretive_school draft or published row. Used by ComposeDraftBlock
// (sender's proposed card), PendingDraftCard (recipient's triage card), and
// — when published — wherever schools list their tempo cues.
//
// Single styling source so dark-mode overrides, spacing, and future polish
// land in one file.

import { tempoCueEntries } from '../lib/draftKinds';

export default function TempoCuesDisplay({ raw }: { raw: unknown }) {
  const entries = tempoCueEntries(raw);
  if (entries.length === 0) return null;
  return (
    <div className="tempo-display">
      <span className="tempo-display-label">Tempo cues</span>
      <ul className="tempo-display-list">
        {entries.map(([section, value]) => (
          <li key={section}>
            <span className="tempo-display-section">{section}</span>
            <span className="tempo-display-value">{value}</span>
          </li>
        ))}
      </ul>
      <style>{`
        .tempo-display {
          margin: 10px 0;
          padding: 8px 10px;
          border-radius: 6px;
          background: var(--surface, #FAF8F4);
          border: 0.5px solid var(--border-strong, #CFCCC5);
        }
        html[data-theme="dark"] .tempo-display {
          background: rgba(255, 255, 255, 0.03);
        }
        .tempo-display-label {
          display: block;
          font-family: var(--font-sans);
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--muted, #6F6F6F);
          margin-bottom: 4px;
        }
        .tempo-display-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-wrap: wrap;
          gap: 4px 16px;
        }
        .tempo-display-list li {
          display: inline-flex;
          align-items: baseline;
          gap: 8px;
          font-size: 13px;
        }
        .tempo-display-section {
          font-family: var(--font-sans);
          color: var(--muted, #6F6F6F);
          font-style: italic;
        }
        .tempo-display-value {
          font-family: var(--font-serif);
          color: var(--ink, #1A1A1A);
        }
      `}</style>
    </div>
  );
}
