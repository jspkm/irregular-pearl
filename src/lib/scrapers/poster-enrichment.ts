/**
 * Poster enrichment for scraped events.
 *
 * Two independent helpers:
 *  - findWikipediaImage(title): tries each "/", "&", ":" delimited token of the
 *    event title against Wikipedia and returns the first thumbnail it finds.
 *  - isVenueFallbackImage(url, venueImageCounts): true if the image URL is
 *    reused by many events at the same venue (signal: bachtrack served the
 *    venue's stock image because there's no event-specific poster).
 *
 * Together they let callers say: try Wikipedia first; if the bachtrack image
 * is a venue fallback and Wikipedia gave nothing, null the poster.
 */

const WIKI_UA = 'irregular-pearl/1.0 (poster enrichment; admin@irregularpearl.org)';

function splitTitleCandidates(title: string): string[] {
  // Split on common bachtrack title delimiters and trim noise.
  const parts = title
    .split(/\s*[/|&,]\s*|\s*:\s+|\s+—\s+|\s+-\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 3 && !/^(at|in|the|and|with|featuring)$/i.test(s));
  // Also try the full title as a fallback.
  const seen = new Set<string>();
  return [...parts, title.trim()].filter((s) => {
    const k = s.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

async function wikipediaSummary(query: string): Promise<{ image?: string } | null> {
  // Direct page lookup only — no fuzzy/opensearch. Opensearch returns
  // unrelated pages when the exact name isn't found (e.g. "Quatuor Arod"
  // returned the Arditti Quartet's photo), and a wrong image is worse than
  // no image. Wikipedia's REST follows redirects, so common spelling
  // variants still resolve.
  try {
    const slug = query.trim().replace(/\s+/g, '_');
    const r = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(slug)}`,
      { signal: AbortSignal.timeout(10_000), headers: { 'User-Agent': WIKI_UA } }
    );
    if (!r.ok) return null;
    const data = (await r.json()) as {
      type?: string;
      originalimage?: { source?: string };
      thumbnail?: { source?: string };
    };
    // Skip disambiguation pages; the image there is generic.
    if (data.type === 'disambiguation') return null;
    const image = data.originalimage?.source ?? data.thumbnail?.source;
    return image ? { image } : null;
  } catch {
    return null;
  }
}

export async function findWikipediaImage(title: string): Promise<string | null> {
  for (const candidate of splitTitleCandidates(title)) {
    const r = await wikipediaSummary(candidate);
    if (r?.image) return r.image;
  }
  return null;
}

/**
 * Build a frequency map of poster_url across events at each venue. Keys are
 * `${venue}|${posterUrl}`; values are the count.
 */
export function buildVenueImageCounts(events: { venue: string | null; poster_url: string | null }[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const e of events) {
    if (!e.venue || !e.poster_url) continue;
    const key = `${e.venue}|${e.poster_url}`;
    m.set(key, (m.get(key) ?? 0) + 1);
  }
  return m;
}

/**
 * Returns true if this image URL appears on >= MIN_REUSE distinct events at
 * the same venue — a strong signal it's a venue-stock image, not an event
 * poster.
 */
export function isVenueFallbackImage(
  venue: string | null | undefined,
  posterUrl: string | null | undefined,
  counts: Map<string, number>,
  minReuse = 2
): boolean {
  if (!venue || !posterUrl) return false;
  const n = counts.get(`${venue}|${posterUrl}`) ?? 0;
  return n >= minReuse;
}
