#!/usr/bin/env bun
// Scrapes upcoming events from major venue pages by extracting JSON-LD
// schema.org/Event markup (which most venues publish for SEO) and inserts
// them into public.events as auto-approved venue_scrape rows.
//
// Usage:
//   bun run scripts/scrape-venues.ts                 # all regions
//   bun run scripts/scrape-venues.ts us              # one region
//   bun run scripts/scrape-venues.ts --dry           # parse only, no insert
//   bun run scripts/scrape-venues.ts us --dry

import { createClient } from '@supabase/supabase-js';

type Venue = { name: string; city: string; country: string; url: string };

const VENUES: Record<string, Venue[]> = {
  us: [
    { name: 'Carnegie Hall', city: 'New York', country: 'USA', url: 'https://www.carnegiehall.org/Calendar' },
    { name: 'David Geffen Hall', city: 'New York', country: 'USA', url: 'https://nyphil.org/concerts-tickets/calendar' },
    { name: 'Metropolitan Opera', city: 'New York', country: 'USA', url: 'https://www.metopera.org/season/in-cinemas/' },
    { name: 'Walt Disney Concert Hall', city: 'Los Angeles', country: 'USA', url: 'https://www.laphil.com/calendar' },
    { name: 'Hollywood Bowl', city: 'Los Angeles', country: 'USA', url: 'https://www.hollywoodbowl.com/events' },
    { name: 'LA Opera (Dorothy Chandler Pavilion)', city: 'Los Angeles', country: 'USA', url: 'https://www.laopera.org/performances/' },
    { name: 'Davies Symphony Hall', city: 'San Francisco', country: 'USA', url: 'https://www.sfsymphony.org/Buy-Tickets' },
    { name: 'War Memorial Opera House', city: 'San Francisco', country: 'USA', url: 'https://www.sfopera.com/calendar/' },
    { name: 'Herbst Theatre', city: 'San Francisco', country: 'USA', url: 'https://sfwmpac.org/herbst-theatre/' },
    { name: 'SFJAZZ Center', city: 'San Francisco', country: 'USA', url: 'https://www.sfjazz.org/tickets/' },
    { name: 'Symphony Hall (BSO)', city: 'Boston', country: 'USA', url: 'https://www.bso.org/performances' },
    { name: 'Jordan Hall', city: 'Boston', country: 'USA', url: 'https://necmusic.edu/concerts' },
    { name: 'Symphony Center', city: 'Chicago', country: 'USA', url: 'https://cso.org/performances/' },
    { name: 'Lyric Opera of Chicago', city: 'Chicago', country: 'USA', url: 'https://www.lyricopera.org/shows/' },
    { name: 'Kennedy Center', city: 'Washington, D.C.', country: 'USA', url: 'https://www.kennedy-center.org/whats-on/' },
    { name: 'Strathmore', city: 'Bethesda', country: 'USA', url: 'https://www.strathmore.org/calendar/' },
    { name: 'Kimmel Center', city: 'Philadelphia', country: 'USA', url: 'https://www.kimmelculturalcampus.org/events-and-tickets/' },
    { name: 'Verizon Hall', city: 'Philadelphia', country: 'USA', url: 'https://www.philorch.org/performances/' },
    { name: 'Severance Hall', city: 'Cleveland', country: 'USA', url: 'https://www.clevelandorchestra.com/attend/' },
    { name: 'Heinz Hall', city: 'Pittsburgh', country: 'USA', url: 'https://pittsburghsymphony.org/concerts' },
    { name: 'Meyerson Symphony Center', city: 'Dallas', country: 'USA', url: 'https://www.dallassymphony.org/calendar' },
    { name: 'Jones Hall', city: 'Houston', country: 'USA', url: 'https://houstonsymphony.org/concerts/' },
    { name: 'Benaroya Hall', city: 'Seattle', country: 'USA', url: 'https://www.seattlesymphony.org/concerts' },
    { name: 'Schermerhorn Symphony Center', city: 'Nashville', country: 'USA', url: 'https://www.nashvillesymphony.org/calendar' },
    { name: 'Powell Hall', city: 'St. Louis', country: 'USA', url: 'https://www.slso.org/en/tickets/calendar/' },
    { name: 'Orchestra Hall', city: 'Minneapolis', country: 'USA', url: 'https://www.minnesotaorchestra.org/concerts-tickets/' },
    { name: 'Ordway Concert Hall', city: 'St. Paul', country: 'USA', url: 'https://www.thespco.org/concerts/' },
    { name: 'Bass Performance Hall', city: 'Fort Worth', country: 'USA', url: 'https://www.basshall.com/events' },
    { name: 'Adrienne Arsht Center', city: 'Miami', country: 'USA', url: 'https://www.arshtcenter.org/tickets/' },
  ],
  intl: [
    { name: 'Royal Albert Hall', city: 'London', country: 'UK', url: 'https://www.royalalberthall.com/tickets/' },
    { name: 'Royal Festival Hall', city: 'London', country: 'UK', url: 'https://www.southbankcentre.co.uk/whats-on' },
    { name: 'Barbican Hall', city: 'London', country: 'UK', url: 'https://www.barbican.org.uk/whats-on' },
    { name: 'Wigmore Hall', city: 'London', country: 'UK', url: 'https://wigmore-hall.org.uk/whats-on' },
    { name: 'Royal Opera House', city: 'London', country: 'UK', url: 'https://www.roh.org.uk/tickets-and-events' },
    { name: 'Glyndebourne', city: 'Lewes', country: 'UK', url: 'https://www.glyndebourne.com/tickets/whats-on/' },
    { name: 'Philharmonie de Paris', city: 'Paris', country: 'France', url: 'https://philharmoniedeparis.fr/en/calendar' },
    { name: 'Opéra National de Paris', city: 'Paris', country: 'France', url: 'https://www.operadeparis.fr/en/season-23-24/calendar' },
    { name: 'Théâtre des Champs-Élysées', city: 'Paris', country: 'France', url: 'https://www.theatrechampselysees.fr/en/season' },
    { name: 'Berliner Philharmonie', city: 'Berlin', country: 'Germany', url: 'https://www.berliner-philharmoniker.de/en/concerts/calendar/' },
    { name: 'Staatsoper Unter den Linden', city: 'Berlin', country: 'Germany', url: 'https://www.staatsoper-berlin.de/en/calendar/' },
    { name: 'Elbphilharmonie Hamburg', city: 'Hamburg', country: 'Germany', url: 'https://www.elbphilharmonie.de/en/whats-on' },
    { name: 'Gewandhaus Leipzig', city: 'Leipzig', country: 'Germany', url: 'https://www.gewandhausorchester.de/en/concerts/' },
    { name: 'Bayerische Staatsoper', city: 'Munich', country: 'Germany', url: 'https://www.staatsoper.de/en/schedule' },
    { name: 'Musikverein Vienna', city: 'Vienna', country: 'Austria', url: 'https://www.musikverein.at/en/concerts' },
    { name: 'Konzerthaus Vienna', city: 'Vienna', country: 'Austria', url: 'https://konzerthaus.at/calendar' },
    { name: 'Wiener Staatsoper', city: 'Vienna', country: 'Austria', url: 'https://www.wiener-staatsoper.at/en/schedule/calendar/' },
    { name: 'Concertgebouw Amsterdam', city: 'Amsterdam', country: 'Netherlands', url: 'https://www.concertgebouw.nl/en/calendar' },
    { name: 'Dutch National Opera', city: 'Amsterdam', country: 'Netherlands', url: 'https://www.operaballet.nl/en/calendar' },
    { name: 'KKL Luzern', city: 'Lucerne', country: 'Switzerland', url: 'https://www.kkl-luzern.ch/en/programm/' },
    { name: 'Tonhalle Zürich', city: 'Zurich', country: 'Switzerland', url: 'https://www.tonhalle-orchester.ch/en/concerts/' },
    { name: 'Teatro alla Scala', city: 'Milan', country: 'Italy', url: 'https://www.teatroallascala.org/en/season/2024-2025/calendar' },
    { name: 'Teatro La Fenice', city: 'Venice', country: 'Italy', url: 'https://www.teatrolafenice.it/en/calendar/' },
    { name: 'Accademia Santa Cecilia', city: 'Rome', country: 'Italy', url: 'https://www.santacecilia.it/en/calendar' },
    { name: 'Teatro Real Madrid', city: 'Madrid', country: 'Spain', url: 'https://www.teatroreal.es/en/season-2024-25' },
    { name: 'Gran Teatre del Liceu', city: 'Barcelona', country: 'Spain', url: 'https://www.liceubarcelona.cat/en/2024-2025-season' },
    { name: 'Suntory Hall', city: 'Tokyo', country: 'Japan', url: 'https://www.suntory.com/culture-sports/suntoryhall/calendar/' },
    { name: 'Sydney Opera House', city: 'Sydney', country: 'Australia', url: 'https://www.sydneyoperahouse.com/whats-on' },
    { name: 'Seoul Arts Center', city: 'Seoul', country: 'South Korea', url: 'https://www.sac.or.kr/site/eng/show/show_list' },
    { name: 'Melbourne Recital Centre', city: 'Melbourne', country: 'Australia', url: 'https://www.melbournerecital.com.au/events/' },
  ],
};

