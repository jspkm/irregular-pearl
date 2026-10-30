import { seedPieces } from '../data/seed';
import { musicPeriodProfiles } from '../data/musicPeriodProfiles';
import { livingComposers } from '../data/livingComposers';

function normalize(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

/** Search existing local piece pages when the catalog service is unavailable. */
export function searchLocalPieces(query: string, composerName?: string) {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (normalize(query).length < 2) return [];
  return seedPieces.filter(piece => {
    if (composerName && normalize(piece.composer_name) !== normalize(composerName)) return false;
    const text = normalize(`${piece.title} ${piece.composer_name} ${piece.catalog_number ?? ''}`);
    return words.every(word => text.includes(word));
  }).slice(0, 16).map(piece => ({
    result_type: 'not_yet_curated' as const,
    is_materialized: true,
    id: piece.id,
    title: piece.title,
    composer_name: piece.composer_name,
    catalog_number: piece.catalog_number,
    instruments: piece.instruments,
  }));
}

/** Only names backed by existing composer pages; also includes remote piece composers. */
export function searchComposerPages(query: string, additionalNames: string[] = []) {
  const normalized = normalize(query);
  if (normalized.length < 2) return [];
  const words = normalized.split(/\s+/);
  const names = [...new Set([
    ...seedPieces.map(piece => piece.composer_name),
    ...musicPeriodProfiles.flatMap(profile => profile.composers),
    ...livingComposers.map(composer => composer.name),
    ...additionalNames,
  ])];
  return names.filter(name => words.every(word => normalize(name).includes(word)))
    .sort((a, b) => Number(normalize(b).endsWith(normalized)) - Number(normalize(a).endsWith(normalized)) || a.localeCompare(b))
    .slice(0, 8).map(name => ({
      result_type: 'composer' as const, is_materialized: true,
      id: name, title: name, composer_name: name, catalog_number: null, instruments: null,
    }));
}
