import { useState, useEffect } from 'react';
import { supabase, hasSupabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import GenerativeAvatar from './GenerativeAvatar';

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [dbAvatarUrl, setDbAvatarUrl] = useState<string | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasSupabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        // Fetch avatar_url from public.users (respects user's choice)
        supabase.from('users').select('avatar_url').eq('id', session.user.id).single()
          .then(({ data }) => {
            setDbAvatarUrl(data?.avatar_url ?? null);
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.href,
      },
    });
  };

  if (loading) {
    return <span className="text-sm text-gray-400">...</span>;
  }

  if (user) {
    const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';

    return (
      <a href={`/profile/${user.id}`} className="block no-underline" title={displayName}>
        {dbAvatarUrl ? (
          <img src={dbAvatarUrl} alt={displayName} className="w-7 h-7 rounded-full object-cover" />
        ) : (
          <GenerativeAvatar userId={user.id} size={28} />
        )}
      </a>
    );
  }

  return (
    <button
      onClick={handleSignIn}
      className="text-sm font-medium text-[#B45309] hover:text-[#92400E] transition-colors bg-transparent border-none cursor-pointer p-0"
    >
      Sign in
    </button>
  );
}
