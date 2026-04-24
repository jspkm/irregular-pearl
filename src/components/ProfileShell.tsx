import { useEffect, useState } from 'react';
import { useAuth } from '../lib/useAuth';
import { supabase, hasSupabase } from '../lib/supabase';
import { SIGN_IN_TRIGGER_URL } from '../lib/privateRoute';
import ArtistProfile from './ArtistProfile';
import AppearanceSettings from './AppearanceSettings';
import EmailPreferences from './EmailPreferences';
import PasswordSettings from './PasswordSettings';

type Section = 'profile' | 'setting';

function readSectionFromUrl(): Section {
  if (typeof window === 'undefined') return 'profile';
  const param = new URLSearchParams(window.location.search).get('section');
  return param === 'setting' ? 'setting' : 'profile';
}

export default function ProfileShell({ userId }: { userId: string }) {
  const { user, loading: authLoading, signOut } = useAuth();
  const isOwnProfile = user?.id === userId;
  const [section, setSection] = useState<Section>(() => readSectionFromUrl());
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [userRole, setUserRole] = useState<string>('user');
  const [isMaestro, setIsMaestro] = useState(false);

  // When ?section=setting is on the URL but this isn't the viewer's own
  // profile, the link was meant for the account that owns this profile —
  // typically an email footer clicked from a different session. Redirect:
  // anon → sign-in, signed-in-as-different-user → their own setting tab.
  useEffect(() => {
    if (authLoading) return;
    if (section !== 'setting') return;
    if (isOwnProfile) return;
    if (typeof window === 'undefined') return;
    if (!user) {
      window.location.replace(SIGN_IN_TRIGGER_URL);
      return;
    }
    const hash = window.location.hash || '';
    window.location.replace(`/profile/${user.id}?section=setting${hash}`);
  }, [authLoading, section, isOwnProfile, user]);

  // Scroll to the hash after mount so #email lands at the email section.
  useEffect(() => {
    if (section !== 'setting' || !isOwnProfile) return;
    if (typeof window === 'undefined' || !window.location.hash) return;
    const id = window.location.hash.slice(1);
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ block: 'start' });
    });
  }, [section, isOwnProfile]);

  useEffect(() => {
    if (!confirmLogout) return;
    const t = setTimeout(() => setConfirmLogout(false), 10_000);
    return () => clearTimeout(t);
  }, [confirmLogout]);

  useEffect(() => {
    if (!isOwnProfile || !hasSupabase || !user) return;
    supabase
      .from('users')
      .select('role, is_maestro')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        setUserRole((data as any)?.role || 'user');
        setIsMaestro((data as any)?.is_maestro === true);
      });
  }, [isOwnProfile, user]);

  const switchSection = (next: Section) => {
    setSection(next);
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (next === 'profile') {
      url.searchParams.delete('section');
      url.hash = '';
    } else {
      url.searchParams.set('section', next);
    }
    window.history.replaceState(null, '', url.toString());
  };

  if (!isOwnProfile) {
    return <ArtistProfile userId={userId} />;
  }

  // One URL (/admin) for every role. The AdminPage component filters its
  // tab list by role, so admins see Dashboard/Users/Requests/Playlist/Signals,
  // moderators see Requests/Signals, maestro-only users see Playlist. The
  // initial-tab auto-snap in AdminPage lands each role on the first tab
  // they're allowed to see.
  const roleLinks: { href: string; label: string }[] = [];
  if (isMaestro) roleLinks.push({ href: '/admin', label: 'Maestro' });
  if (userRole === 'admin') roleLinks.push({ href: '/admin', label: 'Admin' });
  if (userRole === 'moderator') roleLinks.push({ href: '/admin', label: 'Moderator' });

  return (
    <div className="max-w-[1100px] mx-auto px-4 md:px-8 py-6 md:py-10">
      <nav className="flex items-center gap-1 border-b border-border pb-2 mb-6 md:mb-8">
        <SidebarItem
          label="Profile"
          active={section === 'profile'}
          onClick={() => switchSection('profile')}
        />
        <SidebarItem
          label="Setting"
          active={section === 'setting'}
          onClick={() => switchSection('setting')}
        />

        {roleLinks.map((link) => (
          <SidebarItem key={link.href} label={link.label} href={link.href} />
        ))}

        {confirmLogout ? (
          <span
            role="alertdialog"
            className="ml-auto text-sm px-3 py-2 rounded border border-border flex items-center gap-2"
          >
            <span className="text-ink">Log out?</span>
            <button
              type="button"
              onClick={signOut}
              className="text-accent underline underline-offset-2 hover:text-accent-dark"
            >
              Yes
            </button>
            <span className="text-muted">/</span>
            <button
              type="button"
              onClick={() => setConfirmLogout(false)}
              className="text-muted underline underline-offset-2 hover:text-ink"
            >
              No
            </button>
          </span>
        ) : (
          <SidebarItem
            label="Logout"
            onClick={() => setConfirmLogout(true)}
            className="ml-auto"
          />
        )}
      </nav>

      <div className="min-w-0">
        {section === 'profile' && <ArtistProfile userId={userId} />}
        {section === 'setting' && <SettingsPanel />}
      </div>
    </div>
  );
}

function SidebarItem({
  label,
  active,
  onClick,
  href,
  className,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
  href?: string;
  className?: string;
}) {
  const base = `text-sm no-underline px-3 py-2 rounded transition-colors ${
    active
      ? 'text-accent bg-accent-light font-medium'
      : 'text-ink hover:text-accent hover:bg-bg-tint'
  } ${className ?? ''}`;

  if (href) {
    return (
      <a href={href} className={base}>
        {label}
      </a>
    );
  }

  return (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        onClick?.();
      }}
      className={base}
    >
      {label}
    </a>
  );
}

function SettingsPanel() {
  return (
    <div className="max-w-[600px]">
      <h1 className="font-display italic text-2xl md:text-[28px] leading-tight mb-6">Setting</h1>
      <section id="appearance" className="mb-10">
        <AppearanceSettings />
      </section>
      <section id="email" className="mb-10 pt-8 border-t border-border">
        <EmailPreferences />
      </section>
      <section id="password" className="pt-8 border-t border-border">
        <PasswordSettings />
      </section>
    </div>
  );
}
