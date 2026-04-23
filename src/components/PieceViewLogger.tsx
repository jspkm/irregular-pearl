// Fire-and-forget island that logs a piece-page view on mount. Renders
// nothing visually. Feeds the "most viewed but not contributed yet"
// editorial dashboard on /admin/unmatched-queries.
//
// Dedup key: signed-in users use auth.uid() (server-side). Anonymous
// users get a stable visitor_token stored in localStorage so revisits
// count as the same visitor. Users in private-browsing mode or with
// storage blocked produce "orphan" rows — each counted individually,
// which is fine because that cohort is small.
//
// Per-mount log, not per-session. A page refresh fires a new row; the
// admin dashboard uses DISTINCT on user_id/visitor_token so repeat
// views roll up for the same person.

import { useEffect } from 'react';
import { supabase, hasSupabase } from '../lib/supabase';

const VISITOR_TOKEN_KEY = 'ip.visitor.token';

function readOrMintVisitorToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    let token = window.localStorage.getItem(VISITOR_TOKEN_KEY);
    if (!token) {
      token = crypto.randomUUID();
      window.localStorage.setItem(VISITOR_TOKEN_KEY, token);
    }
    return token;
  } catch {
    // Private mode / storage blocked — view will log as "orphan."
    return null;
  }
}

interface Props {
  pieceId: string;
}

export default function PieceViewLogger({ pieceId }: Props) {
  useEffect(() => {
    if (!hasSupabase || !pieceId) return;
    const visitorToken = readOrMintVisitorToken();
    void supabase.rpc('log_piece_view', {
      p_piece_id: pieceId,
      p_visitor_token: visitorToken,
    });
  }, [pieceId]);

  return null;
}
