import { describe, test, expect } from 'bun:test';
import { createClient } from '@supabase/supabase-js';

const URL = process.env.PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321';
const ANON = process.env.PUBLIC_SUPABASE_ANON_KEY!;

// Hits search_pieces_typeahead RPC against local Supabase. Local seed has
// bach-cello-suite-1 and bach-cello-suite-2 with seeded signed performer's
// notes (has_signed_content=true). The other 16 pieces are stubs.

describe('search_pieces_typeahead grouping by has_signed_content', () => {
  const sb = createClient(URL, ANON);

  test('Bach Cello Suite 1 (seeded with signed note) returns in_catalog', async () => {
    const { data, error } = await sb.rpc('search_pieces_typeahead', { p_query: 'Cello Suite No. 1' });
    expect(error).toBeNull();
    const row = (data ?? []).find((r: any) => r.id === 'bach-cello-suite-1');
    expect(row).toBeDefined();
    expect(row.result_type).toBe('in_catalog');
    expect(row.is_materialized).toBe(true);
  });

  test('Bach Cello Suite 3 (stub) returns not_yet_curated with is_materialized=true', async () => {
    const { data, error } = await sb.rpc('search_pieces_typeahead', { p_query: 'Cello Suite No. 3' });
    expect(error).toBeNull();
    const row = (data ?? []).find((r: any) => r.id === 'bach-cello-suite-3');
    expect(row).toBeDefined();
    expect(row.result_type).toBe('not_yet_curated');
    expect(row.is_materialized).toBe(true);
  });

  test('returns no rows for a too-short query', async () => {
    const { data } = await sb.rpc('search_pieces_typeahead', { p_query: 'B' });
    expect((data ?? []).length).toBe(0);
  });

  test('Fauré Papillon (stub) returns not_yet_curated', async () => {
    const { data, error } = await sb.rpc('search_pieces_typeahead', { p_query: 'Papillon' });
    expect(error).toBeNull();
    const row = (data ?? []).find((r: any) => r.id === 'faure-papillon');
    expect(row).toBeDefined();
    expect(row.result_type).toBe('not_yet_curated');
    expect(row.is_materialized).toBe(true);
  });
});
