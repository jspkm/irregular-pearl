// External-link CRUD helpers. Shared by the Recordings surface and the
// External references surface — the UI splits rows by type.

import { supabase, hasSupabase } from './supabase';

export const REFERENCE_TYPES = ['imslp', 'wikipedia'] as const;
export const RECORDING_TYPES = [
  'youtube', 'vimeo', 'spotify', 'internet_archive', 'soundcloud', 'bandcamp',
] as const;
export type ExternalLinkType = typeof REFERENCE_TYPES[number] | typeof RECORDING_TYPES[number];

export interface ExternalLink {
  id: string;
  pieceId: string;
  type: string;
  url: string;
  label: string;
  source: string;
  ordinal: number;
}

export async function fetchExternalLinksForPiece(pieceId: string): Promise<ExternalLink[]> {
  if (!hasSupabase) return [];
  const { data, error } = await supabase
    .from('external_links')
    .select('id, piece_id, type, url, label, source, ordinal')
    .eq('piece_id', pieceId)
    .is('deleted_at', null)
    .order('ordinal', { ascending: true });
  if (error) {
    console.error('fetchExternalLinksForPiece', error);
    return [];
  }
  return (data ?? []).map((r: any) => ({
    id: r.id,
    pieceId: r.piece_id,
    type: r.type,
    url: r.url,
    label: r.label,
    source: r.source,
    ordinal: r.ordinal,
  }));
}
