// Shared compose-draft hook. Each section component that supports drafting
// (PerformersNotes, InterpretiveSchools, SignedPieceDescription) calls this
// with its own pieceId + kind and gets back:
//
//   enabled        — whether compose mode applies on this page load
//   myDraft        — the existing draft for this (request, kind), or null
//   propose(p)     — create a new draft
//   update(p)      — edit the existing draft
//   remove()       — delete the existing draft
//   busy, error, refresh
//
// The hook reads ?compose=<request_id> from the URL, validates that the
// request is in outbox state and owned by the current viewer (sender +
// staff), and only returns enabled=true when all those are satisfied. Gates
// are defense-in-depth; the RPCs also enforce every rule server-side.

import { useCallback, useEffect, useState } from 'react';
import { supabase, hasSupabase } from './supabase';
import {
  deleteOutboxDraft,
  fetchSenderDraftsForRequest,
  proposeDraft,
  updateOutboxDraft,
  type DraftKind,
  type OutboxDraft,
} from './contributionDrafts';

interface Options {
  pieceId: string;
  kind: DraftKind;
}

interface Result {
  enabled: boolean;
  ready: boolean;
  requestId: string | null;
  myDraft: OutboxDraft | null;
  busy: boolean;
  error: string | null;
  propose: (payload: Record<string, unknown>) => Promise<boolean>;
  update: (payload: Record<string, unknown>) => Promise<boolean>;
  remove: () => Promise<boolean>;
  clearError: () => void;
}

function readComposeRequestIdFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const raw = params.get('compose');
  return raw && /^[0-9a-f-]{8,}$/i.test(raw) ? raw : null;
}

function fireDraftsChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('drafts:changed'));
  }
}

function mapError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('a draft of this kind already exists')) {
    return 'You already have a draft of this kind on this request. Edit it instead.';
  }
  if (m.includes('already sent')) return 'This request was already sent in another tab.';
  if (m.includes('payload.body required')) return 'Body is required.';
  if (m.includes('payload.name required')) return 'Name is required.';
  if (m.includes('exceeds 40000')) return 'Body too long (40,000 character limit).';
  if (m.includes('exceeds 200')) return 'Name too long (200 character limit).';
  return message;
}

export function useComposeDraft({ pieceId, kind }: Options): Result {
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [myDraft, setMyDraft] = useState<OutboxDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (rid: string) => {
    const rows = await fetchSenderDraftsForRequest(rid);
    setMyDraft(rows.find((r) => r.kind === kind) ?? null);
  }, [kind]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!hasSupabase) { setEnabled(false); setReady(true); return; }
      const rid = readComposeRequestIdFromUrl();
      if (!rid) { setEnabled(false); setReady(true); return; }

      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!session?.user) { setEnabled(false); setReady(true); return; }

      const { data: profile } = await supabase
        .from('users').select('role').eq('id', session.user.id).single();
      if (cancelled) return;
      const role = (profile as { role?: string } | null)?.role ?? null;
      if (role !== 'admin' && role !== 'moderator') {
        setEnabled(false); setReady(true); return;
      }

      const { data: req } = await supabase
        .from('contribution_requests')
        .select('sender_id, piece_id, sent_at')
        .eq('id', rid)
        .maybeSingle();
      if (cancelled) return;
      const r = req as { sender_id?: string; piece_id?: string; sent_at?: string | null } | null;
      if (!r || r.sender_id !== session.user.id || r.piece_id !== pieceId || r.sent_at !== null) {
        setEnabled(false); setReady(true); return;
      }

      setRequestId(rid);
      await refresh(rid);
      if (cancelled) return;
      setEnabled(true);
      setReady(true);
    }

    void init();

    // Cross-section draft changes: when a different section dispatches
    // drafts:changed, refresh our local state in case the count/kinds changed
    // (mostly relevant for the banner's count, but a draft being removed
    // elsewhere shouldn't leave this section rendering stale state either).
    function onChange() {
      if (requestId) void refresh(requestId);
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('drafts:changed', onChange);
    }

    return () => {
      cancelled = true;
      if (typeof window !== 'undefined') {
        window.removeEventListener('drafts:changed', onChange);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pieceId, kind]);

  const propose = useCallback(async (payload: Record<string, unknown>): Promise<boolean> => {
    if (!requestId || busy) return false;
    setBusy(true); setError(null);
    const { errorMessage } = await proposeDraft(requestId, kind, payload);
    setBusy(false);
    if (errorMessage) { setError(mapError(errorMessage)); return false; }
    await refresh(requestId);
    fireDraftsChanged();
    return true;
  }, [requestId, kind, busy, refresh]);

  const update = useCallback(async (payload: Record<string, unknown>): Promise<boolean> => {
    if (!requestId || busy || !myDraft) return false;
    setBusy(true); setError(null);
    const { errorMessage } = await updateOutboxDraft(myDraft.id, payload);
    setBusy(false);
    if (errorMessage) { setError(mapError(errorMessage)); return false; }
    await refresh(requestId);
    fireDraftsChanged();
    return true;
  }, [requestId, busy, myDraft, refresh]);

  const remove = useCallback(async (): Promise<boolean> => {
    if (!requestId || busy || !myDraft) return false;
    setBusy(true); setError(null);
    const { errorMessage } = await deleteOutboxDraft(myDraft.id);
    setBusy(false);
    if (errorMessage) { setError(mapError(errorMessage)); return false; }
    await refresh(requestId);
    fireDraftsChanged();
    return true;
  }, [requestId, busy, myDraft, refresh]);

  const clearError = useCallback(() => setError(null), []);

  return { enabled, ready, requestId, myDraft, busy, error, propose, update, remove, clearError };
}
