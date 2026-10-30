import { useId, useRef, useState } from 'react';
import SearchTypeahead from './SearchTypeahead';
import { hasSupabase } from '../lib/supabase';

export default function AddPiece({ composerName }: { composerName?: string }) {
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  function close() {
    setExpanded(false);
    buttonRef.current?.focus();
  }
  return (
    <div className="add-piece-entry">
      <button ref={buttonRef} type="button" className="add-piece-toggle" aria-expanded={expanded} aria-controls={id} onClick={() => setExpanded(!expanded)}>+ Add a piece</button>
      {expanded && <section id={id} className="add-piece-panel" aria-label="Add a piece to the repertoire" onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); close(); } }}>
        <p className="add-piece-label">{composerName ? `Find a piece by ${composerName}` : 'Find a piece to add to the repertoire'}</p>
        <p className="add-piece-help">Search by title or catalog number. Select a matching piece to open it for contributions. Existing pieces open their current page; adding a new piece requires sign-in.</p>
        {hasSupabase ? <SearchTypeahead autoFocus composerName={composerName} inputLabel={composerName ? `Find a piece by ${composerName}` : 'Find a piece to add'} onDismiss={close} /> : <p role="status" className="add-piece-help">Piece search and additions are unavailable in this preview because the catalog database is not connected.</p>}
        <button type="button" className="add-piece-close" onClick={close}>Close</button>
      </section>}
      <style>{`
        .add-piece-entry { margin-top: 16px; font-family: var(--font-sans); }
        .add-piece-toggle, .add-piece-close { padding: 4px 10px; border: .5px solid var(--border-strong); border-radius: 6px; background: transparent; color: var(--muted); font: 400 13px var(--font-sans); cursor: pointer; }
        .add-piece-toggle:hover, .add-piece-close:hover { color: var(--ink); }
        .add-piece-panel { margin-top: 16px; padding: 16px 0; border-top: .5px solid var(--border); max-width: 640px; }
        .add-piece-label { font-size: 14px; color: var(--ink); margin: 0 0 8px; }
        .add-piece-help { font-size: 13px; color: var(--muted); line-height: 1.55; margin: 0 0 16px; }
        .add-piece-close { margin-top: 16px; }
      `}</style>
    </div>
  );
}
