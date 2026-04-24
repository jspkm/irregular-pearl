// Helpers for fetching published structural landmarks on a piece.
// Landmarks are grouped by movement on the piece page; order within a
// movement is structural (measure_start ASC, tiebreak approved_at ASC).
//
// The base tables have RLS ("published landmarks viewable by everyone");
// the joined payload lives in v_landmark_versions_published, which is
// granted to anon + authenticated. Mirrors src/lib/interpretiveSchools.ts.

import { supabase, hasSupabase } from './supabase';

export interface LandmarkFlag {
  type: string;
  severity: string;
  instrument_specificity?: string[];
}

export interface LandmarkPracticeNote {
  body: string;
}

export interface PublishedLandmark {
  landmarkId: string;
  versionId: string;
  movementId: string;
  measureStart: number;
  measureEnd: number | null;
  label: string;
  description: string | null;
  ordinal: number;
  flags: LandmarkFlag[];
  practiceNotes: LandmarkPracticeNote[];
  versionNumber: number;
  approvedAt: string | null;
  contributor: {
    id: string;
    displayName: string;
    bioShort: string | null;
  };
}

function parseFlags(raw: unknown): LandmarkFlag[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((f): f is Record<string, unknown> => typeof f === 'object' && f !== null)
    .map((f) => ({
      type: String(f.type ?? ''),
      severity: String(f.severity ?? ''),
      instrument_specificity: Array.isArray(f.instrument_specificity)
        ? (f.instrument_specificity as string[])
        : undefined,
    }))
    .filter((f) => f.type && f.severity);
}

function parsePracticeNotes(raw: unknown): LandmarkPracticeNote[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((n): n is Record<string, unknown> => typeof n === 'object' && n !== null)
    .map((n) => ({ body: String(n.body ?? '') }))
    .filter((n) => n.body.length > 0);
}

/**
 * Fetch all published landmarks for a piece, ordered for structural reading:
 * by measure_start ASC within each movement. Grouping by movement happens
 * in the consuming component — this helper returns a flat, ordered list.
 */
export async function getPublishedLandmarksForPiece(
  pieceId: string,
): Promise<PublishedLandmark[]> {
  if (!hasSupabase) return [];

  const landmarksRes = await supabase
    .from('landmarks')
    .select('id, movement_id, contributor_id, current_version_id')
    .eq('piece_id', pieceId)
    .eq('status', 'published');
  if (landmarksRes.error || !landmarksRes.data || landmarksRes.data.length === 0) return [];

  const versionIds = landmarksRes.data
    .map((l) => l.current_version_id)
    .filter((x): x is string => Boolean(x));
  const contributorIds = [...new Set(landmarksRes.data.map((l) => l.contributor_id))];

  const [versionsRes, contribsRes] = await Promise.all([
    supabase
      .from('v_landmark_versions_published')
      .select(
        'id, measure_start, measure_end, label, description, ordinal, flags, practice_notes, version_number, approved_at',
      )
      .in('id', versionIds),
    supabase
      .from('users')
      .select('id, display_name, contributor_bio_short')
      .in('id', contributorIds),
  ]);
  if (versionsRes.error || !versionsRes.data) return [];
  if (contribsRes.error || !contribsRes.data) return [];

  const versionById = new Map(versionsRes.data.map((v) => [v.id, v]));
  const contribById = new Map(contribsRes.data.map((c) => [c.id, c]));

  const rows: PublishedLandmark[] = [];
  for (const l of landmarksRes.data) {
    if (!l.current_version_id) continue;
    const v = versionById.get(l.current_version_id);
    const c = contribById.get(l.contributor_id);
    if (!v || !c) continue;
    if (
      v.id === null ||
      v.measure_start === null ||
      v.label === null ||
      v.version_number === null
    ) {
      continue;
    }
    rows.push({
      landmarkId: l.id,
      versionId: v.id,
      movementId: l.movement_id,
      measureStart: v.measure_start,
      measureEnd: v.measure_end,
      label: v.label,
      description: v.description,
      ordinal: v.ordinal ?? 0,
      flags: parseFlags(v.flags),
      practiceNotes: parsePracticeNotes(v.practice_notes),
      versionNumber: v.version_number,
      approvedAt: v.approved_at,
      contributor: {
        id: c.id,
        displayName: c.display_name,
        bioShort: c.contributor_bio_short ?? null,
      },
    });
  }

  rows.sort((a, b) => {
    if (a.movementId !== b.movementId) return a.movementId.localeCompare(b.movementId);
    if (a.measureStart !== b.measureStart) return a.measureStart - b.measureStart;
    return (a.approvedAt ?? '').localeCompare(b.approvedAt ?? '');
  });

  return rows;
}

export function groupLandmarksByMovement(
  landmarks: PublishedLandmark[],
): Map<string, PublishedLandmark[]> {
  const m = new Map<string, PublishedLandmark[]>();
  for (const l of landmarks) {
    const arr = m.get(l.movementId);
    if (arr) arr.push(l);
    else m.set(l.movementId, [l]);
  }
  return m;
}
