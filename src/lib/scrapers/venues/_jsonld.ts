/**
 * Shared JSON-LD Event extraction. Most major venues publish schema.org
 * Event markup for SEO. When present it is by far the cleanest source —
 * structured title/date/image/url/description/performers without selectors.
 */

import type { Page } from 'playwright';
import type { VenueEvent, VenueScraper } from './types';

interface JsonLdEvent {
  '@type'?: string | string[];
  name?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  url?: string;
  image?: string | string[] | { url?: string };
  performer?: unknown;
  workPerformed?: unknown;
}

function isEvent(t: unknown): boolean {
  if (!t) return false;
  const types = Array.isArray(t) ? t : [t];
  return types.some((x) => typeof x === 'string' && /Event|Festival|Concert/i.test(x));
}

function* iter(root: unknown): Generator<JsonLdEvent> {
  const stack: unknown[] = [root];
  while (stack.length) {
    const n = stack.pop();
    if (Array.isArray(n)) for (const x of n) stack.push(x);
    else if (n && typeof n === 'object') {
      const o = n as Record<string, unknown>;
      if (isEvent(o['@type'])) yield o as JsonLdEvent;
      if (Array.isArray(o['@graph'])) for (const x of o['@graph']) stack.push(x);
      if (Array.isArray(o['itemListElement'])) for (const x of o['itemListElement']) stack.push(x);
      if (o['item']) stack.push(o['item']);
      if (Array.isArray(o['subEvent'])) for (const x of o['subEvent']) stack.push(x);
    }
  }
}

function pickImage(img: JsonLdEvent['image']): string | undefined {
  if (!img) return undefined;
  if (typeof img === 'string') return img;
  if (Array.isArray(img)) return typeof img[0] === 'string' ? (img[0] as string) : undefined;
  if (typeof img === 'object' && 'url' in img) return img.url;
  return undefined;
}

function pickPerformers(p: unknown): string[] | undefined {
  if (!p) return undefined;
  const arr = Array.isArray(p) ? p : [p];
  const out: string[] = [];
  for (const x of arr) {
    if (typeof x === 'string') out.push(x);
    else if (x && typeof x === 'object' && 'name' in x && typeof (x as { name: unknown }).name === 'string') {
      out.push((x as { name: string }).name);
    }
  }
  return out.length ? out : undefined;
}

function pickProgram(w: unknown): string[] | undefined {
  if (!w) return undefined;
  const arr = Array.isArray(w) ? w : [w];
  const out: string[] = [];
  for (const x of arr) {
    if (typeof x === 'string') out.push(x);
    else if (x && typeof x === 'object' && 'name' in x && typeof (x as { name: unknown }).name === 'string') {
      const composer =
        x && typeof x === 'object' && 'composer' in x &&
        (x as { composer?: { name?: string } }).composer?.name
          ? `${(x as { composer: { name: string } }).composer.name}: `
          : '';
      out.push(`${composer}${(x as { name: string }).name}`);
    }
  }
  return out.length ? out : undefined;
}

export async function extractJsonLdEvents(page: Page, venueUrl: string): Promise<VenueEvent[]> {
  const blocks: unknown[] = await page.evaluate(() => {
    const out: unknown[] = [];
    for (const s of Array.from(document.querySelectorAll('script[type="application/ld+json"]'))) {
      try {
        out.push(JSON.parse(s.textContent ?? ''));
      } catch {
        /* skip malformed */
      }
    }
    return out;
  });

  const today = new Date().toISOString().slice(0, 10);
  const out: VenueEvent[] = [];
  const seen = new Set<string>();
  for (const root of blocks) {
    for (const e of iter(root)) {
      if (!e.name || !e.startDate) continue;
      const date = e.startDate.slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < today) continue;
      const time = e.startDate.length >= 16 && e.startDate[10] === 'T' ? e.startDate.slice(11, 16) : undefined;
      const key = `${e.name.toLowerCase()}|${date}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        title: e.name.trim().slice(0, 200),
        event_date: date,
        start_time: time,
        url: e.url ?? venueUrl,
        description: e.description?.slice(0, 1500),
        image_url: pickImage(e.image),
        performers: pickPerformers(e.performer),
        program: pickProgram(e.workPerformed),
      });
    }
  }
  return out;
}

export function jsonLdScraper(): VenueScraper['scrape'] {
  return async (page, venue) => {
    await page.goto(venue.url, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    // Give SPAs a moment to inject JSON-LD.
    await page.waitForTimeout(2000);
    return extractJsonLdEvents(page, venue.url);
  };
}
