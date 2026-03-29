import { useState, useEffect, useRef } from 'react';
import { supabase, hasSupabase } from '../lib/supabase';
import { useAuth } from '../lib/useAuth';
import GenerativeAvatar from './GenerativeAvatar';

interface ProfileData {
  id: string;
  display_name: string;
  instrument: string | null;
  level: string | null;
  avatar_url: string | null;
  bio: string;
  website: string | null;
  social_links: Record<string, string>;
  genres: string[];
  location: string | null;
  ensembles: string[];
  created_at: string;
}

interface WorkingOnPiece {
  piece_id: string;
  pieces: { title: string; composer_name: string; catalog_number: string | null };
}

interface DiscussionPost {
  id: string;
  text: string;
  created_at: string;
  piece_id: string;
  pieces: { title: string };
}

interface EditionReview {
  id: string;
  rating: number;
  text: string | null;
  created_at: string;
  editions: { publisher: string; piece_id: string; pieces: { title: string } };
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export default function ArtistProfile({ userId }: { userId: string }) {
  const { user } = useAuth();
  const isOwnProfile = user?.id === userId;

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [workingOn, setWorkingOn] = useState<WorkingOnPiece[]>([]);
  const [posts, setPosts] = useState<DiscussionPost[]>([]);
  const [reviews, setReviews] = useState<EditionReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ bio: '', instrument: '', website: '', location: '' });

  useEffect(() => {
    if (!hasSupabase) { setLoading(false); return; }

    const fetchProfile = async () => {
      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileData) {
        setProfile(profileData as ProfileData);
        setEditForm({
          bio: profileData.bio || '',
          instrument: profileData.instrument || '',
          website: profileData.website || '',
          location: profileData.location || '',
        });
      }

      const { data: workingData } = await supabase
        .from('working_on')
        .select('piece_id, pieces(title, composer_name, catalog_number)')
        .eq('user_id', userId);

      if (workingData) setWorkingOn(workingData as unknown as WorkingOnPiece[]);

      const { data: postData } = await supabase
        .from('discussions')
        .select('id, text, created_at, piece_id, pieces(title)')
        .eq('user_id', userId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(20);

      if (postData) setPosts(postData as unknown as DiscussionPost[]);

      const { data: reviewData } = await supabase
        .from('edition_reviews')
        .select('id, rating, text, created_at, editions(publisher, piece_id, pieces(title))')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (reviewData) setReviews(reviewData as unknown as EditionReview[]);

      setLoading(false);
    };

    fetchProfile();
  }, [userId]);

  const handleSave = async () => {
    if (!isOwnProfile || !user) return;
    await supabase.from('users').update({
      bio: editForm.bio,
      instrument: editForm.instrument || null,
      website: editForm.website || null,
      location: editForm.location || null,
    }).eq('id', user.id);

    setProfile(prev => prev ? { ...prev, ...editForm } : null);
    setEditing(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  if (loading) {
    return <div className="text-center py-16 text-[#78716C] text-sm">Loading profile...</div>;
  }

  if (!profile) {
    return <div className="text-center py-16 text-[#78716C] text-sm">Profile not found.</div>;
  }

  const memberSince = formatDate(profile.created_at);
  const initials = profile.display_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="max-w-[720px] mx-auto px-4 md:px-6 py-10">
      {/* Header */}
      <div className="flex items-start gap-5 mb-8">
        <div className="relative flex-shrink-0">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-20 h-20 rounded-full object-cover" />
          ) : (
            <GenerativeAvatar userId={profile.id} size={80} />
          )}
          {isOwnProfile && !editing && (
            <AvatarMenu
              hasPhoto={!!profile.avatar_url}
              googleAvatarUrl={user?.user_metadata?.avatar_url}
              onRemove={async () => {
                await supabase.from('users').update({ avatar_url: null }).eq('id', user!.id);
                setProfile(prev => prev ? { ...prev, avatar_url: null } : null);
              }}
              onRestoreGoogle={async () => {
                const url = user?.user_metadata?.avatar_url;
                if (url) {
                  await supabase.from('users').update({ avatar_url: url }).eq('id', user!.id);
                  setProfile(prev => prev ? { ...prev, avatar_url: url } : null);
                }
              }}
              onUpload={async (url: string) => {
                await supabase.from('users').update({ avatar_url: url }).eq('id', user!.id);
                setProfile(prev => prev ? { ...prev, avatar_url: url } : null);
              }}
              userId={user!.id}
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-['Instrument_Serif'] text-2xl md:text-3xl mb-1">{profile.display_name}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-[#78716C]">
            {profile.instrument && <span>{profile.instrument}</span>}
            {profile.level && (
              <span className="text-[11px] bg-[#F0FDF4] text-[#15803D] px-1.5 py-0.5 rounded capitalize">{profile.level}</span>
            )}
            {profile.location && <span>· {profile.location}</span>}
          </div>
          <div className="text-xs text-[#78716C] mt-1">Member since {memberSince}</div>
        </div>
        {isOwnProfile && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-sm text-[#B45309] hover:text-[#92400E] bg-transparent border-none cursor-pointer p-0"
          >
            Edit
          </button>
        )}
      </div>

      {/* Edit form */}
      {editing && (
        <div className="bg-white border border-[#E7E5E4] rounded-lg p-5 mb-8 space-y-4">
          <div>
            <label className="block text-xs text-[#78716C] mb-1">Bio</label>
            <textarea
              value={editForm.bio}
              onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))}
              className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2 text-sm resize-none h-24 focus:outline-none focus:border-[#B45309]"
              placeholder="Tell other musicians about yourself..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#78716C] mb-1">Instrument</label>
              <input
                value={editForm.instrument}
                onChange={e => setEditForm(f => ({ ...f, instrument: e.target.value }))}
                className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#B45309]"
                placeholder="e.g., Cello, Piano"
              />
            </div>
            <div>
              <label className="block text-xs text-[#78716C] mb-1">Location</label>
              <input
                value={editForm.location}
                onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))}
                className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#B45309]"
                placeholder="e.g., New York, NY"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-[#78716C] mb-1">Website</label>
            <input
              value={editForm.website}
              onChange={e => setEditForm(f => ({ ...f, website: e.target.value }))}
              className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#B45309]"
              placeholder="https://..."
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setEditing(false)} className="text-sm text-[#78716C] bg-transparent border-none cursor-pointer p-0">Cancel</button>
            <button onClick={handleSave} className="text-sm text-white bg-[#B45309] hover:bg-[#92400E] px-4 py-1.5 rounded-lg border-none cursor-pointer">Save</button>
          </div>
        </div>
      )}

      {/* Bio */}
      {profile.bio && !editing && (
        <p className="text-sm text-[#78716C] leading-relaxed mb-8">{profile.bio}</p>
      )}

      {/* Website */}
      {profile.website && !editing && (
        <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-sm text-[#B45309] no-underline hover:underline mb-8 block">
          {profile.website.replace(/^https?:\/\//, '')}
        </a>
      )}

      {/* Currently Working On */}
      <section className="mb-10">
        <h2 className="font-['Instrument_Serif'] text-xl mb-4">Currently Working On</h2>
        {workingOn.length === 0 ? (
          <p className="text-sm text-[#78716C] italic">No pieces marked yet.</p>
        ) : (
          <div className="space-y-2">
            {workingOn.map(w => (
              <a key={w.piece_id} href={`/piece/${w.piece_id}`} className="block bg-white border border-[#E7E5E4] rounded-lg px-4 py-3 hover:border-[#78716C] transition-all no-underline">
                <div className="text-sm font-medium text-[#1C1917]">{w.pieces.title}</div>
                <div className="text-xs text-[#78716C]">{w.pieces.composer_name}{w.pieces.catalog_number ? ` · ${w.pieces.catalog_number}` : ''}</div>
              </a>
            ))}
          </div>
        )}
      </section>

      {/* Edition Reviews */}
      <section className="mb-10">
        <h2 className="font-['Instrument_Serif'] text-xl mb-4">Edition Reviews</h2>
        {reviews.length === 0 ? (
          <p className="text-sm text-[#78716C] italic">No reviews yet.</p>
        ) : (
          <div className="space-y-3">
            {reviews.map(r => (
              <div key={r.id} className="bg-white border border-[#E7E5E4] rounded-lg px-4 py-3">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <span className="text-sm font-medium text-[#1C1917]">{r.editions.publisher}</span>
                    <span className="text-xs text-[#78716C] ml-2">for {r.editions.pieces.title}</span>
                  </div>
                  <span className="text-[#D97706]">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                </div>
                {r.text && <p className="text-xs text-[#78716C] leading-relaxed">{r.text}</p>}
                <div className="text-[11px] text-[#78716C] mt-1">{formatDate(r.created_at)}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Discussion Contributions */}
      <section className="mb-10">
        <h2 className="font-['Instrument_Serif'] text-xl mb-4">Discussions</h2>
        {posts.length === 0 ? (
          <p className="text-sm text-[#78716C] italic">No posts yet.</p>
        ) : (
          <div className="space-y-3">
            {posts.map(p => (
              <a key={p.id} href={`/piece/${p.piece_id}`} className="block bg-white border border-[#E7E5E4] rounded-lg px-4 py-3 hover:border-[#78716C] transition-all no-underline">
                <div className="text-xs text-[#78716C] mb-1">{p.pieces.title} · {formatDate(p.created_at)}</div>
                <p className="text-sm text-[#1C1917] leading-relaxed">{p.text.length > 200 ? p.text.slice(0, 200) + '...' : p.text}</p>
              </a>
            ))}
          </div>
        )}
      </section>

      {/* Sign Out (own profile only) */}
      {isOwnProfile && (
        <div className="border-t border-[#E7E5E4] pt-6">
          <button
            onClick={handleSignOut}
            className="text-sm text-[#78716C] hover:text-[#1C1917] bg-transparent border-none cursor-pointer p-0"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

// --- Avatar Menu ---

function AvatarMenu({ hasPhoto, googleAvatarUrl, onRemove, onRestoreGoogle, onUpload, userId }: {
  hasPhoto: boolean;
  googleAvatarUrl?: string;
  onRemove: () => void;
  onRestoreGoogle: () => void;
  onUpload: (url: string) => void;
  userId: string;
}) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `avatars/${userId}.${ext}`;

    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      // Add cache buster so browser shows new image
      onUpload(`${data.publicUrl}?t=${Date.now()}`);
    }
    setUploading(false);
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-white border border-[#E7E5E4] flex items-center justify-center text-[#78716C] hover:text-[#1C1917] cursor-pointer transition-colors"
        title="Change photo"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-2 bg-white border border-[#E7E5E4] rounded-lg shadow-lg z-50 w-48 py-1">
            {hasPhoto && (
              <button
                onClick={() => { onRemove(); setOpen(false); }}
                className="w-full text-left px-3 py-2 text-sm text-[#78716C] hover:bg-[#FAF8F5] bg-transparent border-none cursor-pointer"
              >
                Remove photo
              </button>
            )}
            {!hasPhoto && googleAvatarUrl && (
              <button
                onClick={() => { onRestoreGoogle(); setOpen(false); }}
                className="w-full text-left px-3 py-2 text-sm text-[#78716C] hover:bg-[#FAF8F5] bg-transparent border-none cursor-pointer"
              >
                Restore Google photo
              </button>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full text-left px-3 py-2 text-sm text-[#78716C] hover:bg-[#FAF8F5] bg-transparent border-none cursor-pointer"
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Upload new photo'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </>
      )}
    </>
  );
}
