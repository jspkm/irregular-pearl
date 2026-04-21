// Server + client helpers for the voting surface. Today the public
// read-path is fetchOrderedSubjects — returns IDs sorted by
// vote_tallies.net_score DESC without exposing the counts themselves (per
// plan §2.5: vote_tallies is REVOKE'd from anon + authenticated, only the
// SECURITY DEFINER RPC fetch_ordered_subjects is callable).

import { supabase, hasSupabase } from './supabase';

export type VoteSubjectTable =
  | 'performers_notes'
  | 'interpretive_schools'
  | 'piece_descriptions'
  | 'landmarks'
  | 'pieces_seed_description';

/**
 * Reorder a list of subject IDs by vote_tallies.net_score DESC (tie-break
 * on id ASC). Returns the same IDs as the input in a new order, or the
 * input unchanged if the RPC is unavailable.
 */
/**
 * Fetch the deterministic UUID used as the vote subject for a piece's
 * unsigned seed description (pieces.description). One row per piece, lives
 * on `pieces.seed_description_vote_id` (migration 20260516). Returns null
 * if the piece doesn't exist or Supabase isn't configured.
 */
export async function fetchSeedDescriptionVoteId(pieceId: string): Promise<string | null> {
  if (!hasSupabase) return null;
  const { data, error } = await supabase
    .from('pieces')
    .select('seed_description_vote_id')
    .eq('id', pieceId)
    .maybeSingle();
  if (error) {
    console.error('fetchSeedDescriptionVoteId', error);
    return null;
  }
  return (data as { seed_description_vote_id: string | null } | null)?.seed_description_vote_id ?? null;
}

export async function fetchOrderedSubjects(
  subjectTable: VoteSubjectTable,
  ids: string[],
): Promise<string[]> {
  if (!hasSupabase || ids.length === 0) return ids;
  const { data, error } = await supabase.rpc('fetch_ordered_subjects', {
    p_subject_table: subjectTable,
    p_subject_ids: ids,
  });
  if (error) {
    console.error('fetchOrderedSubjects', error);
    return ids;
  }
  return (data as string[]) ?? ids;
}
