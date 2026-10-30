import { upkeepResources, curatedResourceId } from '../data/instrumentalUpkeep';
import { hasSupabase, supabase } from './supabase';

export interface ResourceEntry {
  id: string; category: string; level: string; topic: string; title: string;
  publisher: string; scope: string; summary: string; url: string;
  reviewed_at: string | null; user_id: string | null; author: string | null;
}
export interface ResourceInput { topic: string; title: string; publisher: string; scope: string; summary: string; url: string }
export type HelpfulnessVote = -1 | 1;

export function validateResource(input: ResourceInput): ResourceInput {
  const value = Object.fromEntries((['topic', 'title', 'publisher', 'scope', 'summary', 'url'] as const).map(key => [key, typeof input[key] === 'string' ? input[key].trim() : ''])) as unknown as ResourceInput;
  for (const [key, limit] of Object.entries({ topic: 120, title: 240, publisher: 160, scope: 160, summary: 1200, url: 2000 })) {
    if (!value[key as keyof ResourceInput] || value[key as keyof ResourceInput].length > limit) throw new Error('Complete all fields within their character limits.');
  }
  let url: URL;
  try { url = new URL(value.url); } catch { throw new Error('Enter a valid http or https resource URL.'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('Enter a valid http or https resource URL without credentials.');
  value.url = url.href;
  return value;
}

export function curatedResources(category: keyof typeof upkeepResources, level: 'beginner' | 'advanced'): ResourceEntry[] {
  return upkeepResources[category][level].map(row => ({ ...row,
    id: curatedResourceId(category, level, row.topic), category, level,
    reviewed_at: row.reviewedAt, user_id: null, author: null,
  }));
}

// These tables and RPC are introduced by 20261021000000_upkeep_resources.sql.
// Keep their query types local until the generated project database types are refreshed.
const db = supabase as any;
export async function loadResources(category: string, level: string): Promise<ResourceEntry[]> {
  const { data, error } = await db.rpc('list_upkeep_resources', { p_category: category, p_level: level });
  if (error) throw error;
  return data ?? [];
}
export async function ownVotes(userId: string, ids: string[]): Promise<Record<string, HelpfulnessVote>> {
  if (!ids.length) return {};
  const { data, error } = await db.from('upkeep_resource_votes').select('resource_id, value').eq('user_id', userId).in('resource_id', ids);
  if (error) throw error;
  return Object.fromEntries((data ?? []).map((row: { resource_id: string; value: HelpfulnessVote }) => [row.resource_id, row.value]));
}
export async function currentUserId(): Promise<string> {
  if (!hasSupabase) throw new Error('A connected database is required.');
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('Please sign in to continue.');
  return data.user.id;
}
export async function saveResource(category: string, level: string, input: ResourceInput, id?: string): Promise<void> {
  const userId = await currentUserId();
  const value = validateResource(input);
  const query = id
    ? db.from('upkeep_resources').update(value).eq('id', id).eq('user_id', userId).select('id').single()
    : db.from('upkeep_resources').insert({ ...value, category, level, user_id: userId }).select('id').single();
  const { error } = await query;
  if (error) throw error;
}
export async function deleteResource(id: string): Promise<void> {
  const userId = await currentUserId();
  const { error } = await db.from('upkeep_resources').delete().eq('id', id).eq('user_id', userId).select('id').single();
  if (error) throw error;
}
export async function voteResource(id: string, value: HelpfulnessVote | 0): Promise<void> {
  const userId = await currentUserId();
  const { error } = value === 0
    ? await db.from('upkeep_resource_votes').delete().eq('resource_id', id).eq('user_id', userId)
    : await db.from('upkeep_resource_votes').upsert({ resource_id: id, user_id: userId, value }, { onConflict: 'resource_id,user_id' });
  if (error) throw error;
}
