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
  url: string | null;
  poster_url: string | null;
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
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

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
    setSelected(new Set());
    const { data } = await supabase
      .from('events')
      .select('id, title, venue, city, event_date, event_type, source, url, poster_url, status, created_by, created_at, moderation_note')
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

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === events.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(events.map(e => e.id)));
    }
  }

  async function moderate(eventId: string, action: 'approve' | 'reject' | 'requeue') {
    const statusMap = { approve: 'approved', reject: 'rejected', requeue: 'queued' } as const;
    let note: string | null = null;

    if (action === 'reject') {
      note = prompt('Reason for rejection (optional):');
      if (note === null) return;
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
    setSelected(prev => { const next = new Set(prev); next.delete(eventId); return next; });
    fetchCounts();
  }

  async function bulkModerate(action: 'approve' | 'reject' | 'requeue') {
    if (selected.size === 0) return;

    const statusMap = { approve: 'approved', reject: 'rejected', requeue: 'queued' } as const;
    let note: string | null = null;

    if (action === 'reject') {
      note = prompt(`Reason for rejecting ${selected.size} events (optional):`);
      if (note === null) return;
    }

    if (!confirm(`${action === 'approve' ? 'Approve' : action === 'reject' ? 'Reject' : 'Requeue'} ${selected.size} events?`)) return;

    setBulkLoading(true);
    const ids = Array.from(selected);

    const { error } = await supabase
      .from('events')
      .update({
        status: statusMap[action],
        moderated_by: userId,
        moderated_at: new Date().toISOString(),
        moderation_note: note || null,
      })
      .in('id', ids);

    setBulkLoading(false);

    if (error) {
      alert(`Bulk action failed: ${error.message}`);
      return;
    }

    setEvents(prev => prev.filter(e => !selected.has(e.id)));
    setSelected(new Set());
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

  const allSelected = events.length > 0 && selected.size === events.length;

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

      {/* Bulk actions bar */}
      {events.length > 0 && (
        <div className="flex items-center gap-3 mb-4 py-2 border-b border-[#E7E5E4]">
          <label className="flex items-center gap-2 text-xs text-[#78716C] cursor-pointer">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              className="accent-[#B45309]"
            />
            {selected.size > 0 ? `${selected.size} selected` : 'Select all'}
          </label>

          {selected.size > 0 && (
            <>
              {statusFilter !== 'approved' && (
                <button onClick={() => bulkModerate('approve')} disabled={bulkLoading}
                  className="px-3 py-1 text-xs bg-[#15803D] text-white rounded hover:bg-[#166534] transition-colors cursor-pointer disabled:opacity-50">
                  Approve {selected.size}
                </button>
              )}
              {statusFilter !== 'rejected' && (
                <button onClick={() => bulkModerate('reject')} disabled={bulkLoading}
                  className="px-3 py-1 text-xs bg-[#DC2626] text-white rounded hover:bg-[#B91C1C] transition-colors cursor-pointer disabled:opacity-50">
                  Reject {selected.size}
                </button>
              )}
              {statusFilter !== 'queued' && (
                <button onClick={() => bulkModerate('requeue')} disabled={bulkLoading}
                  className="px-3 py-1 text-xs border border-[#E7E5E4] text-[#78716C] rounded hover:border-[#78716C] transition-colors cursor-pointer disabled:opacity-50">
                  Requeue {selected.size}
                </button>
              )}
            </>
          )}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-sm text-[#78716C]">Loading...</div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 text-sm text-[#78716C]">
          No {statusFilter} events.
        </div>
      ) : (
        <div className="space-y-3">
          {events.map(event => (
            <div key={event.id} className={`bg-white border rounded-lg p-5 transition-colors ${
              selected.has(event.id) ? 'border-[#B45309] bg-[#FEF3C7]/20' : 'border-[#E7E5E4]'
            }`}>
              <div className="flex items-start gap-4">
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={selected.has(event.id)}
                  onChange={() => toggleSelect(event.id)}
                  className="mt-1 accent-[#B45309] flex-shrink-0"
                />

                {/* Poster thumbnail */}
                {event.poster_url && (
                  <div className="flex-shrink-0 w-16 h-20 rounded overflow-hidden bg-[#FAF8F5]">
                    <img src={event.poster_url} alt="" className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Event details */}
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
                  <div className="font-serif text-lg text-[#1C1917]">
                    {event.title}
                  </div>
                  <div className="text-xs text-[#78716C] mt-0.5">
                    {event.venue}{event.city ? `, ${event.city}` : ''}
                    {event.created_by && <span> &middot; user submitted</span>}
                  </div>
                  {event.url && (
                    <a href={event.url} target="_blank" rel="noopener noreferrer"
                      className="inline-block mt-1 text-xs text-[#B45309] no-underline hover:underline">
                      View source &rarr;
                    </a>
                  )}
                  <div className="text-[10px] text-[#A8A29E] mt-1">
                    Submitted {new Date(event.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </div>
                  {event.moderation_note && (
                    <div className="mt-2 text-xs text-[#78716C] bg-[#FAF8F5] px-3 py-2 rounded">
                      Note: {event.moderation_note}
                    </div>
                  )}
                </div>

                {/* Per-item actions */}
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
