// piece_redirects resolver. Slug immutability (PRD) means pieces.id never
// changes; the piece_redirects table records editorial corrections of the
// rare case where an auto-generated slug was genuinely wrong. The router
// calls resolvePieceRedirect(slug) on 404 to see if the slug is an alias
// for a current piece; if so, it 301s.

import { supabase, hasSupabase } from './supabase';

export async function resolvePieceRedirect(fromSlug: string): Promise<string | null> {
  if (!hasSupabase || !fromSlug) return null;

  try {
    const { data, error } = await supabase
      .from('piece_redirects')
      .select('to_piece_id')
      .eq('from_slug', fromSlug)
      .maybeSingle();
    if (error || !data) return null;
    return (data as { to_piece_id: string }).to_piece_id;
  } catch {
    return null;
  }
}
