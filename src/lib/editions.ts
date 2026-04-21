// Editions: wiki-edit CRUD helpers. Any authenticated user can create,
// edit, reorder, and soft-delete via the RPCs shipped in
// 20260507000000_editions_wiki_crud.sql. Reads filter deleted_at IS NULL.

import { supabase, hasSupabase } from './supabase';

export interface Edition {
  id: string;
  pieceId: string;
  publisher: string;
  editor: string;
  year: number | null;
  description: string;
  type: string | null;
  url: string | null;
  ordinal: number;
}

export async function fetchEditionsForPiece(pieceId: string): Promise<Edition[]> {
  if (!hasSupabase) return [];
  const { data, error } = await supabase
    .from('editions')
    .select('id, piece_id, publisher, editor, year, description, type, url, ordinal')
    .eq('piece_id', pieceId)
    .is('deleted_at', null)
    .order('ordinal', { ascending: true });
  if (error) {
    console.error('fetchEditionsForPiece', error);
    return [];
  }
  return (data ?? []).map((r: any) => ({
    id: r.id,
    pieceId: r.piece_id,
    publisher: r.publisher,
    editor: r.editor,
    year: r.year,
    description: r.description,
    type: r.type,
    url: r.url,
    ordinal: r.ordinal,
  }));
}
