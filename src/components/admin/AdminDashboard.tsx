import { useState, useEffect } from 'react';
import { supabase, hasSupabase } from '../../lib/supabase';

interface Props {
  isAdmin: boolean;
}

interface RecentUser {
  id: string;
  display_name: string;
  instrument: string | null;
  level: string | null;
  created_at: string;
}

interface RecentCuration {
  subject_type: string;
  subject_id: string;
  piece_id: string;
  piece_title: string;
  contributor_id: string | null;
  contributor_display_name: string | null;
  contributor_username: string | null;
  contributor_email: string | null;
  published_at: string;
}

const SUBJECT_TYPE_LABEL: Record<string, string> = {
  performers_note: "Performer's note",
  interpretive_school: 'Interpretive school',
  landmark: 'Landmark',
  piece_description: 'Piece description',
};

function formatWhen(iso: string): string {
  const then = new Date(iso).getTime();
  const delta = Date.now() - then;
  const mins = Math.floor(delta / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 14) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AdminDashboard({ isAdmin }: Props) {
  const [stats, setStats] = useState({
    totalUsers: 0,
    newUsers7d: 0,
    totalPieces: 0,
    piecesWithCuration: 0,
  });
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [recentCuration, setRecentCuration] = useState<RecentCuration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasSupabase) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchAll() {
      const [usersRes, newUsersRes, piecesRes, curationCountRes, recentUsersRes, recentCurationRes] =
        await Promise.allSettled([
          supabase.from('users').select('id', { count: 'exact', head: true }),
          supabase
            .from('users')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
          supabase.from('pieces').select('id', { count: 'exact', head: true }),
          supabase
            .from('v_pieces_with_content_state')
            .select('id', { count: 'exact', head: true })
            .eq('has_signed_content', true),
          isAdmin
            ? supabase
                .from('users')
                .select('id, display_name, instrument, level, created_at')
                .order('created_at', { ascending: false })
                .limit(10)
            : Promise.resolve({ data: [] }),
          isAdmin
            ? supabase.rpc('admin_recent_curation', { p_limit: 10 })
            : Promise.resolve({ data: [] }),
        ]);

      if (cancelled) return;

      setStats({
        totalUsers: usersRes.status === 'fulfilled' ? (usersRes.value.count ?? 0) : 0,
        newUsers7d: newUsersRes.status === 'fulfilled' ? (newUsersRes.value.count ?? 0) : 0,
        totalPieces: piecesRes.status === 'fulfilled' ? (piecesRes.value.count ?? 0) : 0,
        piecesWithCuration:
          curationCountRes.status === 'fulfilled' ? (curationCountRes.value.count ?? 0) : 0,
      });

      if (isAdmin && recentUsersRes.status === 'fulfilled' && (recentUsersRes.value as any).data) {
        setRecentUsers((recentUsersRes.value as any).data);
      }
      if (
        isAdmin &&
        recentCurationRes.status === 'fulfilled' &&
        (recentCurationRes.value as any).data
      ) {
        setRecentCuration((recentCurationRes.value as any).data);
      }

      setLoading(false);
    }

    fetchAll();
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  if (loading) return <div className="text-sm text-muted">Loading...</div>;

  const cards = [
    ...(isAdmin
      ? [
          { label: 'Total Users', value: stats.totalUsers },
          { label: 'New Users (7d)', value: stats.newUsers7d },
        ]
      : []),
    { label: 'Total Pieces', value: stats.totalPieces },
    { label: 'Pieces w/ User Curation', value: stats.piecesWithCuration },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="bg-surface border border-border rounded-xl p-5">
            <div className="text-xs text-muted mb-1">{card.label}</div>
            <div className="font-display text-2xl text-ink">{card.value.toLocaleString()}</div>
          </div>
        ))}
      </div>

      {isAdmin && recentUsers.length > 0 && (
        <div className="mb-10">
          <h2 className="font-display text-lg mb-3">Recent Signups</h2>
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted">
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Instrument</th>
                  <th className="px-4 py-2">Level</th>
                  <th className="px-4 py-2">Joined</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((u) => (
                  <tr key={u.id} className="border-b border-border/50 last:border-b-0">
                    <td className="px-4 py-2 font-medium">{u.display_name}</td>
                    <td className="px-4 py-2 text-muted">{u.instrument || '—'}</td>
                    <td className="px-4 py-2 text-muted capitalize">{u.level || '—'}</td>
                    <td className="px-4 py-2 text-muted">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isAdmin && (
        <div>
          <h2 className="font-display text-lg mb-3">Recent Curation</h2>
          {recentCuration.length === 0 ? (
            <p className="text-sm text-muted italic">
              No published signed content yet.
            </p>
          ) : (
            <div className="bg-surface border border-border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted">
                    <th className="px-4 py-2">Piece</th>
                    <th className="px-4 py-2">What</th>
                    <th className="px-4 py-2">Contributor</th>
                    <th className="px-4 py-2">When</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCuration.map((row) => {
                    const contributorLabel =
                      row.contributor_username ||
                      row.contributor_display_name ||
                      row.contributor_email ||
                      '—';
                    const contributorSecondary =
                      row.contributor_username && row.contributor_display_name
                        ? row.contributor_display_name
                        : row.contributor_email && row.contributor_username
                        ? row.contributor_email
                        : null;
                    return (
                      <tr
                        key={`${row.subject_type}:${row.subject_id}`}
                        className="border-b border-border/50 last:border-b-0"
                      >
                        <td className="px-4 py-2 font-medium">
                          <a
                            href={`/piece/${row.piece_id}`}
                            className="text-ink no-underline hover:underline"
                          >
                            {row.piece_title}
                          </a>
                        </td>
                        <td className="px-4 py-2 text-muted">
                          {SUBJECT_TYPE_LABEL[row.subject_type] ?? row.subject_type}
                        </td>
                        <td className="px-4 py-2">
                          <span className="text-ink">{contributorLabel}</span>
                          {contributorSecondary && (
                            <span className="text-xs text-muted ml-2">
                              {contributorSecondary}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-muted text-xs">
                          {formatWhen(row.published_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
