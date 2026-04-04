/**
 * Interactive calendar view for events page.
 *
 * Features:
 * - Month grid (7 columns) with event count dots
 * - Click date to filter the events list (navigates with ?date=YYYY-MM-DD)
 * - Month navigation (prev/next)
 * - Mobile (<640px): horizontal week strip showing current week
 * - Respects active city and type filters via query params
 */

import { useState, useEffect } from 'react';

interface Props {
  mode: string;
  city: string;
  eventType: string;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function EventCalendar({ mode, city, eventType }: Props) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (!showCalendar) return;

    const supabaseUrl = (import.meta as any).env?.PUBLIC_SUPABASE_URL;
    const supabaseKey = (import.meta as any).env?.PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return;

    // Fetch event counts for this month via a simple API call
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endMonth = month === 12 ? 1 : month + 1;
    const endYear = month === 12 ? year + 1 : year;
    const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;

    import('@supabase/supabase-js').then(({ createClient }) => {
      const supabase = createClient(supabaseUrl, supabaseKey);
      supabase
        .from('events')
        .select('event_date')
        .eq('status', 'approved')
        .gte('event_date', startDate)
        .lt('event_date', endDate)
        .then(({ data }) => {
          if (!data) return;
          const c: Record<string, number> = {};
          for (const row of data) {
            const d = (row as { event_date: string }).event_date;
            c[d] = (c[d] || 0) + 1;
          }
          setCounts(c);
        });
    });
  }, [showCalendar, year, month]);

  function buildFilterUrl(date: string) {
    const params = new URLSearchParams();
    params.set('mode', mode);
    params.set('date', date);
    if (city) params.set('city', city);
    if (eventType) params.set('type', eventType);
    return `/events?${params.toString()}`;
  }

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  const monthName = new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Build calendar grid
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date().toISOString().split('T')[0];

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  if (!showCalendar) {
    return (
      <button
        onClick={() => setShowCalendar(true)}
        className="text-xs text-accent hover:underline mb-4 inline-block cursor-pointer bg-transparent border-none p-0 font-body"
      >
        Show calendar view
      </button>
    );
  }

  // Mobile: week strip
  if (isMobile) {
    const todayDate = new Date();
    const weekDates: Date[] = [];
    const dayOfWeek = todayDate.getDay();
    for (let i = 0; i < 7; i++) {
      const d = new Date(todayDate);
      d.setDate(todayDate.getDate() - dayOfWeek + i);
      weekDates.push(d);
    }

    return (
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted font-body">{monthName}</span>
          <button onClick={() => setShowCalendar(false)} className="text-xs text-accent hover:underline cursor-pointer bg-transparent border-none p-0 font-body">
            Hide calendar
          </button>
        </div>
        <div className="flex gap-1">
          {weekDates.map(d => {
            const dateStr = d.toISOString().split('T')[0];
            const count = counts[dateStr] || 0;
            const isToday = dateStr === today;
            return (
              <a
                key={dateStr}
                href={buildFilterUrl(dateStr)}
                className={`flex-1 text-center py-2 rounded-lg no-underline transition-colors ${
                  isToday ? 'bg-accent/10 border border-accent/30' : 'border border-border'
                }`}
              >
                <div className="text-[10px] text-muted font-mono">{DAYS[d.getDay()]}</div>
                <div className={`text-sm font-display ${isToday ? 'text-accent' : 'text-ink'}`}>{d.getDate()}</div>
                {count > 0 && (
                  <div className="flex justify-center mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                  </div>
                )}
              </a>
            );
          })}
        </div>
      </div>
    );
  }

  // Desktop: full month grid
  return (
    <div className="mb-6 border border-border rounded-lg p-4 bg-surface">
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="text-muted hover:text-ink text-sm cursor-pointer bg-transparent border-none p-1 font-body">&larr;</button>
        <span className="text-sm font-body text-ink font-medium">{monthName}</span>
        <div className="flex items-center gap-3">
          <button onClick={nextMonth} className="text-muted hover:text-ink text-sm cursor-pointer bg-transparent border-none p-1 font-body">&rarr;</button>
          <button onClick={() => setShowCalendar(false)} className="text-[10px] text-accent hover:underline cursor-pointer bg-transparent border-none p-0 font-body">
            Hide
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-px mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-[10px] text-muted font-mono py-1">{d}</div>
        ))}
      </div>

      {/* Calendar cells */}
      <div className="grid grid-cols-7 gap-px">
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} className="py-2" />;
          const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const count = counts[dateStr] || 0;
          const isToday = dateStr === today;

          return (
            <a
              key={dateStr}
              href={buildFilterUrl(dateStr)}
              className={`text-center py-2 rounded no-underline transition-colors hover:bg-accent/5 ${
                isToday ? 'bg-accent/10 font-medium' : ''
              }`}
            >
              <div className={`text-xs ${isToday ? 'text-accent' : 'text-ink'}`}>{day}</div>
              {count > 0 && (
                <div className="flex justify-center mt-0.5 gap-0.5">
                  {Array.from({ length: Math.min(count, 3) }).map((_, j) => (
                    <span key={j} className="w-1 h-1 rounded-full bg-accent" />
                  ))}
                  {count > 3 && <span className="text-[8px] text-accent ml-0.5">+</span>}
                </div>
              )}
            </a>
          );
        })}
      </div>
    </div>
  );
}
