import type { APIRoute } from 'astro';
import { seedPieces } from '../data/seed';

export const GET: APIRoute = ({ url }) => {
  const origin = url.origin;

  const pieceEntries = seedPieces.map((piece) => {
    const editions = piece.editions
      .map((e) => `    - ${e.publisher} (${e.editor}${e.year ? `, ${e.year}` : ''}): ${e.description}`)
      .join('\n');

    const links = piece.external_links
      .map((l) => `    - [${l.label}](${l.url})`)
      .join('\n');

    return `## ${piece.title}${piece.catalog_number ? ` (${piece.catalog_number})` : ''}
- Composer: ${piece.composer_name}
- Instruments: ${piece.instruments.join(', ')}
- Era: ${piece.era} | Form: ${piece.form} | Difficulty: ${piece.difficulty}${piece.duration_minutes ? ` | Duration: ~${piece.duration_minutes} min` : ''}
- URL: ${origin}/piece/${piece.id}

${piece.description}

### Editions
${editions}

### Resources
${links}
`;
  });

  const content = `# Irregular Pearl — Full Piece Catalog

> Complete catalog of ${seedPieces.length} classical music pieces with editions, recordings, and metadata.
> For a summary, see: ${origin}/llms.txt

${pieceEntries.join('\n---\n\n')}`;

  return new Response(content, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
