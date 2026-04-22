// Global navbar typeahead. Calls search_pieces_typeahead RPC which returns
// two groups: IN THE CATALOG (already-materialized pieces) and NOT YET
// CURATED (seed entries from the canonical index). Clicking a catalog row
// navigates to the piece page. Clicking a seed row triggers materialize
// (signed-in only); signed-out users get the existing sign-in prompt and
// finish the click post-auth via a return_to URL.
//
// Inherits the navbar's search-input visual spec (shadow-md exception per
// DESIGN.md decisions log). Dropdown follows the popover pattern: bg-surface,
// 0.5px border, 12px radius, shadow-md, 0.5px row dividers, Escape/outside-
// click dismiss.

import { useEffect, useRef, useState } from 'react';
import { supabase, hasSupabase } from '../lib/supabase';

interface Result {
  result_type: 'materialized' | 'seed';
  id: string;
  title: string;
  composer_name: string;
  catalog_number: string | null;
  instruments: string[] | null;
}

// Piece pages live at /piece/[slug]. Exported so a unit test can pin the
// path shape against the /p/ vs /piece/ regression.
export function piecePath(slug: string): string {
  return `/piece/${slug}`;
}

interface Props {
  className?: string;
  /** When set, the input autofocuses on mount (used in the mobile overlay). */
  autoFocus?: boolean;
  /** Called when the dropdown should dismiss (mobile overlay closes). */
  onDismiss?: () => void;
}

