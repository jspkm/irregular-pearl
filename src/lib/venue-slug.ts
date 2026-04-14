/**
 * Reversible-ish venue slugs for /venues/[slug] URLs.
 *
 * We don't store slugs in the DB, so we derive them from the venue name
 * and match back fuzzily (case-insensitive, ignores punctuation, handles
 * common venue-suffix differences like "Carnegie Hall: Stern Auditorium").
 */

export function venueSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Turn a slug back into a search needle suitable for an ILIKE match.
 * Trims after the second word so multi-hall venues still match
 * (e.g. "carnegie-hall-stern-auditorium" → "carnegie hall").
 */
export function slugToVenueQuery(slug: string): string {
  const tokens = slug.split('-').filter(Boolean);
  // Take the first 2-3 tokens — enough to disambiguate, loose enough to
  // match sub-hall variants like "Carnegie Hall: Weill" → tokens ["carnegie","hall"].
  return tokens.slice(0, 3).join(' ');
}

/**
 * Returns a display name from a list of candidate venue strings, picking
 * the shortest one that matches the slug (usually the canonical name
 * without the sub-hall suffix).
 */
export function pickCanonicalVenueName(slug: string, venues: string[]): string | null {
  if (venues.length === 0) return null;
  const canonical = venues
    .filter((v) => venueSlug(v).startsWith(slug.split('-').slice(0, 2).join('-')))
    .sort((a, b) => a.length - b.length);
  return canonical[0] ?? venues[0];
}
