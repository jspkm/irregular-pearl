// "Start the first contribution" primary CTA on the pre-piece page.
// - Signed-in: navigates to the same piece URL with ?expand=1, which
//   server-renders the full PiecePageLayout (all writeable sections:
//   performer's notes, schools, landmarks, etc.). The pre-piece page
//   stays deliberately read-only until this click so no one nudges
//   into writing accidentally.
// - Signed-out: opens the SignInPanel inline on the current piece page
//   (no home-page detour). After successful sign-in the pending action
//   auto-resumes via useRequireAuth, so the user doesn't click twice.

import { useRequireAuth } from '../lib/useRequireAuth';
import SignInPanel from './SignInPanel';

interface Props {
  pieceId: string;
}

export default function StartContributionButton({ pieceId }: Props) {
  const { signInOpen, onClose, onSignedIn, redirectTo, gate } = useRequireAuth();

  // Same URL + ?expand=1 — forces [id].astro down the PiecePageLayout
  // branch even when has_signed_content is still false.
  const expandUrl = `/piece/${pieceId}?expand=1`;

  function handleClick() {
    gate(() => { window.location.href = expandUrl; }, { resumeUrl: expandUrl });
  }

  return (
    <>
      <button
        type="button"
        className="pp-cta-primary"
        onClick={handleClick}
      >
        Start the first contribution
      </button>
      {signInOpen && (
        <SignInPanel
          onClose={onClose}
          onSignedIn={onSignedIn}
          redirectTo={redirectTo}
          title="Sign in to contribute"
          body={
            <>Any registered user can start a contribution. Sign in or create an account to open this piece for writing.</>
          }
        />
      )}
    </>
  );
}
