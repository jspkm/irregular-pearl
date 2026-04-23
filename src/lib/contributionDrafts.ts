// Client-side helpers for the contribution-request drafts surface.
//
// PR 1 landed the schema + RPCs. PR 2 (recipient piece-page UX) consumes
// them: fetch live drafts addressed to the current viewer on a piece, render
// inline proposal cards in each section, dispatch act_on_draft and
// dismiss_draft_inline.
//
// All reads + writes go through Supabase RLS / RPCs. The recipient SELECT
// policy on contribution_request_drafts already filters
//   sent_at IS NOT NULL AND dispositioned_at IS NULL
// so a `select * from contribution_request_drafts where ...` returns only
// the rows this viewer should see. Sender's no-feedback property is
// enforced server-side via the sender_drafts_archive function (PR 5).

import { supabase } from './supabase';

export type DraftKind =
  | 'performers_note'
  | 'interpretive_school'
  | 'piece_description'
  | 'landmark';

export interface PendingDraft {
  draftId: string;
  requestId: string;
  kind: DraftKind;
  payload: Record<string, unknown>;
  createdAt: string;
  /** Stamped by Add to Todo. Card is hidden from inline render but still
   * lives on the recipient's Todos screen (PR 3). */
  inlineDismissedAt: string | null;
  sender: { id: string; displayName: string | null };
}

export type ActOnDraftAction = 'accept_as_is' | 'edit_and_accept' | 'decline';

export interface ActOnDraftResult {
  /** UUID of the new content row when accepted; null on decline. */
  contentId: string | null;
  /** Friendly error code or null. Codes:
   *   'draft_no_longer_available' — sender deleted the request, or row gone
   *   'draft_already_dispositioned' — another tab acted first
   *   'request_no_longer_sent' — outbox state, shouldn't happen for recipient
   *   'unknown' — fallback */
  errorCode: 'draft_no_longer_available' | 'draft_already_dispositioned' | 'request_no_longer_sent' | 'unknown' | null;
  /** Raw error message (debugging only — UI shows a friendly toast). */
  errorMessage: string | null;
}

/**
 * Fetch all live (non-dispositioned) drafts on a piece for the current viewer.
 * Recipient RLS already filters by recipient + sent. Empty array if anon or
 * no drafts.
 */
export async function fetchPendingDraftsOnPiece(pieceId: string): Promise<PendingDraft[]> {
  const { data: drafts, error: draftsErr } = await supabase
    .from('contribution_request_drafts')
    .select('id, request_id, kind, payload, created_at, inline_dismissed_at')
    .order('created_at', { ascending: true });
  if (draftsErr || !drafts || drafts.length === 0) return [];

  const requestIds = [...new Set(drafts.map((d) => d.request_id))];
  const { data: requests, error: reqErr } = await supabase
    .from('contribution_requests')
    .select('id, sender_id, piece_id')
    .in('id', requestIds)
    .eq('piece_id', pieceId);
  if (reqErr || !requests) return [];

  const reqById = new Map(requests.map((r) => [r.id, r]));
  const senderIds = [...new Set(requests.map((r) => r.sender_id))];
  const { data: senders } = await supabase
    .from('users')
    .select('id, display_name')
    .in('id', senderIds);
  const senderById = new Map((senders ?? []).map((s) => [s.id, s]));

  const out: PendingDraft[] = [];
  for (const d of drafts) {
    const req = reqById.get(d.request_id);
    if (!req) continue; // request not on this piece
    const sender = senderById.get(req.sender_id);
    out.push({
      draftId: d.id,
      requestId: d.request_id,
      kind: d.kind as DraftKind,
      payload: (d.payload as Record<string, unknown>) ?? {},
      createdAt: d.created_at,
      inlineDismissedAt: d.inline_dismissed_at,
      sender: { id: req.sender_id, displayName: sender?.display_name ?? null },
    });
  }
  return out;
}

/**
 * Dispatch the recipient's act on a pending draft.
 * Returns a normalized result; UI uses errorCode to choose the right toast.
 */
export async function actOnDraft(
  draftId: string,
  action: ActOnDraftAction,
  payloadOverride?: Record<string, unknown>,
): Promise<ActOnDraftResult> {
  const { data, error } = await supabase.rpc('act_on_draft', {
    p_draft_id: draftId,
    p_action: action,
    p_payload_override: payloadOverride ?? null,
  });
  if (error) {
    const m = error.message.toLowerCase();
    let errorCode: ActOnDraftResult['errorCode'] = 'unknown';
    if (m.includes('no longer available') || m.includes('not found')) errorCode = 'draft_no_longer_available';
    else if (m.includes('already dispositioned')) errorCode = 'draft_already_dispositioned';
    else if (m.includes('not sent')) errorCode = 'request_no_longer_sent';
    return { contentId: null, errorCode, errorMessage: error.message };
  }
  return { contentId: (data as string | null) ?? null, errorCode: null, errorMessage: null };
}

/** Hide the inline draft card on the piece page; row persists for Todos screen. */
export async function dismissDraftInline(
  draftId: string,
): Promise<{ errorCode: ActOnDraftResult['errorCode']; errorMessage: string | null }> {
  const { error } = await supabase.rpc('dismiss_draft_inline', { p_draft_id: draftId });
  if (error) {
    const m = error.message.toLowerCase();
    let errorCode: ActOnDraftResult['errorCode'] = 'unknown';
    if (m.includes('not found') || m.includes('no longer')) errorCode = 'draft_no_longer_available';
    else if (m.includes('already dispositioned')) errorCode = 'draft_already_dispositioned';
    return { errorCode, errorMessage: error.message };
  }
  return { errorCode: null, errorMessage: null };
}
