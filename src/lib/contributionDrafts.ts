// Client-side helpers for the contribution-request drafts surface.
//
// PR 1 landed the schema + RPCs. PR 2 (recipient piece-page UX) +
// PR 3 (/notifications Open items tab) consume them: fetch live drafts
// addressed to the current viewer, render proposal cards with three
// actions (Accept as-is / Edit & accept / Decline), dispatch act_on_draft.
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
  sender: { id: string; displayName: string | null };
  /** Populated by fetchPendingDraftsForViewer() (Open items tab needs
   * piece context to render cross-piece). Null when fetched via
   * fetchPendingDraftsOnPiece() — the piece is implicit there. */
  piece: { id: string; title: string; composerName: string | null } | null;
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
 * Fetch all live (non-dispositioned) drafts on a piece addressed to the
 * current viewer as recipient. Empty array if anon, if nobody has asked this
 * viewer on this piece, or if all drafts are dispositioned.
 *
 * Why the explicit recipient filter here — RLS is not sufficient on its own
 * because `crd_staff_read` lets staff see all drafts for moderation. Without
 * this filter, a staff user drafting their own outbox on a piece would see
 * their own proposal render back as a pending "act on this" card.
 *
 * The returned drafts have `piece: null` — the piece is implicit (the section
 * components rendering this know the pieceId). For cross-piece reads (the
 * Open items tab on /notifications), use fetchPendingDraftsForViewer() instead.
 */
export async function fetchPendingDraftsOnPiece(pieceId: string): Promise<PendingDraft[]> {
  const { data: { session } } = await supabase.auth.getSession();
  const viewerId = session?.user?.id ?? null;
  if (!viewerId) return [];

  const { data: drafts, error: draftsErr } = await supabase
    .from('contribution_request_drafts')
    .select('id, request_id, kind, payload, created_at')
    .is('dispositioned_at', null)
    .order('created_at', { ascending: true });
  if (draftsErr || !drafts || drafts.length === 0) return [];

  const requestIds = [...new Set(drafts.map((d) => d.request_id))];
  const { data: requests, error: reqErr } = await supabase
    .from('contribution_requests')
    .select('id, sender_id, piece_id')
    .in('id', requestIds)
    .eq('piece_id', pieceId)
    .eq('recipient_id', viewerId)
    .not('sent_at', 'is', null);
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
      sender: { id: req.sender_id, displayName: sender?.display_name ?? null },
      piece: null,
    });
  }
  return out;
}

/**
 * Fetch all live (non-dispositioned) drafts addressed to the current viewer
 * across every piece. Used by the Open items tab on /notifications. Same
 * explicit recipient filter as fetchPendingDraftsOnPiece — required because
 * the staff RLS policy would otherwise leak drafts the staff viewer sent or
 * drafts addressed to other users.
 *
 * Returns drafts with `piece` populated. Sorted newest-first so the
 * Open items tab matches the Messages tab pattern.
 */
