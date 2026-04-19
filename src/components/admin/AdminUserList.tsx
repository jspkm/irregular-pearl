import { useState, useEffect } from 'react';
import { supabase, hasSupabase } from '../../lib/supabase';

const SECTIONS = [
  'baroque', 'classical', 'romantic', 'late-romantic', 'impressionist', '20th-century', 'post-romantic',
  'piano', 'violin', 'cello', 'voice', 'winds', 'organ', 'harp', 'percussion', 'guitar',
];

interface User {
  id: string;
  display_name: string;
  instrument: string | null;
  level: string | null;
  role: string;
  is_maestro: boolean;
  managed_sections: string[];
  is_banned: boolean;
  username: string | null;
  created_at: string;
}

export default function AdminUserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [editingSections, setEditingSections] = useState<string | null>(null);
  const [tempSections, setTempSections] = useState<string[]>([]);

  const fetchUsers = async () => {
    if (!hasSupabase) return;
    let query = supabase.from('users')
      .select('id, display_name, instrument, level, role, is_maestro, managed_sections, is_banned, username, created_at')
      .order('created_at', { ascending: false })
      .limit(100);

    if (search) query = query.ilike('display_name', `%${search}%`);
    if (roleFilter !== 'all') query = query.eq('role', roleFilter);

    const { data } = await query;
    if (data) setUsers(data as User[]);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, [search, roleFilter]);

  const updateUser = async (userId: string, updates: Partial<User>) => {
    const { error } = await supabase.from('users').update(updates).eq('id', userId);
    if (!error) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } as User : u));
    }
  };

  const toggleMaestro = async (userId: string, currentlyMaestro: boolean) => {
    if (!currentlyMaestro) {
      const current = users.find(u => u.is_maestro);
      if (current && !confirm(`${current.display_name} is the current Maestro. They will lose the title. Continue?`)) return;
    }
    await updateUser(userId, { is_maestro: !currentlyMaestro });
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (newRole === 'firstchair') {
      setEditingSections(userId);
      setTempSections([]);
      return;
    }
    await updateUser(userId, { role: newRole, managed_sections: [] });
  };

  const saveSections = async (userId: string) => {
    await updateUser(userId, { role: 'firstchair', managed_sections: tempSections });
    setEditingSections(null);
  };

  if (loading) return <div className="text-sm text-muted">Loading...</div>;

  return (
    <div>
      <div className="flex gap-3 mb-6">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name..."
          className="flex-1 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#B45309]"
        />
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="all">All roles</option>
          <option value="admin">Admin</option>
          <option value="firstchair">First Chair</option>
          <option value="user">User</option>
        </select>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2 hidden md:table-cell">Instrument</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2">Maestro</th>
              <th className="px-4 py-2 hidden md:table-cell">Sections</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-border/50 last:border-b-0">
                <td className="px-4 py-2">
                  <a href={u.username ? `/@${u.username}` : `/profile/${u.id}`} className="font-medium text-ink no-underline hover:underline">
                    {u.display_name}
                  </a>
                </td>
                <td className="px-4 py-2 text-muted hidden md:table-cell">{u.instrument || '—'}</td>
                <td className="px-4 py-2">
                  <select
                    value={u.role}
                    onChange={e => handleRoleChange(u.id, e.target.value)}
                    className="text-xs border border-border rounded px-2 py-1 bg-white"
                  >
                    <option value="user">User</option>
                    <option value="firstchair">First Chair</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => toggleMaestro(u.id, u.is_maestro)}
                    className={`text-[10px] px-2 py-0.5 rounded-full border-none cursor-pointer ${u.is_maestro ? 'bg-[#FEF3C7] text-[#B45309] font-medium' : 'bg-gray-100 text-gray-400'}`}
                  >
                    {u.is_maestro ? '♪ Maestro' : '—'}
                  </button>
                </td>
                <td className="px-4 py-2 hidden md:table-cell">
                  {u.role === 'firstchair' && u.managed_sections?.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {u.managed_sections.map(s => (
                        <span key={s} className="text-[10px] bg-[#FEF3C7] text-[#B45309] px-1.5 py-0.5 rounded-full">{s}</span>
                      ))}
                    </div>
                  ) : '—'}
                </td>
                <td className="px-4 py-2">
                  {u.is_banned ? (
                    <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full">Banned</span>
                  ) : (
                    <span className="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded-full">Active</span>
                  )}
                </td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => {
                      if (confirm(`${u.is_banned ? 'Unban' : 'Ban'} ${u.display_name}?`))
                        updateUser(u.id, { is_banned: !u.is_banned });
                    }}
                    className="text-xs text-muted hover:text-ink bg-transparent border-none cursor-pointer p-0"
                  >
                    {u.is_banned ? 'Unban' : 'Ban'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Section picker modal */}
      {editingSections && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-xl p-6 w-96 max-h-[80vh] overflow-y-auto">
            <h3 className="font-display text-lg mb-4">Assign Sections</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {SECTIONS.map(s => {
                const selected = tempSections.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setTempSections(prev => selected ? prev.filter(x => x !== s) : [...prev, s])}
                    className={`text-xs px-3 py-1.5 rounded-full border cursor-pointer transition-colors capitalize ${
                      selected
                        ? 'bg-[#FEF3C7] text-[#B45309] border-[#B45309] font-medium'
                        : 'bg-white text-muted border-border hover:border-[#B45309] hover:text-[#B45309]'
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setEditingSections(null)} className="text-sm text-muted bg-transparent border-none cursor-pointer">Cancel</button>
              <button onClick={() => saveSections(editingSections)} className="text-sm text-white bg-[#1C1917] px-4 py-1.5 rounded-lg border-none cursor-pointer">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
