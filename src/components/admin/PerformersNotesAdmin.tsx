// Staff authoring surface for performer's notes. Deliberately unpolished —
// PRD treats Tier 1 as data-model + admin view, not styled product. The goal
// is a reliable scaffold: create a draft on behalf of a contributor, revise
// after a rejection, submit, retract, see status at a glance.
//
// The contributor-facing UX lives at /notifications. This page is for
// Editorial Director and staff.

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

type DraftStatus = 'draft' | 'awaiting_contributor_approval' | 'published' | 'removed';

interface Piece {
  id: string;
  title: string;
  composer_name: string;
  catalog_number: string | null;
}

interface Contributor {
  id: string;
  display_name: string;
}

interface NoteVersion {
  id: string;
  version_number: number;
  body: string;
  approved_at: string | null;
  rejection_note: string | null;
  created_at: string;
}

interface NoteRow {
  id: string;
  piece: Piece;
  contributor: Contributor;
  status: DraftStatus;
  current_version_id: string | null;
  drafted_by_name: string | null;
  versions: NoteVersion[];
  created_at: string;
  updated_at: string;
}

export default function PerformersNotesAdmin() {
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create form
  const [pieceId, setPieceId] = useState<string>('');
  const [contributorId, setContributorId] = useState<string>('');
  const [body, setBody] = useState<string>('');
  const [creating, setCreating] = useState<boolean>(false);

  // Per-row state
  const [rowBusy, setRowBusy] = useState<Record<string, boolean>>({});
  const [reviseOpen, setReviseOpen] = useState<Record<string, boolean>>({});
  const [reviseBody, setReviseBody] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<'all' | DraftStatus>('awaiting_contributor_approval');

  const reload = useCallback(async () => {
    setError(null);

    const [piecesRes, contribRes, notesRes] = await Promise.all([
      supabase.from('pieces').select('id, title, composer_name, catalog_number').order('title'),
      supabase
        .from('users')
        .select('id, display_name')
        .eq('is_contributor', true)
        .eq('contributor_active', true)
        .order('display_name'),
      supabase
        .from('performers_notes')
        .select('id, piece_id, contributor_id, status, current_version_id, drafted_by, created_at, updated_at')
        .order('updated_at', { ascending: false }),
    ]);
    if (piecesRes.error) { setError(piecesRes.error.message); return; }
    if (contribRes.error) { setError(contribRes.error.message); return; }
    if (notesRes.error) { setError(notesRes.error.message); return; }

    setPieces(piecesRes.data ?? []);
    setContributors(contribRes.data ?? []);

    // Pre-select default contributor if exactly one exists.
    if ((contribRes.data?.length ?? 0) === 1) {
      setContributorId(contribRes.data![0].id);
    }

    const rawNotes = notesRes.data ?? [];
    if (rawNotes.length === 0) {
      setNotes([]);
      setLoading(false);
      return;
    }

    const noteIds = rawNotes.map((n) => n.id);
    const drafterIds = [...new Set(rawNotes.map((n) => n.drafted_by).filter((x): x is string => Boolean(x)))];
    const contribIds = [...new Set(rawNotes.map((n) => n.contributor_id))];

    const [versionsRes, draftersRes, contribLookupRes] = await Promise.all([
      supabase
        .from('performers_note_versions')
        .select('id, note_id, version_number, body, approved_at, rejection_note, created_at')
        .in('note_id', noteIds)
        .order('version_number', { ascending: false }),
      drafterIds.length
        ? supabase.from('users').select('id, display_name').in('id', drafterIds)
        : Promise.resolve({ data: [], error: null as null | { message: string } }),
      supabase.from('users').select('id, display_name').in('id', contribIds),
    ]);
    if (versionsRes.error) { setError(versionsRes.error.message); return; }
    if (draftersRes.error) { setError(draftersRes.error.message); return; }
    if (contribLookupRes.error) { setError(contribLookupRes.error.message); return; }

    const pieceById = new Map((piecesRes.data ?? []).map((p) => [p.id, p]));
    const drafterById = new Map((draftersRes.data ?? []).map((u) => [u.id, u.display_name]));
    const contributorById = new Map((contribLookupRes.data ?? []).map((u) => [u.id, u.display_name]));

    const versionsByNote = new Map<string, NoteVersion[]>();
    for (const v of versionsRes.data ?? []) {
      const arr = versionsByNote.get(v.note_id) ?? [];
      arr.push({
        id: v.id,
        version_number: v.version_number,
        body: v.body,
        approved_at: v.approved_at,
        rejection_note: v.rejection_note,
        created_at: v.created_at,
      });
      versionsByNote.set(v.note_id, arr);
    }

    const hydrated: NoteRow[] = [];
    for (const n of rawNotes) {
      const piece = pieceById.get(n.piece_id);
      if (!piece) continue;
      hydrated.push({
        id: n.id,
        piece,
        contributor: { id: n.contributor_id, display_name: contributorById.get(n.contributor_id) ?? 'Unknown' },
        status: n.status as DraftStatus,
        current_version_id: n.current_version_id,
        drafted_by_name: n.drafted_by ? drafterById.get(n.drafted_by) ?? null : null,
        versions: versionsByNote.get(n.id) ?? [],
        created_at: n.created_at,
        updated_at: n.updated_at,
      });
    }
    setNotes(hydrated);
    setLoading(false);
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  async function handleCreate(options: { submitAfter: boolean }) {
    if (!pieceId) { setError('Pick a piece.'); return; }
    if (!contributorId) { setError('Pick a contributor.'); return; }
    if (body.trim().length === 0) { setError('Body required.'); return; }

    setCreating(true);
    setError(null);
    const { data: noteId, error: createErr } = await supabase.rpc('create_performers_note_draft', {
      p_piece_id: pieceId,
      p_contributor_id: contributorId,
      p_body: body,
    });
    if (createErr) { setError(createErr.message); setCreating(false); return; }

    if (options.submitAfter) {
      const { error: submitErr } = await supabase.rpc('submit_performers_note', { p_note_id: noteId });
      if (submitErr) { setError(submitErr.message); setCreating(false); return; }
    }

    setBody('');
    setCreating(false);
    await reload();
    notifyChanged();
  }

  function notifyChanged() {
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('notifications:changed'));
  }

  async function handleSubmit(noteId: string) {
    setRowBusy((b) => ({ ...b, [noteId]: true })); setError(null);
    const { error: err } = await supabase.rpc('submit_performers_note', { p_note_id: noteId });
    setRowBusy((b) => ({ ...b, [noteId]: false }));
    if (err) { setError(err.message); return; }
    await reload();
    notifyChanged();
  }

  async function handleRetract(noteId: string) {
    setRowBusy((b) => ({ ...b, [noteId]: true })); setError(null);
    const { error: err } = await supabase.rpc('retract_performers_note', { p_note_id: noteId });
    setRowBusy((b) => ({ ...b, [noteId]: false }));
    if (err) { setError(err.message); return; }
    await reload();
    notifyChanged();
  }

  async function handleRevise(noteId: string) {
    const newBody = reviseBody[noteId] ?? '';
    if (newBody.trim().length === 0) { setError('Revision body required.'); return; }
    setRowBusy((b) => ({ ...b, [noteId]: true })); setError(null);
    const { error: err } = await supabase.rpc('update_performers_note_draft', {
      p_note_id: noteId,
      p_body: newBody,
    });
    setRowBusy((b) => ({ ...b, [noteId]: false }));
    if (err) { setError(err.message); return; }
    setReviseOpen((o) => ({ ...o, [noteId]: false }));
    setReviseBody((b) => ({ ...b, [noteId]: '' }));
    await reload();
  }

  if (loading) return <div className="text-sm text-[#6F6F6F]">Loading…</div>;

  const filtered = filter === 'all' ? notes : notes.filter((n) => n.status === filter);

  const canSend = Boolean(pieceId && contributorId && body.trim().length > 0 && !creating);
  const noContributor = contributors.length === 0;

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-lg border-[0.5px] border-[#A32D2D] bg-[#F7E4E4] px-4 py-3 text-sm text-[#A32D2D]">
          {error}
        </div>
      )}

      {/* Create a new draft */}
      <section className="border-[0.5px] border-[#E5E3DE] rounded-xl bg-white p-5">
        <h2 className="font-display text-[20px] mb-1 text-[#1A1A1A]">New draft</h2>
        <p className="text-xs text-[#6F6F6F] mb-4">
          Authored on the contributor's behalf. They approve it before it publishes.
        </p>

        {noContributor && (
          <div className="rounded-lg bg-[#FAF2DB] border-[0.5px] border-[#8B6914] text-[#8B6914] text-xs px-3 py-2 mb-3">
            No active contributors yet. Promote one via <code>scripts/seed-contributor.ts</code> before drafting.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <label className="block text-xs text-[#6F6F6F]">
            Piece
            <select
              value={pieceId}
              onChange={(e) => setPieceId(e.target.value)}
              className="mt-1 w-full px-3 py-2 text-sm text-[#1A1A1A] border-[0.5px] border-[#CCC9C2] rounded-lg bg-white"
            >
              <option value="">— select a piece —</option>
              {pieces.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}{p.catalog_number ? ` (${p.catalog_number})` : ''} — {p.composer_name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-[#6F6F6F]">
            Contributor
            <select
              value={contributorId}
              onChange={(e) => setContributorId(e.target.value)}
              disabled={noContributor}
              className="mt-1 w-full px-3 py-2 text-sm text-[#1A1A1A] border-[0.5px] border-[#CCC9C2] rounded-lg bg-white disabled:bg-[#F8F7F4] disabled:text-[#9A9A9A]"
            >
              {contributors.length === 1 ? (
                <option value={contributors[0].id}>{contributors[0].display_name}</option>
              ) : (
                <>
                  <option value="">— select a contributor —</option>
                  {contributors.map((c) => (
                    <option key={c.id} value={c.id}>{c.display_name}</option>
                  ))}
                </>
              )}
            </select>
          </label>
        </div>

        <label className="block text-xs text-[#6F6F6F] mb-3">
          Body
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            placeholder="Proposed performer's note…"
            className="mt-1 w-full px-3 py-2 text-[15px] font-display leading-[1.68] text-[#1A1A1A] border-[0.5px] border-[#CCC9C2] rounded-lg resize-y bg-white"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleCreate({ submitAfter: true })}
            disabled={!canSend || noContributor}
            className="inline-flex items-center px-4 py-2 bg-[#1A1A1A] text-white text-sm font-medium rounded-lg hover:bg-[#292524] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? 'Sending…' : 'Send to contributor'}
          </button>
          <button
            type="button"
            onClick={() => handleCreate({ submitAfter: false })}
            disabled={!canSend || noContributor}
            className="inline-flex items-center px-4 py-2 bg-transparent text-[#1A1A1A] text-sm font-medium border-[0.5px] border-[#CCC9C2] rounded-lg hover:bg-[#F8F7F4] disabled:opacity-50"
          >
            Save as draft only
          </button>
        </div>
      </section>

      {/* Existing notes */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-[20px] text-[#1A1A1A]">Notes</h2>
          <div className="flex gap-1 text-xs">
            {(['awaiting_contributor_approval', 'draft', 'published', 'removed', 'all'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-2 py-1 rounded ${filter === f ? 'bg-[#F2EEF5] text-[#6B4E7C]' : 'bg-transparent text-[#6F6F6F] hover:text-[#1A1A1A]'}`}
              >
                {f === 'awaiting_contributor_approval' ? 'awaiting' : f}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-xl border-[0.5px] border-[#E5E3DE] bg-white px-5 py-8 text-center text-sm text-[#6F6F6F]">
            Nothing here.
          </div>
        ) : (
          <ul className="space-y-3">
            {filtered.map((n) => {
              const busy = rowBusy[n.id] ?? false;
              const pending = n.versions.find((v) => v.approved_at === null);
              const currentVersion = n.versions.find((v) => v.id === n.current_version_id);
              const rejected = n.versions.filter((v) => v.rejection_note);
              return (
                <li key={n.id} className="rounded-xl border-[0.5px] border-[#E5E3DE] bg-white p-4">
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <div className="font-display text-[18px] text-[#1A1A1A] leading-tight">
                      {n.piece.title}{n.piece.catalog_number && (
                        <span className="ml-2 text-[11px] font-mono text-[#9A9A9A] tracking-wide">{n.piece.catalog_number}</span>
                      )}
                    </div>
                    <StatusPill status={n.status} />
                  </div>
                  <div className="text-xs text-[#6F6F6F] mb-3">
                    for {n.contributor.display_name} &middot; {n.drafted_by_name ? `drafted by ${n.drafted_by_name}` : 'self-authored'} &middot; {n.versions.length} version{n.versions.length === 1 ? '' : 's'}
                  </div>

                  {/* Rejection notes — visible inline so staff learn from them */}
                  {rejected.length > 0 && (
                    <div className="mb-3 rounded-lg bg-[#FAF2DB] border-[0.5px] border-[#8B6914] text-[#8B6914] text-xs px-3 py-2 space-y-1">
                      {rejected.map((r) => (
                        <div key={r.id}>
                          <span className="font-medium">rejected v{r.version_number}:</span> {r.rejection_note}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Current body preview (pending or published) */}
                  {(pending || currentVersion) && (
                    <pre
                      className="px-3 py-2 mb-3 bg-[#F8F7F4] border-[0.5px] border-[#E5E3DE] rounded-lg font-display text-[14px] leading-[1.55] text-[#1A1A1A] whitespace-pre-wrap"
                    >
                      {(pending ?? currentVersion)!.body}
                    </pre>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    {n.status === 'draft' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleSubmit(n.id)}
                          disabled={busy}
                          className="px-3 py-1.5 bg-[#1A1A1A] text-white text-xs font-medium rounded-lg hover:bg-[#292524] disabled:opacity-50"
                        >
                          {busy ? 'Sending…' : 'Send to contributor'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setReviseOpen((o) => ({ ...o, [n.id]: !(o[n.id] ?? false) }));
                            setReviseBody((b) => ({ ...b, [n.id]: (pending ?? currentVersion)?.body ?? '' }));
                          }}
                          disabled={busy}
                          className="px-3 py-1.5 bg-transparent text-[#1A1A1A] text-xs font-medium border-[0.5px] border-[#CCC9C2] rounded-lg hover:bg-[#F8F7F4] disabled:opacity-50"
                        >
                          {reviseOpen[n.id] ? 'Close' : 'Revise'}
                        </button>
                      </>
                    )}
                    {n.status === 'awaiting_contributor_approval' && (
                      <button
                        type="button"
                        onClick={() => handleRetract(n.id)}
                        disabled={busy}
                        className="px-3 py-1.5 bg-transparent text-[#1A1A1A] text-xs font-medium border-[0.5px] border-[#CCC9C2] rounded-lg hover:bg-[#F8F7F4] disabled:opacity-50"
                      >
                        {busy ? 'Retracting…' : 'Retract'}
                      </button>
                    )}
                  </div>

                  {/* Revise form */}
                  {n.status === 'draft' && reviseOpen[n.id] && (
                    <div className="mt-3">
                      <textarea
                        value={reviseBody[n.id] ?? ''}
                        onChange={(e) => setReviseBody((b) => ({ ...b, [n.id]: e.target.value }))}
                        rows={5}
                        className="w-full px-3 py-2 text-[15px] font-display leading-[1.68] text-[#1A1A1A] border-[0.5px] border-[#CCC9C2] rounded-lg resize-y bg-white"
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => handleRevise(n.id)}
                          disabled={busy}
                          className="px-3 py-1.5 bg-[#1A1A1A] text-white text-xs font-medium rounded-lg hover:bg-[#292524] disabled:opacity-50"
                        >
                          {busy ? 'Saving…' : 'Save new version'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setReviseOpen((o) => ({ ...o, [n.id]: false }))}
                          disabled={busy}
                          className="px-3 py-1.5 bg-transparent text-[#1A1A1A] text-xs font-medium border-[0.5px] border-[#CCC9C2] rounded-lg hover:bg-[#F8F7F4] disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatusPill({ status }: { status: DraftStatus }) {
  const styles: Record<DraftStatus, { bg: string; color: string; border: string; label: string }> = {
    draft:                         { bg: '#F8F7F4', color: '#6F6F6F', border: '#CCC9C2', label: 'draft' },
    awaiting_contributor_approval: { bg: '#F2EEF5', color: '#6B4E7C', border: '#D9CCE1', label: 'awaiting' },
    published:                     { bg: '#E6F1E9', color: '#2D6A3F', border: '#2D6A3F', label: 'published' },
    removed:                       { bg: '#F8F7F4', color: '#9A9A9A', border: '#CCC9C2', label: 'removed' },
  };
  const s = styles[status];
  return (
    <span
      className="text-[10px] font-medium tracking-wider uppercase px-2 py-0.5 rounded-full shrink-0"
      style={{ background: s.bg, color: s.color, border: `0.5px solid ${s.border}` }}
    >
      {s.label}
    </span>
  );
}
