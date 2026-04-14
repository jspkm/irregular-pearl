/**
 * LA Phil — public JSON feed at /events/feed/live. Includes both Walt Disney
 * Concert Hall and Hollywood Bowl events; we filter to Disney Hall only.
 *
 * Fields: id, start_time (ISO with offset), absolute_url, calendar_image.url,
 * venue.name, program.name, performers, pieces, categories.
 */

import type { VenueScraper, VenueEvent } from './types';

interface Feed {
  id: number;
  is_past?: boolean;
  hide_from_calendar?: boolean;
  start_time: string;
  absolute_url: string;
  calendar_image?: { url?: string };
  venue?: { name?: string };
  program?: { name?: string; name_markdown?: string };
  performers?: { name?: string }[];
  pieces?: { composer?: { name?: string }; title?: string }[];
  categories?: { name?: string }[];
  formatted_date_for_calendar?: string;
}

function inferEventType(cats?: { name?: string }[]): VenueEvent['event_type'] {
  const s = (cats ?? []).map((c) => c.name ?? '').join(' ').toLowerCase();
  if (s.includes('recital')) return 'recital';
  if (s.includes('master')) return 'masterclass';
  if (s.includes('festival')) return 'festival';
  return 'concert';
}

export const laPhil: VenueScraper = {
  slug: 'la-phil',
  name: 'Walt Disney Concert Hall',
  city: 'Los Angeles',
  country: 'USA',
  url: 'https://www.laphil.com/calendar',

  async scrape(): Promise<VenueEvent[]> {
    const r = await fetch('https://www.laphil.com/events/feed/live', {
      signal: AbortSignal.timeout(30_000),
      headers: { 'user-agent': 'Mozilla/5.0', accept: 'application/json' },
    });
    if (!r.ok) throw new Error(`laphil feed ${r.status}`);
    const feed = (await r.json()) as Feed[];
    const today = new Date().toISOString().slice(0, 10);
    const out: VenueEvent[] = [];
    for (const e of feed) {
      if (e.is_past || e.hide_from_calendar) continue;
      // Filter to Disney Hall (this org also runs Hollywood Bowl).
      if (e.venue?.name && !/Disney|Disney Hall|WDCH/i.test(e.venue.name)) continue;
      const date = e.start_time.slice(0, 10);
      if (date < today) continue;
      const time = e.start_time.slice(11, 16);
      const program = (e.pieces ?? [])
        .map((p) => {
          const c = p.composer?.name;
          return c && p.title ? `${c}: ${p.title}` : (p.title ?? '');
        })
        .filter(Boolean);
      out.push({
        title: e.program?.name ?? `LA Phil — ${e.formatted_date_for_calendar ?? date}`,
        event_date: date,
        start_time: time,
        url: e.absolute_url,
        image_url: e.calendar_image?.url,
        performers: (e.performers ?? []).map((p) => p.name ?? '').filter(Boolean),
        program,
        event_type: inferEventType(e.categories),
      });
    }
    return out;
  },
};
