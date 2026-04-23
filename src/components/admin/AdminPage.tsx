import { useState, useEffect } from 'react';
import { supabase, hasSupabase } from '../../lib/supabase';
import { redirectFromPrivateRoute } from '../../lib/privateRoute';
import AdminDashboard from './AdminDashboard';
import AdminUserList from './AdminUserList';
import AdminPlaylist from './AdminPlaylist';
import ContributorContentAdmin from './ContributorContentAdmin';
import AdminSignals from './AdminSignals';

type Tab = 'dashboard' | 'users' | 'playlist' | 'performers-notes' | 'interpretive-schools' | 'piece-descriptions' | 'signals';

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
    // /admin + /maestro are private routes. Two unauthorized cases —
    // both redirect via the shared helper, no leak about what the page
    // contains.
    if (!hasSupabase) { redirectFromPrivateRoute(false); return; }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) {
        // Anon → home with sign-in modal trigger.
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
        // Signed in but lacking permission → home, no modal.
        redirectFromPrivateRoute(true);
        return;
      }

      setProfile(data as StaffProfile);
      setLoading(false);
    });
  }, []);

  // Render nothing while resolving auth and during the redirect away —
  // private route, no leak about what's behind the gate.
  if (loading || !profile) return null;

  const isAdmin = profile.role === 'admin';
  const isMaestro = profile.is_maestro || isAdmin;
  const headerLabel = isAdmin ? 'Admin' : profile.role === 'moderator' ? 'Moderator' : isMaestro ? 'Maestro' : 'Admin';

  const isStaff = isAdmin || profile.role === 'moderator';

  const tabs = [
    { id: 'dashboard' as Tab, label: 'Dashboard', show: isAdmin },
    { id: 'users' as Tab, label: 'Users', show: isAdmin },
    { id: 'performers-notes' as Tab, label: "Performer's notes", show: isAdmin },
    { id: 'interpretive-schools' as Tab, label: 'Schools', show: isAdmin },
    { id: 'piece-descriptions' as Tab, label: 'Descriptions', show: isAdmin },
    { id: 'playlist' as Tab, label: 'Playlist', show: isMaestro },
    { id: 'signals' as Tab, label: 'Signals', show: isStaff },
  ].filter(t => t.show);

  if (!tabs.find(t => t.id === activeTab) && tabs.length > 0) {
    setActiveTab(tabs[0].id);
  }

  const titles: Record<Tab, string> = {
    dashboard: 'Dashboard',
    users: 'User Management',
    'performers-notes': "Performer's notes",
    'interpretive-schools': 'Interpretive schools',
    'piece-descriptions': 'Piece descriptions',
    playlist: 'Maestro Playlist',
    signals: 'Editorial signals',
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      <div className="bg-[#1A1A1A] text-white px-4 md:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <a href="/" className="text-lg font-medium tracking-tight text-white no-underline opacity-70 hover:opacity-100">IrregularPearl</a>
          <span className="text-xs text-white/40">|</span>
          <span className="text-sm font-medium">{headerLabel}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/60">{profile.display_name}</span>
          <a href="/" className="text-xs text-white/40 hover:text-white no-underline">← Back to site</a>
        </div>
      </div>

      <div className="border-b border-[#E5E3DE] bg-white px-4 md:px-6">
        <div className="max-w-6xl mx-auto flex gap-0">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 bg-transparent cursor-pointer transition-colors ${
                activeTab === tab.id
                  ? 'border-[#6B4E7C] text-[#6B4E7C]'
                  : 'border-transparent text-[#6F6F6F] hover:text-[#1A1A1A]'
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
        {activeTab === 'performers-notes' && isAdmin && <ContributorContentAdmin subjectTable="performers_notes" />}
        {activeTab === 'interpretive-schools' && isAdmin && <ContributorContentAdmin subjectTable="interpretive_schools" />}
        {activeTab === 'piece-descriptions' && isAdmin && <ContributorContentAdmin subjectTable="piece_descriptions" />}
        {activeTab === 'playlist' && isMaestro && <AdminPlaylist />}
        {activeTab === 'signals' && isStaff && <AdminSignals />}
      </div>
    </div>
  );
}
