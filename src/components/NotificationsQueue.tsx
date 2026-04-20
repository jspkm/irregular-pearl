// Contributor approval queue. Lists drafts attributed to the logged-in
// contributor that are awaiting their review. For each draft:
//
//   • piece title + link, drafter meta
//   • current proposed body in the signed-notes pattern (serif, 2px purple
//     left border)
//   • action row: Approve, Approve and edit (inline textarea), Reject
//     (inline confirmation with optional freeform reason — no native dialog)
//
// For Slice A the queue is effectively a single-user surface (v1 contributor
// is H. alone). RLS on performers_notes scopes reads to the caller; RPCs
// enforce ownership on mutations. The diff block against prior versions is
// deferred to v1.1 per the plan-eng-review decisions.

import { useEffect, useState, useCallback } from 'react';
import { supabase, hasSupabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

type Status = 'loading' | 'unauthed' | 'not-contributor' | 'ready';

interface PendingDraft {
  noteId: string;
  pieceId: string;
  pieceTitle: string;
  composerName: string;
  catalogNumber: string | null;
  drafterName: string | null;
  body: string;
  versionNumber: number;
  pendingVersionId: string;
  createdAt: string;
}

interface ContributorProfile {
  displayName: string;
  bioShort: string | null;
}

type ItemAction = null | 'approve' | 'approve-and-edit' | 'reject';

export default function NotificationsQueue() {
  const [status, setStatus] = useState<Status>('loading');
  const [profile, setProfile] = useState<ContributorProfile | null>(null);
  const [drafts, setDrafts] = useState<PendingDraft[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [actionById, setActionById] = useState<Record<string, ItemAction>>({});
  const [busyById, setBusyById] = useState<Record<string, boolean>>({});

  const loadQueue = useCallback(async (session: Session) => {
    setError(null);

    // Profile check: must be an active contributor.
    const { data: profileRow, error: profileErr } = await supabase
      .from('users')
      .select('is_contributor, contributor_active, display_name, contributor_bio_short')
      .eq('id', session.user.id)
      .single();
    if (profileErr) {
      setError(profileErr.message);
      return;
    }
    if (!profileRow?.is_contributor || !profileRow.contributor_active) {
      setStatus('not-contributor');
      return;
    }
    setProfile({
      displayName: profileRow.display_name,
      bioShort: profileRow.contributor_bio_short ?? null,
    });

    // Pending drafts for this contributor.
    const { data: notes, error: notesErr } = await supabase
      .from('performers_notes')
      .select('id, piece_id, created_at')
      .eq('contributor_id', session.user.id)
      .eq('status', 'awaiting_contributor_approval')
      .order('created_at', { ascending: false });
    if (notesErr) {
      setError(notesErr.message);
      return;
    }
    if (!notes || notes.length === 0) {
      setDrafts([]);
      setStatus('ready');
      return;
    }

    const noteIds = notes.map((n) => n.id);
    const pieceIds = [...new Set(notes.map((n) => n.piece_id))];

    // Fetch pending versions (unapproved), pieces, and drafters in parallel.
    const [versionsRes, piecesRes, fullNotesRes] = await Promise.all([
      supabase
        .from('performers_note_versions')
        .select('id, note_id, body, version_number')
        .in('note_id', noteIds)
        .is('approved_at', null)
        .order('version_number', { ascending: false }),
      supabase.from('pieces').select('id, title, composer_name, catalog_number').in('id', pieceIds),
      supabase.from('performers_notes').select('id, drafted_by').in('id', noteIds),
    ]);
    if (versionsRes.error) { setError(versionsRes.error.message); return; }
    if (piecesRes.error) { setError(piecesRes.error.message); return; }
    if (fullNotesRes.error) { setError(fullNotesRes.error.message); return; }

    const draftedByIds = [
      ...new Set(
        (fullNotesRes.data ?? [])
          .map((n) => n.drafted_by)
          .filter((x): x is string => Boolean(x)),
      ),
    ];
    const draftersRes = draftedByIds.length
      ? await supabase.from('users').select('id, display_name').in('id', draftedByIds)
      : { data: [], error: null as null | { message: string } };
    if (draftersRes.error) { setError(draftersRes.error.message); return; }

    const pieceById = new Map((piecesRes.data ?? []).map((p) => [p.id, p]));
    const drafterById = new Map((draftersRes.data ?? []).map((u) => [u.id, u.display_name]));
    const drafterIdByNoteId = new Map(
      (fullNotesRes.data ?? []).map((n) => [n.id, n.drafted_by as string | null]),
    );
    // Keep only the highest version_number per note (first item after desc order).
    const latestVersionByNoteId = new Map<string, { id: string; body: string; version_number: number }>();
    for (const v of versionsRes.data ?? []) {
      if (!latestVersionByNoteId.has(v.note_id)) {
        latestVersionByNoteId.set(v.note_id, { id: v.id, body: v.body, version_number: v.version_number });
      }
    }

    const rows: PendingDraft[] = [];
    for (const n of notes) {
      const piece = pieceById.get(n.piece_id);
      const version = latestVersionByNoteId.get(n.id);
      if (!piece || !version) continue;
      const drafterId = drafterIdByNoteId.get(n.id);
      rows.push({
        noteId: n.id,
        pieceId: n.piece_id,
        pieceTitle: piece.title,
        composerName: piece.composer_name,
        catalogNumber: piece.catalog_number ?? null,
        drafterName: drafterId ? drafterById.get(drafterId) ?? null : null,
        body: version.body,
        versionNumber: version.version_number,
        pendingVersionId: version.id,
        createdAt: n.created_at,
      });
    }

    setDrafts(rows);
    setStatus('ready');
  }, []);

  useEffect(() => {
    if (!hasSupabase) { setStatus('unauthed'); return; }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { setStatus('unauthed'); return; }
      void loadQueue(session);
    });
  }, [loadQueue]);

  async function refresh() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) await loadQueue(session);
  }

  function notifyChanged() {
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('notifications:changed'));
  }

  async function handleApprove(noteId: string) {
    setBusyById((b) => ({ ...b, [noteId]: true }));
    setError(null);
    const { error: rpcErr } = await supabase.rpc('approve_performers_note', { p_note_id: noteId });
    setBusyById((b) => ({ ...b, [noteId]: false }));
    if (rpcErr) { setError(rpcErr.message); return; }
    // Remove the row locally; avoids a round-trip.
    setDrafts((rows) => rows.filter((r) => r.noteId !== noteId));
    setActionById((a) => ({ ...a, [noteId]: null }));
    notifyChanged();
  }

  async function handleApproveAndEdit(noteId: string, body: string) {
    setBusyById((b) => ({ ...b, [noteId]: true }));
    setError(null);
    const { error: rpcErr } = await supabase.rpc('approve_and_edit_performers_note', {
      p_note_id: noteId,
      p_body: body,
    });
    setBusyById((b) => ({ ...b, [noteId]: false }));
    if (rpcErr) { setError(rpcErr.message); return; }
    setDrafts((rows) => rows.filter((r) => r.noteId !== noteId));
    setActionById((a) => ({ ...a, [noteId]: null }));
    notifyChanged();
  }

  async function handleReject(noteId: string, reason: string) {
    setBusyById((b) => ({ ...b, [noteId]: true }));
    setError(null);
    const { error: rpcErr } = await supabase.rpc('reject_performers_note', {
      p_note_id: noteId,
      p_reason: reason || null,
    });
    setBusyById((b) => ({ ...b, [noteId]: false }));
    if (rpcErr) { setError(rpcErr.message); return; }
    setDrafts((rows) => rows.filter((r) => r.noteId !== noteId));
    setActionById((a) => ({ ...a, [noteId]: null }));
    notifyChanged();
  }

  if (status === 'loading') {
    return <div className="text-sm text-muted font-body">Loading your queue…</div>;
  }
  if (status === 'unauthed') {
    return (
      <div className="font-body">
        <h1 className="text-2xl font-display text-ink mb-3">Your queue</h1>
        <p className="text-sm text-muted">You need to be signed in to see your approval queue.</p>
      </div>
    );
  }
  if (status === 'not-contributor') {
    return (
      <div className="font-body">
        <h1 className="text-2xl font-display text-ink mb-3">Your queue</h1>
        <p className="text-sm text-muted">
          The queue is for signed contributors. If you think you should have access, reach out to the
          Editorial Director.
        </p>
      </div>
    );
  }

  return (
    <div className="font-body">
      <h1 className="text-[28px] font-display text-ink mb-1 tracking-tight">Your queue</h1>
      <p className="text-sm text-muted mb-8">
        Drafts waiting for your review. Approve as-is, edit and then approve, or send back with a note.
      </p>

      {error && (
        <div className="mb-6 rounded-lg border-[0.5px] border-[#A32D2D] bg-[#F7E4E4] px-4 py-3 text-sm text-[#A32D2D]">
          {error}
        </div>
      )}

      {drafts.length === 0 ? (
        <div className="rounded-xl border-[0.5px] border-border bg-surface px-5 py-8 text-center">
          <p className="text-sm text-muted">Nothing waiting. When staff routes a draft to you, it'll appear here.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {drafts.map((d) => {
            const currentAction = actionById[d.noteId] ?? null;
            const busy = busyById[d.noteId] ?? false;
            return (
              <li
                key={d.noteId}
                className="rounded-xl border-[0.5px] border-border bg-surface p-5"
              >
                {/* Context: where this will appear */}
                <div
                  className="text-[11px] font-medium tracking-[0.08em] uppercase mb-4"
                  style={{ color: 'var(--color-accent)' }}
                >
                  Performer's note &middot; on the piece page
                </div>

                {/* Piece header — mirror the piece-page H1 + byline format */}
                <div className="pb-4 mb-5 border-b-[0.5px] border-border">
                  <div className="flex items-baseline flex-wrap gap-x-3 gap-y-1">
                    <a
                      href={`/piece/${d.pieceId}`}
                      className="font-display text-[22px] text-ink leading-tight tracking-tight no-underline hover:underline"
                    >
                      {d.pieceTitle}
                    </a>
                    {d.catalogNumber && (
                      <span className="text-[11px] font-mono text-tertiary tracking-wide">
                        {d.catalogNumber}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-sm text-muted">
                    by <span className="text-ink">{d.composerName}</span>
                  </div>
                </div>

                {/* Preview of the signed unit exactly as it will render on the piece page */}
                <div
                  className="pl-[18px] border-l-2 mb-2 font-display text-[16px] text-ink leading-[1.68] whitespace-pre-wrap"
                  style={{ borderLeftColor: 'var(--color-accent)' }}
                >
                  {d.body}
                </div>
                {profile && (
                  <div className="pl-[18px] mb-1 font-body">
                    <div className="text-sm text-ink font-medium">{profile.displayName}</div>
                    {profile.bioShort && (
                      <div className="text-xs text-muted">{profile.bioShort}</div>
                    )}
                  </div>
                )}

                <div className="text-[11px] text-tertiary mt-4 mb-4">
                  {d.drafterName ? `drafted by ${d.drafterName}` : 'drafted on your behalf'} &middot; v{d.versionNumber}
                </div>

                {currentAction === null && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleApprove(d.noteId)}
                      disabled={busy}
                      className="inline-flex items-center px-4 py-2 bg-ink text-white text-sm font-medium rounded-lg hover:bg-[#292524] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {busy ? 'Approving…' : 'Approve'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActionById((a) => ({ ...a, [d.noteId]: 'approve-and-edit' }))}
                      disabled={busy}
                      className="inline-flex items-center px-4 py-2 bg-transparent text-ink text-sm font-medium border-[0.5px] border-border-strong rounded-lg hover:bg-[#F8F7F4] disabled:opacity-50 transition-colors"
                    >
                      Edit and approve
                    </button>
                    <button
                      type="button"
                      onClick={() => setActionById((a) => ({ ...a, [d.noteId]: 'reject' }))}
                      disabled={busy}
                      className="inline-flex items-center px-4 py-2 bg-transparent text-ink text-sm font-medium border-[0.5px] border-border-strong rounded-lg hover:bg-[#F8F7F4] disabled:opacity-50 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                )}

                {currentAction === 'approve-and-edit' && (
                  <EditForm
                    initialBody={d.body}
                    submitting={busy}
                    onCancel={() => setActionById((a) => ({ ...a, [d.noteId]: null }))}
                    onSubmit={(newBody) => handleApproveAndEdit(d.noteId, newBody)}
                  />
                )}

                {currentAction === 'reject' && (
                  <RejectForm
                    submitting={busy}
                    onCancel={() => setActionById((a) => ({ ...a, [d.noteId]: null }))}
                    onSubmit={(reason) => handleReject(d.noteId, reason)}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-10">
        <button
          type="button"
          onClick={refresh}
          className="text-xs text-tertiary hover:text-ink underline underline-offset-4"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}

function EditForm(props: {
  initialBody: string;
  submitting: boolean;
  onSubmit: (body: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(props.initialBody);
  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={6}
        className="w-full px-3 py-2 text-[15px] font-display leading-[1.68] text-ink border-[0.5px] border-border-strong rounded-lg focus:outline-none focus:ring-1 focus:ring-accent resize-y"
      />
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => props.onSubmit(value)}
          disabled={props.submitting || value.trim() === ''}
          className="inline-flex items-center px-4 py-2 bg-ink text-white text-sm font-medium rounded-lg hover:bg-[#292524] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {props.submitting ? 'Approving…' : 'Approve'}
        </button>
        <button
          type="button"
          onClick={props.onCancel}
          disabled={props.submitting}
          className="inline-flex items-center px-4 py-2 bg-transparent text-ink text-sm font-medium border-[0.5px] border-border-strong rounded-lg hover:bg-[#F8F7F4] disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function RejectForm(props: {
  submitting: boolean;
  onSubmit: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState('');
  return (
    <div>
      <label className="block text-xs text-muted mb-2 uppercase tracking-wider font-medium">
        Reason (optional, visible to staff)
      </label>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={3}
        placeholder="e.g. The second sentence reads as too prescriptive."
        className="w-full px-3 py-2 text-sm font-body text-ink border-[0.5px] border-border-strong rounded-lg focus:outline-none focus:ring-1 focus:ring-accent resize-y"
      />
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => props.onSubmit(reason)}
          disabled={props.submitting}
          className="inline-flex items-center px-4 py-2 bg-ink text-white text-sm font-medium rounded-lg hover:bg-[#292524] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {props.submitting ? 'Sending back…' : 'Send back'}
        </button>
        <button
          type="button"
          onClick={props.onCancel}
          disabled={props.submitting}
          className="inline-flex items-center px-4 py-2 bg-transparent text-ink text-sm font-medium border-[0.5px] border-border-strong rounded-lg hover:bg-[#F8F7F4] disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
