import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || '';

export const hasSupabase = Boolean(supabaseUrl && supabaseAnonKey);

// Create a no-op client that won't crash when Supabase isn't configured
let _supabase: SupabaseClient<Database> | null = null;

export function createSupabaseClient(url: string, key: string): SupabaseClient<Database> {
  return createClient<Database>(url, key);
}

export function getSupabase(): SupabaseClient<Database> {
  if (!_supabase) {
    _supabase = createSupabaseClient(
      hasSupabase ? supabaseUrl : 'https://placeholder.supabase.co',
      hasSupabase ? supabaseAnonKey : 'placeholder',
    );
  }
  return _supabase;
}

// Keep a default export for convenience — lazy initialized
export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop) {
    return (getSupabase() as any)[prop];
  },
});
