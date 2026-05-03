// Helpers for fetching published signed piece descriptions. Mirrors
// src/lib/performersNotes.ts. Separate from the unsigned pieces.description
// column, which stays as short house-style reference copy per PRD §54.

import { supabase, hasSupabase } from './supabase';

export interface PublishedPieceDescription {
  descriptionId: string;
  versionId: string;
  body: string;
  versionNumber: number;
  approvedAt: string | null;
  contributor: {
    id: string;
    displayName: string;
    username: string | null;
    bioShort: string | null;
  };
}

/** Fetch all published piece descriptions. Ordered by approved_at ASC (CM6). */
export async function getPublishedPieceDescriptions(
  pieceId: string,
): Promise<PublishedPieceDescription[]> {
  if (!hasSupabase) return [];

  const descRes = await supabase
    .from('piece_descriptions')
    .select('id, contributor_id, current_version_id, approved_by_contributor_at')
    .eq('piece_id', pieceId)
    .eq('status', 'published')
    .order('approved_by_contributor_at', { ascending: true });
  if (descRes.error || !descRes.data || descRes.data.length === 0) return [];

  const versionIds = descRes.data
    .map((d) => d.current_version_id)
    .filter((x): x is string => Boolean(x));
  const contributorIds = [...new Set(descRes.data.map((d) => d.contributor_id))];

  const [versionsRes, contribsRes] = await Promise.all([
    supabase
      .from('v_piece_description_versions_published')
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

  const rows: PublishedPieceDescription[] = [];
  for (const d of descRes.data) {
    if (!d.current_version_id) continue;
    const version = versionById.get(d.current_version_id);
    const contributor = contribById.get(d.contributor_id);
    if (!version || !contributor) continue;
    if (version.id === null || version.body === null || version.version_number === null) {
      continue;
    }
    rows.push({
      descriptionId: d.id,
      versionId: version.id,
      body: version.body,
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