type ScrapedEvent = {
  title: string;
  venue: string;
  city: string;
  country: string;
  event_date: string;
  start_time: string | null;
  url: string | null;
  description: string;
};

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const r = await fetch(url, {
      signal: AbortSignal.timeout(20_000),
      redirect: 'follow',
      headers: { 'user-agent': UA, 'accept': 'text/html,application/xhtml+xml' },
    });
    if (!r.ok) return null;
    return await r.text();
  } catch {
    return null;
  }
}

// Extract every JSON-LD <script> block. schema.org Event entries can be top-level,
// inside a @graph array, or nested under itemListElement.
function extractJsonLd(html: string): unknown[] {
  const out: unknown[] = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    try {
      const parsed = JSON.parse(m[1].trim());
      out.push(parsed);
    } catch {
      /* ignore malformed blocks */
    }
  }
  return out;
}

function* iterateNodes(root: unknown): Generator<Record<string, unknown>> {
  const stack: unknown[] = [root];
  while (stack.length) {
    const node = stack.pop();
    if (Array.isArray(node)) {
      for (const x of node) stack.push(x);
    } else if (node && typeof node === 'object') {
      const obj = node as Record<string, unknown>;
      yield obj;
      if (Array.isArray(obj['@graph'])) for (const x of obj['@graph']) stack.push(x);
      if (Array.isArray(obj['itemListElement'])) for (const x of obj['itemListElement']) stack.push(x);
      if (obj['item']) stack.push(obj['item']);
      if (Array.isArray(obj['subEvent'])) for (const x of obj['subEvent']) stack.push(x);
    }
  }
}

