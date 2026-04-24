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
import { useRequireAuth } from '../lib/useRequireAuth';
import SignInPanel from './SignInPanel';

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

const SEARCH_MISS_LOGGED_KEY = 'ip.search-miss.logged';
const SEARCH_MISS_MIN_LEN = 6;

function alreadyLoggedMiss(query: string): boolean {
  try {
    const raw = sessionStorage.getItem(SEARCH_MISS_LOGGED_KEY);
    if (!raw) return false;
    const logged = JSON.parse(raw) as string[];
    return Array.isArray(logged) && logged.includes(query);
  } catch {
    return false;
  }
}

function rememberLoggedMiss(query: string) {
  try {
    const raw = sessionStorage.getItem(SEARCH_MISS_LOGGED_KEY);
    const logged = raw ? (JSON.parse(raw) as string[]) : [];
    if (!Array.isArray(logged)) return;
    if (!logged.includes(query)) {
      logged.push(query);
      // Bound the set so sessions don't grow forever.
      if (logged.length > 200) logged.splice(0, logged.length - 200);
      sessionStorage.setItem(SEARCH_MISS_LOGGED_KEY, JSON.stringify(logged));
    }
  } catch {
    // Storage disabled — skip dedup, accept some duplicate logs.
  }
}

export default function SearchTypeahead({ className, autoFocus, onDismiss }: Props) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [materializing, setMaterializing] = useState(false);
  const [pendingSeed, setPendingSeed] = useState<Result | null>(null);
  const {
    signInOpen,
    onClose: signInOnClose,
    onSignedIn: signInOnSignedIn,
    gate,
  } = useRequireAuth();

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Track the latest (trimmed) query + its result count so the dismiss
  // handler can decide whether to log a miss. Refs because we read them
  // inside listeners that shouldn't re-bind on every render.
  const lastQueryRef = useRef('');
  const lastResultCountRef = useRef(0);

  function maybeLogDismissedMiss() {
    if (!hasSupabase) return;
    const query = lastQueryRef.current;
    if (query.length < SEARCH_MISS_MIN_LEN) return;
    if (lastResultCountRef.current > 0) return;
    if (alreadyLoggedMiss(query)) return;
    rememberLoggedMiss(query);
    void supabase.rpc('log_search_miss', { p_query: query });
  }

  // Debounced search
  useEffect(() => {
    const trimmed = q.trim();
    lastQueryRef.current = trimmed;
    if (trimmed.length < 2) {
      setResults([]);
      lastResultCountRef.current = 0;
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
        lastResultCountRef.current = 0;
      } else {
        const rows = (data || []) as Result[];
        setResults(rows);
        lastResultCountRef.current = rows.length;
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
        if (open) maybeLogDismissedMiss();
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Escape dismiss. The SignInPanel owns its own Escape handling when open,
  // so we only care about dismissing the typeahead dropdown here.
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (open) {
          maybeLogDismissedMiss();
          setOpen(false);
        } else if (onDismiss) {
          onDismiss();
        }
      }
    }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onDismiss]);

  // Page unload (nav away with dropdown still open)
  useEffect(() => {
    function handler() {
      if (open) maybeLogDismissedMiss();
    }
    window.addEventListener('pagehide', handler);
    return () => window.removeEventListener('pagehide', handler);
  }, [open]);

  async function materializeAndGo(r: Result) {
    if (!hasSupabase) return;
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

  function handleSelect(r: Result) {
    if (r.result_type === 'materialized') {
      window.location.href = piecePath(r.id);
      return;
    }
    // Seed: anon gets SignInPanel with the seed stashed as the pending
    // action; on successful sign-in the materialize + navigate resumes.
    setPendingSeed(r);
    gate(() => {
      setPendingSeed(null);
      void materializeAndGo(r);
    });
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

      {signInOpen && (
        <SignInPanel
          onClose={() => { setPendingSeed(null); signInOnClose(); }}
          onSignedIn={signInOnSignedIn}
          title="Sign in to open this piece"
          body={
            pendingSeed ? (
              <>
                Opening <span style={{ fontWeight: 500 }}>{pendingSeed.composer_name} · {pendingSeed.title}</span> for contribution is a signed action. Sign in or create an account to continue.
              </>
            ) : (
              <>Opening a seed piece for contribution is a signed action. Sign in or create an account to continue.</>
            )
          }
        />
      )}
    </div>
  );
}