export default function SearchTypeahead({ className, autoFocus, onDismiss }: Props) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [materializing, setMaterializing] = useState(false);
  const [needsSignIn, setNeedsSignIn] = useState<Result | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search
  useEffect(() => {
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const handle = setTimeout(async () => {
      if (!hasSupabase) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase.rpc('search_pieces_typeahead', { p_query: trimmed });
      if (error) {
        // Fail soft: just clear results. Log for debugging.
        console.error('typeahead:', error.message);
        setResults([]);
      } else {
        setResults((data || []) as Result[]);
        setActiveIdx(0);
      }
      setLoading(false);
    }, 120);
    return () => clearTimeout(handle);
  }, [q]);

  // Outside-click dismiss
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Escape dismiss
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (needsSignIn) {
          setNeedsSignIn(null);
          return;
        }
        if (open) {
          setOpen(false);
        } else if (onDismiss) {
          onDismiss();
        }
      }
    }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, needsSignIn, onDismiss]);

  async function handleSelect(r: Result) {
    if (r.result_type === 'materialized') {
      window.location.href = piecePath(r.id);
      return;
    }
    // Seed: materialize (signed-in only)
    if (!hasSupabase) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setNeedsSignIn(r);
      return;
    }
    setMaterializing(true);
    const { data: pieceId, error } = await supabase.rpc('materialize_piece_from_index', {
      p_index_id: r.id,
    });
    setMaterializing(false);
    if (error) {
      // Unexpected for a signed-in user; surface briefly and recover.
      console.error('materialize:', error.message);
      window.alert(`Could not open this piece: ${error.message}`);
      return;
    }
    window.location.href = piecePath(pieceId as string);
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return;
    if (results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActiveIdx(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActiveIdx(results.length - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const active = results[activeIdx];
      if (active) handleSelect(active);
    }
  }

  const materialized = results.filter((r) => r.result_type === 'materialized');
  const seed = results.filter((r) => r.result_type === 'seed');
  const hasResults = results.length > 0;
  const showNoMatch = open && !loading && q.trim().length >= 2 && !hasResults;
  const showDropdown = open && (loading || hasResults || showNoMatch);

  function highlightMatch(text: string): React.ReactNode {
    const query = q.trim();
    if (!query) return text;
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const idx = lowerText.indexOf(lowerQuery);
    if (idx < 0) return text;
    return (
      <>
        {text.slice(0, idx)}
        <span className="text-accent font-medium">{text.slice(idx, idx + query.length)}</span>
        {text.slice(idx + query.length)}
      </>
    );
  }

  function renderRow(r: Result, globalIdx: number) {
    const isActive = globalIdx === activeIdx;
    return (
      <button
        key={`${r.result_type}-${r.id}`}
        type="button"
        role="option"
        aria-selected={isActive}
        id={`typeahead-opt-${globalIdx}`}
        onClick={() => handleSelect(r)}
        onMouseEnter={() => setActiveIdx(globalIdx)}
        className={`w-full text-left px-4 py-2 flex items-baseline justify-between gap-4 border-0 cursor-pointer font-body text-sm ${
          isActive ? 'bg-accent-light' : 'bg-transparent'
        } hover:bg-accent-light transition-colors`}
      >
        <span className="min-w-0 truncate">
          <span className="text-muted">{highlightMatch(r.composer_name)}</span>
          <span className="text-muted"> · </span>
          <span className="text-ink">{highlightMatch(r.title)}</span>
        </span>
        {r.catalog_number && (
          <span className="font-mono text-xs text-muted shrink-0 tabular-nums">
            {r.catalog_number}
          </span>
        )}
      </button>
    );
  }

  return (
    <div ref={containerRef} className={`relative ${className || ''}`}>
      <div className="relative">
        <input
          ref={(el) => {
            inputRef.current = el;
            if (el && autoFocus) {
              // defer so overlay reveal animation doesn't swallow focus
              requestAnimationFrame(() => el.focus());
            }
          }}
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKey}
          aria-label="Search"
          aria-haspopup="listbox"
          aria-expanded={showDropdown}
          aria-controls={showDropdown ? 'typeahead-listbox' : undefined}
          aria-activedescendant={
            hasResults && showDropdown ? `typeahead-opt-${activeIdx}` : undefined
          }
          role="combobox"
          placeholder=" "
          autoComplete="off"
          spellCheck={false}
          className="w-full pl-9 pr-3 py-2.5 border border-border rounded-lg text-sm shadow-md focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-light font-body bg-surface"
        />
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted"
        >
          <circle cx="11" cy="11" r="7"></circle>
          <path d="m21 21-4.3-4.3"></path>
        </svg>
      </div>

      {showDropdown && (
        <div
          id="typeahead-listbox"
          role="listbox"
          className="absolute left-0 right-0 top-full mt-2 bg-surface border border-border rounded-xl shadow-md z-50 max-h-[70vh] overflow-y-auto"
        >
          {loading && !hasResults && (
            <div className="px-4 py-3 text-xs text-muted">Searching…</div>
          )}

          {materialized.length > 0 && (
            <div>
              <div className="px-4 pt-3 pb-1 text-[11px] tracking-[0.08em] uppercase text-accent font-medium">
                In the catalog
              </div>
              <div className="divide-y divide-border">
                {materialized.map((r) => renderRow(r, results.indexOf(r)))}
              </div>
            </div>
          )}

          {seed.length > 0 && (
            <div className={materialized.length > 0 ? 'border-t border-border mt-1 pt-1' : ''}>
              <div className="px-4 pt-3 pb-1 text-[11px] tracking-[0.08em] uppercase text-accent font-medium">
                Not yet curated
              </div>
              <div className="divide-y divide-border">
                {seed.map((r) => renderRow(r, results.indexOf(r)))}
              </div>
            </div>
          )}

          {showNoMatch && (
            <div className="px-4 py-3 text-xs text-muted">
              No match. Try a different spelling or check the composer.
            </div>
          )}
        </div>
      )}

      {materializing && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted pointer-events-none">
          opening…
        </div>
      )}

      {needsSignIn && (
        <div
          className="absolute left-0 right-0 top-full mt-2 bg-surface border border-border rounded-xl shadow-md z-50 p-4"
          role="dialog"
          aria-label="Sign in required"
        >
          <p className="text-sm text-ink mb-2">
            <span className="text-muted">{needsSignIn.composer_name} · </span>
            <span className="text-ink">{needsSignIn.title}</span>
          </p>
          <p className="text-xs text-muted mb-3">
            Sign in to open this piece so you can contribute or request a contribution.
          </p>
          <div className="flex gap-2">
            <a
              href={`/?sign_in=1`}
              className="inline-flex items-center px-3 py-1.5 bg-ink text-surface rounded-md text-xs font-medium no-underline"
            >
              Sign in
            </a>
            <button
              type="button"
              onClick={() => setNeedsSignIn(null)}
              className="inline-flex items-center px-3 py-1.5 text-muted hover:text-ink border border-border-strong rounded-md text-xs bg-transparent cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
