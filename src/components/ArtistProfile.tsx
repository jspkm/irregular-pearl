import { useState, useEffect } from 'react';
import { supabase, hasSupabase } from '../lib/supabase';
import type { UserLevel } from '../lib/database.types';
import { useAuth } from '../lib/useAuth';
import { normalizeSocialUrl, getSocialIcon, normalizeWebsiteUrl } from '../lib/helpers';
import UsernameEditor from './UsernameEditor';
import GenerativeAvatar from './GenerativeAvatar';

interface ProfileData {
  id: string;
  display_name: string;
  instrument: string | null;
  level: UserLevel | null;
  avatar_url: string | null;
  username: string | null;
  bio: string;
  website: string | null;
  social_links: Record<string, string>;
  location: string | null;
}

const SOCIAL_PLATFORMS = ['instagram', 'youtube', 'tiktok', 'twitter', 'spotify'];

export default function ArtistProfile({ userId }: { userId: string }) {
  const { user } = useAuth();
  const isOwnProfile = user?.id === userId;

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    bio: '',
    instrument: '',
    level: '',
    website: '',
    location: '',
    social_links: {} as Record<string, string>,
  });

  useEffect(() => {
    if (!hasSupabase) { setLoading(false); return; }
    (async () => {
      const { data } = await supabase.from('users').select('*').eq('id', userId).single();
      if (data) {
        setProfile(data as ProfileData);
        setEditForm({
          bio: data.bio || '',
          instrument: data.instrument || '',
          level: data.level || '',
          website: data.website || '',
          location: data.location || '',
          social_links:
            typeof data.social_links === 'object' &&
            data.social_links !== null &&
            !Array.isArray(data.social_links)
              ? (data.social_links as Record<string, string>)
              : {},
        });
      }
      setLoading(false);
    })();
  }, [userId]);

  const handleSave = async () => {
    if (!isOwnProfile || !profile) return;
    const cleanLinks = Object.fromEntries(Object.entries(editForm.social_links).filter(([, v]) => v));
    const nextLevel = (editForm.level || null) as UserLevel | null;
    await supabase.from('users').update({
      bio: editForm.bio,
      instrument: editForm.instrument || null,
      level: nextLevel,
      website: editForm.website || null,
      location: editForm.location || null,
      social_links: cleanLinks,
    }).eq('id', profile.id);
    setProfile(prev => prev ? { ...prev, ...editForm, level: nextLevel } : null);
    setEditing(false);
  };

  if (loading) return <div className="max-w-190 mx-auto p-8 text-sm text-muted">Loading…</div>;
  if (!profile) return <div className="max-w-190 mx-auto p-8 text-sm text-muted">Profile not found.</div>;

  const rawName = profile.display_name || '';
  const displayName = rawName.includes('@') ? rawName.split('@')[0] : rawName;

  return (
    <main className="max-w-190 mx-auto px-4 md:px-8 py-8 md:py-12">
      <div className="flex items-start gap-5 mb-6">
        <div className="shrink-0">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={displayName} className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover" />
          ) : (
            <GenerativeAvatar userId={profile.id} size={96} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-display italic text-2xl md:text-[28px] leading-tight mb-1">{displayName}</h1>
          {isOwnProfile && <UsernameEditor currentUsername={profile.username} userId={profile.id} />}
          <div className="mt-2 flex flex-wrap gap-2 items-center">
            {profile.instrument && profile.instrument.split(',').map(i => i.trim()).filter(Boolean).map(inst => (
              <span key={inst} className="text-[11px] px-2.5 py-1 bg-accent-soft text-accent rounded-full font-medium">{inst}</span>
            ))}
            {profile.level && (
              <span className="text-[11px] px-2.5 py-1 bg-green-50 text-green-700 rounded-full capitalize font-medium">{profile.level}</span>
            )}
            {profile.location && <span className="text-xs text-muted">{profile.location}</span>}
          </div>
        </div>
        {isOwnProfile && !editing && (
          <button onClick={() => setEditing(true)} className="text-xs text-accent underline">Edit</button>
        )}
      </div>

      {!editing && profile.bio && (
        <p className="text-sm md:text-base text-muted leading-relaxed mb-4 whitespace-pre-line">{profile.bio}</p>
      )}

      {!editing && (profile.website || (profile.social_links && Object.values(profile.social_links).some(Boolean))) && (
        <div className="flex flex-wrap items-center gap-3 mb-8">
          {profile.social_links && Object.entries(profile.social_links).filter(([, v]) => v).map(([platform, value]) => (
            <a key={platform} href={normalizeSocialUrl(platform, value)} target="_blank" rel="noopener noreferrer" title={platform}
              className="w-8 h-8 rounded-full bg-bg border border-border flex items-center justify-center text-muted hover:text-accent hover:border-accent no-underline">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" dangerouslySetInnerHTML={{ __html: getSocialIcon(platform) }} />
            </a>
          ))}
          {profile.website && (
            <a href={normalizeWebsiteUrl(profile.website)} className="text-xs text-accent hover:underline" target="_blank" rel="noopener">
              {profile.website.replace(/^https?:\/\//, '')}
            </a>
          )}
        </div>
      )}

      {editing && (
        <div className="space-y-4 mb-8">
          <label className="block">
            <span className="text-xs text-muted uppercase tracking-wider">Bio</span>
            <textarea value={editForm.bio} onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
              rows={4}
              className="mt-1 w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-accent" />
          </label>
          <label className="block">
            <span className="text-xs text-muted uppercase tracking-wider">Instrument(s)</span>
            <input value={editForm.instrument} onChange={e => setEditForm({ ...editForm, instrument: e.target.value })}
              className="mt-1 w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-accent" />
          </label>
          <label className="block">
            <span className="text-xs text-muted uppercase tracking-wider">Level</span>
            <select value={editForm.level} onChange={e => setEditForm({ ...editForm, level: e.target.value })}
              className="mt-1 w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-accent">
              <option value="">—</option>
              <option value="student">student</option>
              <option value="amateur">amateur</option>
              <option value="professional">professional</option>
              <option value="teacher">teacher</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-muted uppercase tracking-wider">Location</span>
            <input value={editForm.location} onChange={e => setEditForm({ ...editForm, location: e.target.value })}
              className="mt-1 w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-accent" />
          </label>
          <label className="block">
            <span className="text-xs text-muted uppercase tracking-wider">Website</span>
            <input value={editForm.website} onChange={e => setEditForm({ ...editForm, website: e.target.value })}
              className="mt-1 w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-accent" />
          </label>
          {SOCIAL_PLATFORMS.map(platform => (
            <label key={platform} className="block">
              <span className="text-xs text-muted tracking-wider capitalize">{platform}</span>
              <input
                value={editForm.social_links[platform] || ''}
                onChange={e => setEditForm({ ...editForm, social_links: { ...editForm.social_links, [platform]: e.target.value } })}
                placeholder={platform === 'twitter' ? '@handle' : 'username or URL'}
                className="mt-1 w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-accent" />
            </label>
          ))}
          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} className="bg-ink text-bg text-sm font-medium px-4 py-2 rounded">Save</button>
            <button onClick={() => setEditing(false)} className="text-sm text-muted underline">Cancel</button>
          </div>
        </div>
      )}
    </main>
  );
}
