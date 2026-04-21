// Pedagogical-arc data access. Per-piece "Prepare with" + "Natural next"
// connections. Backing schema + RPCs shipped in
// 20260509000000_pedagogical_arc.sql; this module is read-side helpers
// + light types for the UI layer.

import { supabase, hasSupabase } from './supabase';

export type PedagogicalKind = 'prepare_with' | 'natural_next';

export interface PedagogicalConnection {
  id: string;
  pieceId: string;
  relatedPieceId: string;
  relatedTitle: string;
  relatedComposer: string;
  relatedCatalogNumber: string | null;
  kind: PedagogicalKind;
  note: string | null;
  ordinal: number;
}

interface RawConnection {
  id: string;
  piece_id: string;
  related_piece_id: string;
  kind: string;
  note: string | null;
  ordinal: number;
  related: {
    id: string;
    title: string;
    composer_name: string;
    catalog_number: string | null;
  } | null;
}

export async function fetchPedagogicalConnections(pieceId: string): Promise<PedagogicalConnection[]> {
  if (!hasSupabase) return [];
  const { data, error } = await supabase
    .from('pedagogical_connections')
    .select(
      'id, piece_id, related_piece_id, kind, note, ordinal, related:pieces!related_piece_id(id, title, composer_name, catalog_number)',
    )
    .eq('piece_id', pieceId)
    .is('deleted_at', null)
    .order('kind', { ascending: true })
    .order('ordinal', { ascending: true });
  if (error) {
    console.error('fetchPedagogicalConnections', error);
    return [];
  }
  return (data ?? []).map((r: any): PedagogicalConnection => {
    const row = r as RawConnection;
    return {
      id: row.id,
      pieceId: row.piece_id,
      relatedPieceId: row.related_piece_id,
      relatedTitle: row.related?.title ?? row.related_piece_id,
      relatedComposer: row.related?.composer_name ?? '',
      relatedCatalogNumber: row.related?.catalog_number ?? null,
      kind: row.kind === 'natural_next' ? 'natural_next' : 'prepare_with',
      note: row.note,
      ordinal: row.ordinal,
    };
  });
}

export interface PieceOption {
  id: string;
  title: string;
  composerName: string;
  catalogNumber: string | null;
}

export async function fetchAllPiecesForPicker(): Promise<PieceOption[]> {
  if (!hasSupabase) return [];
  const { data, error } = await supabase
    .from('pieces')
    .select('id, title, composer_name, catalog_number')
    .order('composer_name', { ascending: true })
    .order('title', { ascending: true });
  if (error) {
    console.error('fetchAllPiecesForPicker', error);
    return [];
  }
  return (data ?? []).map((r: any) => ({
    id: r.id,
    title: r.title,
    composerName: r.composer_name,
    catalogNumber: r.catalog_number,
  }));
}
