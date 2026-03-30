import { useState, useEffect } from 'react';
import { supabase, hasSupabase } from '../lib/supabase';
import { ACTIVITY_STAT_LABELS } from '../lib/helpers';

interface PieceActivityStatsProps {
  pieceId: string;
}

export default function PieceActivityStats({ pieceId }: PieceActivityStatsProps) {
  const [musicianCount, setMusicianCount] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [breakdown, setBreakdown] = useState('');

  useEffect(() => {
    if (!hasSupabase) return;

    const fetch = async () => {
      const { data } = await supabase
        .from('activity_log')
        .select('user_id, activity')
        .eq('piece_id', pieceId);

      if (!data || data.length === 0) return;

      const uniqueUsers = new Set(data.map(r => r.user_id));
      setMusicianCount(uniqueUsers.size);
      setSessionCount(data.length);

      const counts: Record<string, number> = {};
      for (const r of data) {
        counts[r.activity] = (counts[r.activity] || 0) + 1;
      }

      const parts = Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([type, count]) => `${count} ${ACTIVITY_STAT_LABELS[type] || type}`);

      setBreakdown(parts.join(', '));
    };

    fetch();
  }, [pieceId]);

  if (sessionCount === 0) return null;

  return (
    <div className="border-t border-[#F3F2F0] pt-2.5 mt-2 flex flex-col gap-0.5">
      {musicianCount >= 2 && (
        <div className="text-xs font-medium text-[#57534E]">
          {musicianCount} musicians on this
        </div>
      )}
      <div className="text-[11px] text-[#A8A29E]">
        {sessionCount} sessions · {breakdown}
      </div>
    </div>
  );
}
