/**
 * Event data helpers — two-helper pattern.
 *
 * getEventsBasic()  — list views (no JOINs, fast)
 * getEventFull()    — detail page (with performer/piece JOINs)
 *
 * Both filter by status='approved' for public queries.
 * Staff queries bypass the status filter via RLS.
 */

import { supabase, hasSupabase } from './supabase';
import type { EventStatus, EventType } from './database.types';

export interface EventBasic {
  id: string;
  title: string;
  venue: string | null;
  city: string | null;
  country: string | null;
  event_date: string;
  show_from: string | null;
  start_time: string | null;
  event_type: string;
  description: string | null;
  url: string | null;
  poster_url: string | null;
  ticket_price: string | null;
  ticket_url: string | null;
  status: EventStatus;
  source: string;
  created_by: string | null;
  performers_raw: string[] | null;
  program_raw: string[] | null;
}

export interface EventPerformer {
  users: { id: string; display_name: string; username: string | null } | null;
  pieces: { id: string; title: string; composer_name: string } | null;
  instruments: { id: string; type: string; maker: string | null } | null;
}

export interface EventFull extends EventBasic {
  moderated_by: string | null;
  moderated_at: string | null;
  moderation_note: string | null;
  performers: EventPerformer[];
}

export interface EventListOptions {
  mode?: 'upcoming' | 'archive';
  city?: string;
  venue?: string;
  eventType?: string;
  date?: string; // specific date filter (from calendar click)
  limit?: number;
  offset?: number;
}

const EVENT_BASIC_FIELDS = 'id, title, venue, city, country, event_date, show_from, start_time, event_type, description, url, poster_url, ticket_price, ticket_url, status, source, created_by, performers_raw, program_raw';

/**
 * Fetch events for list views. No JOINs. Fast.
 * RLS ensures only approved events are returned for public users.
 */
export async function getEventsBasic(options: EventListOptions = {}): Promise<{ events: EventBasic[]; count: number }> {
  if (!hasSupabase) return { events: [], count: 0 };

  const { mode = 'upcoming', city, venue, eventType, date, limit = 20, offset = 0 } = options;
  const today = new Date().toISOString().split('T')[0];

  let query = supabase
    .from('events')
    .select(EVENT_BASIC_FIELDS, { count: 'exact' })
    .eq('status', 'approved')
    .neq('title', '');

  if (date) {
    query = query.eq('event_date', date);
  } else if (mode === 'upcoming') {
    // Rolling window: event hasn't passed AND its show_from has arrived.
    // show_from defaults to event_date - 30 days, so unsubmitted events
    // surface roughly 30 days before they happen.
    query = query.gte('event_date', today).lte('show_from', today);
  } else {
    query = query.lt('event_date', today);
  }

  if (city) query = query.eq('city', city);
  if (venue) query = query.ilike('venue', `%${venue}%`);
  if (eventType) query = query.eq('event_type', eventType);

  query = query.order('event_date', { ascending: mode === 'upcoming' });
  query = query.range(offset, offset + limit - 1);

  const { data, count } = await query;
  return { events: (data || []) as EventBasic[], count: count ?? 0 };
}

/**
 * Fetch a single event with full performer/piece/instrument JOINs.
 * Returns null if not found (RLS hides non-approved for public users).
 */
export async function getEventFull(id: string): Promise<EventFull | null> {
  if (!hasSupabase || !id) return null;

  const { data: event } = await supabase
    .from('events')
    .select(EVENT_BASIC_FIELDS + ', moderated_by, moderated_at, moderation_note')
    .eq('id', id)
    .single();

  if (!event) return null;

  const { data: performances } = await supabase
    .from('event_performances')
    .select('*, users(id, display_name, username), pieces(id, title, composer_name), instruments(id, type, maker)')
    .eq('event_id', id);

  return {
    ...(event as EventBasic & { moderated_by: string | null; moderated_at: string | null; moderation_note: string | null }),
    performers: (performances || []) as EventPerformer[],
  };
}

/**
 * Get distinct cities from approved events (for city filter dropdown).
 * Only approved events to avoid leaking queued/rejected metadata.
 */
export async function getEventCities(): Promise<string[]> {
  if (!hasSupabase) return [];

  const { data } = await supabase
    .from('events')
    .select('city')
    .eq('status', 'approved')
    .not('city', 'is', null)
    .neq('city', '');

  if (!data) return [];
  const cities = [...new Set(data.map((r: { city: string }) => r.city))].sort();
  return cities;
}

