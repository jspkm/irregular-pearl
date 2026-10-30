import { historicalComposers } from '../data/historicalComposers';
import { upkeepCategories, upkeepLevels } from '../data/instrumentalUpkeep';
import type { APIRoute } from 'astro';
import { seedPieces } from '../data/seed';
import { musicPeriods } from '../data/musicPeriods';
import { opportunities } from '../data/opportunities';
import { supabase, hasSupabase } from '../lib/supabase';

export const GET: APIRoute = async ({ url }) => {
  const origin = url.origin;
  const now = new Date().toISOString().split('T')[0];

  const composers = [...new Set([...seedPieces.map(p => p.composer_name), ...historicalComposers.map(composer => composer.name)])];
  const instruments = [...new Set(seedPieces.flatMap(p => p.instruments))];

  let artistSlugs: string[] = [];
  if (hasSupabase) {
    const { data } = await supabase.from('users').select('username').not('username', 'is', null);
    if (data) artistSlugs = data.map((r: any) => r.username);
  }

  const urls = [
    `  <url><loc>${origin}/composers</loc><changefreq>monthly</changefreq><priority>0.7</priority><lastmod>${now}</lastmod></url>`,
    `  <url>
    <loc>${origin}/who-we-are</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
    <lastmod>${now}</lastmod>
  </url>`,
    ...['/instrumental-upkeep', ...upkeepCategories.flatMap(category => upkeepLevels.map(level => `/instrumental-upkeep/${category.id}/${level.id}`))].map(path => `  <url>
    <loc>${origin}${path}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
    <lastmod>${now}</lastmod>
  </url>`),
    `  <url>
    <loc>${origin}/residency/application</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
    <lastmod>${now}</lastmod>
  </url>`,
    `  <url>
    <loc>${origin}/residency</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
    <lastmod>${now}</lastmod>
  </url>`,
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
    <loc>${origin}/pieces</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
    <lastmod>${now}</lastmod>
  </url>`,
    `  <url>
    <loc>${origin}/glossary</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
    <lastmod>${now}</lastmod>
  </url>`,
    ...musicPeriods.map(
      (period) => `  <url>
    <loc>${origin}/glossary/era/${period.id}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
    <lastmod>${now}</lastmod>
  </url>`
    ),
    `  <url>
    <loc>${origin}/opportunities</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
    <lastmod>${now}</lastmod>
  </url>`,
    ...opportunities.map(
      (entry) => `  <url>
    <loc>${origin}/opportunities/${entry.id}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
    <lastmod>${now}</lastmod>
  </url>`
    ),
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