function isEventType(t: unknown): boolean {
  if (!t) return false;
  const types = Array.isArray(t) ? t : [t];
  return types.some((x) => typeof x === 'string' && /(?:^|\/)(?:Event|MusicEvent|TheaterEvent|Festival|ConcertSeries)$/i.test(x));
}

function asString(x: unknown): string | undefined {
  return typeof x === 'string' ? x : undefined;
}

function eventsFromHtml(html: string, venue: Venue): ScrapedEvent[] {
  const blocks = extractJsonLd(html);
  const today = new Date().toISOString().slice(0, 10);
  const out: ScrapedEvent[] = [];
  const seen = new Set<string>();
  for (const root of blocks) {
    for (const node of iterateNodes(root)) {
      if (!isEventType(node['@type'])) continue;
      const name = asString(node.name);
      const startDate = asString(node.startDate);
      if (!name || !startDate) continue;
      const date = startDate.slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
      if (date < today) continue;
      const time = startDate.length >= 16 && startDate[10] === 'T' ? startDate.slice(11, 16) : null;
      const url = asString(node.url) ?? venue.url;
      const description = asString(node.description) ?? '';
      const key = `${name.toLowerCase()}|${date}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        title: name.trim().slice(0, 200),
        venue: venue.name,
        city: venue.city,
        country: venue.country,
        event_date: date,
        start_time: time,
        url,
        description: description.slice(0, 1000),
      });
    }
  }
  return out;
}

async function scrapeVenue(v: Venue): Promise<ScrapedEvent[]> {
  const html = await fetchHtml(v.url);
  if (!html) return [];
  return eventsFromHtml(html, v);
}

async function main() {
  const args = process.argv.slice(2);
  const dry = args.includes('--dry');
  const region = args.find((a) => !a.startsWith('--'));
  const venues = region ? VENUES[region] : Object.values(VENUES).flat();
  if (!venues) {
    console.error(`Unknown region '${region}'. Known: ${Object.keys(VENUES).join(', ')}`);
    process.exit(2);
  }

  console.error(`Scraping ${venues.length} venues${region ? ` (${region})` : ''}${dry ? ' [dry]' : ''}...`);

  const all: { venue: Venue; events: ScrapedEvent[] }[] = [];
  // modest concurrency to be polite
  const CONC = 6;
  let idx = 0;
  await Promise.all(
    Array.from({ length: CONC }, async () => {
      while (true) {
        const i = idx++;
        if (i >= venues.length) return;
        const v = venues[i];
        const events = await scrapeVenue(v);
        console.error(`  ${events.length.toString().padStart(4)}  ${v.name}`);
        all.push({ venue: v, events });
      }
    })
  );

  const flat = all.flatMap((x) => x.events);
  console.error(`Found ${flat.length} events across ${all.length} venues.`);

  if (dry) {
    console.log(JSON.stringify(flat.slice(0, 10), null, 2));
    process.exit(0);
  }

  const url = process.env.SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  const sb = createClient(url, key);

  let inserted = 0;
  let deduped = 0;
  let errors = 0;
  // Insert in batches; rely on the unique dedup index for ON CONFLICT DO NOTHING via upsert ignoreDuplicates.
  const BATCH = 100;
  for (let i = 0; i < flat.length; i += BATCH) {
    const batch = flat.slice(i, i + BATCH).map((e) => ({
      title: e.title,
      venue: e.venue,
      city: e.city,
      country: e.country,
      event_date: e.event_date,
      start_time: e.start_time,
      event_type: 'concert',
      url: e.url,
      description: e.description,
      status: 'approved',
      source: 'venue_scrape',
      created_by: null,
    }));
    const r = await sb.from('events').upsert(batch, { onConflict: 'lower(title),event_date,lower(venue)', ignoreDuplicates: true }).select('id');
    if (r.error) {
      console.error('  insert error:', r.error.message);
      errors += batch.length;
      continue;
    }
    inserted += r.data?.length ?? 0;
    deduped += batch.length - (r.data?.length ?? 0);
  }
  console.error(`\nDone. inserted=${inserted}  deduped=${deduped}  errors=${errors}  total_seen=${flat.length}`);
}

await main();
