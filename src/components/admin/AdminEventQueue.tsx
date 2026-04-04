import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import InlineConfirm, { InlineMessage } from './InlineConfirm';

type EventStatus = 'queued' | 'approved' | 'rejected';
type ConfirmAction = { type: 'single'; id: string; action: 'approve' | 'reject' | 'requeue' }
  | { type: 'bulk'; action: 'approve' | 'reject' | 'requeue' };

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
  const [pendingConfirm, setPendingConfirm] = useState<ConfirmAction | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);

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
    setPendingConfirm(null);
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

  function requestAction(action: 'approve' | 'reject' | 'requeue', eventId?: string) {
    setPendingConfirm(eventId
      ? { type: 'single', id: eventId, action }
      : { type: 'bulk', action }
    );
  }

  async function executeAction(note?: string) {
    if (!pendingConfirm) return;
    const statusMap = { approve: 'approved', reject: 'rejected', requeue: 'queued' } as const;
    const newStatus = statusMap[pendingConfirm.action];

    const ids = pendingConfirm.type === 'single'
      ? [pendingConfirm.id]
      : Array.from(selected);

    const { error } = await supabase
      .from('events')
      .update({
        status: newStatus,
        moderated_by: userId,
        moderated_at: new Date().toISOString(),
        moderation_note: note || null,
      })
      .in('id', ids);

    setPendingConfirm(null);

    if (error) {
      setMessage({ text: `Failed: ${error.message}`, type: 'error' });
      return;
    }

    const count = ids.length;
    const label = pendingConfirm.action === 'approve' ? 'approved' : pendingConfirm.action === 'reject' ? 'rejected' : 'requeued';
    setMessage({ text: `${count} event${count !== 1 ? 's' : ''} ${label}.`, type: 'success' });
    setEvents(prev => prev.filter(e => !ids.includes(e.id)));
    setSelected(prev => { const next = new Set(prev); ids.forEach(id => next.delete(id)); return next; });
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
  const actionLabel = (a: string) => a === 'approve' ? 'Approve' : a === 'reject' ? 'Reject' : 'Requeue';
  const actionStyle = (a: string): 'success' | 'danger' | 'default' => a === 'approve' ? 'success' : a === 'reject' ? 'danger' : 'default';

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

      {/* Inline message */}
      {message && <InlineMessage message={message.text} type={message.type} onDismiss={() => setMessage(null)} />}

      {/* Bulk actions bar */}
      {events.length > 0 && (
        <div className="flex items-center gap-3 mb-4 py-2 border-b border-[#E7E5E4]">
          <label className="flex items-center gap-2 text-xs text-[#78716C] cursor-pointer">
            <input type="checkbox" checked={allSelected} onChange={toggleAll} className="accent-[#B45309]" />
            {selected.size > 0 ? `${selected.size} selected` : 'Select all'}
          </label>

          {selected.size > 0 && !pendingConfirm && (
            <>
              {statusFilter !== 'approved' && (
                <button onClick={() => requestAction('approve')}
                  className="px-3 py-1 text-xs bg-[#15803D] text-white rounded hover:bg-[#166534] transition-colors cursor-pointer border-none">
                  Approve {selected.size}
                </button>
              )}
              {statusFilter !== 'rejected' && (
                <button onClick={() => requestAction('reject')}
                  className="px-3 py-1 text-xs bg-[#DC2626] text-white rounded hover:bg-[#B91C1C] transition-colors cursor-pointer border-none">
                  Reject {selected.size}
                </button>
              )}
              {statusFilter !== 'queued' && (
                <button onClick={() => requestAction('requeue')}
                  className="px-3 py-1 text-xs border border-[#E7E5E4] text-[#78716C] rounded hover:border-[#78716C] transition-colors cursor-pointer bg-transparent">
                  Requeue {selected.size}
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Bulk confirm inline */}
      {pendingConfirm?.type === 'bulk' && (
        <InlineConfirm
          message={`${actionLabel(pendingConfirm.action)} ${selected.size} event${selected.size !== 1 ? 's' : ''}?`}
          confirmLabel={`${actionLabel(pendingConfirm.action)} ${selected.size}`}
          confirmStyle={actionStyle(pendingConfirm.action)}
          inputPlaceholder={pendingConfirm.action === 'reject' ? 'Reason for rejection (optional)...' : undefined}
          onConfirm={(note) => executeAction(note)}
          onCancel={() => setPendingConfirm(null)}
        />
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
                <input
                  type="checkbox"
                  checked={selected.has(event.id)}
                  onChange={() => toggleSelect(event.id)}
                  className="mt-1 accent-[#B45309] flex-shrink-0"
                />

                {event.poster_url && (
                  <div className="flex-shrink-0 w-16 h-20 rounded overflow-hidden bg-[#FAF8F5]">
                    <img src={event.poster_url} alt="" className="w-full h-full object-cover" />
                  </div>
                )}

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
                  <div className="font-serif text-lg text-[#1C1917]">{event.title}</div>
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

                  {/* Inline confirm for this event */}
                  {pendingConfirm?.type === 'single' && pendingConfirm.id === event.id && (
                    <InlineConfirm
                      message={`${actionLabel(pendingConfirm.action)} this event?`}
                      confirmLabel={actionLabel(pendingConfirm.action)}
                      confirmStyle={actionStyle(pendingConfirm.action)}
                      inputPlaceholder={pendingConfirm.action === 'reject' ? 'Reason for rejection (optional)...' : undefined}
                      onConfirm={(note) => executeAction(note)}
                      onCancel={() => setPendingConfirm(null)}
                    />
                  )}
                </div>

                {/* Per-item actions (hidden when confirm is active for this item) */}
                {!(pendingConfirm?.type === 'single' && pendingConfirm.id === event.id) && (
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    {statusFilter !== 'approved' && (
                      <button onClick={() => requestAction('approve', event.id)}
                        className="px-3 py-1 text-xs bg-[#15803D] text-white rounded hover:bg-[#166534] transition-colors cursor-pointer border-none">
                        Approve
                      </button>
                    )}
                    {statusFilter !== 'rejected' && (
                      <button onClick={() => requestAction('reject', event.id)}
                        className="px-3 py-1 text-xs bg-[#DC2626] text-white rounded hover:bg-[#B91C1C] transition-colors cursor-pointer border-none">
                        Reject
                      </button>
                    )}
                    {statusFilter !== 'queued' && (
                      <button onClick={() => requestAction('requeue', event.id)}
                        className="px-3 py-1 text-xs border border-[#E7E5E4] text-[#78716C] rounded hover:border-[#78716C] transition-colors cursor-pointer bg-transparent">
                        Requeue
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
