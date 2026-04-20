// Published performer's notes on a piece page, plus contributor-authored
// affordances (write a note, edit your own, remove your own).
//
// Reads are SSR'd by the parent PiecePageLayout (passed in via
// `initialNotes`). This island hydrates with that same data so there's no
// flicker, then checks auth to decide whether to show:
//   - "Write a note" entry (contributor without an existing published note
//     on this piece)
//   - Edit + Remove affordances on a card the caller owns
//
// All mutations go through the Slice A security-definer RPCs via
// supabase.rpc(); no Astro API layer.

import { useCallback, useEffect, useState } from 'react';
import { supabase, hasSupabase } from '../lib/supabase';
import type { PublishedPerformersNote } from '../lib/performersNotes';

interface Props {
  pieceId: string;
  initialNotes: PublishedPerformersNote[];
}

interface Viewer {
  userId: string | null;
  isContributor: boolean;
  displayName: string | null;
  bioShort: string | null;
}

type Mode = null | 'write' | { action: 'edit'; noteId: string };

export default function PerformersNotes({ pieceId, initialNotes }: Props) {
  const [notes, setNotes] = useState<PublishedPerformersNote[]>(initialNotes);
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const [mode, setMode] = useState<Mode>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadViewer = useCallback(async () => {
    if (!hasSupabase) { setViewer({ userId: null, isContributor: false, displayName: null, bioShort: null }); return; }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      setViewer({ userId: null, isContributor: false, displayName: null, bioShort: null });
      return;
    }

    const { data } = await supabase
      .from('users')
      .select('display_name, is_contributor, contributor_active, contributor_bio_short')
      .eq('id', session.user.id)
      .single();

    setViewer({
      userId: session.user.id,
      isContributor: Boolean(data?.is_contributor && data?.contributor_active),
      displayName: data?.display_name ?? null,
      bioShort: data?.contributor_bio_short ?? null,
    });
  }, []);

  useEffect(() => { void loadViewer(); }, [loadViewer]);

  async function refetchNotes() {
    const { data } = await supabase
      .from('performers_notes')
      .select('id, contributor_id, current_version_id, approved_by_contributor_at')
      .eq('piece_id', pieceId)
      .eq('status', 'published')
      .order('approved_by_contributor_at', { ascending: true });
    if (!data || data.length === 0) { setNotes([]); return; }

    const versionIds = data.map((n) => n.current_version_id).filter((x): x is string => Boolean(x));
    const contribIds = [...new Set(data.map((n) => n.contributor_id))];

    const [versionsRes, contribsRes] = await Promise.all([
      supabase.from('v_performers_note_versions_published').select('id, body, version_number, approved_at').in('id', versionIds),
      supabase.from('users').select('id, display_name, contributor_bio_short').in('id', contribIds),
    ]);
    const vById = new Map((versionsRes.data ?? []).map((v) => [v.id, v]));
    const cById = new Map((contribsRes.data ?? []).map((c) => [c.id, c]));

    const rows: PublishedPerformersNote[] = [];
    for (const n of data) {
      if (!n.current_version_id) continue;
      const v = vById.get(n.current_version_id);
      const c = cById.get(n.contributor_id);
      if (!v || !c) continue;
      rows.push({
        noteId: n.id,
        versionId: v.id,
        body: v.body,
        versionNumber: v.version_number,
        approvedAt: v.approved_at,
        contributor: { id: c.id, displayName: c.display_name, bioShort: c.contributor_bio_short ?? null },
      });
    }
    setNotes(rows);
  }

  async function handleWrite(body: string) {
    if (body.trim().length === 0) { setError('Body required.'); return; }
    setBusy(true); setError(null);
    const { error: err } = await supabase.rpc('publish_contributor_note', { p_piece_id: pieceId, p_body: body });
    setBusy(false);
    if (err) { setError(err.message); return; }
    setMode(null);
    await refetchNotes();
  }

  async function handleEdit(noteId: string, body: string) {
    if (body.trim().length === 0) { setError('Body required.'); return; }
    setBusy(true); setError(null);
    const { error: err } = await supabase.rpc('publish_contributor_edit', { p_note_id: noteId, p_body: body });
    setBusy(false);
    if (err) { setError(err.message); return; }
    setMode(null);
    await refetchNotes();
  }

  async function handleRemove(noteId: string) {
    setBusy(true); setError(null);
    const { error: err } = await supabase.rpc('remove_performers_note', { p_note_id: noteId });
    setBusy(false);
    if (err) { setError(err.message); return; }
    await refetchNotes();
    // remove can auto-clear stragglers via the defensive trigger; ping the bell.
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('notifications:changed'));
  }

  // Can the viewer write a brand-new note? Only if they're an active
  // contributor AND they don't already have a published note on this piece.
  const viewerHasNote = Boolean(
    viewer?.userId && notes.some((n) => n.contributor.id === viewer.userId),
  );
  const canWrite = Boolean(viewer?.isContributor && !viewerHasNote);

  return (
    <div>
      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg border-[0.5px] px-3 py-2 text-sm"
          style={{ background: 'var(--color-error-bg)', color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
        >
          {error}
        </div>
      )}

      {notes.length === 0 ? (
        <p className="empty-state">No performer's notes yet.</p>
      ) : (
        <div className="performers-notes-list">
          {notes.map((note, idx) => {
            const isOwner = viewer?.userId === note.contributor.id;
            const isEditing = typeof mode === 'object' && mode?.action === 'edit' && mode.noteId === note.noteId;
            // First note is primary accent; any siblings get the muted
            // contrasting-voice treatment per DESIGN.md.
            const signedClass = idx === 0 ? 'signed' : 'signed alt';
            return (
              <div key={note.noteId} className={signedClass}>
                {!isEditing && (
                  <>
                    <div className="prose">
                      {note.body.split(/\n\s*\n/).map((para, i) => <p key={i}>{para}</p>)}
                    </div>
                    <div className="by">
                      <span className="name">{note.contributor.displayName}</span>
                      {note.contributor.bioShort && (
                        <>
                          <span className="dot" aria-hidden="true"></span>
                          <span>{note.contributor.bioShort}</span>
                        </>
                      )}
                    </div>
                    {isOwner && (
                      <div className="owner-actions">
                        <button
                          type="button"
                          onClick={() => { setMode({ action: 'edit', noteId: note.noteId }); setError(null); }}
                          className="owner-btn"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemove(note.noteId)}
                          disabled={busy}
                          className="owner-btn"
                        >
                          {busy ? 'Removing…' : 'Remove'}
                        </button>
                      </div>
                    )}
                  </>
                )}

                {isEditing && viewer && (
                  <EditForm
                    initial={note.body}
                    contributor={{ name: viewer.displayName ?? note.contributor.displayName, bio: viewer.bioShort }}
                    submitting={busy}
                    onCancel={() => { setMode(null); setError(null); }}
                    onSubmit={(body) => handleEdit(note.noteId, body)}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Write-a-note entry (only for contributors without a published note here) */}
      {mode !== 'write' && canWrite && (
        <button
          type="button"
          onClick={() => { setMode('write'); setError(null); }}
          className="write-entry"
        >
          Write a performer's note &rarr;
        </button>
      )}
      {mode === 'write' && viewer && (
        <div className="mt-6 signed">
          <EditForm
            initial=""
            placeholder="Write the note the way you'd want to read it on another musician's piece page."
            contributor={{ name: viewer.displayName ?? 'You', bio: viewer.bioShort }}
            submitting={busy}
            onCancel={() => { setMode(null); setError(null); }}
            onSubmit={handleWrite}
            submitLabel="Publish"
            submittingLabel="Publishing…"
          />
        </div>
      )}

      <style>{`
        .performers-notes-list { display: flex; flex-direction: column; gap: 32px; }
        .owner-actions { display: flex; gap: 8px; margin-top: 10px; }
        .owner-btn {
          background: transparent;
          border: 0.5px solid var(--border-strong);
          color: var(--muted);
          font-family: var(--font-sans);
          font-size: 11px;
          padding: 4px 10px;
          border-radius: 6px;
          cursor: pointer;
          transition: color 0.12s, border-color 0.12s;
        }
        .owner-btn:hover { color: var(--ink); border-color: var(--ink); }
        .owner-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .write-entry {
          margin-top: 24px;
          background: transparent;
          border: 0;
          color: var(--accent);
          font-family: var(--font-sans);
          font-size: 13px;
          padding: 0;
          cursor: pointer;
          text-decoration: none;
        }
        .write-entry:hover { color: var(--ink); }
      `}</style>
    </div>
  );
}

function EditForm(props: {
  initial: string;
  placeholder?: string;
  contributor: { name: string; bio: string | null };
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (body: string) => void;
  submitLabel?: string;
  submittingLabel?: string;
}) {
  const [value, setValue] = useState(props.initial);
  const submitLabel = props.submitLabel ?? 'Save';
  const submittingLabel = props.submittingLabel ?? 'Saving…';

  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={6}
        placeholder={props.placeholder}
        style={{
          width: '100%',
          fontFamily: 'var(--font-serif)',
          fontSize: '16px',
          lineHeight: 1.65,
          color: 'var(--ink)',
          background: 'transparent',
          border: '0.5px solid var(--border-strong)',
          borderRadius: '8px',
          padding: '10px 12px',
          resize: 'vertical',
        }}
      />
      <div className="by" style={{ marginTop: '12px' }}>
        <span className="name">{props.contributor.name}</span>
        {props.contributor.bio && (
          <>
            <span className="dot" aria-hidden="true"></span>
            <span>{props.contributor.bio}</span>
          </>
        )}
      </div>
      <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
        <button
          type="button"
          onClick={() => props.onSubmit(value)}
          disabled={props.submitting || value.trim() === ''}
          style={{
            background: 'var(--ink)',
            color: '#FFFFFF',
            border: 0,
            fontFamily: 'var(--font-sans)',
            fontSize: '13px',
            fontWeight: 500,
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: props.submitting || value.trim() === '' ? 'not-allowed' : 'pointer',
            opacity: props.submitting || value.trim() === '' ? 0.5 : 1,
          }}
        >
          {props.submitting ? submittingLabel : submitLabel}
        </button>
        <button
          type="button"
          onClick={props.onCancel}
          disabled={props.submitting}
          style={{
            background: 'transparent',
            color: 'var(--ink)',
            border: '0.5px solid var(--border-strong)',
            fontFamily: 'var(--font-sans)',
            fontSize: '13px',
            fontWeight: 500,
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: props.submitting ? 'not-allowed' : 'pointer',
            opacity: props.submitting ? 0.5 : 1,
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
