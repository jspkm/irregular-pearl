/**
 * Chicago Symphony Orchestra — Umbraco surface endpoint accepts a JSON POST
 * with tag filters. Fields per item: production, performanceTitle,
 * firstPerformanceDate / lastPerformanceDate, productionSeasonListImage,
 * productionSeasonDescriptionShort (HTML).
 *
 * We expand multi-date productions: each date in performanceDatesCsv becomes
 * a separate event row.
 */

import type { VenueScraper, VenueEvent } from './types';

interface Item {
  production?: string;
  performanceTitle?: string;
  productionSeasonDescriptionLong?: string;
  productionSeasonDescriptionShort?: string;
  productionSeasonListImage?: string;
  performanceDatesCsv?: string; // YYYYMMDD,YYYYMMDD
  performanceIdsCsv?: string;
  firstPerformanceDate?: string; // ISO Z
  lastPerformanceDate?: string;
  nextPerformanceDate?: string;
}

function stripHtml(s?: string): string {
  if (!s) return '';
  // Drop the CSO-specific Show/Hide bootstrap collapse buttons first, then tags.
  return s
    .replace(/<a[^>]*class="[^"]*btn[^"]*"[^>]*>[\s\S]*?<\/a>/gi, '')
    .replace(/<div[^>]*class="[^"]*collapse[^"]*"[^>]*>[\s\S]*?<\/div>\s*<\/div>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractCsoProgram(html?: string): string[] {
  if (!html) return [];
  // The long description embeds a collapse panel with <p><strong>Composer</strong> Work<br/>...</p>
  const m = html.match(/id="collapseProgram\d*"[\s\S]*?<div class="card card-body">[\s\S]*?<!--\s*Program HERE\s*-->([\s\S]*?)<\/div>\s*<\/div>/i);
  if (!m) return [];
  const inner = m[1];
  // Split on <br /> then strip tags.
  return inner
    .split(/<br\s*\/?>/i)
    .map((line) => line.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function extractCsoPerformers(html?: string): string[] {
  if (!html) return [];
  const m = html.match(/id="collapsePerfs\d*"[\s\S]*?<div class="card card-body">[\s\S]*?<!--\s*Performers HERE\s*-->([\s\S]*?)<\/div>\s*<\/div>/i);
  if (!m) return [];
  return m[1]
    .split(/<br\s*\/?>/i)
    .map((line) => line.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function inferEventType(production?: string): VenueEvent['event_type'] {
  const p = (production ?? '').toLowerCase();
  if (p.includes('recital')) return 'recital';
  if (p.includes('chamber')) return 'concert';
  if (p.includes('master')) return 'masterclass';
  return 'concert';
}

export const chicagoCso: VenueScraper = {
  slug: 'chicago-cso',
  name: 'Symphony Center',
  city: 'Chicago',
  country: 'USA',
  url: 'https://cso.org/performances/',

  async scrape(): Promise<VenueEvent[]> {
    // Coming Up Listing returns the next ~12 productions; bump count for breadth.
    const r = await fetch('https://cso.org/umbraco/surface/events/search', {
      method: 'POST',
      signal: AbortSignal.timeout(20_000),
      headers: { 'content-type': 'application/json', accept: 'application/json', referer: 'https://cso.org/performances/' },
      body: JSON.stringify({ count: '60', tags: ['Coming Up Listing'], pinned: [], condition: 'ANY', exclude: [] }),
    });
    if (!r.ok) throw new Error(`cso umbraco ${r.status}`);
    const items = (await r.json()) as Item[];
    const today = new Date().toISOString().slice(0, 10);
    const out: VenueEvent[] = [];
    for (const it of items) {
      const title = it.performanceTitle ?? it.production ?? 'CSO Concert';
      const description = stripHtml(it.productionSeasonDescriptionLong) || stripHtml(it.productionSeasonDescriptionShort);
      const program = extractCsoProgram(it.productionSeasonDescriptionShort);
      const performers = extractCsoPerformers(it.productionSeasonDescriptionShort);
      const dates = (it.performanceDatesCsv ?? '').split(',').filter(Boolean);
      const ids = (it.performanceIdsCsv ?? '').split(',').filter(Boolean);
      // Single fallback if no CSV
      const list = dates.length ? dates : (it.firstPerformanceDate ? [it.firstPerformanceDate.slice(0, 10).replace(/-/g, '')] : []);
      for (let i = 0; i < list.length; i++) {
        const raw = list[i];
        const date = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
        if (date < today) continue;
        const perfId = ids[i] ?? ids[0];
        const url = perfId ? `https://cso.org/performances/${perfId}/` : 'https://cso.org/performances/';
        out.push({
          title,
          event_date: date,
          url,
          description: description || undefined,
          image_url: it.productionSeasonListImage || undefined,
          performers: performers.length ? performers : undefined,
          program: program.length ? program : undefined,
          event_type: inferEventType(it.production),
        });
      }
    }
    return out;
  },
};
