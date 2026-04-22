// Controlled vocabulary for the `instrument` pill category and (eventually)
// browse facets. Full-orchestra coverage organized by family. Display values
// are lowercase (the pills row lowercases everything anyway); pill comparison
// is case-insensitive at the RPC layer.

export const INSTRUMENT_FAMILIES = {
  strings: ['violin', 'viola', 'cello', 'double bass', 'harp'],
  woodwinds: [
    'piccolo',
    'flute',
    'alto flute',
    'oboe',
    'english horn',
    'clarinet',
    'bass clarinet',
    'bassoon',
    'contrabassoon',
    'saxophone',
  ],
  brass: ['french horn', 'trumpet', 'cornet', 'trombone', 'bass trombone', 'tuba', 'euphonium'],
  percussion: ['timpani', 'percussion', 'snare drum', 'bass drum', 'cymbals', 'triangle', 'tambourine', 'xylophone', 'marimba', 'vibraphone', 'glockenspiel', 'celesta'],
  keyboard: ['piano', 'harpsichord', 'organ', 'fortepiano'],
  voice: ['soprano', 'mezzo-soprano', 'alto', 'contralto', 'tenor', 'baritone', 'bass'],
  ensemble: ['choir', 'orchestra', 'string quartet', 'wind ensemble', 'brass ensemble', 'chamber ensemble'],
} as const;

export const INSTRUMENTS: readonly string[] = Object.values(INSTRUMENT_FAMILIES).flat();

export const INSTRUMENT_SET = new Set<string>(INSTRUMENTS);

export function isValidInstrument(value: string): boolean {
  return INSTRUMENT_SET.has(value.trim().toLowerCase());
}
