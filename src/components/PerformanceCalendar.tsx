import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ExternalLink, Plus, X } from 'lucide-react';
import { hasSupabase, supabase } from '../lib/supabase';
import { useAuth } from '../lib/useAuth';
import { formatPerformanceDate, normalizeConcertUrl, type PiecePerformance } from '../lib/performanceCalendar';

interface Props {
  pieceId: string;
  pieceTitle: string;
}

const emptyForm = { eventName: '', venue: '', date: '', concertUrl: '' };

export default function PerformanceCalendar({ pieceId, pieceTitle }: Props) {
  const { user, loading: authLoading, signIn } = useAuth();
  const [performances, setPerformances] = useState<PiecePerformance[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const storageKey = `irregular-pearl:performances:${pieceId}`;

  useEffect(() => {
    if (!hasSupabase) {
      try { setPerformances(JSON.parse(localStorage.getItem(storageKey) || '[]')); } catch { setPerformances([]); }
      return;
    }
    (async () => {
      const { data } = await (supabase as any).from('performances').select('id,user_id,event_name,venue,date,piece_id,concert_url').eq('piece_id', pieceId).not('date', 'is', null).order('date');
      if (data) setPerformances(data as PiecePerformance[]);
    })();
  }, [pieceId, storageKey]);

  const sorted = useMemo(() => [...performances].sort((a, b) => a.date.localeCompare(b.date)), [performances]);

  async function addPerformance(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    const concertUrl = normalizeConcertUrl(form.concertUrl);
    if (!form.eventName.trim() || !form.date) return setError('Add a concert name and date.');
    if (form.concertUrl.trim() && !concertUrl) return setError('Enter a valid concert link.');
    if (hasSupabase && !user) return setError('Sign in to add your performance.');

    setSaving(true);
    const next: PiecePerformance = {
      id: crypto.randomUUID(), user_id: user?.id ?? null, event_name: form.eventName.trim(), venue: form.venue.trim() || null,
      date: form.date, piece_id: pieceId, concert_url: concertUrl,
    };
    if (hasSupabase) {
      const { data, error: saveError } = await (supabase as any).from('performances').insert({
        user_id: user!.id, event_name: next.event_name, venue: next.venue, date: next.date, piece_id: pieceId,
        is_upcoming: next.date >= new Date().toISOString().slice(0, 10), concert_url: next.concert_url,
      }).select('id,user_id,event_name,venue,date,piece_id,concert_url').single();
      if (saveError) { setSaving(false); return setError('The performance could not be saved. Please try again.'); }
      setPerformances((items) => [...items, data as PiecePerformance]);
    } else {
      const items = [...performances, next];
      setPerformances(items);
      localStorage.setItem(storageKey, JSON.stringify(items));
    }
    setForm(emptyForm);
    setShowForm(false);
    setSaving(false);
  }

  async function removePerformance(item: PiecePerformance) {
    if (hasSupabase) await (supabase as any).from('performances').delete().eq('id', item.id).eq('user_id', user?.id);
    const items = performances.filter((entry) => entry.id !== item.id);
    setPerformances(items);
    if (!hasSupabase) localStorage.setItem(storageKey, JSON.stringify(items));
  }

  return (
    <div className="performance-calendar">
      <div className="performance-calendar-head">
        <div>
          <h2>Performance calendar</h2>
          <p>Share when and where this piece will be performed.</p>
        </div>
        {!showForm && <button className="performance-add" type="button" onClick={() => setShowForm(true)}><Plus size={14} /> Add performance</button>}
      </div>

      {showForm && (
        <form className="performance-form" onSubmit={addPerformance}>
          <div className="performance-form-top"><strong>Add a performance</strong><button type="button" onClick={() => { setShowForm(false); setError(''); }} aria-label="Close form"><X size={15} /></button></div>
          <div className="performance-fields">
            <label><span>Concert name</span><input required value={form.eventName} onChange={(e) => setForm({ ...form, eventName: e.target.value })} placeholder={`${pieceTitle} in concert`} /></label>
            <label><span>Date</span><input required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></label>
            <label><span>Venue</span><input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} placeholder="Hall or city (optional)" /></label>
            <label><span>Concert link</span><input type="text" inputMode="url" value={form.concertUrl} onChange={(e) => setForm({ ...form, concertUrl: e.target.value })} placeholder="https://… (optional)" /></label>
          </div>
          {error && <p className="performance-error" role="alert">{error}</p>}
          <div className="performance-actions">
            {hasSupabase && !authLoading && !user ? <button className="performance-save" type="button" onClick={signIn}>Sign in to add</button> : <button className="performance-save" disabled={saving}>{saving ? 'Saving…' : 'Add to calendar'}</button>}
            <button className="performance-cancel" type="button" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      {sorted.length === 0 ? (
        <div className="performance-empty"><CalendarDays size={18} /><span>No performances scheduled yet.</span></div>
      ) : (
        <div className="performance-list">
          {sorted.map((item) => {
            const date = formatPerformanceDate(item.date);
            const own = !hasSupabase || item.user_id === user?.id;
            return <article className="performance-row" key={item.id}>
              <time dateTime={item.date} aria-label={date.full}><span>{date.month}</span><strong>{date.day}</strong></time>
              <div className="performance-copy">
                {item.concert_url ? <a href={item.concert_url} target="_blank" rel="noopener noreferrer">{item.event_name}<ExternalLink size={12} /></a> : <strong>{item.event_name}</strong>}
                {item.venue && <span>{item.venue}</span>}
              </div>
              {own && <button className="performance-remove" type="button" onClick={() => removePerformance(item)} aria-label={`Remove ${item.event_name}`}><X size={14} /></button>}
            </article>;
          })}
        </div>
      )}
    </div>
  );
}
