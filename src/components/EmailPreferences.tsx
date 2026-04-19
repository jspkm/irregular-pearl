import { useState, useEffect } from 'react';
import { supabase, hasSupabase } from '../lib/supabase';
import { useAuth } from '../lib/useAuth';

interface Preferences {
  email_weekly_digest: boolean;
  email_welcome: boolean;
}

export default function EmailPreferences() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!hasSupabase || !user) { setLoading(false); return; }

    const fetch = async () => {
      const { data } = await supabase
        .from('users')
        .select('email_weekly_digest, email_welcome')
        .eq('id', user.id)
        .single();

      if (data) setPrefs(data as Preferences);
      setLoading(false);
    };
    fetch();
  }, [user?.id]);

  const toggle = async (key: keyof Preferences) => {
    if (!user || !prefs) return;
    setSaving(true);
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);

    await supabase.from('users').update({ [key]: updated[key] }).eq('id', user.id);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const unsubscribeAll = async () => {
    if (!user) return;
    setSaving(true);
    const updated = { email_weekly_digest: false, email_welcome: false };
    setPrefs(updated);
    await supabase.from('users').update(updated).eq('id', user.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!hasSupabase || !user) {
    return (
      <div className="text-center py-16 text-muted text-sm">
        Sign in to manage your email preferences.
      </div>
    );
  }

  if (loading || !prefs) {
    return (
      <div className="max-w-[600px] mx-auto px-6 py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-48" />
          <div className="h-16 bg-gray-100 rounded-lg" />
          <div className="h-16 bg-gray-100 rounded-lg" />
        </div>
      </div>
    );
  }

  const EMAIL_OPTIONS: { key: keyof Preferences; title: string; description: string }[] = [
    {
      key: 'email_weekly_digest',
      title: 'Weekly Digest',
      description: 'A summary of new pieces added to the catalog every Monday.',
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-['Instrument_Serif'] text-xl">Email Preferences</h2>
        {saved && <span className="text-xs text-success">Saved</span>}
      </div>

      <div className="space-y-3">
        {EMAIL_OPTIONS.map(opt => (
          <div
            key={opt.key}
            className="bg-surface border border-border rounded-lg px-5 py-4 flex items-center justify-between gap-4"
          >
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-ink">{opt.title}</div>
              <div className="text-xs text-muted mt-0.5">{opt.description}</div>
            </div>
            <button
              onClick={() => toggle(opt.key)}
              disabled={saving}
              className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer border-none flex-shrink-0 ${
                prefs[opt.key] ? 'bg-accent' : 'bg-border'
              }`}
              role="switch"
              aria-checked={prefs[opt.key]}
              aria-label={opt.title}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  prefs[opt.key] ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-border">
        <button
          onClick={unsubscribeAll}
          disabled={saving || !prefs.email_weekly_digest}
          className="text-sm text-muted hover:text-error bg-transparent border-none cursor-pointer p-0 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Unsubscribe from all emails
        </button>
        <p className="text-[11px] text-muted mt-2">
          You will still receive essential account emails (password resets, security alerts).
        </p>
      </div>
    </div>
  );
}
