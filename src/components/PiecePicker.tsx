// Small piece-id picker for forms inside the kit aesthetic. Filters a
// pre-fetched piece list by case-insensitive substring on title + composer
// + catalog. Returns a piece id via onSelect; renders selected state as a
// readable summary line so the user can see what they picked. ↑/↓ navigates
// the list, Enter picks, Esc clears.
//
// Tightly scoped to the pedagogical-arc form for now. If a second caller
// shows up (passage picker, recording artist picker), pull the matching
// logic into a hook.

import { useEffect, useMemo, useRef, useState } from 'react';
import type { PieceOption } from '../lib/pedagogical';

interface Props {
  options: PieceOption[];
  value: string | null;
  onSelect: (pieceId: string | null) => void;
  excludeIds?: string[];
  autoFocus?: boolean;
  placeholder?: string;
}

export default function PiecePicker({ options, value, onSelect, excludeIds, autoFocus, placeholder }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const exclude = useMemo(() => new Set(excludeIds ?? []), [excludeIds]);

  const optionsById = useMemo(() => {
    const m = new Map<string, PieceOption>();
    for (const o of options) m.set(o.id, o);
    return m;
  }, [options]);
  const selected = value ? optionsById.get(value) ?? null : null;

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!open) return [];
    const pool = options.filter((o) => !exclude.has(o.id));
    if (!q) return pool.slice(0, 10);
    return pool
      .filter((o) => {
        const hay = `${o.title} ${o.composerName} ${o.catalogNumber ?? ''}`.toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 10);
  }, [options, exclude, query, open]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => { setActiveIndex(matches.length === 0 ? -1 : 0); }, [matches.length]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex((i) => Math.min(matches.length - 1, i + 1)); return; }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIndex((i) => Math.max(0, i - 1)); return; }
    if (e.key === 'Enter') {
      if (activeIndex >= 0 && matches[activeIndex]) {
        e.preventDefault();
        choose(matches[activeIndex]);
      }
      return;
    }
    if (e.key === 'Escape') { setOpen(false); }
  }

  function choose(o: PieceOption) {
    onSelect(o.id);
    setQuery('');
    setOpen(false);
    inputRef.current?.blur();
  }

  function clear() {
    onSelect(null);
    setQuery('');
    setOpen(true);
    inputRef.current?.focus();
  }

  return (
    <div className="piece-picker" ref={containerRef}>
      {selected ? (
        <div className="piece-picker-selected">
          <span className="piece-picker-selected-title">{selected.title}</span>
          <span className="piece-picker-selected-meta">
            {selected.composerName}
            {selected.catalogNumber ? ` · ${selected.catalogNumber}` : ''}
          </span>
          <button type="button" className="piece-picker-clear" aria-label="Change selection" onClick={clear}>Change</button>
        </div>
      ) : (
        <>
          <input
            ref={inputRef}
            type="text"
            className="piece-picker-input"
            placeholder={placeholder ?? 'Search pieces…'}
            value={query}
            autoFocus={autoFocus}
            onFocus={() => setOpen(true)}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onKeyDown={handleKeyDown}
            autoComplete="off"
          />
          {open && matches.length > 0 && (
            <ul className="piece-picker-list" role="listbox">
              {matches.map((o, i) => (
                <li key={o.id}
                    role="option"
                    aria-selected={i === activeIndex}
                    className={`piece-picker-item${i === activeIndex ? ' is-active' : ''}`}
                    onMouseDown={(e) => { e.preventDefault(); choose(o); }}
                    onMouseEnter={() => setActiveIndex(i)}>
                  <span className="piece-picker-item-title">{o.title}</span>
                  <span className="piece-picker-item-meta">
                    {o.composerName}
                    {o.catalogNumber ? ` · ${o.catalogNumber}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {open && matches.length === 0 && query.trim().length > 0 && (
            <p className="piece-picker-empty">No matching pieces.</p>
          )}
        </>
      )}
    </div>
  );
}
