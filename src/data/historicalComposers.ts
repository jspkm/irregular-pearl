// Explicit historical directory, independent of the default living-status fallback.
// Contemporary names are not included merely because a profile is missing.
// Saariaho biography: https://saariaho.org/about (1952–2023).
export const historicalComposerNames = [
  "Johann Sebastian Bach",
  "Joseph Haydn",
  "Antonio Vivaldi",
  "Camille Saint-Saëns",
  "Edward Elgar",
  "Richard Strauss",
  "Felix Mendelssohn",
  "Gabriel Fauré",
  "George Crumb",
  "Wolfgang Amadeus Mozart",
  "Giovanni Bottesini",
  "Claude Debussy",
  "Carl Maria von Weber",
  "Ferdinand David",
  "Darius Milhaud",
  "Béla Bartók",
  "Ludwig van Beethoven",
  "César Franck",
  "Franz Schubert",
  "Johannes Brahms",
  "Pyotr Ilyich Tchaikovsky",
  "Igor Stravinsky",
  "Tomaso Antonio Vitali",
  "Robert Schumann",
  "Edvard Grieg",
  "Sergei Rachmaninoff",
  "Frédéric Chopin",
  "Franz Liszt",
  "Dmitri Shostakovich",
  "Giovanni Pierluigi da Palestrina",
  "Giacomo Puccini",
  "George Frideric Handel",
  "Gioachino Rossini",
  "Antonín Dvořák",
  "Maurice Ravel",
  "Gustav Holst",
  "Bedřich Smetana",
  "Jean Sibelius",
  "Mesomedes of Crete",
  "Terpander",
  "Limenius",
  "Kassia",
  "Romanos the Melodist",
  "Notker the Stammerer",
  "Hildegard von Bingen",
  "Bernart de Ventadorn",
  "Léonin",
  "Pérotin",
  "Adam de la Halle",
  "Franco of Cologne",
  "Guillaume de Machaut",
  "Francesco Landini",
  "Philippe de Vitry",
  "Guillaume Du Fay",
  "Johannes Ockeghem",
  "Josquin des Prez",
  "Orlando di Lasso",
  "Tomás Luis de Victoria",
  "William Byrd",
  "Claudio Monteverdi",
  "Barbara Strozzi",
  "Heinrich Schütz",
  "Arcangelo Corelli",
  "Élisabeth Jacquet de La Guerre",
  "Joseph Bologne",
  "Clara Schumann",
  "Richard Wagner",
  "Arnold Schoenberg",
  "Florence Price",
  "Kaija Saariaho"
] as const;

const nameOverrides: Record<string, { given: string; surname: string; sort: string }> = {
  'Guillaume Du Fay': { given: 'Guillaume', surname: 'Du Fay', sort: 'Du Fay' },
  'Josquin des Prez': { given: 'Josquin', surname: 'des Prez', sort: 'Des Prez' },
  'Élisabeth Jacquet de La Guerre': { given: 'Élisabeth', surname: 'Jacquet de La Guerre', sort: 'Jacquet de La Guerre' },
  'Orlando di Lasso': { given: 'Orlando', surname: 'di Lasso', sort: 'Lasso' },
  'Tomás Luis de Victoria': { given: 'Tomás Luis', surname: 'de Victoria', sort: 'Victoria' },
  'Philippe de Vitry': { given: 'Philippe', surname: 'de Vitry', sort: 'Vitry' },
};
const historicAppellations = new Set([
  'Mesomedes of Crete', 'Terpander', 'Limenius', 'Kassia', 'Romanos the Melodist',
  'Notker the Stammerer', 'Hildegard von Bingen', 'Bernart de Ventadorn', 'Léonin',
  'Pérotin', 'Adam de la Halle', 'Franco of Cologne',
]);
export function composerDirectoryName(name: string) {
  if (nameOverrides[name]) return nameOverrides[name];
  if (historicAppellations.has(name)) return { given: '', surname: name, sort: name };
  const parts = name.trim().split(/\s+/);
  const surname = parts.pop() ?? name;
  return { given: parts.join(' '), surname, sort: surname };
}
export const historicalComposers = historicalComposerNames.map(name => ({ name, ...composerDirectoryName(name) }))
  .sort((a, b) => a.sort.localeCompare(b.sort, 'en', { sensitivity: 'base' }) || a.name.localeCompare(b.name));

import { musicPeriods } from './musicPeriods';
import { musicPeriodProfiles } from './musicPeriodProfiles';
import { seedPieces } from './seed';

// Use the site's existing historical taxonomy. Each composer appears once;
// these two later careers began in the twentieth century and extend beyond it.
const directoryPeriodOverrides: Record<string, string> = {
  'Kaija Saariaho': '20th-century',
  'George Crumb': '20th-century',
  'Camille Saint-Saëns': 'late-romanticism',
  'Edward Elgar': 'late-romanticism',
  'Gabriel Fauré': 'late-romanticism',
  'Giovanni Bottesini': 'late-romanticism',
  'César Franck': 'late-romanticism',
  'Edvard Grieg': 'late-romanticism',
  'Sergei Rachmaninoff': 'late-romanticism',
  'Giacomo Puccini': 'late-romanticism',
  'Bedřich Smetana': 'late-romanticism',
  'Jean Sibelius': 'late-romanticism',

};
const seedEraPeriods: Record<string, string> = {
  Baroque: 'late-baroque', Classical: '18th-century', Romantic: '19th-century',
  'Late Romantic': 'late-romanticism', 'Post-Romantic': 'late-romanticism',
  '20th Century': '20th-century', Modern: '20th-century', Contemporary: '20th-century',
};
export function historicalComposerPeriod(name: string): string {
  if (directoryPeriodOverrides[name]) return directoryPeriodOverrides[name];
  const profile = musicPeriodProfiles.find(period => period.composers.includes(name));
  if (profile) return profile.periodId;
  const piece = seedPieces.find(piece => piece.composer_name === name);
  const period = piece && seedEraPeriods[piece.era];
  if (!period) throw new Error(`Historical composer needs a period: ${name}`);
  return period;
}
export const historicalComposerEras = musicPeriods.filter(period => period.id !== '21st-century')
  .map(period => ({ ...period,
    title: period.id === 'antiquity' ? 'Antiquity' : period.id === '20th-century' ? '20th century' : period.title,
    composers: historicalComposers.filter(composer => historicalComposerPeriod(composer.name) === period.id),
  })).filter(period => period.composers.length > 0);
