import type { APIRoute } from 'astro';
import { seedPieces } from '../data/seed';

export const GET: APIRoute = ({ url }) => {
  const origin = url.origin;

  const content = `# Irregular Pearl

> A collaborative platform for classical music knowledge. Every musical work gets a living page with editions, recordings, and community discussion.

Irregular Pearl organizes classical music knowledge around the PIECE as the atomic unit. Each piece page contains structured metadata, edition comparisons with community ratings, embedded recordings, and threaded discussion from musicians worldwide.

## Key Facts
- ${seedPieces.length} pieces across Piano, Violin, Cello, Voice, and Winds
- Non-profit organization for public domain classical music knowledge
- Each piece has 2-3 editions with publisher, editor, and year information
- Community discussion and ratings from working musicians

## Navigation
- Homepage: ${origin}/
- Search: ${origin}/?q={query}
- Piece pages: ${origin}/piece/{piece-id}
- Full piece catalog: ${origin}/llms-full.txt

## Piece Page Structure
Each piece page (${origin}/piece/{id}) contains:
- Title, composer, catalog number
- Instrument, era, form, duration, difficulty level
- Description of the work
- Edition comparisons (publisher, editor, year, description)
- External links to IMSLP, YouTube recordings, Wikipedia
- Community discussion thread

## Example Pieces
- ${origin}/piece/bach-cello-suite-1 — Bach Cello Suite No. 1 in G major, BWV 1007
- ${origin}/piece/beethoven-sonata-14 — Beethoven "Moonlight" Sonata
- ${origin}/piece/chopin-ballade-1 — Chopin Ballade No. 1 in G minor

## Contact
Irregular Pearl is a non-profit for classical music knowledge.
`;

  return new Response(content, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
