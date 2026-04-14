/**
 * Wigmore Hall — calendar SSRs HTML with event links of the form
 * /whats-on/YYYYMMDDHHMM. The slug encodes the date and start time directly.
 *
 * For each link we hit the detail page once to pull the title and (when
 * present) an og:image. Description / performers are best-effort from
 * the detail page meta tags.
 */

import type { VenueScraper, VenueEvent } from './types';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

function metaContent(html: string, prop: string): string | undefined {
  // Match content=... in either order (before or after the property attr).
  const m1 = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i'));
  if (m1) return m1[1];
  const m2 = html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`, 'i'));
  return m2?.[1];
}

async function fetchDetail(slug: string): Promise<{ title: string; image?: string; description?: string } | null> {
  const r = await fetch(`https://www.wigmore-hall.org.uk/whats-on/${slug}`, {
    signal: AbortSignal.timeout(15_000),
    headers: { 'user-agent': UA, accept: 'text/html' },
  });
  if (!r.ok) return null;
  const html = await r.text();
  const title = metaContent(html, 'og:title') ?? html.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim();
  if (!title) return null;
  return {
    title: title.replace(/\s*\|\s*Wigmore Hall.*$/i, '').trim(),
    image: metaContent(html, 'og:image'),
    description: metaContent(html, 'og:description'),
  };
}

export const wigmoreHall: VenueScraper = {
  slug: 'wigmore-hall',
  name: 'Wigmore Hall',
  city: 'London',
  country: 'UK',
  url: 'https://www.wigmore-hall.org.uk/whats-on',

  async scrape(): Promise<VenueEvent[]> {
    const list = await fetch('https://www.wigmore-hall.org.uk/whats-on', {
      signal: AbortSignal.timeout(20_000),
      headers: { 'user-agent': UA, accept: 'text/html' },
    });
    if (!list.ok) throw new Error(`wigmore listing ${list.status}`);
    const html = await list.text();
    const slugs = [...new Set([...html.matchAll(/href="\/whats-on\/(\d{12})"/g)].map((m) => m[1]))];
    const today = new Date().toISOString().slice(0, 10);

    const out: VenueEvent[] = [];
    const CONC = 4;
    let i = 0;
    await Promise.all(
      Array.from({ length: CONC }, async () => {
        while (true) {
          const idx = i++;
          if (idx >= slugs.length) return;
          const s = slugs[idx];
          const date = `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
          if (date < today) continue;
          const time = `${s.slice(8, 10)}:${s.slice(10, 12)}`;
          const detail = await fetchDetail(s);
          if (!detail) continue;
          out.push({
            title: detail.title,
            event_date: date,
            start_time: time,
            url: `https://www.wigmore-hall.org.uk/whats-on/${s}`,
            image_url: detail.image,
            description: detail.description,
            event_type: 'concert',
          });
          await new Promise((r) => setTimeout(r, 300));
        }
      })
    );
    out.sort((a, b) => a.event_date.localeCompare(b.event_date));
    return out;
  },
};
