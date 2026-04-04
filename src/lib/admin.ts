import { createServerClient } from '@supabase/ssr';
import type { AstroCookies } from 'astro';

interface StaffProfile {
  id: string;
  role: 'admin' | 'firstchair' | 'user';
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
        // Astro cookies: iterate all cookies from the request
        const cookieHeader = (cookies as any)._request?.headers?.get?.('cookie')
          || (cookies as any)._headers?.get?.('cookie')
          || '';
        if (cookieHeader) {
          for (const part of cookieHeader.split(';')) {
            const [name, ...rest] = part.trim().split('=');
            if (name && rest.length > 0) {
              all.push({ name: name.trim(), value: rest.join('=').trim() });
            }
          }
        }
        // Fallback: try known Supabase cookie names directly
        if (all.length === 0) {
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
