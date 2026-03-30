import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, hasSupabase } from '../lib/supabase';
import { useAuth } from '../lib/useAuth';
import { ACTIVITIES } from '../lib/helpers';
import Toast from './Toast';

interface ActivityLogButtonProps {
  pieceId: string;
}

export default function ActivityLogButton({ pieceId }: ActivityLogButtonProps) {
  const { user, signIn } = useAuth();
  const [musicianCount, setMusicianCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; entryId: string } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchCounts = useCallback(async () => {
    if (!hasSupabase) return;

    const { count } = await supabase
      .from('activity_log')
      .select('user_id', { count: 'exact', head: false })
      .eq('piece_id', pieceId);

    // Count distinct users — the query returns all rows, so dedupe
    if (count !== null) {
      const { data } = await supabase
        .from('activity_log')
        .select('user_id')
        .eq('piece_id', pieceId);

      if (data) {
        const uniqueUsers = new Set(data.map(r => r.user_id));
        setMusicianCount(uniqueUsers.size);
      }
    }
  }, [pieceId]);

  useEffect(() => {
    fetchCounts();

    if (!hasSupabase) return;

    const channel = supabase
      .channel(`activity_log:${pieceId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'activity_log',
        filter: `piece_id=eq.${pieceId}`,
      }, () => {
        fetchCounts();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [pieceId, fetchCounts]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  const handleLog = async (activity: ActivityType, label: string) => {
    setIsOpen(false);

    if (hasSupabase && !user) {
      signIn();
      return;
    }

    if (hasSupabase && user) {
      const { data, error } = await supabase
        .from('activity_log')
        .insert({ piece_id: pieceId, user_id: user.id, activity })
        .select('id')
        .single();

      if (!error && data) {
        setToast({ message: `Logged: ${label}`, entryId: data.id });
        fetchCounts();
      }
    } else {
      // Local-only mode
      setToast({ message: `Logged: ${label}`, entryId: 'local' });
    }
  };

  const handleUndo = async () => {
    if (!toast) return;

    if (hasSupabase && user && toast.entryId !== 'local') {
      await supabase
        .from('activity_log')
        .delete()
        .eq('id', toast.entryId);

      fetchCounts();
    }
    setToast(null);
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div ref={dropdownRef} className="relative">
        <button
          onClick={() => {
            if (hasSupabase && !user) {
              signIn();
              return;
            }
            setIsOpen(!isOpen);
          }}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
            isOpen
              ? 'bg-[#B45309] text-white'
              : 'bg-[#1C1917] text-white hover:bg-[#292524]'
          }`}
        >
          + Log activity
        </button>

        {isOpen && (
          <div className="absolute top-[calc(100%+6px)] left-0 bg-white border border-[#E7E5E4] rounded-lg shadow-[0_4px_16px_rgba(28,25,23,0.08),0_1px_3px_rgba(28,25,23,0.04)] min-w-[220px] p-1 z-10">
            {ACTIVITIES.map(({ type, emoji, label }) => (
              <button
                key={type}
                onClick={() => handleLog(type, label)}
                className="flex items-center gap-2.5 w-full px-3.5 py-2.5 rounded-md text-sm text-[#1C1917] hover:bg-[#FEF3C7] transition-colors bg-transparent border-none cursor-pointer text-left"
              >
                <span className="text-[15px] w-5 text-center flex-shrink-0">{emoji}</span>
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {musicianCount >= 2 && (
        <span className="text-[13px] font-medium text-[#57534E]">
          {musicianCount} musicians on this
        </span>
      )}

      {toast && (
        <Toast
          message={toast.message}
          onUndo={handleUndo}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  );
}
