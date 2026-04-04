import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

type EventStatus = 'queued' | 'approved' | 'rejected';

interface QueuedEvent {
  id: string;
  title: string;
  venue: string | null;
  city: string | null;
  event_date: string;
  event_type: string;
  source: string;
  status: EventStatus;
  created_by: string | null;
  created_at: string;
  moderation_note: string | null;
}

interface Props {
  userId: string;
}

export default function AdminEventQueue({ userId }: Props) {
  const [events, setEvents] = useState<QueuedEvent[]>([]);
  const [statusFilter, setStatusFilter] = useState<EventStatus>('queued');
  const [counts, setCounts] = useState({ queued: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);

  async function fetchCounts() {
    const [q, a, r] = await Promise.all([
      supabase.from('events').select('*', { count: 'exact', head: true }).eq('status', 'queued'),
      supabase.from('events').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('events').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
    ]);
    setCounts({ queued: q.count ?? 0, approved: a.count ?? 0, rejected: r.count ?? 0 });
  }

  async function fetchEvents(status: EventStatus) {
    setLoading(true);
    const { data } = await supabase
      .from('events')
      .select('id, title, venue, city, event_date, event_type, source, status, created_by, created_at, moderation_note')
      .eq('status', status)
      .order('created_at', { ascending: true })
      .limit(50);
    setEvents((data || []) as QueuedEvent[]);
    setLoading(false);
  }

  useEffect(() => {
    fetchCounts();
    fetchEvents(statusFilter);
  }, [statusFilter]);

  async function moderate(eventId: string, action: 'approve' | 'reject' | 'requeue') {
    const statusMap = { approve: 'approved', reject: 'rejected', requeue: 'queued' } as const;
    let note: string | null = null;

    if (action === 'reject') {
      note = prompt('Reason for rejection (optional):');
      if (note === null) return; // cancelled
    }

    const { error } = await supabase
      .from('events')
      .update({
        status: statusMap[action],
        moderated_by: userId,
        moderated_at: new Date().toISOString(),
        moderation_note: note || null,
      })
      .eq('id', eventId);

    if (error) {
      alert(`Failed: ${error.message}`);
      return;
    }

    setEvents(prev => prev.filter(e => e.id !== eventId));
    fetchCounts();
  }

  const tabStyle = (status: EventStatus) =>
    `px-3 py-1.5 text-xs cursor-pointer transition-colors ${
      statusFilter === status
        ? status === 'queued' ? 'bg-[#CA8A04] text-white'
          : status === 'approved' ? 'bg-[#15803D] text-white'
          : 'bg-[#DC2626] text-white'
        : 'text-[#78716C] hover:text-[#1C1917]'
    }`;

  return (
    <div>
      {/* Status tabs */}
      <div className="flex gap-px border border-[#E7E5E4] rounded-lg overflow-hidden w-fit mb-6">
        <button onClick={() => setStatusFilter('queued')} className={tabStyle('queued')}>
          Queued ({counts.queued})
        </button>
        <button onClick={() => setStatusFilter('approved')} className={tabStyle('approved')}>
          Approved ({counts.approved})
        </button>
        <button onClick={() => setStatusFilter('rejected')} className={tabStyle('rejected')}>
          Rejected ({counts.rejected})
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-sm text-[#78716C]">Loading...</div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 text-sm text-[#78716C]">
          No {statusFilter} events.
        </div>
      ) : (
        <div className="space-y-3">
          {events.map(event => (
            <div key={event.id} className="bg-white border border-[#E7E5E4] rounded-lg p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] text-[#78716C] bg-[#FAF8F5] border border-[#E7E5E4] px-2 py-0.5 rounded capitalize">
                      {event.event_type}
                    </span>
                    <span className="text-[10px] text-[#A8A29E]">via {event.source}</span>
                    <span className="font-mono text-[10px] text-[#78716C]">
                      {new Date(event.event_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <a href={`/events/${event.id}`} className="font-serif text-lg text-[#1C1917] no-underline hover:underline" target="_blank">
                    {event.title}
                  </a>
                  <div className="text-xs text-[#78716C] mt-0.5">
                    {event.venue}{event.city ? `, ${event.city}` : ''}
                    {event.created_by && <span> &middot; user submitted</span>}
                  </div>
                  <div className="text-[10px] text-[#A8A29E] mt-1">
                    Submitted {new Date(event.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </div>
                  {event.moderation_note && (
                    <div className="mt-2 text-xs text-[#78716C] bg-[#FAF8F5] px-3 py-2 rounded">
                      Note: {event.moderation_note}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  {statusFilter !== 'approved' && (
                    <button onClick={() => moderate(event.id, 'approve')}
                      className="px-3 py-1 text-xs bg-[#15803D] text-white rounded hover:bg-[#166534] transition-colors cursor-pointer">
                      Approve
                    </button>
                  )}
                  {statusFilter !== 'rejected' && (
                    <button onClick={() => moderate(event.id, 'reject')}
                      className="px-3 py-1 text-xs bg-[#DC2626] text-white rounded hover:bg-[#B91C1C] transition-colors cursor-pointer">
                      Reject
                    </button>
                  )}
                  {statusFilter !== 'queued' && (
                    <button onClick={() => moderate(event.id, 'requeue')}
                      className="px-3 py-1 text-xs border border-[#E7E5E4] text-[#78716C] rounded hover:border-[#78716C] transition-colors cursor-pointer">
                      Requeue
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
