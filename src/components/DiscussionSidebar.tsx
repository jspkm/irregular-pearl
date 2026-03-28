import { useState, useEffect, useRef } from 'react';
import { supabase, hasSupabase } from '../lib/supabase';
import { useAuth } from '../lib/useAuth';

interface Message {
  id: string;
  sender: string;
  level: string | null;
  text: string;
  time: string;
  parentId: string | null;
}

interface DiscussionSidebarProps {
  pieceId: string;
  pieceTitle: string;
}

// Placeholder messages for demo (used when Supabase is not configured)
const placeholderMessages: Record<string, Message[]> = {
  'bach-cello-suite-1': [
    { id: '1', sender: 'Sarah K.', level: 'Teacher', text: 'For students struggling with the Prelude tempo, I recommend starting at quarter=50 and focusing on the string crossings in bars 9-12 before bringing it up. The Henle edition makes these passages much clearer than the Rose.', time: '2h ago', parentId: null },
    { id: '2', sender: 'Marco R.', level: null, text: "Has anyone compared the Bärenreiter bowings in the Sarabande with Casals' recording? The editorial choices feel like they're pulling away from historical performance practice.", time: '5h ago', parentId: null },
    { id: '3', sender: 'Jun L.', level: null, text: 'Preparing this for my conservatory audition next month. The Courante is killing me. Any tips on the 16th note runs starting at bar 22?', time: '1d ago', parentId: null },
    { id: '4', sender: 'Anna L.', level: 'Performer', text: "@Jun slow practice with the metronome, but also try practicing the bariolage patterns in isolation. I wrote a practice guide for this section.", time: '2d ago', parentId: '3' },
  ],
  'chopin-ballade-1': [
    { id: '5', sender: 'Elena P.', level: 'Teacher', text: 'The National Edition (Ekier) really changed how I teach this piece. The fingering suggestions in the coda are significantly different from the Henle and make more musical sense.', time: '3h ago', parentId: null },
    { id: '6', sender: 'David W.', level: null, text: 'Working on the second theme... the voicing in the left hand is so tricky. Anyone have tips for bringing out the inner melody while keeping the bass light?', time: '1d ago', parentId: null },
  ],
  'beethoven-sonata-14': [
    { id: '7', sender: 'Lisa M.', level: null, text: 'Hot take: the first movement is actually harder to play well than the third. Anyone can play it at tempo but making it sing without being boring requires real control.', time: '4h ago', parentId: null },
    { id: '8', sender: 'Tom H.', level: 'Teacher', text: '@Lisa totally agree. The pedaling alone is a whole study. Most students over-pedal. Try half-pedaling on each beat change.', time: '6h ago', parentId: '7' },
  ],
};

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d ago`;
}

export default function DiscussionSidebar({ pieceId, pieceTitle }: DiscussionSidebarProps) {
  const { user, signIn } = useAuth();
  const [messages, setMessages] = useState<Message[]>(() => {
    if (!hasSupabase) return placeholderMessages[pieceId] || [];
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
          users!inner(display_name, level)
        `)
        .eq('piece_id', pieceId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        setMessages(data.map((d: any) => ({
          id: d.id,
          sender: d.users.display_name,
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
          .select('display_name, level')
          .eq('id', payload.new.user_id)
          .single();

        const newMsg: Message = {
          id: payload.new.id,
          sender: userData?.display_name || 'Unknown',
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
        sender: 'You',
        level: null,
        text: newMessage.trim(),
        time: 'just now',
        parentId: null,
      };
      setMessages(prev => [msg, ...prev]);
      setNewMessage('');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-[15px] font-semibold">Discussion</h2>
        <span className="text-xs text-gray-400">
          {messages.length} message{messages.length !== 1 ? 's' : ''}
        </span>
      </div>

        <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-0">
        {loading ? (
          <div className="text-center py-8 text-sm text-gray-400">Loading...</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-400 mb-1">No discussion yet</p>
            <p className="text-xs text-gray-400">
              Be the first to share a tip, ask a question, or discuss this piece.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={msg.parentId ? 'ml-9' : ''}>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-[11px] font-semibold text-gray-500 flex-shrink-0">
                  {getInitials(msg.sender)}
                </div>
                <span className="text-[13px] font-semibold text-gray-800">{msg.sender}</span>
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

      <form onSubmit={handleSubmit} className="border-t border-gray-100 pt-4 mt-auto">
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={user || !hasSupabase
            ? "Share a tip, ask a question, or discuss this piece..."
            : "Sign in to join the discussion..."
          }
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-[13px] resize-none h-[70px] focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
        />
        <div className="flex justify-end mt-2">
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-gray-900 text-white px-4 py-1.5 rounded-md text-[13px] font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
          >
            {!hasSupabase || user ? 'Post' : 'Sign in to post'}
          </button>
        </div>
      </form>
    </div>
  );
}
