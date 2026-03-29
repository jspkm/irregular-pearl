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

interface Performance {
  id: string;
  event_name: string;
  venue: string | null;
  date: string | null;
  piece_id: string | null;
  is_upcoming: boolean;
}

interface DiscographyItem {
  id: string;
  title: string;
  year: number | null;
  role: string | null;
  url: string | null;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export default function ArtistProfile({ userId }: { userId: string }) {
  const { user } = useAuth();
  const isOwnProfile = user?.id === userId;

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [workingOn, setWorkingOn] = useState<WorkingOnPiece[]>([]);
  const [posts, setPosts] = useState<DiscussionPost[]>([]);
  const [reviews, setReviews] = useState<EditionReview[]>([]);
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [discography, setDiscography] = useState<DiscographyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ bio: '', instrument: '', website: '', location: '', social_links: {} as Record<string, string> });

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
          social_links: profileData.social_links || {},
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

      const { data: perfData } = await supabase
        .from('performances')
        .select('id, event_name, venue, date, piece_id, is_upcoming')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(20);

      if (perfData) setPerformances(perfData as Performance[]);

      const { data: discData } = await supabase
        .from('discography')
        .select('id, title, year, role, url')
        .eq('user_id', userId)
        .order('year', { ascending: false })
        .limit(20);

      if (discData) setDiscography(discData as DiscographyItem[]);

      setLoading(false);
    };

    fetchProfile();
  }, [userId]);

  const handleSave = async () => {
    if (!isOwnProfile || !user) return;
    const cleanLinks = Object.fromEntries(Object.entries(editForm.social_links).filter(([, v]) => v));
    await supabase.from('users').update({
      bio: editForm.bio,
      instrument: editForm.instrument || null,
      website: editForm.website || null,
      location: editForm.location || null,
      social_links: cleanLinks,
    }).eq('id', user.id);

    setProfile(prev => prev ? { ...prev, ...editForm } : null);
    setEditing(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="max-w-[720px] mx-auto px-4 md:px-6 py-10">
        <div className="flex items-start gap-5 mb-8 animate-pulse">
          <div className="w-20 h-20 rounded-full bg-gray-200 flex-shrink-0" />
          <div className="flex-1">
            <div className="h-7 bg-gray-200 rounded w-48 mb-2" />
            <div className="h-4 bg-gray-100 rounded w-32 mb-1" />
            <div className="h-3 bg-gray-100 rounded w-24" />
          </div>
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="mb-8">
            <div className="h-5 bg-gray-200 rounded w-36 mb-3" />
            <div className="h-16 bg-gray-100 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (!profile) {
    return <div className="text-center py-16 text-muted text-sm">Profile not found.</div>;
  }

  return (
    <div className="max-w-[720px] mx-auto px-4 md:px-6 py-10">
      {/* Header */}
      <div className="flex items-start gap-5 mb-6">
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
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
            {profile.instrument && <span>{profile.instrument}</span>}
            {profile.level && (
              <span className="text-[11px] bg-success-bg text-success px-1.5 py-0.5 rounded capitalize">{profile.level}</span>
            )}
            {profile.location && <span>· {profile.location}</span>}
          </div>
          <div className="text-xs text-muted mt-1">Joined {formatDate(profile.created_at)}</div>
        </div>
        {isOwnProfile && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-sm text-accent hover:text-accent-hover bg-transparent border-none cursor-pointer p-0"
          >
            Edit
          </button>
        )}
      </div>

      {/* Bio & links */}
      {!editing && (
        <div className="mb-8">
          {profile.bio && <p className="text-sm text-muted leading-relaxed mb-3">{profile.bio}</p>}
          {profile.website && (
            <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-sm text-accent no-underline hover:underline mb-3 block">
              {profile.website.replace(/^https?:\/\//, '')}
            </a>
          )}
          {profile.social_links && Object.keys(profile.social_links).some(k => profile.social_links[k]) && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(profile.social_links).filter(([, v]) => v).map(([platform, url]) => (
                <a key={platform} href={url.startsWith('http') ? url : `https://${url}`} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-muted hover:text-accent no-underline border border-border px-3 py-1.5 rounded-full transition-colors">
                  {platform}
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit form */}
      {editing && (
        <div className="bg-surface border border-border rounded-lg p-5 mb-8 space-y-4">
          <div>
            <label className="block text-xs text-muted mb-1">Bio</label>
            <textarea value={editForm.bio} onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm resize-none h-24 focus:outline-none focus:border-accent"
              placeholder="Tell other musicians about yourself..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted mb-1">Instrument</label>
              <input value={editForm.instrument} onChange={e => setEditForm(f => ({ ...f, instrument: e.target.value }))}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" placeholder="e.g., Cello, Piano" />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Location</label>
              <input value={editForm.location} onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" placeholder="e.g., New York, NY" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Website</label>
            <input value={editForm.website} onChange={e => setEditForm(f => ({ ...f, website: e.target.value }))}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" placeholder="https://..." />
          </div>
          <div>
            <label className="block text-xs text-muted mb-2">Social Links</label>
            <div className="grid grid-cols-2 gap-3">
              {['Instagram', 'YouTube', 'X / Twitter', 'Facebook'].map(platform => (
                <input key={platform} value={editForm.social_links[platform] || ''}
                  onChange={e => setEditForm(f => ({ ...f, social_links: { ...f.social_links, [platform]: e.target.value } }))}
                  className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" placeholder={platform} />
              ))}
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setEditing(false)} className="text-sm text-muted bg-transparent border-none cursor-pointer p-0">Cancel</button>
            <button onClick={handleSave} className="text-sm text-white bg-accent hover:bg-accent-hover px-4 py-1.5 rounded-lg border-none cursor-pointer">Save</button>
          </div>
        </div>
      )}

      {/* Divider before sections */}
      <div className="border-t border-border mb-10" />

      {/* === REORDERED: Performances first (identity), then Working On, Discography, Reviews, Discussions === */}

      {/* Performances */}
      <section className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-['Instrument_Serif'] text-xl">Performances</h2>
          {isOwnProfile && (
            <button onClick={() => addPerformance()} className="text-xs text-accent hover:text-accent-hover bg-transparent border-none cursor-pointer p-0">+ Add</button>
          )}
        </div>
        {performances.length === 0 ? (
          <EmptyState
            message={isOwnProfile ? "Share your performances with the community." : "No performances listed yet."}
            action={isOwnProfile ? "Add your first performance" : undefined}
            onAction={isOwnProfile ? () => addPerformance() : undefined}
          />
        ) : (
          <div className="space-y-2">
            {performances.map(p => (
              <EditableCard key={p.id} isOwner={isOwnProfile}
                onDelete={async () => { await supabase.from('performances').delete().eq('id', p.id); setPerformances(prev => prev.filter(x => x.id !== p.id)); }}
                onSave={async (vals) => { await supabase.from('performances').update(vals).eq('id', p.id); setPerformances(prev => prev.map(x => x.id === p.id ? { ...x, ...vals } : x)); }}
                fields={[
                  { key: 'event_name', label: 'Event', value: p.event_name },
                  { key: 'venue', label: 'Venue', value: p.venue || '' },
                  { key: 'date', label: 'Date', value: p.date || '', type: 'date' },
                ]}
              >
                <div className="text-sm font-medium text-ink">
                  {p.event_name}
                  {p.is_upcoming && <span className="ml-2 text-[10px] bg-accent-light text-accent px-1.5 py-0.5 rounded">Upcoming</span>}
                </div>
                <div className="text-xs text-muted">{p.venue && `${p.venue} · `}{p.date || ''}</div>
              </EditableCard>
            ))}
          </div>
        )}
      </section>

      {/* Currently Working On */}
      <section className="mb-10">
        <h2 className="font-['Instrument_Serif'] text-xl mb-4">Currently Working On</h2>
        {workingOn.length === 0 ? (
          <EmptyState
            message={isOwnProfile ? "Mark pieces you're practicing from any piece page." : "No pieces marked yet."}
          />
        ) : (
          <div className="space-y-2">
            {workingOn.map(w => (
              <a key={w.piece_id} href={`/piece/${w.piece_id}`} className="block bg-surface border border-border rounded-lg px-4 py-3 hover:border-muted transition-all no-underline">
                <div className="text-sm font-medium text-ink">{w.pieces.title}</div>
                <div className="text-xs text-muted">{w.pieces.composer_name}{w.pieces.catalog_number ? ` · ${w.pieces.catalog_number}` : ''}</div>
              </a>
            ))}
          </div>
        )}
      </section>

      {/* Discography */}
      <section className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-['Instrument_Serif'] text-xl">Discography</h2>
          {isOwnProfile && (
            <button onClick={() => addDiscography()} className="text-xs text-accent hover:text-accent-hover bg-transparent border-none cursor-pointer p-0">+ Add</button>
          )}
        </div>
        {discography.length === 0 ? (
          <EmptyState
            message={isOwnProfile ? "Add your recordings and albums." : "No recordings listed yet."}
            action={isOwnProfile ? "Add your first recording" : undefined}
            onAction={isOwnProfile ? () => addDiscography() : undefined}
          />
        ) : (
          <div className="space-y-2">
            {discography.map(d => (
              <EditableCard key={d.id} isOwner={isOwnProfile}
                onDelete={async () => { await supabase.from('discography').delete().eq('id', d.id); setDiscography(prev => prev.filter(x => x.id !== d.id)); }}
                onSave={async (vals) => { await supabase.from('discography').update(vals).eq('id', d.id); setDiscography(prev => prev.map(x => x.id === d.id ? { ...x, ...vals } : x)); }}
                fields={[
                  { key: 'title', label: 'Title', value: d.title },
                  { key: 'role', label: 'Role', value: d.role || '' },
                  { key: 'year', label: 'Year', value: String(d.year || '') },
                  { key: 'url', label: 'URL', value: d.url || '' },
                ]}
              >
                <div className="text-sm font-medium text-ink">
                  {d.url ? <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-ink no-underline hover:underline">{d.title}</a> : d.title}
                </div>
                <div className="text-xs text-muted">{d.role && `${d.role} · `}{d.year || ''}</div>
              </EditableCard>
            ))}
          </div>
        )}
      </section>

      {/* Edition Reviews */}
      <section className="mb-10">
        <h2 className="font-['Instrument_Serif'] text-xl mb-4">Edition Reviews</h2>
        {reviews.length === 0 ? (
          <EmptyState message={isOwnProfile ? "Rate editions from any piece page to build your review history." : "No reviews yet."} />
        ) : (
          <div className="space-y-3">
            {reviews.map(r => (
              <div key={r.id} className="bg-surface border border-border rounded-lg px-4 py-3">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <span className="text-sm font-medium text-ink">{r.editions.publisher}</span>
                    <span className="text-xs text-muted ml-2">for {r.editions.pieces.title}</span>
                  </div>
                  <span className="text-star">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                </div>
                {r.text && <p className="text-xs text-muted leading-relaxed">{r.text}</p>}
                <div className="text-[11px] text-muted mt-1">{formatDate(r.created_at)}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Discussion Contributions */}
      <section className="mb-10">
        <h2 className="font-['Instrument_Serif'] text-xl mb-4">Discussions</h2>
        {posts.length === 0 ? (
          <EmptyState message={isOwnProfile ? "Join a discussion on any piece page. Your contributions show up here." : "No posts yet."} />
        ) : (
          <div className="space-y-3">
            {posts.map(p => (
              <a key={p.id} href={`/piece/${p.piece_id}`} className="block bg-surface border border-border rounded-lg px-4 py-3 hover:border-muted transition-all no-underline">
                <div className="text-xs text-muted mb-1">{p.pieces.title} · {formatDate(p.created_at)}</div>
                <p className="text-sm text-ink leading-relaxed">{p.text.length > 200 ? p.text.slice(0, 200) + '...' : p.text}</p>
              </a>
            ))}
          </div>
        )}
      </section>

      {/* Sign Out */}
      {isOwnProfile && (
        <div className="border-t border-border pt-6">
          <button onClick={handleSignOut} className="text-sm text-muted hover:text-ink bg-transparent border-none cursor-pointer p-0">Sign out</button>
        </div>
      )}
    </div>
  );

  // Helper functions for adding items
  function addPerformance() {
    supabase.from('performances').insert({
      user_id: user!.id, event_name: '', venue: '', date: new Date().toISOString().split('T')[0], is_upcoming: true,
    }).select().single().then(({ data }) => {
      if (data) setPerformances(prev => [data as Performance, ...prev]);
    });
  }

  function addDiscography() {
    supabase.from('discography').insert({
      user_id: user!.id, title: '', year: new Date().getFullYear(), role: 'Performer',
    }).select().single().then(({ data }) => {
      if (data) setDiscography(prev => [data as DiscographyItem, ...prev]);
    });
  }
}

// --- Empty State ---

function EmptyState({ message, action, onAction }: { message: string; action?: string; onAction?: () => void }) {
  return (
    <div className="border border-dashed border-border rounded-lg py-6 px-4 text-center">
      <p className="text-sm text-muted mb-2">{message}</p>
      {action && onAction && (
        <button onClick={onAction} className="text-xs text-accent hover:text-accent-hover bg-transparent border-none cursor-pointer p-0">{action}</button>
      )}
    </div>
  );
}

// --- Editable Card ---

function EditableCard({ children, isOwner, onDelete, onSave, fields }: {
  children: React.ReactNode;
  isOwner: boolean;
  onDelete: () => void;
  onSave: (vals: Record<string, string>) => void;
  fields: { key: string; label: string; value: string; type?: string }[];
}) {
  const [editMode, setEditMode] = useState(false);
  const [vals, setVals] = useState<Record<string, string>>(() => Object.fromEntries(fields.map(f => [f.key, f.value])));

  // Open in edit mode if title/event_name is empty (just created)
  useEffect(() => {
    const mainField = fields[0];
    if (mainField && !mainField.value) setEditMode(true);
  }, []);

  if (editMode && isOwner) {
    return (
      <div className="bg-surface border border-accent/30 rounded-lg px-4 py-3 space-y-2">
        {fields.map(f => (
          <div key={f.key}>
            <label className="block text-[11px] text-muted mb-0.5">{f.label}</label>
            <input value={vals[f.key] || ''} type={f.type || 'text'}
              onChange={e => setVals(v => ({ ...v, [f.key]: e.target.value }))}
              className="w-full border border-border rounded px-2 py-1 text-sm focus:outline-none focus:border-accent" />
          </div>
        ))}
        <div className="flex gap-2 justify-end pt-1">
          <button onClick={() => setEditMode(false)} className="text-xs text-muted bg-transparent border-none cursor-pointer p-0">Cancel</button>
          <button onClick={() => { onSave(vals); setEditMode(false); }} className="text-xs text-accent hover:text-accent-hover bg-transparent border-none cursor-pointer p-0">Save</button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-lg px-4 py-3 flex justify-between items-start group">
      <div className="flex-1 min-w-0">{children}</div>
      {isOwner && (
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
          <button onClick={() => setEditMode(true)} className="text-muted hover:text-ink bg-transparent border-none cursor-pointer p-1" title="Edit">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
          </button>
          <button onClick={onDelete} className="text-muted hover:text-error bg-transparent border-none cursor-pointer p-1" title="Delete">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
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
      onUpload(`${data.publicUrl}?t=${Date.now()}`);
    }
    setUploading(false);
    setOpen(false);
  };

  return (
    <>
      <button onClick={() => setOpen(!open)}
        className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-surface border border-border flex items-center justify-center text-muted hover:text-ink cursor-pointer transition-colors"
        title="Change photo">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-2 bg-surface border border-border rounded-lg shadow-lg z-50 w-48 py-1">
            {hasPhoto && (
              <button onClick={() => { onRemove(); setOpen(false); }}
                className="w-full text-left px-3 py-2 text-sm text-muted hover:bg-bg bg-transparent border-none cursor-pointer">Remove photo</button>
            )}
            {!hasPhoto && googleAvatarUrl && (
              <button onClick={() => { onRestoreGoogle(); setOpen(false); }}
                className="w-full text-left px-3 py-2 text-sm text-muted hover:bg-bg bg-transparent border-none cursor-pointer">Restore Google photo</button>
            )}
            <button onClick={() => fileInputRef.current?.click()}
              className="w-full text-left px-3 py-2 text-sm text-muted hover:bg-bg bg-transparent border-none cursor-pointer" disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload new photo'}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </div>
        </>
      )}
    </>
  );
}
