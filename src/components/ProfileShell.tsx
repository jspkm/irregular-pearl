import { useEffect, useState } from 'react';
import { useAuth } from '../lib/useAuth';
import { supabase, hasSupabase } from '../lib/supabase';
import ArtistProfile from './ArtistProfile';
import AppearanceSettings from './AppearanceSettings';

type Section = 'profile' | 'setting';

export default function ProfileShell({ userId }: { userId: string }) {
  const { user, signOut } = useAuth();
  const isOwnProfile = user?.id === userId;
  const [section, setSection] = useState<Section>('profile');
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [userRole, setUserRole] = useState<string>('user');
  const [isMaestro, setIsMaestro] = useState(false);

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

  if (!isOwnProfile) {
    return <ArtistProfile userId={userId} />;
  }

  const roleLinks: { href: string; label: string }[] = [];
  if (isMaestro) roleLinks.push({ href: '/maestro', label: 'Maestro' });
  if (userRole === 'admin') roleLinks.push({ href: '/admin', label: 'Admin' });
  if (userRole === 'moderator') roleLinks.push({ href: '/moderator/reports', label: 'Moderator' });

  return (
    <div className="max-w-[1100px] mx-auto px-4 md:px-8 py-6 md:py-10">
      <nav className="flex items-center gap-1 border-b border-border pb-2 mb-6 md:mb-8">
        <SidebarItem
          label="Profile"
          active={section === 'profile'}
          onClick={() => setSection('profile')}
        />
        <SidebarItem
          label="Setting"
          active={section === 'setting'}
          onClick={() => setSection('setting')}
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
    <section>
      <h1 className="font-display italic text-2xl md:text-[28px] leading-tight mb-6">Setting</h1>
      <AppearanceSettings />
    </section>
  );
}
