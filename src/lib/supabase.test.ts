import { describe, test, expect } from 'bun:test';
import { getSupabase, hasSupabase, createSupabaseClient, supabase } from './supabase';

describe('supabase client', () => {
  test('getSupabase returns a client object', () => {
    const client = getSupabase();
    expect(client).toBeTruthy();
    expect(typeof client.from).toBe('function');
  });

  test('getSupabase returns the same instance on repeated calls', () => {
    const a = getSupabase();
    const b = getSupabase();
    expect(a).toBe(b);
  });

  test('client has auth property', () => {
    const client = getSupabase();
    expect(client.auth).toBeTruthy();
  });

  test('hasSupabase is a boolean', () => {
    expect(typeof hasSupabase).toBe('boolean');
  });

  test('createSupabaseClient returns a client for any URL/key', () => {
    const client = createSupabaseClient('https://placeholder.supabase.co', 'placeholder');
    expect(client).toBeTruthy();
    expect(typeof client.from).toBe('function');
    expect(client.auth).toBeTruthy();
  });

  test('proxy export delegates to getSupabase', () => {
    expect(typeof supabase.from).toBe('function');
    expect(supabase.auth).toBeTruthy();
  });
});
