import { useState } from 'react';
import { supabase, hasSupabase } from '../lib/supabase';
import { validateSlug } from '../lib/helpers';

interface VanitySlugEditorProps {
  userId: string;
  currentSlug: string | null;
  onSlugChange: (slug: string) => void;
}

export default function VanitySlugEditor({ userId, currentSlug, onSlugChange }: VanitySlugEditorProps) {
  const [editing, setEditing] = useState(false);
  const [slug, setSlug] = useState(currentSlug || '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!hasSupabase) return null;

  const handleSave = async () => {
    setError(null);
    const trimmed = slug.trim().toLowerCase();

    if (!trimmed) {
      setError('Username cannot be empty');
      return;
    }

    const validation = validateSlug(trimmed);
    if (!validation.valid) {
      setError(validation.error || 'Invalid username');
      return;
    }

    setSaving(true);

    const { error: dbError } = await supabase
      .from('users')
      .update({ vanity_slug: trimmed })
      .eq('id', userId);

    if (dbError) {
      if (dbError.message?.includes('unique') || dbError.message?.includes('duplicate') || dbError.code === '23505') {
        setError('This username is already taken');
      } else {
        setError('Could not save. Please try again.');
      }
      setSaving(false);
      return;
    }

    setSaving(false);
    setSaved(true);
    setEditing(false);
    onSlugChange(trimmed);
    setTimeout(() => setSaved(false), 3000);
  };

  if (!editing) {
    return (
      <div className="flex items-center gap-2 mb-4">
        {currentSlug ? (
          <>
            <span className="font-mono text-xs text-[#A8A29E]">
              irregularpearl.org/@{currentSlug}
            </span>
            <a
              href={`/@${currentSlug}`}
              className="text-[11px] text-accent hover:underline no-underline"
            >
              View
            </a>
            <span className="text-[11px] text-[#E7E5E4]">·</span>
            <button
              onClick={() => { setEditing(true); setSlug(currentSlug); }}
              className="text-[11px] text-accent hover:underline bg-transparent border-none cursor-pointer p-0"
            >
              Change username
            </button>
            {saved && <span className="text-[11px] text-green-600">Saved</span>}
          </>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1C1917] text-white text-xs font-medium rounded-lg hover:bg-[#292524] transition-colors border-none cursor-pointer"
          >
            Claim your URL
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="mb-4 p-4 bg-surface border border-border rounded-lg">
      <label className="block text-xs font-medium text-ink mb-2">
        {currentSlug ? 'Change your username' : 'Choose your username'}
      </label>
      <div className="flex items-center gap-1 mb-2">
        <span className="text-xs text-muted">irregularpearl.org/@</span>
        <input
          type="text"
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
            setError(null);
          }}
          placeholder="your-username"
          maxLength={30}
          className="flex-1 px-2 py-1.5 border border-border rounded text-sm font-mono focus:outline-none focus:border-accent"
          autoFocus
        />
      </div>
      <p className="text-[10px] text-muted mb-2">3-30 characters. Letters, numbers, hyphens. Must start and end with a letter or number.</p>
      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving || !slug.trim()}
          className="px-3 py-1.5 bg-[#1C1917] text-white text-xs font-medium rounded-lg hover:bg-[#292524] transition-colors border-none cursor-pointer disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button
          onClick={() => { setEditing(false); setError(null); setSlug(currentSlug || ''); }}
          className="px-3 py-1.5 text-xs text-muted hover:text-ink bg-transparent border border-border rounded-lg cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