export async function fetchPendingDraftsForViewer(): Promise<PendingDraft[]> {
  const { data: { session } } = await supabase.auth.getSession();
  const viewerId = session?.user?.id ?? null;
  if (!viewerId) return [];

  const { data: drafts, error: draftsErr } = await supabase
    .from('contribution_request_drafts')
    .select('id, request_id, kind, payload, created_at')
    .is('dispositioned_at', null)
    .order('created_at', { ascending: false });
  if (draftsErr || !drafts || drafts.length === 0) return [];

  const requestIds = [...new Set(drafts.map((d) => d.request_id))];
  const { data: requests, error: reqErr } = await supabase
    .from('contribution_requests')
    .select('id, sender_id, piece_id')
    .in('id', requestIds)
    .eq('recipient_id', viewerId)
    .not('sent_at', 'is', null);
  if (reqErr || !requests) return [];

  const reqById = new Map(requests.map((r) => [r.id, r]));
  const senderIds = [...new Set(requests.map((r) => r.sender_id))];
  const pieceIds = [...new Set(requests.map((r) => r.piece_id))];

  const [{ data: senders }, { data: pieces }] = await Promise.all([
    supabase.from('users').select('id, display_name').in('id', senderIds),
    supabase.from('pieces').select('id, title, composer_name').in('id', pieceIds),
  ]);

  const senderById = new Map((senders ?? []).map((s) => [s.id, s]));
  const pieceById = new Map(
    (pieces ?? []).map((p) => [p.id, { id: p.id, title: p.title, composerName: p.composer_name }]),
  );

  const out: PendingDraft[] = [];
  for (const d of drafts) {
    const req = reqById.get(d.request_id);
    if (!req) continue;
    const sender = senderById.get(req.sender_id);
    const piece = pieceById.get(req.piece_id) ?? null;
    out.push({
      draftId: d.id,
      requestId: d.request_id,
      kind: d.kind as DraftKind,
      payload: (d.payload as Record<string, unknown>) ?? {},
      createdAt: d.created_at,
      sender: { id: req.sender_id, displayName: sender?.display_name ?? null },
      piece,
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
    p_payload_override: (payloadOverride ?? null) as never,
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

// ============================================================
// Sender-side helpers (PR 4 — drafting mode)
// ============================================================

export interface OutboxRequest {
  id: string;
  pieceId: string;
  senderId: string;
  recipientId: string | null;
  recipientDisplayName: string | null;
  note: string | null;
  sentAt: string | null;
}

export interface OutboxDraft {
  id: string;
  requestId: string;
  kind: DraftKind;
  payload: Record<string, unknown>;
  ordinal: number;
  createdAt: string;
}

/** Create a new outbox request. Staff-only. Returns the new request id. */
export async function createOutboxRequest(
  pieceId: string,
  recipientId: string,
  note: string | null,
): Promise<{ requestId: string | null; errorMessage: string | null }> {
  const { data, error } = await supabase.rpc('create_outbox_request', {
    p_piece_id: pieceId,
    p_recipient_id: recipientId,
    p_note: note as never,
  });
  if (error) return { requestId: null, errorMessage: error.message };
  return { requestId: (data as string | null) ?? null, errorMessage: null };
}

/** Propose a new draft on an outbox request. Returns the new draft id. */
export async function proposeDraft(
  requestId: string,
  kind: DraftKind,
  payload: Record<string, unknown>,
): Promise<{ draftId: string | null; errorMessage: string | null }> {
  const { data, error } = await supabase.rpc('propose_draft', {
    p_request_id: requestId,
    p_kind: kind,
    p_payload: payload as never,
  });
  if (error) return { draftId: null, errorMessage: error.message };
  return { draftId: (data as string | null) ?? null, errorMessage: null };
}

export async function updateOutboxDraft(
  draftId: string,
  payload: Record<string, unknown>,
): Promise<{ errorMessage: string | null }> {
  const { error } = await supabase.rpc('update_outbox_draft', {
    p_draft_id: draftId,
    p_payload: payload as never,
  });
  return { errorMessage: error ? error.message : null };
}

export async function deleteOutboxDraft(
  draftId: string,
): Promise<{ errorMessage: string | null }> {
  const { error } = await supabase.rpc('delete_outbox_draft', {
    p_draft_id: draftId,
  });
  return { errorMessage: error ? error.message : null };
}

export async function deleteOutboxRequest(
  requestId: string,
): Promise<{ errorMessage: string | null }> {
  const { error } = await supabase.rpc('delete_outbox_request', {
    p_request_id: requestId,
  });
  return { errorMessage: error ? error.message : null };
}

export async function sendRequest(
  requestId: string,
): Promise<{ errorMessage: string | null }> {
  const { error } = await supabase.rpc('send_request', {
    p_request_id: requestId,
  });
  return { errorMessage: error ? error.message : null };
}

/**
 * Fetch the outbox request by id for the drafting banner. Returns null if
 * the request no longer exists or isn't readable (sender RLS only returns
 * rows they own).
 */
export async function fetchOutboxRequest(
  requestId: string,
): Promise<OutboxRequest | null> {
  const { data, error } = await supabase
    .from('contribution_requests')
    .select('id, piece_id, sender_id, recipient_id, note, sent_at')
    .eq('id', requestId)
    .maybeSingle();
  if (error || !data) return null;

  let recipientDisplayName: string | null = null;
  if (data.recipient_id) {
    const { data: user } = await supabase
      .from('users')
      .select('display_name')
      .eq('id', data.recipient_id)
      .maybeSingle();
    recipientDisplayName = (user as { display_name?: string } | null)?.display_name ?? null;
  }

  return {
    id: data.id as string,
    pieceId: data.piece_id as string,
    senderId: data.sender_id as string,
    recipientId: (data.recipient_id as string | null) ?? null,
    recipientDisplayName,
    note: (data.note as string | null) ?? null,
    sentAt: (data.sent_at as string | null) ?? null,
  };
}

/**
 * Fetch the sender's own drafts on a specific outbox request via the
 * no-feedback security-definer function. Returns only safe columns; the
 * caller cannot see disposition state.
 */
export async function fetchSenderDraftsForRequest(
  requestId: string,
): Promise<OutboxDraft[]> {
  const { data, error } = await supabase.rpc('fetch_sender_drafts_archive', {
    p_request_id: requestId,
  });
  if (error || !data) return [];
  const rows = data as Array<{
    id: string;
    request_id: string;
    kind: string;
    payload: Record<string, unknown>;
    ordinal: number;
    created_at: string;
  }>;
  return rows.map((r) => ({
    id: r.id,
    requestId: r.request_id,
    kind: r.kind as DraftKind,
    payload: r.payload ?? {},
    ordinal: r.ordinal,
    createdAt: r.created_at,
  }));
}

// ============================================================
// Sent archive (Requests admin tab)
// ============================================================

export interface SentRequestArchiveRow {
  id: string;
  originalRequestId: string;
  pieceId: string;
  pieceTitle: string | null;
  recipientId: string | null;
  recipientDisplayName: string | null;
  sentAt: string;
  note: string | null;
  drafts: Array<{ kind: DraftKind; payload: Record<string, unknown> }>;
}

export interface OutboxListRow {
  requestId: string;
  pieceId: string;
  pieceTitle: string | null;
  recipientId: string | null;
  recipientDisplayName: string | null;
  note: string | null;
  createdAt: string;
  draftCount: number;
}

/** List the viewer's own outbox (unsent) requests for the Requests admin tab. */
export async function fetchOutboxList(): Promise<OutboxListRow[]> {
  const { data: reqs, error } = await supabase
    .from('contribution_requests')
    .select('id, piece_id, recipient_id, note, created_at')
    .is('sent_at', null)
    .order('created_at', { ascending: false });
  if (error || !reqs || reqs.length === 0) return [];

  const pieceIds = [...new Set(reqs.map((r) => r.piece_id as string))];
  const recipientIds = [...new Set(reqs.map((r) => r.recipient_id).filter((x): x is string => Boolean(x)))];
  const requestIds = reqs.map((r) => r.id as string);

  const [piecesRes, usersRes, draftsRes] = await Promise.all([
    supabase.from('pieces').select('id, title').in('id', pieceIds),
    recipientIds.length > 0
      ? supabase.from('users').select('id, display_name').in('id', recipientIds)
      : Promise.resolve({ data: [] as { id: string; display_name: string | null }[] }),
    supabase.rpc('fetch_sender_drafts_archive', { p_request_id: null as never }),
  ]);

  const pieceById = new Map((piecesRes.data ?? []).map((p) => [p.id as string, p.title as string | null]));
  const userById = new Map((usersRes.data ?? []).map((u) => [u.id as string, u.display_name as string | null]));
  const countByRequest = new Map<string, number>();
  if (Array.isArray(draftsRes.data)) {
    for (const row of draftsRes.data as Array<{ request_id: string }>) {
      countByRequest.set(row.request_id, (countByRequest.get(row.request_id) ?? 0) + 1);
    }
  }

  return reqs.map((r) => ({
    requestId: r.id as string,
    pieceId: r.piece_id as string,
    pieceTitle: pieceById.get(r.piece_id as string) ?? null,
    recipientId: (r.recipient_id as string | null) ?? null,
    recipientDisplayName: r.recipient_id ? userById.get(r.recipient_id as string) ?? null : null,
    note: (r.note as string | null) ?? null,
    createdAt: r.created_at as string,
    draftCount: countByRequest.get(r.id as string) ?? 0,
  }));
}

/** List the viewer's sent-request archive for the Requests admin tab. */
export async function fetchSentArchiveList(limit = 20): Promise<SentRequestArchiveRow[]> {
  const { data, error } = await supabase
    .from('sent_request_archive')
    .select('id, original_request_id, piece_id, recipient_id, recipient_display_name, sent_at, note, drafts')
    .order('sent_at', { ascending: false })
    .limit(limit);
  if (error || !data) return [];

  const pieceIds = [...new Set(data.map((r) => r.piece_id as string))];
  const piecesRes = await supabase.from('pieces').select('id, title').in('id', pieceIds);
  const pieceById = new Map((piecesRes.data ?? []).map((p) => [p.id as string, p.title as string | null]));

  return data.map((r) => ({
    id: r.id as string,
    originalRequestId: r.original_request_id as string,
    pieceId: r.piece_id as string,
    pieceTitle: pieceById.get(r.piece_id as string) ?? null,
    recipientId: (r.recipient_id as string | null) ?? null,
    recipientDisplayName: (r.recipient_display_name as string | null) ?? null,
    sentAt: r.sent_at as string,
    note: (r.note as string | null) ?? null,
    drafts: (r.drafts as Array<{ kind: DraftKind; payload: Record<string, unknown> }>) ?? [],
  }));
}
