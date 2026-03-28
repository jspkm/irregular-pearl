import { useState, useEffect } from 'react';
import { supabase, hasSupabase } from '../lib/supabase';
import { useAuth } from '../lib/useAuth';

interface WorkingOnButtonProps {
  pieceId: string;
}

export default function WorkingOnButton({ pieceId }: WorkingOnButtonProps) {
  const { user, signIn } = useAuth();
  const [isWorking, setIsWorking] = useState(false);
  const [count, setCount] = useState(0);

  // Fetch count from Supabase
  useEffect(() => {
    if (!hasSupabase) return;

    const fetchCount = async () => {
      const { count: total } = await supabase
        .from('working_on')
        .select('*', { count: 'exact', head: true })
        .eq('piece_id', pieceId);
      setCount(total || 0);

      // Check if current user is working on this
      if (user) {
        const { data } = await supabase
          .from('working_on')
          .select('piece_id')
          .eq('piece_id', pieceId)
          .eq('user_id', user.id)
          .maybeSingle();
        setIsWorking(!!data);
      }
    };

    fetchCount();

    // Realtime count updates
    const channel = supabase
      .channel(`working_on:${pieceId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'working_on',
        filter: `piece_id=eq.${pieceId}`,
      }, () => {
        fetchCount();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [pieceId, user]);

  const handleToggle = async () => {
    if (hasSupabase && !user) {
      signIn();
      return;
    }

    if (hasSupabase && user) {
      if (isWorking) {
        await supabase.from('working_on').delete()
          .eq('piece_id', pieceId).eq('user_id', user.id);
        setIsWorking(false);
        setCount(c => Math.max(0, c - 1));
      } else {
        await supabase.from('working_on').insert({ piece_id: pieceId, user_id: user.id });
        setIsWorking(true);
        setCount(c => c + 1);
      }
    } else {
      // Local-only mode
      setIsWorking(!isWorking);
      setCount(c => isWorking ? Math.max(0, c - 1) : c + 1);
    }
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {count > 0 && (
        <div className="text-sm text-gray-600 bg-[#FEF3C7] border border-[#FDE68A] px-3 py-1.5 rounded-md inline-flex items-center gap-1.5">
          <span className="w-2 h-2 bg-[#B45309] rounded-full" />
          <strong>{count}</strong> musician{count !== 1 ? 's' : ''} working on this
        </div>
      )}
      <button
        onClick={handleToggle}
        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          isWorking
            ? 'bg-[#B45309] text-white hover:bg-[#92400E]'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        {isWorking ? '✓ Working on this' : '+ I\'m working on this'}
      </button>
    </div>
  );
}
