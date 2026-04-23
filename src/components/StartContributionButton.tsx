// "Start the first contribution" primary CTA on the pre-piece page.
// - Signed-in: navigates to the same piece URL with ?expand=1, which
//   server-renders the full PiecePageLayout (all writeable sections:
//   performer's notes, schools, landmarks, etc.). The pre-piece page
//   stays deliberately read-only until this click so no one nudges
//   into writing accidentally.
// - Signed-out: routes to /?sign_in=1 first; after auth they return
//   to the piece page and can click the CTA again.

import { useAuth } from '../lib/useAuth';

interface Props {
  pieceId: string;
}

export default function StartContributionButton({ pieceId }: Props) {
  const { user, loading } = useAuth();

  function handleClick() {
    if (loading) return;
    if (!user) {
      window.location.href = '/?sign_in=1';
      return;
    }
    // Same URL + ?expand=1 — forces [id].astro down the PiecePageLayout
    // branch even when has_signed_content is still false.
    window.location.href = `/piece/${pieceId}?expand=1`;
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
