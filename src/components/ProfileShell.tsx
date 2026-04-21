import { useState } from 'react';
import { useAuth } from '../lib/useAuth';
import ArtistProfile from './ArtistProfile';
import AppearanceSettings from './AppearanceSettings';

type Section = 'profile' | 'setting';

export default function ProfileShell({ userId }: { userId: string }) {
  const { user, signOut } = useAuth();
  const isOwnProfile = user?.id === userId;
  const [section, setSection] = useState<Section>('profile');

  if (!isOwnProfile) {
    return <ArtistProfile userId={userId} />;
  }

  return (
    <div className="max-w-[1100px] mx-auto px-4 md:px-8 py-6 md:py-10 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8 md:gap-12">
      <aside className="md:sticky md:top-20 md:self-start">
        <nav className="flex md:flex-col gap-1 border-b md:border-b-0 md:border-r border-border pb-2 md:pb-0 md:pr-4">
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
          <SidebarItem
            label="Logout"
            onClick={signOut}
          />
        </nav>
      </aside>

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
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`text-sm no-underline px-3 py-2 rounded transition-colors ${
        active
          ? 'text-accent bg-accent-light font-medium'
          : 'text-ink hover:text-accent hover:bg-bg-tint'
      }`}
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
