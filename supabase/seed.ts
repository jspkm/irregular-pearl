// Seed script: bun run supabase/seed.ts
// Inserts seed pieces, editions, and external links into Supabase.
// Requires PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.

import { createClient } from '@supabase/supabase-js';
import { seedPieces } from '../src/data/seed';

const url = process.env.PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Missing env vars: PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

async function seed() {
  console.log(`Seeding ${seedPieces.length} pieces...`);

  for (const piece of seedPieces) {
    // Insert piece
    const { error: pieceError } = await supabase
      .from('pieces')
      .upsert({
        id: piece.id,
        title: piece.title,
        composer_name: piece.composer_name,
        catalog_number: piece.catalog_number,
        instruments: piece.instruments,
        era: piece.era,
        form: piece.form,
        duration_minutes: piece.duration_minutes,
        difficulty: piece.difficulty,
        description: piece.description,
      }, { onConflict: 'id' });

    if (pieceError) {
      console.error(`  Failed to insert piece "${piece.title}":`, pieceError.message);
      continue;
    }
    console.log(`  ✓ ${piece.title}`);

    // Insert editions
    for (const edition of piece.editions) {
      const { error } = await supabase
        .from('editions')
        .upsert({
          id: edition.id,
          piece_id: piece.id,
          publisher: edition.publisher,
          editor: edition.editor,
          year: edition.year,
          description: edition.description,
        }, { onConflict: 'id' });

      if (error) {
        console.error(`    Failed to insert edition "${edition.publisher}":`, error.message);
      }
    }

    // Insert external links
    for (const link of piece.external_links) {
      const { error } = await supabase
        .from('external_links')
        .upsert({
          id: `${piece.id}-${link.type}-${link.url.slice(-20)}`,
          piece_id: piece.id,
          type: link.type,
          url: link.url,
          label: link.label,
        }, { onConflict: 'id' });

      if (error) {
        console.error(`    Failed to insert link "${link.label}":`, error.message);
      }
    }
  }

  console.log('\nDone!');
}

seed().catch(console.error);
