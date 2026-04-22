// Controlled vocabularies for the four single-value pill categories.
// `instrument` lives in src/data/instruments.ts (longer, orchestra-organized).
// Lists mirror the PRD vocabulary verbatim. All values are lowercase at the
// pill layer — the labels users author into the DB are normalized via
// `normalizePillValue` before insert and re-checked on read.

import { INSTRUMENTS } from './instruments';

export const ERAS = [
  'baroque',
  'classical',
  'romantic',
  'late romantic',
  'post-romantic',
  'impressionist',
  '20th century',
  'modern',
  'contemporary',
] as const;

export const FORMS = [
  'suite',
  'sonata',
  'concerto',
  'symphony',
  'quartet',
  'quintet',
  'trio',
  'duo',
  'chaconne',
  'partita',
  'fugue',
  'fantasia',
  'variations',
  'prelude',
  'etude',
  'nocturne',
  'mass',
  'oratorio',
  'opera',
  'song cycle',
  'tone poem',
  'rhapsody',
  'overture',
  'ballet',
] as const;

export const DIFFICULTIES = ['beginner', 'intermediate', 'advanced', 'virtuoso'] as const;

export type PillCategory = 'instrument' | 'era' | 'form' | 'duration' | 'difficulty';

export const PILL_CATEGORIES: readonly PillCategory[] = ['instrument', 'era', 'form', 'duration', 'difficulty'];

export const SINGLE_VALUE_CATEGORIES: ReadonlySet<PillCategory> = new Set([
  'era',
  'form',
  'duration',
  'difficulty',
]);

const DURATION_RE = /^~\d{1,3} min$/;

export function normalizePillValue(category: PillCategory, raw: string): string {
  const trimmed = raw.trim();
  if (category === 'duration') return trimmed; // duration is the one free-format category
  return trimmed.toLowerCase();
}

export function isValidPillValue(category: PillCategory, value: string): boolean {
  const v = normalizePillValue(category, value);
  switch (category) {
    case 'instrument':
      return INSTRUMENTS.includes(v);
    case 'era':
      return (ERAS as readonly string[]).includes(v);
    case 'form':
      return (FORMS as readonly string[]).includes(v);
    case 'difficulty':
      return (DIFFICULTIES as readonly string[]).includes(v);
    case 'duration':
      return DURATION_RE.test(v);
  }
}

/** Values from the controlled list not yet used on this piece. */
export function availableValues(category: PillCategory, used: ReadonlySet<string>): readonly string[] {
  const list =
    category === 'instrument' ? INSTRUMENTS
    : category === 'era' ? ERAS
    : category === 'form' ? FORMS
    : category === 'difficulty' ? DIFFICULTIES
    : [];
  return list.filter(v => !used.has(v));
}
