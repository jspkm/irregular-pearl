import { useState, useEffect } from 'react';
import { supabase, hasSupabase } from '../../lib/supabase';
import { redirectFromPrivateRoute } from '../../lib/privateRoute';
import AdminDashboard from './AdminDashboard';
import AdminUserList from './AdminUserList';
import AdminPlaylist from './AdminPlaylist';
import AdminSignals from './AdminSignals';
import RequestsAdmin from './RequestsAdmin';

type Tab = 'dashboard' | 'users' | 'playlist' | 'requests' | 'signals';

interface StaffProfile {
  id: string;
  role: string;
  is_maestro: boolean;
  managed_sections: string[];
  display_name: string;
}

interface Props {
  initialTab: Tab;
}

export default function AdminPage({ initialTab }: Props) {
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  useEffect(() => {
    if (!hasSupabase) { redirectFromPrivateRoute(false); return; }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) {
        redirectFromPrivateRoute(false);
        return;
      }

      const { data } = await supabase
        .from('users')
        .select('id, role, is_maestro, managed_sections, display_name')
        .eq('id', session.user.id)
        .single();

      const isStaff = data && (data.role === 'admin' || data.role === 'moderator' || data.is_maestro);
      if (!data || !isStaff) {
        redirectFromPrivateRoute(true);
        return;
      }

      setProfile(data as StaffProfile);
      setLoading(false);
    });
  }, []);

  if (loading || !profile) return null;

  const isAdmin = profile.role === 'admin';
  const isMaestro = profile.is_maestro || isAdmin;
  const headerLabel = isAdmin ? 'Admin' : profile.role === 'moderator' ? 'Moderator' : isMaestro ? 'Maestro' : 'Admin';

  const isStaff = isAdmin || profile.role === 'moderator';

  const tabs = [
    { id: 'dashboard' as Tab, label: 'Dashboard', show: isAdmin },
    { id: 'users' as Tab, label: 'Users', show: isAdmin },
    { id: 'requests' as Tab, label: 'Requests', show: isStaff },
    { id: 'playlist' as Tab, label: 'Playlist', show: isMaestro },
    { id: 'signals' as Tab, label: 'Signals', show: isStaff },
  ].filter(t => t.show);

  if (!tabs.find(t => t.id === activeTab) && tabs.length > 0) {
    setActiveTab(tabs[0].id);
  }

  const titles: Record<Tab, string> = {
    dashboard: 'Dashboard',
    users: 'User Management',
    requests: 'Contribution requests',
    playlist: 'Maestro Playlist',
    signals: 'Editorial signals',
  };

  return (
    <div className="min-h-screen bg-bg">
      <div
        className="px-4 md:px-6 py-3 flex items-center justify-between"
        style={{ background: '#1A1A1A', color: '#FFFFFF' }}
      >
        <div className="flex items-center gap-4">
          <a href="/" className="text-lg font-medium tracking-tight no-underline opacity-70 hover:opacity-100" style={{ color: '#FFFFFF' }}>IrregularPearl</a>
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>|</span>
          <span className="text-sm font-medium">{headerLabel}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>{profile.display_name}</span>
          <a href="/" className="text-xs no-underline hover:opacity-100" style={{ color: 'rgba(255,255,255,0.4)' }}>← Back to site</a>
        </div>
      </div>

      <div className="border-b border-border bg-bg px-4 md:px-6">
        <div className="max-w-6xl mx-auto flex gap-0">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 bg-transparent cursor-pointer transition-colors ${
                activeTab === tab.id
                  ? 'border-accent text-accent'
                  : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <h1 className="font-display italic text-2xl mb-6">{titles[activeTab]}</h1>

        {activeTab === 'dashboard' && isAdmin && <AdminDashboard isAdmin={true} />}
        {activeTab === 'users' && isAdmin && <AdminUserList />}
        {activeTab === 'requests' && isStaff && <RequestsAdmin />}
        {activeTab === 'playlist' && isMaestro && <AdminPlaylist />}
        {activeTab === 'signals' && isStaff && <AdminSignals />}
      </div>
    </div>
  );
}
