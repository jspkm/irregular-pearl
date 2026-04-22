// Editorial signals dashboard. Staff-only. Two sections:
//
// 1. Unmatched queries — what users typed into the navbar search that
//    returned zero matches (logged on dismiss with query >= 6 chars).
//    Groups by lowercased query, sorts by frequency. Feeds the
//    eventual automated index-writer worker.
//
// 2. Most-viewed pieces without contributions — pieces in the catalog
//    that accumulated page views but have no published signed content
//    yet. Unique viewers dedup by user_id or visitor_token (same
//    person counts once). Default top 50, adjustable 30–200.
//
// Staff gate is server-side on both RPCs. Non-staff viewers see a
// blank "not authorized" state.

import { useEffect, useState } from 'react';
import { supabase, hasSupabase } from '../../lib/supabase';
import { useAuth } from '../../lib/useAuth';

interface UnmatchedQuery {
  query: string;
  count: number;
  distinct_users: number;
  first_seen: string;
  last_seen: string;
}

interface ViewedNoContentPiece {
  piece_id: string;
  title: string;
  composer_name: string;
  catalog_number: string | null;
  unique_viewers: number;
  total_views: number;
  last_viewed: string;
}

type GateStatus = 'loading' | 'unauthorized' | 'ready';

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const delta = Date.now() - then;
  const mins = Math.floor(delta / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AdminSignals() {
  const { user, loading: authLoading } = useAuth();
  const [gate, setGate] = useState<GateStatus>('loading');
  const [unmatched, setUnmatched] = useState<UnmatchedQuery[]>([]);
  const [viewedNoContent, setViewedNoContent] = useState<ViewedNoContentPiece[]>([]);
  const [limit, setLimit] = useState(50);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !hasSupabase) {
      // Non-staff (including signed-out) don't get to learn this URL
      // exists. Bounce to the project-wide 404 page, replacing history
      // so the back button doesn't land back on this URL.
      window.location.replace('/404');
      return;
    }
    let cancelled = false;

    async function load() {
      setError(null);
      const [queriesRes, piecesRes] = await Promise.all([
        supabase.rpc('admin_top_unmatched_queries', { p_limit: 50 }),
        supabase.rpc('admin_top_viewed_no_content_pieces', { p_limit: limit }),
      ]);

      if (cancelled) return;

      if (queriesRes.error || piecesRes.error) {
        const msg = queriesRes.error?.message ?? piecesRes.error?.message ?? '';
        if (msg.toLowerCase().includes('staff only')) {
          window.location.replace('/404');
          return;
        }
        setError(msg || 'Could not load signals.');
        setGate('ready');
        return;
      }

      setUnmatched((queriesRes.data ?? []) as UnmatchedQuery[]);
      setViewedNoContent((piecesRes.data ?? []) as ViewedNoContentPiece[]);
      setGate('ready');
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user, limit]);

  // Render nothing while loading or bouncing — the dashboard body below
  // mounts only after the RPC calls succeed as staff.
  if (gate === 'loading' || gate === 'unauthorized') {
    return null;
  }

  return (
    <div className="font-body">
      <h1 className="text-[28px] font-display text-ink mb-2 tracking-tight">Editorial signals</h1>
      <p className="text-sm text-muted mb-10 max-w-2xl">
        What musicians tried to find but the catalog didn&apos;t have, and which pieces in the catalog are drawing traffic without any signed contribution yet. Two editorial priority lists.
      </p>

      {error && (
        <div className="mb-6 rounded-lg border-[0.5px] border-[#A32D2D] bg-[#F7E4E4] px-4 py-3 text-sm text-[#A32D2D]">
          {error}
        </div>
      )}

      {/* Unmatched queries */}
      <section className="mb-14">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-display text-[22px] text-ink">Unmatched queries</h2>
          <span className="text-[11px] uppercase tracking-wider text-muted">
            {unmatched.length} unique
          </span>
        </div>
        {unmatched.length === 0 ? (
          <p className="text-sm text-muted italic">No logged misses yet. Users who type 6+ characters with no matches will appear here.</p>
        ) : (
          <table className="w-full text-sm border-t-[0.5px] border-border">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-muted">
                <th className="text-left py-2 font-medium">Query</th>
                <th className="text-right py-2 font-medium">Count</th>
                <th className="text-right py-2 font-medium">Users</th>
                <th className="text-right py-2 font-medium">First seen</th>
                <th className="text-right py-2 font-medium">Last seen</th>
              </tr>
            </thead>
            <tbody>
              {unmatched.map((row) => (
                <tr key={row.query} className="border-t-[0.5px] border-border">
                  <td className="py-2.5 font-mono text-[13px] text-ink">{row.query}</td>
                  <td className="py-2.5 text-right text-ink tabular-nums">{row.count}</td>
                  <td className="py-2.5 text-right text-muted tabular-nums">{row.distinct_users}</td>
                  <td className="py-2.5 text-right text-muted text-xs">{formatRelative(row.first_seen)}</td>
                  <td className="py-2.5 text-right text-muted text-xs">{formatRelative(row.last_seen)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Most viewed, not contributed */}
      <section>
        <div className="flex items-baseline justify-between mb-3 flex-wrap gap-2">
          <h2 className="font-display text-[22px] text-ink">Most viewed, not contributed</h2>
          <label className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted">
            Top
            <input
              type="number"
              min={30}
              max={200}
              step={10}
              value={limit}
              onChange={(e) => {
                const next = Math.max(30, Math.min(200, parseInt(e.target.value) || 50));
                setLimit(next);
              }}
              className="w-16 px-2 py-1 border-[0.5px] border-border rounded text-sm text-ink font-body normal-case tracking-normal"
            />
          </label>
        </div>
        {viewedNoContent.length === 0 ? (
          <p className="text-sm text-muted italic">No piece views recorded yet for pre-piece entries.</p>
        ) : (
          <table className="w-full text-sm border-t-[0.5px] border-border">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-muted">
                <th className="text-left py-2 font-medium">Piece</th>
                <th className="text-right py-2 font-medium">Unique</th>
                <th className="text-right py-2 font-medium">Total</th>
                <th className="text-right py-2 font-medium">Last viewed</th>
              </tr>
            </thead>
            <tbody>
              {viewedNoContent.map((p) => (
                <tr key={p.piece_id} className="border-t-[0.5px] border-border">
                  <td className="py-2.5">
                    <a
                      href={`/piece/${p.piece_id}`}
                      className="text-ink no-underline hover:underline"
                    >
                      <span className="text-muted">{p.composer_name}</span> ·{' '}
                      <span className="text-ink">{p.title}</span>
                      {p.catalog_number && (
                        <span className="font-mono text-[11px] text-tertiary ml-2">{p.catalog_number}</span>
                      )}
                    </a>
                  </td>
                  <td className="py-2.5 text-right text-ink tabular-nums">{p.unique_viewers}</td>
                  <td className="py-2.5 text-right text-muted tabular-nums">{p.total_views}</td>
                  <td className="py-2.5 text-right text-muted text-xs">{formatRelative(p.last_viewed)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
