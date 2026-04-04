/**
 * Slug generation utilities for Irregular Pearl import scripts.
 *
 * Handles Unicode transliteration (Dvorak, Bartok, etc.) and generates
 * deterministic piece IDs matching the existing seed data format.
 */

/** Common diacritics → ASCII mapping for classical-music names. */
const DIACRITICS: Record<string, string> = {
  '\u00e0': 'a', '\u00e1': 'a', '\u00e2': 'a', '\u00e3': 'a', '\u00e4': 'a', '\u00e5': 'a',
  '\u00e6': 'ae',
  '\u00e7': 'c', '\u010d': 'c', '\u0107': 'c',
  '\u00e8': 'e', '\u00e9': 'e', '\u00ea': 'e', '\u00eb': 'e', '\u011b': 'e',
  '\u00ec': 'i', '\u00ed': 'i', '\u00ee': 'i', '\u00ef': 'i',
  '\u00f0': 'd', '\u010f': 'd', '\u0111': 'd',
  '\u00f1': 'n', '\u0148': 'n', '\u0144': 'n',
  '\u00f2': 'o', '\u00f3': 'o', '\u00f4': 'o', '\u00f5': 'o', '\u00f6': 'o', '\u00f8': 'o',
  '\u0159': 'r',
  '\u00df': 'ss',
  '\u0161': 's', '\u015b': 's', '\u015f': 's',
  '\u0165': 't', '\u0163': 't',
  '\u00f9': 'u', '\u00fa': 'u', '\u00fb': 'u', '\u00fc': 'u', '\u016f': 'u',
  '\u00fd': 'y', '\u00ff': 'y',
  '\u017e': 'z', '\u017a': 'z', '\u017c': 'z',
};

/**
 * Convert a string to a URL-safe slug.
 *
 * - Lowercases the input
 * - Transliterates common diacritics (e.g. Dvorak from Dvořák)
 * - Strips anything that isn't a-z, 0-9, or space/hyphen
 * - Collapses whitespace/hyphens into single hyphens
 * - Trims leading/trailing hyphens
 */
export function slugify(text: string): string {
  let result = text.toLowerCase();

  // Replace known diacritics
  result = result
    .split('')
    .map((ch) => DIACRITICS[ch] ?? ch)
    .join('');

  // Fallback: use Unicode NFD normalization to strip remaining combining marks
  result = result.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Replace non-alphanumeric chars with hyphens
  result = result.replace(/[^a-z0-9]+/g, '-');

  // Trim leading/trailing hyphens
  result = result.replace(/^-+|-+$/g, '');

  return result;
}

/**
 * Generate a deterministic piece ID from composer name, title, and optional
 * catalog number. Format matches existing seed data (e.g. "bach-cello-suite-1").
 *
 * Uses only the composer's last name for brevity.
 */
export function generatePieceId(
  composerName: string,
  title: string,
  catalogNumber?: string | null,
): string {
  // Extract last name (handle "Johann Sebastian Bach" → "Bach")
  const parts = composerName.trim().split(/\s+/);
  const lastName = parts[parts.length - 1];
  const composerSlug = slugify(lastName);

  const titleSlug = slugify(title);

  let id = `${composerSlug}-${titleSlug}`;

  // Append catalog number if present, to avoid collisions
  if (catalogNumber) {
    const catSlug = slugify(catalogNumber);
    if (catSlug) {
      id = `${id}-${catSlug}`;
    }
  }

  return id;
}
