import type { APIRoute } from 'astro';
import { seedPieces } from '../data/seed';
import { supabase, hasSupabase } from '../lib/supabase';

export const GET: APIRoute = async ({ url }) => {
  const origin = url.origin;
  const now = new Date().toISOString().split('T')[0];

  // Static entities from seed data
  const composers = [...new Set(seedPieces.map(p => p.composer_name))];
  const instruments = [...new Set(seedPieces.flatMap(p => p.instruments))];

  // Dynamic entities from Supabase
  let artistSlugs: string[] = [];
  let instrumentIds: string[] = [];
  let eventIds: string[] = [];

  if (hasSupabase) {
    const [artistsRes, instrRes, eventsRes] = await Promise.allSettled([
      supabase.from('users').select('vanity_slug').not('vanity_slug', 'is', null),
      supabase.from('instruments').select('id').eq('privacy_level', 'public'),
      supabase.from('events').select('id'),
    ]);
    if (artistsRes.status === 'fulfilled' && artistsRes.value.data)
      artistSlugs = artistsRes.value.data.map((r: any) => r.vanity_slug);
    if (instrRes.status === 'fulfilled' && instrRes.value.data)
      instrumentIds = instrRes.value.data.map((r: any) => r.id);
    if (eventsRes.status === 'fulfilled' && eventsRes.value.data)
      eventIds = eventsRes.value.data.map((r: any) => r.id);
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
    `  <url>
    <loc>${origin}/events</loc>
    <changefreq>daily</changefreq>
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
    ...instrumentIds.map(
      (id) => `  <url>
    <loc>${origin}/instruments/${id}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
    <lastmod>${now}</lastmod>
  </url>`
    ),
    ...eventIds.map(
      (id) => `  <url>
    <loc>${origin}/events/${id}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
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
