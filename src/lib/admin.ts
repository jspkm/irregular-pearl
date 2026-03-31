import { createServerClient } from '@supabase/ssr';
import type { AstroCookies } from 'astro';

interface StaffProfile {
  id: string;
  role: 'admin' | 'manager' | 'user';
  is_maestro: boolean;
  managed_sections: string[];
  display_name: string;
}

export async function getStaffUser(cookies: AstroCookies) {
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => {
        const all: { name: string; value: string }[] = [];
        for (const [name, value] of Object.entries(cookies)) {
          if (typeof value === 'object' && value?.value) {
            all.push({ name, value: value.value });
          }
        }
        // Try common Supabase cookie patterns
        const sbCookies = ['sb-access-token', 'sb-refresh-token'];
        for (const name of sbCookies) {
          const val = cookies.get(name)?.value;
          if (val) all.push({ name, value: val });
        }
        // Also check for project-specific cookies (sb-<ref>-auth-token)
        return all;
      },
      setAll: () => {},
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('users')
    .select('id, role, is_maestro, managed_sections, display_name')
    .eq('id', user.id)
    .single();

  if (!profile || (!['admin', 'manager'].includes(profile.role) && !profile.is_maestro)) return null;

  return {
    user,
    profile: profile as StaffProfile,
    supabase,
  };
}

export function isAdminRole(profile: StaffProfile): boolean {
  return profile.role === 'admin';
}

export function isMaestroRole(profile: StaffProfile): boolean {
  return profile.is_maestro || profile.role === 'admin';
}

export function canManageSection(profile: StaffProfile, section: string): boolean {
  if (profile.role === 'admin') return true;
  if (profile.role === 'manager') {
    return (profile.managed_sections || []).includes(section);
  }
  return false;
}
