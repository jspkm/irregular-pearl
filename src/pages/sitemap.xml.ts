import type { APIRoute } from 'astro';
import { seedPieces } from '../data/seed';
import { supabase, hasSupabase } from '../lib/supabase';

export const GET: APIRoute = async ({ url }) => {
  const origin = url.origin;
  const now = new Date().toISOString().split('T')[0];

  const composers = [...new Set(seedPieces.map(p => p.composer_name))];
  const instruments = [...new Set(seedPieces.flatMap(p => p.instruments))];

  let artistSlugs: string[] = [];
  if (hasSupabase) {
    const { data } = await supabase.from('users').select('username').not('username', 'is', null);
    if (data) artistSlugs = data.map((r: any) => r.username);
  }

  const urls = [
    `  <url>
    <loc>${origin}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <lastmod>${now}</lastmod>
  </url>`,
    `  <url>
    <loc>${origin}/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
    <lastmod>${now}</lastmod>
  </url>`,
    ...composers.map(
      (name) => `  <url>
    <loc>${origin}/composer/${encodeURIComponent(name)}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
    <lastmod>${now}</lastmod>
  </url>`
    ),
    ...instruments.map(
      (name) => `  <url>
    <loc>${origin}/instrument/${encodeURIComponent(name.toLowerCase())}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
    <lastmod>${now}</lastmod>
  </url>`
    ),
    ...seedPieces.map(
      (piece) => `  <url>
    <loc>${origin}/piece/${piece.id}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <lastmod>${now}</lastmod>
  </url>`
    ),
    ...artistSlugs.map(
      (slug) => `  <url>
    <loc>${origin}/@${encodeURIComponent(slug)}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
    <lastmod>${now}</lastmod>
  </url>`
    ),
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
