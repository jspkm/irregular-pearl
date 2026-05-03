// Signed four-axis difficulty ratings — user-contributed companion to the
// seed axes defined in src/data/difficulty-axes.ts. Every piece carries a
// seed card; any registered user can add their own rating, shown ahead of
// the seed after reordering by vote_tallies.net_score DESC.

import { supabase, hasSupabase } from './supabase';

export interface PublishedPieceDifficultyAxis {
  level: number;
  note: string | null;
}

export interface PublishedPieceDifficulty {
  ratingId: string;
  technical: PublishedPieceDifficultyAxis;
  stamina: PublishedPieceDifficultyAxis;
  interpretive: PublishedPieceDifficultyAxis;
  ensemble: PublishedPieceDifficultyAxis;
  contributor: {
    id: string;
    displayName: string;
    username: string | null;
    bioShort: string | null;
  };
}

/** Fetch all published signed difficulty ratings for a piece. */
export async function getPublishedPieceDifficultyRatings(
  pieceId: string,
): Promise<PublishedPieceDifficulty[]> {
  if (!hasSupabase) return [];

  const { data, error } = await supabase
    .from('piece_difficulty_ratings')
    .select(
      'id, contributor_id, technical_level, technical_note, stamina_level, stamina_note, interpretive_level, interpretive_note, ensemble_level, ensemble_note',
    )
    .eq('piece_id', pieceId)
    .eq('status', 'published')
    .order('created_at', { ascending: true });
  if (error || !data || data.length === 0) return [];

  const contributorIds = [...new Set(data.map((r) => r.contributor_id))];
  const { data: contribs } = await supabase
    .from('users')
    .select('id, display_name, username, contributor_bio_short')
    .in('id', contributorIds);
  const contribById = new Map((contribs ?? []).map((c) => [c.id, c]));

  const rows: PublishedPieceDifficulty[] = [];
  for (const r of data) {
    const c = contribById.get(r.contributor_id);
    if (!c) continue;
    rows.push({
      ratingId: r.id,
      technical: { level: r.technical_level, note: r.technical_note ?? null },
      stamina: { level: r.stamina_level, note: r.stamina_note ?? null },
      interpretive: { level: r.interpretive_level, note: r.interpretive_note ?? null },
      ensemble: { level: r.ensemble_level, note: r.ensemble_note ?? null },
      contributor: {
        id: c.id,
        displayName: c.display_name,
        username: c.username ?? null,
        bioShort: c.contributor_bio_short ?? null,
      },
    });
  }
  return rows;
}

/** Deterministic vote subject id for the seed difficulty card on a piece. */
export async function fetchSeedDifficultyVoteId(pieceId: string): Promise<string | null> {
  if (!hasSupabase) return null;
  const { data, error } = await supabase
    .from('pieces')
    .select('seed_difficulty_vote_id')
    .eq('id', pieceId)
    .maybeSingle();
  if (error) {
    console.error('fetchSeedDifficultyVoteId', error);
    return null;
  }
  return (data as { seed_difficulty_vote_id: string | null } | null)?.seed_difficulty_vote_id ?? null;
}
