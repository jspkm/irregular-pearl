// Page-level unified change log. Rendered as its own section at the bottom
// of the piece page. Shows every versioned change across every subject on
// the piece, most recent first. Today only movement edits/reorders/creates/
// deletes appear; as new versioned subjects land (landmarks, signed content,
// etc.) they join the RPC's UNION and automatically show up here — no UI
// change needed.
//
// Always visible (no disclosure). SSR'd initial rows come from the Astro
// page; after any mutation elsewhere on the page, the dispatcher fires a
// `pearl:changelog-refresh` CustomEvent and this island refetches.
//
// The underlying RPC is security-definer + granted to anon + authenticated,
// so signed-out users can read the log.

import { useCallback, useEffect, useState } from 'react';
import { fetchPieceChangelog, type ChangeLogEntry } from '../lib/movements';

interface Props {
  pieceId: string;
  initialEntries: ChangeLogEntry[];
}

export const CHANGELOG_REFRESH_EVENT = 'pearl:changelog-refresh';

export default function ChangeLog({ pieceId, initialEntries }: Props) {
  const [entries, setEntries] = useState<ChangeLogEntry[]>(initialEntries);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await fetchPieceChangelog(pieceId);
      setEntries(next);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [pieceId]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ pieceId?: string }>).detail;
      if (!detail || detail.pieceId === pieceId) refresh();
    };
    window.addEventListener(CHANGELOG_REFRESH_EVENT, handler);
    return () => window.removeEventListener(CHANGELOG_REFRESH_EVENT, handler);
  }, [pieceId, refresh]);

  if (entries.length === 0 && !loading) {
    return <p className="empty-state">No changes recorded yet.</p>;
  }

  return (
    <>
      {error && (
        <p className="changelog-error">
          Couldn't refresh — {error}.{' '}
          <button type="button" className="changelog-retry" onClick={refresh}>
            Retry
          </button>
        </p>
      )}
      <ol className="changelog-list">
        {entries.map((r) => (
          <li key={r.id} className="changelog-row">
            {r.authoredByUsername
              ? <a className="changelog-who" href={`/@${r.authoredByUsername}`}>{r.authoredByDisplayName}</a>
              : r.authoredBy
                ? <a className="changelog-who" href={`/profile/${r.authoredBy}`}>{r.authoredByDisplayName}</a>
                : <span className="changelog-who">{r.authoredByDisplayName}</span>}
            <span className="changelog-sep">·</span>
            <time className="changelog-when" dateTime={r.createdAt}>
              {formatUtc(r.createdAt)}
            </time>
            <span className="changelog-sep">·</span>
            <span className="changelog-subject">
              {r.subjectType} <em>{r.subjectLabel}</em>
            </span>
            <span className="changelog-sep">—</span>
            <span className="changelog-what">
              {r.editSummary ?? defaultSummary(r)}
            </span>
          </li>
        ))}
      </ol>
    </>
  );
}

function formatUtc(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ` +
    `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`
  );
}

function defaultSummary(r: ChangeLogEntry): string {
  if (r.versionNumber === 1) return 'published';
  if (r.versionNumber != null && r.versionNumber > 1) return 'edited';
  return 'changed';
}
