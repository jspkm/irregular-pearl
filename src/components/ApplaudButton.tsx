import { useState, useEffect } from 'react';
import { supabase, hasSupabase } from '../lib/supabase';
import { useAuth } from '../lib/useAuth';

interface ApplaudButtonProps {
  artistId: string;
  /** Compact mode for community cards (smaller button + inline count) */
  compact?: boolean;
}

export default function ApplaudButton({ artistId, compact = false }: ApplaudButtonProps) {
  const { user, signIn } = useAuth();
  const [count, setCount] = useState(0);
  const [hasApplauded, setHasApplauded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasSupabase) { setLoading(false); return; }

    const fetchApplause = async () => {
      // Get count
      const { count: total } = await supabase
        .from('applause')
        .select('*', { count: 'exact', head: true })
        .eq('artist_id', artistId);
      setCount(total || 0);

      // Check if current user has applauded
      if (user) {
        const { data } = await supabase
          .from('applause')
          .select('id')
          .eq('artist_id', artistId)
          .eq('user_id', user.id)
          .maybeSingle();
        setHasApplauded(!!data);
      }
      setLoading(false);
    };

    fetchApplause();

    // Realtime subscription for count updates
    const channel = supabase
      .channel(`applause:${artistId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'applause',
        filter: `artist_id=eq.${artistId}`,
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setCount(c => c + 1);
          if (user && (payload.new as any).user_id === user.id) setHasApplauded(true);
        } else if (payload.eventType === 'DELETE') {
          setCount(c => Math.max(0, c - 1));
          if (user && (payload.old as any).user_id === user.id) setHasApplauded(false);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [artistId, user?.id]);

  const handleToggle = async () => {
    if (!user) { signIn(); return; }
    if (loading) return;

    // Optimistic update
    if (hasApplauded) {
      setHasApplauded(false);
      setCount(c => Math.max(0, c - 1));
      await supabase.from('applause').delete().eq('artist_id', artistId).eq('user_id', user.id);
    } else {
      setHasApplauded(true);
      setCount(c => c + 1);
      await supabase.from('applause').insert({ artist_id: artistId, user_id: user.id });
    }
  };

  // Don't show applaud button on own profile
  const isOwnProfile = user?.id === artistId;

  const countText = count === 0 ? '' : count === 1 ? '1 applause' : `${count} applause`;

  if (compact) {
    return (
      <div className="flex justify-between items-center">
        <span className="text-xs text-muted">{countText}</span>
        {!isOwnProfile && (
          <button
            onClick={handleToggle}
            disabled={!hasSupabase}
            className={`text-xs font-medium px-3.5 py-1 rounded-full border cursor-pointer transition-all font-body ${
              hasApplauded
                ? 'bg-accent text-white border-accent'
                : !user
                  ? 'border-accent text-accent opacity-50'
                  : 'border-accent text-accent hover:bg-accent hover:text-white'
            }`}
          >
            {hasApplauded ? 'Applauding \u2713' : 'Applaud'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {countText && <span className="text-sm font-medium text-ink">{countText}</span>}
      {!isOwnProfile && (
        <button
          onClick={handleToggle}
          disabled={!hasSupabase}
          className={`text-[13px] font-medium px-5 py-1.5 rounded-full border cursor-pointer transition-all font-body ${
            hasApplauded
              ? 'bg-accent text-white border-accent'
              : !user
                ? 'border-accent text-accent opacity-50'
                : 'border-accent text-accent hover:bg-accent hover:text-white'
          }`}
        >
          {hasApplauded ? 'Applauding \u2713' : 'Applaud'}
        </button>
      )}
    </div>
  );
}
