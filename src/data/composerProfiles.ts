export interface ComposerProfile {
  living: boolean;
  underrepresented: boolean;
}

// Editorial identity fields are explicit so discovery views never infer identity
// or living status from a composer's name.
export const composerProfiles: Record<string, ComposerProfile> = {
  'Antonio Vivaldi': { living: false, underrepresented: false },
  'Camille Saint-Saëns': { living: false, underrepresented: false },
  'Edward Elgar': { living: false, underrepresented: false },
  'Felix Mendelssohn': { living: false, underrepresented: false },
  'Gabriel Fauré': { living: false, underrepresented: false },
  'George Crumb': { living: false, underrepresented: false },
  'Johann Sebastian Bach': { living: false, underrepresented: false },
  'Joseph Haydn': { living: false, underrepresented: false },
  'Richard Strauss': { living: false, underrepresented: false },
  ...Object.fromEntries(livingComposers.map((composer) => [composer.name, { living: true, underrepresented: false }])),
};

export function getComposerProfile(name: string): ComposerProfile {
  return composerProfiles[name] ?? { living: false, underrepresented: false };
}
import { livingComposers } from './livingComposers';
