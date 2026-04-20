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

  // Detect whether the movements table exists (Slice C Step 2). If it doesn't,
  // skip movement seeding silently so the rest of the seed still works against
  // pre-Step-2 databases.
  const { error: movementsProbeErr } = await supabase
    .from('movements')
    .select('id', { count: 'exact', head: true })
    .limit(1);
  const hasMovements = !movementsProbeErr;
  if (!hasMovements) {
    console.log(
      '  (movements table not found — skipping movement seeding. Apply migration 20260427000000 to enable.)',
    );
  }

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

    // Insert movements + their initial versions. Slice C Step 2 materialized
    // movements as first-class Postgres rows; seed.ts remains the source of
    // truth. Idempotent via unique(piece_id, ordinal) — re-running the seed
    // skips existing movements instead of duplicating. Skipped entirely if
    // the movements table doesn't exist yet (pre-Step-2 DB).
    if (hasMovements && piece.movements && piece.movements.length > 0) {
      for (let i = 0; i < piece.movements.length; i++) {
        const mv = piece.movements[i];
        const ordinal = i + 1;

        // Check whether this (piece, ordinal) already has a movement row.
        const { data: existing } = await supabase
          .from('movements')
          .select('id')
          .eq('piece_id', piece.id)
          .eq('ordinal', ordinal)
          .maybeSingle();

        if (existing) {
          continue; // already seeded; don't duplicate or overwrite user edits
        }

        // Insert movement first (current_version_id null — FK is deferrable).
        const { data: movement, error: mErr } = await supabase
          .from('movements')
          .insert({
            piece_id: piece.id,
            ordinal,
            name: mv.name,
            key_signature: mv.key ?? null,
            meter: mv.meter ?? null,
          })
          .select('id')
          .single();

        if (mErr || !movement) {
          console.error(`    Failed to insert movement "${mv.name}":`, mErr?.message);
          continue;
        }

        // Insert initial version (authored_by null = seed data).
        const { data: version, error: vErr } = await supabase
          .from('movement_versions')
          .insert({
            movement_id: movement.id,
            piece_id: piece.id,
            ordinal,
            name: mv.name,
            key_signature: mv.key ?? null,
            meter: mv.meter ?? null,
            version_number: 1,
            authored_by: null,
            edit_summary: 'initial seed from src/data/seed.ts',
          })
          .select('id')
          .single();

        if (vErr || !version) {
          console.error(`    Failed to insert version for "${mv.name}":`, vErr?.message);
          continue;
        }

        // Point movement.current_version_id at the newly created version.
        const { error: uErr } = await supabase
          .from('movements')
          .update({ current_version_id: version.id })
          .eq('id', movement.id);

        if (uErr) {
          console.error(`    Failed to link current_version for "${mv.name}":`, uErr.message);
        }
      }
    }
  }

  console.log('\nDone!');
}

seed().catch(console.error);
