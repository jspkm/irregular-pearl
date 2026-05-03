// Helpers for fetching published interpretive schools on a piece. Mirrors
// src/lib/performersNotes.ts. The published-versions view (granted to anon
// + authenticated) exposes only version rows whose parent school is
// `status = 'published'`; the base table RLS blocks direct anon reads.

import { supabase, hasSupabase } from './supabase';

export interface PublishedInterpretiveSchool {
  schoolId: string;
  versionId: string;
  name: string;
  body: string;
  tempoCues: Record<string, unknown> | null;
  versionNumber: number;
  approvedAt: string | null;
  contributor: {
    id: string;
    displayName: string;
    username: string | null;
    bioShort: string | null;
  };
}

/**
 * Fetch all published interpretive schools for a piece. Ordered by
 * approved_at ASC (CM6: chronological publication order, non-ranking).
 */
export async function getPublishedInterpretiveSchools(
  pieceId: string,
): Promise<PublishedInterpretiveSchool[]> {
  if (!hasSupabase) return [];

  const schoolsRes = await supabase
    .from('interpretive_schools')
    .select('id, contributor_id, current_version_id, name, tempo_cues, approved_by_contributor_at')
    .eq('piece_id', pieceId)
    .eq('status', 'published')
    .order('approved_by_contributor_at', { ascending: true });
  if (schoolsRes.error || !schoolsRes.data || schoolsRes.data.length === 0) return [];

  const versionIds = schoolsRes.data
    .map((s) => s.current_version_id)
    .filter((x): x is string => Boolean(x));
  const contributorIds = [...new Set(schoolsRes.data.map((s) => s.contributor_id))];

  const [versionsRes, contribsRes] = await Promise.all([
    supabase
      .from('v_interpretive_school_versions_published')
      .select('id, body, version_number, approved_at')
      .in('id', versionIds),
    supabase
      .from('users')
      .select('id, display_name, username, contributor_bio_short')
      .in('id', contributorIds),
  ]);
  if (versionsRes.error || !versionsRes.data) return [];
  if (contribsRes.error || !contribsRes.data) return [];

  const versionById = new Map(versionsRes.data.map((v) => [v.id, v]));
  const contribById = new Map(contribsRes.data.map((c) => [c.id, c]));

  const rows: PublishedInterpretiveSchool[] = [];
  for (const s of schoolsRes.data) {
    if (!s.current_version_id) continue;
    const version = versionById.get(s.current_version_id);
    const contributor = contribById.get(s.contributor_id);
    if (!version || !contributor) continue;
    if (version.id === null || version.body === null || version.version_number === null) {
      continue;
    }
    rows.push({
      schoolId: s.id,
      versionId: version.id,
      name: s.name,
      body: version.body,
      tempoCues: (s.tempo_cues as Record<string, unknown> | null) ?? null,
      versionNumber: version.version_number,
      approvedAt: version.approved_at,
      contributor: {
        id: contributor.id,
        displayName: contributor.display_name,
        username: contributor.username ?? null,
        bioShort: contributor.contributor_bio_short ?? null,
      },
    });
  }
  return rows;
}
