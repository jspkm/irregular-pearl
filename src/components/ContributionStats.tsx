import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Props {
  userId: string;
}

interface Stats {
  editions: number;
  discussions: number;
  pieces: number;
}

export default function ContributionStats({ userId }: Props) {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    async function load() {
      const [editionsRes, discussionsRes, piecesRes] = await Promise.allSettled([
        supabase.from('edition_reviews').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('discussions').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('pieces').select('id', { count: 'exact', head: true }).eq('source', 'user'),
      ]);

      setStats({
        editions: editionsRes.status === 'fulfilled' ? (editionsRes.value.count ?? 0) : 0,
        discussions: discussionsRes.status === 'fulfilled' ? (discussionsRes.value.count ?? 0) : 0,
        pieces: piecesRes.status === 'fulfilled' ? (piecesRes.value.count ?? 0) : 0,
      });
    }
    load();
  }, [userId]);

  if (!stats) return null;

  const total = stats.editions + stats.discussions + stats.pieces;
  if (total === 0) return null;

  return (
    <div className="text-xs text-muted">
      <span className="font-medium text-ink">{total} contribution{total !== 1 ? 's' : ''}</span>
      <span className="mx-1">·</span>
      {[
        stats.editions > 0 && `${stats.editions} review${stats.editions !== 1 ? 's' : ''}`,
        stats.discussions > 0 && `${stats.discussions} discussion${stats.discussions !== 1 ? 's' : ''}`,
        stats.pieces > 0 && `${stats.pieces} piece${stats.pieces !== 1 ? 's' : ''} added`,
      ].filter(Boolean).join(' · ')}
    </div>
  );
}
