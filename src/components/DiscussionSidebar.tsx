import { useState, useEffect, useRef } from 'react';
import { supabase, hasSupabase } from '../lib/supabase';
import { useAuth } from '../lib/useAuth';
import { getInitials, formatTime } from '../lib/helpers';

interface Message {
  id: string;
  userId: string | null;
  sender: string;
  instrument: string | null;
  level: string | null;
  text: string;
  time: string;
  parentId: string | null;
}

interface DiscussionSidebarProps {
  pieceId: string;
  pieceTitle: string;
  sidebarWidth?: number;
}

export default function DiscussionSidebar({ pieceId, pieceTitle, sidebarWidth }: DiscussionSidebarProps) {
  const { user, signIn } = useAuth();
  const [messages, setMessages] = useState<Message[]>(() => {
    if (!hasSupabase) return [];
    return [];
  });
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(hasSupabase);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Fetch discussions from Supabase
  useEffect(() => {
    if (!hasSupabase) return;

    const fetchDiscussions = async () => {
      const { data, error } = await supabase
        .from('discussions')
        .select(`
          id, text, created_at, parent_id,
          users!inner(display_name, instrument, level)
        `)
        .eq('piece_id', pieceId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        setMessages(data.map((d: any) => ({
          id: d.id,
          userId: d.user_id,
          sender: d.users.display_name,
          instrument: d.users.instrument,
          level: d.users.level,
          text: d.text,
          time: formatTime(d.created_at),
          parentId: d.parent_id,
        })));
      }
      setLoading(false);
    };

    fetchDiscussions();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`discussions:${pieceId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'discussions',
        filter: `piece_id=eq.${pieceId}`,
      }, async (payload) => {
        // Fetch the user info for the new message
        const { data: userData } = await supabase
          .from('users')
          .select('display_name, instrument, level')
          .eq('id', payload.new.user_id)
          .single();

        const newMsg: Message = {
          id: payload.new.id,
          userId: payload.new.user_id,
          sender: userData?.display_name || 'Unknown',
          instrument: userData?.instrument || null,
          level: userData?.level || null,
          text: payload.new.text,
          time: 'just now',
          parentId: payload.new.parent_id,
        };
        setMessages(prev => [newMsg, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pieceId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    if (hasSupabase && !user) {
      signIn();
      return;
    }

    if (hasSupabase && user) {
      // Post to Supabase
      const { error } = await supabase.from('discussions').insert({
        piece_id: pieceId,
        user_id: user.id,
        text: newMessage.trim(),
        parent_id: null,
      });
      if (!error) {
        setNewMessage('');
      }
    } else {
      // Local-only mode (no Supabase)
      const msg: Message = {
        id: `local-${Date.now()}`,
        userId: null,
        sender: 'You',
        instrument: null,
        level: null,
        text: newMessage.trim(),
        time: 'just now',
        parentId: null,
      };
      setMessages(prev => [msg, ...prev]);
      setNewMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  // Show messages in chronological order (oldest first)
  const sortedMessages = [...messages].reverse();

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-[15px] font-semibold">Discussion</h2>
        <span className="text-xs text-gray-400">
          {messages.length} message{messages.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Messages — chronological order */}
      <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
        {loading ? (
          <div className="text-center py-8 text-sm text-gray-400">Loading...</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-400 mb-1">No discussion yet</p>
            <p className="text-xs text-gray-400">
              Be the first to share a tip or ask a question.
            </p>
          </div>
        ) : (
          sortedMessages.map((msg) => (
            <div key={msg.id} className={msg.parentId ? 'ml-9' : ''}>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-[11px] font-semibold text-gray-500 flex-shrink-0">
                  {getInitials(msg.sender)}
                </div>
                {msg.userId ? (
                  <a href={`/profile/${msg.userId}`} className="text-[13px] font-semibold text-gray-800 no-underline hover:underline">{msg.sender}</a>
                ) : (
                  <span className="text-[13px] font-semibold text-gray-800">{msg.sender}</span>
                )}
                {msg.instrument && (
                  <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">
                    {msg.instrument}
                  </span>
                )}
                {msg.level && (
                  <span className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded capitalize">
                    {msg.level}
                  </span>
                )}
                <span className="text-[11px] text-gray-400">{msg.time}</span>
              </div>
              <p className="text-[13px] leading-relaxed text-gray-600 ml-9">{msg.text}</p>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Compose — sticky to bottom of sidebar */}
      <form
        onSubmit={handleSubmit}
        className="sticky bottom-0 bg-white border-t border-l border-gray-200 -mx-4 md:-mx-5 px-4 md:px-5 py-3 z-10"
      >
        <div className="relative">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={user || !hasSupabase
              ? "Share a tip, ask a question..."
              : "Sign in to join the discussion..."
            }
            className="w-full border-none outline-none px-3 py-2.5 pr-10 text-[13px] resize-none h-[50px] bg-transparent"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="absolute right-2 bottom-2 p-1.5 rounded-md disabled:opacity-30 disabled:cursor-not-allowed text-[#B45309] hover:bg-[#FEF3C7] transition-colors bg-transparent border-none cursor-pointer"
            title="Post"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" />
              <path d="m21.854 2.147-10.94 10.939" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
