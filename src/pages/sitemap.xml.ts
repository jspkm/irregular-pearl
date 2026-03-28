import type { APIRoute } from 'astro';
import { seedPieces } from '../data/seed';

export const GET: APIRoute = ({ url }) => {
  const origin = url.origin;
  const now = new Date().toISOString().split('T')[0];

  const urls = [
    `  <url>
    <loc>${origin}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <lastmod>${now}</lastmod>
  </url>`,
    ...seedPieces.map(
      (piece) => `  <url>
    <loc>${origin}/piece/${piece.id}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <lastmod>${now}</lastmod>
  </url>`
    ),
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: { 'Content-Type': 'application/xml' },
  });
};
