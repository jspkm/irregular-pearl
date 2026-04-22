// Server-side fetch helper + shared types for the pills row on the piece
// page. The pill row is the source of truth for piece metadata (instrument,
// era, form, duration, difficulty); the legacy scalar/array columns on
// pieces are kept as a denormalized read cache via a DB trigger so existing
// browse / search reads keep working.

import { supabase, hasSupabase } from './supabase';
import type { PillCategory } from '../data/pill-vocabulary';

export interface Pill {
  id: string;
  pieceId: string;
  category: PillCategory;
  value: string;
  source: 'seed' | 'user' | 'mod';
  addedBy: string | null;
  createdAt: string;
}

/**
 * Fetch all pills for a piece from the DB. Returns [] if Supabase is not
 * configured (build-time / preview environments). The piece page falls
 * back to constructing read-only pills from the piece's scalar fields in
 * that case.
 */
export async function getPiecePills(pieceId: string): Promise<Pill[]> {
  if (!hasSupabase) return [];

  try {
    const { data, error } = await supabase
      .from('piece_pills')
      .select('id, piece_id, category, value, source, added_by, created_at')
      .eq('piece_id', pieceId)
      .order('created_at', { ascending: true });

    if (error || !data) return [];

    return data.map((row: any) => ({
      id: row.id,
      pieceId: row.piece_id,
      category: row.category,
      value: row.value,
      source: row.source,
      addedBy: row.added_by,
      createdAt: row.created_at,
    }));
  } catch {
    return [];
  }
}

/**
 * Build a read-only fallback pill list from a piece's scalar/array fields.
 * Used when DB pills aren't available (Supabase missing). No DB ids — this
 * is render-only.
 */
export function pillsFromPieceFields(piece: {
  instruments?: string[] | null;
  era?: string | null;
  form?: string | null;
  duration_minutes?: number | null;
  difficulty?: string | null;
}): Pill[] {
  const pills: Pill[] = [];
  const now = new Date().toISOString();
  let i = 0;
  const make = (category: PillCategory, value: string): Pill => ({
    id: `fallback-${category}-${i++}`,
    pieceId: '',
    category,
    value,
    source: 'seed',
    addedBy: null,
    createdAt: now,
  });
  for (const v of piece.instruments ?? []) {
    if (v && v.trim()) pills.push(make('instrument', v.toLowerCase()));
  }
  if (piece.era) pills.push(make('era', piece.era.toLowerCase()));
  if (piece.form) pills.push(make('form', piece.form.toLowerCase()));
  if (piece.duration_minutes != null) pills.push(make('duration', `~${piece.duration_minutes} min`));
  if (piece.difficulty) pills.push(make('difficulty', piece.difficulty));
  return pills;
}
