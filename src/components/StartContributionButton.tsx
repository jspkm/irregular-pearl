// "Start the first contribution" primary CTA on the pre-piece page.
// - Signed-in: smooth-scrolls to <section id="contribute"> below, where
//   the PerformersNotes island lives with its write-a-note affordance.
// - Signed-out: routes to /?sign_in=1 so the user can authenticate
//   first, then comes back to finish contributing.

import { useAuth } from '../lib/useAuth';

export default function StartContributionButton() {
  const { user, loading } = useAuth();

  function handleClick() {
    if (loading) return;
    if (!user) {
      window.location.href = '/?sign_in=1';
      return;
    }
    const target = document.getElementById('contribute');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  return (
    <button
      type="button"
      className="pp-cta-primary"
      onClick={handleClick}
    >
      Start the first contribution
    </button>
  );
}
