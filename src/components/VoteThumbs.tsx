// Reusable thumbs-up / thumbs-down affordance for any voteable signed
// subject (performers_notes, interpretive_schools, piece_descriptions, and
// eventually landmarks).
//
// Invariants:
//   - Never renders vote counts. Counts exist server-side in vote_tallies
//     for stacking order; they're not exposed to the client, ever.
//   - Anon users see the thumbs at 40% opacity; clicking opens a shared
//     sign-in prompt (per memory: edit-affordance always visible, click
//     prompts sign-in).
//   - Own-vote state is loaded on mount via a direct SELECT against the
//     votes table (RLS restricts the row set to the current user's own
//     votes, so the client never sees other users' rows).
//   - Optimistic UI: click fills/unfills immediately, RPC fires, revert on
//     error (with a toast via the shared emitter).

import { useCallback, useEffect, useState } from 'react';
import { supabase, hasSupabase } from '../lib/supabase';
import { useAuth } from '../lib/useAuth';
import SignInPanel from './SignInPanel';

export type VoteSubjectTable =
  | 'performers_notes'
  | 'interpretive_schools'
  | 'piece_descriptions'
  | 'landmarks'
  | 'pieces_seed_description'
  | 'piece_difficulty_ratings'
  | 'pieces_seed_difficulty';

interface Props {
  subjectTable: VoteSubjectTable;
  subjectId: string;
}

type Vote = -1 | 0 | 1;

export default function VoteThumbs({ subjectTable, subjectId }: Props) {
  const { user, loading: authLoading } = useAuth();
  const [vote, setVote] = useState<Vote>(0);
  const [error, setError] = useState<string | null>(null);
  const [signInOpen, setSignInOpen] = useState(false);
  const [pending, setPending] = useState(false);
  // Bumps every time the user transitions INTO an upvote (not clear, not down).
  // The upvote button reads this to trigger a one-shot celebration animation
  // via a dynamic key + CSS class. Reduced motion respected in CSS.
  const [celebrateKey, setCelebrateKey] = useState(0);

  // Load the user's existing vote on mount (or when auth resolves).
  useEffect(() => {
    let cancelled = false;
    if (authLoading || !user || !hasSupabase) return;
    (async () => {
      const { data, error: err } = await supabase
        .from('votes')
        .select('vote_value')
        .eq('subject_table', subjectTable)
        .eq('subject_id', subjectId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (cancelled) return;
      if (err) return;
      setVote(((data?.vote_value as Vote | undefined) ?? 0) as Vote);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading, subjectTable, subjectId]);

  const cast = useCallback(
    async (desired: 1 | -1) => {
      if (!user) {
        setSignInOpen(true);
        return;
      }
      if (pending) return;
      const prev = vote;
      // Clicking the already-filled thumb clears the vote; otherwise sets.
      const next: Vote = prev === desired ? 0 : desired;
      setVote(next);
      if (desired === 1 && next === 1 && prev !== 1) {
        // Transitioning into an upvote — trigger the celebration pulse.
        setCelebrateKey((k) => k + 1);
      }
      setPending(true);
      setError(null);
      const { error: rpcErr } =
        next === 0
          ? await supabase.rpc('clear_vote', {
              p_subject_table: subjectTable,
              p_subject_id: subjectId,
            })
          : await supabase.rpc('cast_vote', {
              p_subject_table: subjectTable,
              p_subject_id: subjectId,
              p_vote_value: next,
            });
      setPending(false);
      if (rpcErr) {
        setVote(prev); // revert optimistic
        const pretty = rpcErr.message.includes('rate limit')
          ? 'Voting too fast — wait a second.'
          : `Vote failed: ${rpcErr.message}`;
        setError(pretty);
      }
    },
    [user, vote, pending, subjectTable, subjectId],
  );

  const ariaUp = user
    ? vote === 1
      ? 'Remove upvote'
      : 'Upvote'
    : 'Sign in to upvote';
  const ariaDown = user
    ? vote === -1
      ? 'Remove downvote'
      : 'Downvote'
    : 'Sign in to downvote';

  return (
    <>
      <span
        className={`vote-thumbs${pending ? ' is-pending' : ''}`}
        role="group"
        aria-label="Vote on this contribution"
      >
        <button
          type="button"
          className={`vote-thumb vote-thumb-up${vote === 1 ? ' is-active' : ''}`}
          aria-pressed={vote === 1}
          aria-label={ariaUp}
          onClick={() => cast(1)}
          disabled={pending}
        >
          <span key={celebrateKey} className={`vote-thumb-glyph${celebrateKey > 0 ? ' is-celebrating' : ''}`}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M3 14V7h2.5l2-4.5a1.5 1.5 0 012.9.9L9.5 7H13a1.5 1.5 0 011.5 1.7l-.8 4.5A2 2 0 0111.7 15H5.5A2.5 2.5 0 013 14z"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinejoin="round"
                fill={vote === 1 ? 'currentColor' : 'none'}
              />
            </svg>
          </span>
        </button>
        <button
          type="button"
          className={`vote-thumb vote-thumb-down${vote === -1 ? ' is-active' : ''}`}
          aria-pressed={vote === -1}
          aria-label={ariaDown}
          onClick={() => cast(-1)}
          disabled={pending}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M13 2v7h-2.5l-2 4.5a1.5 1.5 0 01-2.9-.9L6.5 9H3a1.5 1.5 0 01-1.5-1.7l.8-4.5A2 2 0 014.3 1h6.2A2.5 2.5 0 0113 2z"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinejoin="round"
              fill={vote === -1 ? 'currentColor' : 'none'}
            />
          </svg>
        </button>
      </span>

      {error && (
        <span className="vote-error" role="alert">
          {error}
        </span>
      )}

      {signInOpen && (
        <SignInPanel
          onClose={() => setSignInOpen(false)}
          title="Sign in to vote"
          body={
            <>
              Voting helps the community surface the most trusted signed contributions.
              Sign in or create an account to cast your vote.
            </>
          }
        />
      )}
    </>
  );
}
