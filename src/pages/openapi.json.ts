import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ url }) => {
  const origin = url.origin;

  const spec = {
    openapi: '3.1.0',
    info: {
      title: 'Irregular Pearl API',
      description: 'Classical music knowledge base — look up pieces, editions, and recordings.',
      version: '1.0.0',
    },
    servers: [{ url: origin }],
    paths: {
      '/': {
        get: {
          operationId: 'searchPieces',
          summary: 'Search classical music pieces by title, composer, or instrument',
          parameters: [
            {
              name: 'q',
              in: 'query',
              description: 'Search query (piece title, composer name, or instrument)',
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': { description: 'HTML page with matching pieces' },
          },
        },
      },
      '/piece/{id}': {
        get: {
          operationId: 'getPiece',
          summary: 'Get detailed information about a classical music piece including editions and recordings',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Piece slug ID (e.g., bach-cello-suite-1, beethoven-sonata-14)',
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': { description: 'HTML page with piece details, editions, and recordings' },
          },
        },
      },
      '/llms.txt': {
        get: {
          operationId: 'getLlmsSummary',
          summary: 'Get a plain-text summary of Irregular Pearl for AI consumption',
          responses: {
            '200': { description: 'Plain text summary of the platform' },
          },
        },
      },
      '/llms-full.txt': {
        get: {
          operationId: 'getFullCatalog',
          summary: 'Get the complete catalog of all 103 classical music pieces with editions and metadata',
          responses: {
            '200': { description: 'Plain text full catalog' },
          },
        },
      },
      '/sitemap.xml': {
        get: {
          operationId: 'getSitemap',
          summary: 'XML sitemap with all piece page URLs',
          responses: {
            '200': { description: 'XML sitemap' },
          },
        },
      },
    },
  };

  return new Response(JSON.stringify(spec, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  });
};
