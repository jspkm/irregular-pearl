import { hasSupabase, supabase } from './supabase';
import type { LivingComposerEntry } from '../data/livingComposers';
export async function getCommunityComposers(): Promise<LivingComposerEntry[]> {
  if (!hasSupabase) return [];
  const { data, error } = await (supabase as any).from('community_composers').select('name, stage, notable_work, source_url');
  if (error) return [];
  return (data ?? []).map((row: any) => ({ name: row.name, stage: row.stage, notableWork: row.notable_work || undefined, sourceUrl: row.source_url, distinction: 'Community-added composer', affiliations: [] }));
}
