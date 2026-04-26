import { useEffect, useState } from 'react';
import { useAuth } from '../lib/useAuth';
import SignInPanel from './SignInPanel';

const TARGET = (uid: string) => `/profile/${uid}?section=setting`;

export default function SettingsRedirect() {
  const { user, loading } = useAuth();
  const [forceSignIn, setForceSignIn] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (user) {
      window.location.replace(TARGET(user.id));
      return;
    }
    setForceSignIn(true);
  }, [loading, user]);

  if (loading || (user && !forceSignIn)) {
    return (
      <div className="text-muted text-sm py-12 text-center">Loading…</div>
    );
  }

  return (
    <SignInPanel
      onClose={() => {
        window.location.replace('/');
      }}
      onSignedIn={() => {
        // useAuth tick will re-render; the effect above redirects to the
        // canonical profile-section URL once we have a uid.
      }}
      redirectTo="/settings"
      title="Sign in to manage settings"
    />
  );
}
