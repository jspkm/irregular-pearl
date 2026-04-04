import { useState, useEffect } from 'react';
import { supabase, hasSupabase } from '../../lib/supabase';
import { seedPieces } from '../../data/seed';

interface Props {
  isAdmin: boolean;
}

export default function AdminDashboard({ isAdmin }: Props) {
  const [stats, setStats] = useState({
    totalUsers: 0,
    newUsers7d: 0,
    totalInteractions: 0,
    totalDiscussions: 0,
    pendingReports: 0,
    pendingEvents: 0,
  });
  const [recentUsers, setRecentUsers] = useState<{ id: string; display_name: string; instrument: string | null; level: string | null; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const composerCount = new Set(seedPieces.map(p => p.composer_name)).size;
  const editionCount = seedPieces.reduce((sum, p) => sum + p.editions.length, 0);

  useEffect(() => {
    if (!hasSupabase) { setLoading(false); return; }

    const fetchStats = async () => {
      const [usersRes, newUsersRes, activityRes, discussionsRes, reportsRes, eventsRes, recentRes] = await Promise.allSettled([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('users').select('id', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
        supabase.from('activity_log').select('id', { count: 'exact', head: true }),
        supabase.from('discussions').select('id', { count: 'exact', head: true }).eq('is_deleted', false),
        supabase.from('reports').select('id', { count: 'exact', head: true }),
        supabase.from('events').select('id', { count: 'exact', head: true }).eq('status', 'queued'),
        isAdmin ? supabase.from('users').select('id, display_name, instrument, level, created_at').order('created_at', { ascending: false }).limit(10) : Promise.resolve({ data: [] }),
      ]);

      setStats({
        totalUsers: usersRes.status === 'fulfilled' ? (usersRes.value.count ?? 0) : 0,
        newUsers7d: newUsersRes.status === 'fulfilled' ? (newUsersRes.value.count ?? 0) : 0,
        totalInteractions: activityRes.status === 'fulfilled' ? (activityRes.value.count ?? 0) : 0,
        totalDiscussions: discussionsRes.status === 'fulfilled' ? (discussionsRes.value.count ?? 0) : 0,
        pendingReports: reportsRes.status === 'fulfilled' ? (reportsRes.value.count ?? 0) : 0,
        pendingEvents: eventsRes.status === 'fulfilled' ? (eventsRes.value.count ?? 0) : 0,
      });

      if (isAdmin && recentRes.status === 'fulfilled' && (recentRes.value as any).data) {
        setRecentUsers((recentRes.value as any).data);
      }

      setLoading(false);
    };

    fetchStats();
  }, []);

  if (loading) return <div className="text-sm text-muted">Loading...</div>;

  const cards = [
    ...(isAdmin ? [
      { label: 'Total Users', value: stats.totalUsers },
      { label: 'New Users (7d)', value: stats.newUsers7d },
    ] : []),
    { label: 'Interactions', value: stats.totalInteractions },
    { label: 'Discussions', value: stats.totalDiscussions },
    { label: 'Pending Reports', value: stats.pendingReports, accent: stats.pendingReports > 0 },
    { label: 'Pending Events', value: stats.pendingEvents, accent: stats.pendingEvents > 0 },
    { label: 'Pieces', value: seedPieces.length },
    ...(isAdmin ? [
      { label: 'Composers', value: composerCount },
      { label: 'Editions', value: editionCount },
    ] : []),
  ];

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(card => (
          <div key={card.label} className="bg-surface border border-border rounded-xl p-5">
            <div className="text-xs text-muted mb-1">{card.label}</div>
            <div className={`font-display text-2xl ${(card as any).accent ? 'text-[#B45309]' : 'text-ink'}`}>
              {card.value.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {isAdmin && recentUsers.length > 0 && (
        <div>
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
                {recentUsers.map(u => (
                  <tr key={u.id} className="border-b border-border/50 last:border-b-0">
                    <td className="px-4 py-2 font-medium">{u.display_name}</td>
                    <td className="px-4 py-2 text-muted">{u.instrument || '—'}</td>
                    <td className="px-4 py-2 text-muted capitalize">{u.level || '—'}</td>
                    <td className="px-4 py-2 text-muted">{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
