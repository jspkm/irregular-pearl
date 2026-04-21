// Helpers for reading piece movements. Movements are wiki-edit content
// (any authenticated user can update via the update_movement RPC landing in
// Step 3). RLS grants public select on both `movements` and
// `movement_versions`, so this helper works for anon + authenticated alike.
//
// The current row in `movements` always reflects the latest version via
// the composite FK on current_version_id. Reading from the base table is
// fine for the common "show current state" case; the versions table is
// only needed for history + revert.

import { supabase, hasSupabase } from './supabase';

export interface Movement {
  id: string;
  pieceId: string;
  ordinal: number;
  name: string;
  tempoIndication: string | null;
  keySignature: string | null;
  meter: string | null;
  currentVersionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MovementVersion {
  id: string;
  movementId: string;
  pieceId: string;
  ordinal: number;
  name: string;
  tempoIndication: string | null;
  keySignature: string | null;
  meter: string | null;
  versionNumber: number;
  authoredBy: string;
  createdAt: string;
  editSummary: string | null;
  revertedFromVersionId: string | null;
}

/**
 * Fetch all movements for a piece, ordered by ordinal ASC.
 * Returns an empty array if the piece has no movements (synthetic fallback)
 * or if Supabase isn't configured.
 */
export async function fetchMovementsForPiece(pieceId: string): Promise<Movement[]> {
  if (!hasSupabase) return [];

  const { data, error } = await supabase
    .from('movements')
    .select(
      'id, piece_id, ordinal, name, tempo_indication, key_signature, meter, current_version_id, created_at, updated_at',
    )
    .eq('piece_id', pieceId)
    .is('deleted_at', null)
    .order('ordinal', { ascending: true });

  if (error) {
    console.error('fetchMovementsForPiece', error);
    return [];
  }

  return (data ?? []).map(rowToMovement);
}

/**
 * Fetch a single movement by id. Does not return soft-deleted rows.
 */
export async function fetchMovement(movementId: string): Promise<Movement | null> {
  if (!hasSupabase) return null;

  const { data, error } = await supabase
    .from('movements')
    .select(
      'id, piece_id, ordinal, name, tempo_indication, key_signature, meter, current_version_id, created_at, updated_at',
    )
    .eq('id', movementId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) {
    console.error('fetchMovement', error);
    return null;
  }

  return data ? rowToMovement(data) : null;
}

/**
 * Fetch the full version history for a movement, most recent first.
 * Used by the history modal (landing in Step 3).
 */
export async function fetchMovementHistory(movementId: string): Promise<MovementVersion[]> {
  if (!hasSupabase) return [];

  const { data, error } = await supabase
    .from('movement_versions')
    .select(
      'id, movement_id, piece_id, ordinal, name, tempo_indication, key_signature, meter, version_number, authored_by, created_at, edit_summary, reverted_from_version_id',
    )
    .eq('movement_id', movementId)
    .order('version_number', { ascending: false });

  if (error) {
    console.error('fetchMovementHistory', error);
    return [];
  }

  return (data ?? []).map(rowToMovementVersion);
}

// ============================================================================
// Page-level change log
// ============================================================================

export interface ChangeLogEntry {
  id: string;
  createdAt: string;
  authoredBy: string | null;
  authoredByDisplayName: string;
  subjectType: 'movement'; // more types as they land
  subjectId: string;
  subjectLabel: string;
  editSummary: string | null;
  versionNumber: number;
}

/**
 * Fetch the unified change log for a piece across every versioned subject.
 * Today only movement_versions is unioned in; landmarks + signed content
 * will join as their versioning lands.
 */
export async function fetchPieceChangelog(pieceId: string): Promise<ChangeLogEntry[]> {
  if (!hasSupabase) return [];

  const { data, error } = await supabase.rpc('fetch_piece_changelog', {
    p_piece_id: pieceId,
  });
  if (error) {
    console.error('fetchPieceChangelog', error);
    return [];
  }
  return ((data as any[]) ?? []).map((r) => ({
    id: r.id,
    createdAt: r.created_at,
    authoredBy: r.authored_by,
    authoredByDisplayName: r.authored_by_display_name,
    subjectType: r.subject_type,
    subjectId: r.subject_id,
    subjectLabel: r.subject_label,
    editSummary: r.edit_summary,
    versionNumber: r.version_number,
  }));
}

// ============================================================================
// Row mappers — DB snake_case → TS camelCase
// ============================================================================

type MovementRow = {
  id: string;
  piece_id: string;
  ordinal: number;
  name: string;
  tempo_indication: string | null;
  key_signature: string | null;
  meter: string | null;
  current_version_id: string | null;
  created_at: string;
  updated_at: string;
};

function rowToMovement(row: MovementRow): Movement {
  return {
    id: row.id,
    pieceId: row.piece_id,
    ordinal: row.ordinal,
    name: row.name,
    tempoIndication: row.tempo_indication,
    keySignature: row.key_signature,
    meter: row.meter,
    currentVersionId: row.current_version_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

type MovementVersionRow = {
  id: string;
  movement_id: string;
  piece_id: string;
  ordinal: number;
  name: string;
  tempo_indication: string | null;
  key_signature: string | null;
  meter: string | null;
  version_number: number;
  authored_by: string;
  created_at: string;
  edit_summary: string | null;
  reverted_from_version_id: string | null;
};

function rowToMovementVersion(row: MovementVersionRow): MovementVersion {
  return {
    id: row.id,
    movementId: row.movement_id,
    pieceId: row.piece_id,
    ordinal: row.ordinal,
    name: row.name,
    tempoIndication: row.tempo_indication,
    keySignature: row.key_signature,
    meter: row.meter,
    versionNumber: row.version_number,
    authoredBy: row.authored_by,
    createdAt: row.created_at,
    editSummary: row.edit_summary,
    revertedFromVersionId: row.reverted_from_version_id,
  };
}
