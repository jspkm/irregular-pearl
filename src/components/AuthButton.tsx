import { useState, useEffect } from 'react';
import { supabase, hasSupabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import GenerativeAvatar from './GenerativeAvatar';
import SignInPanel from './SignInPanel';

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [dbAvatarUrl, setDbAvatarUrl] = useState<string | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [signInOpen, setSignInOpen] = useState(false);

  useEffect(() => {
    if (!hasSupabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        // Fetch avatar_url from public.users (respects user's choice).
        // Don't block the navbar on this — if the row is missing or the
        // query fails, we still render the avatar via GenerativeAvatar.
        supabase.from('users').select('avatar_url').eq('id', session.user.id).single()
          .then(({ data }) => {
            setDbAvatarUrl(data?.avatar_url ?? null);
          });
      } else if (typeof window !== 'undefined') {
        // Auto-open sign-in modal when arriving with ?signin=1. Used by
        // private pages (/notifications, etc.) that redirect anon visitors
        // here without leaking what the source page was about.
        const params = new URLSearchParams(window.location.search);
        if (params.get('signin') === '1') {
          setSignInOpen(true);
          // Strip the param so a refresh doesn't keep popping the modal.
          params.delete('signin');
          const newSearch = params.toString();
          const newUrl =
            window.location.pathname + (newSearch ? '?' + newSearch : '') + window.location.hash;
          window.history.replaceState({}, '', newUrl);
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <span className="text-sm text-gray-400">...</span>;
  }

  if (user) {
    const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';

    return (
      <div className="flex items-center gap-3">
        <a
          href={`/profile/${user.id}`}
          className="inline-flex items-center justify-center no-underline min-w-0!"
          title={displayName}
        >
          {dbAvatarUrl ? (
            <img src={dbAvatarUrl} alt={displayName} className="w-7 h-7 rounded-full object-cover" />
          ) : (
            <GenerativeAvatar userId={user.id} size={28} />
          )}
        </a>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setSignInOpen(true)}
        className="text-sm font-medium text-accent hover:text-accent-hover transition-colors bg-transparent border-none cursor-pointer p-0"
      >
        Sign in
      </button>
      {signInOpen && <SignInPanel onClose={() => setSignInOpen(false)} />}
    </>
  );
}
