import { createServerClient } from '@supabase/ssr';
import type { AstroCookies } from 'astro';

interface StaffProfile {
  id: string;
  role: 'admin' | 'firstchair' | 'user';
  is_maestro: boolean;
  managed_sections: string[];
  display_name: string;
}

export async function getStaffUser(cookies: AstroCookies, request?: Request) {
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => {
        const all: { name: string; value: string }[] = [];
        // Parse raw cookie header from the request (most reliable)
        const cookieHeader = request?.headers?.get('cookie') || '';
        if (cookieHeader) {
          for (const part of cookieHeader.split(';')) {
            const eq = part.indexOf('=');
            if (eq > 0) {
              all.push({
                name: part.slice(0, eq).trim(),
                value: part.slice(eq + 1).trim(),
              });
            }
          }
          return all;
        }
        // Fallback: try AstroCookies.get() with known names
        const sbNames = [
          'sb-access-token', 'sb-refresh-token',
          'sb-dwtwmpcaylxgprdwaggl-auth-token',
          'sb-dwtwmpcaylxgprdwaggl-auth-token.0',
          'sb-dwtwmpcaylxgprdwaggl-auth-token.1',
        ];
        for (const name of sbNames) {
          const val = cookies.get(name)?.value;
          if (val) all.push({ name, value: val });
        }
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

  if (!profile || (!['admin', 'firstchair'].includes(profile.role) && !profile.is_maestro)) return null;

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
  if (profile.role === 'firstchair') {
    return (profile.managed_sections || []).includes(section);
  }
  return false;
}

// 'events' section note: first chairs with 'events' in managed_sections
// can moderate ALL events (not scoped by instrument/genre). The RLS UPDATE
// policy grants access to all firstchair roles as a broad gate; this
// canManageSection check provides the narrower application-level enforcement.
