import { useState, useEffect } from 'react';
import { supabase, hasSupabase } from '../../lib/supabase';
import AdminDashboard from './AdminDashboard';
import AdminUserList from './AdminUserList';
import AdminPlaylist from './AdminPlaylist';

type Tab = 'dashboard' | 'users' | 'playlist';

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
  const [denied, setDenied] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  useEffect(() => {
    if (!hasSupabase) { setLoading(false); setDenied(true); return; }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) { setDenied(true); setLoading(false); return; }

      const { data } = await supabase
        .from('users')
        .select('id, role, is_maestro, managed_sections, display_name')
        .eq('id', session.user.id)
        .single();

      if (!data) { setDenied(true); setLoading(false); return; }

      const isStaff = data.role === 'admin' || data.role === 'firstchair' || data.is_maestro;
      if (!isStaff) { setDenied(true); setLoading(false); return; }

      setProfile(data as StaffProfile);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center text-sm text-[#78716C]">Loading...</div>;

  if (denied || !profile) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center">
        <p className="text-sm text-[#78716C] mb-2">Access denied</p>
        <a href="/" className="text-xs text-[#B45309] no-underline hover:underline">← Back to site</a>
      </div>
    );
  }

  const isAdmin = profile.role === 'admin';
  const isMaestro = profile.is_maestro || isAdmin;
  const headerLabel = isAdmin ? 'Admin' : profile.role === 'firstchair' ? 'First Chair' : isMaestro ? 'Maestro' : 'Admin';

  const tabs = [
    { id: 'dashboard' as Tab, label: 'Dashboard', show: isAdmin },
    { id: 'users' as Tab, label: 'Users', show: isAdmin },
    { id: 'playlist' as Tab, label: 'Playlist', show: isMaestro },
  ].filter(t => t.show);

  if (!tabs.find(t => t.id === activeTab) && tabs.length > 0) {
    setActiveTab(tabs[0].id);
  }

  const titles: Record<Tab, string> = {
    dashboard: 'Dashboard',
    users: 'User Management',
    playlist: 'Maestro Playlist',
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <div className="bg-[#1C1917] text-white px-4 md:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <a href="/" className="font-['Instrument_Serif'] italic text-lg text-white no-underline opacity-70 hover:opacity-100">Irregular Pearl</a>
          <span className="text-xs text-white/40">|</span>
          <span className="text-sm font-medium">{headerLabel}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/60">{profile.display_name}</span>
          <a href="/" className="text-xs text-white/40 hover:text-white no-underline">← Back to site</a>
        </div>
      </div>

      <div className="border-b border-[#E7E5E4] bg-white px-4 md:px-6">
        <div className="max-w-6xl mx-auto flex gap-0">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 bg-transparent cursor-pointer transition-colors ${
                activeTab === tab.id
                  ? 'border-[#B45309] text-[#B45309]'
                  : 'border-transparent text-[#78716C] hover:text-[#1C1917]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <h1 className="font-['Instrument_Serif'] italic text-2xl mb-6">{titles[activeTab]}</h1>

        {activeTab === 'dashboard' && isAdmin && <AdminDashboard isAdmin={true} />}
        {activeTab === 'users' && isAdmin && <AdminUserList />}
        {activeTab === 'playlist' && isMaestro && <AdminPlaylist />}
      </div>
    </div>
  );
}
