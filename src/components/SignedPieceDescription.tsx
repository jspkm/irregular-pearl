// Published signed piece descriptions. Per 7A the signed description
// renders as the piece's editorial essay, below the header, in Source Serif
// 4. The unsigned pieces.description stays elsewhere as an italic metadata
// strip (handled by PiecePageLayout.astro).
//
// Plural markup — typically one per piece, but supports N for plural-voice
// expansion. Contributor affordances mirror InterpretiveSchools + PerformersNotes.

import { useCallback, useEffect, useState } from 'react';
import { supabase, hasSupabase } from '../lib/supabase';
import type { PublishedPieceDescription } from '../lib/pieceDescriptions';

interface Props {
  pieceId: string;
  initialDescriptions: PublishedPieceDescription[];
}

interface Viewer {
  userId: string | null;
  isContributor: boolean;
  displayName: string | null;
  bioShort: string | null;
}

type Mode = null | 'write' | { action: 'edit'; descriptionId: string };

export default function SignedPieceDescription({ pieceId, initialDescriptions }: Props) {
  const [descriptions, setDescriptions] = useState<PublishedPieceDescription[]>(initialDescriptions);
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

  async function refetch() {
    const { data } = await supabase
      .from('piece_descriptions')
      .select('id, contributor_id, current_version_id, approved_by_contributor_at')
      .eq('piece_id', pieceId)
      .eq('status', 'published')
      .order('approved_by_contributor_at', { ascending: true });
    if (!data || data.length === 0) { setDescriptions([]); return; }

    const versionIds = data.map((d) => d.current_version_id).filter((x): x is string => Boolean(x));
    const contribIds = [...new Set(data.map((d) => d.contributor_id))];

    const [versionsRes, contribsRes] = await Promise.all([
      supabase.from('v_piece_description_versions_published').select('id, body, version_number, approved_at').in('id', versionIds),
      supabase.from('users').select('id, display_name, contributor_bio_short').in('id', contribIds),
    ]);
    const vById = new Map((versionsRes.data ?? []).map((v) => [v.id, v]));
    const cById = new Map((contribsRes.data ?? []).map((c) => [c.id, c]));

    const rows: PublishedPieceDescription[] = [];
    for (const d of data) {
      if (!d.current_version_id) continue;
      const v = vById.get(d.current_version_id);
      const c = cById.get(d.contributor_id);
      if (!v || !c) continue;
      rows.push({
        descriptionId: d.id,
        versionId: v.id,
        body: v.body,
        versionNumber: v.version_number,
        approvedAt: v.approved_at,
        contributor: { id: c.id, displayName: c.display_name, bioShort: c.contributor_bio_short ?? null },
      });
    }
    setDescriptions(rows);
  }

  async function handleWrite(body: string) {
    if (body.trim().length === 0) { setError('Body required.'); return; }
    setBusy(true); setError(null);
    const { error: err } = await supabase.rpc('publish_contributor_piece_description', {
      p_piece_id: pieceId,
      p_body: body,
    });
    setBusy(false);
    if (err) { setError(err.message); return; }
    setMode(null);
    await refetch();
  }

  async function handleEdit(descriptionId: string, body: string) {
    if (body.trim().length === 0) { setError('Body required.'); return; }
    setBusy(true); setError(null);
    const { error: err } = await supabase.rpc('publish_contributor_piece_description_edit', {
      p_description_id: descriptionId,
      p_body: body,
    });
    setBusy(false);
    if (err) { setError(err.message); return; }
    setMode(null);
    await refetch();
  }

  async function handleRemove(descriptionId: string) {
    setBusy(true); setError(null);
    const { error: err } = await supabase.rpc('remove_piece_description', { p_description_id: descriptionId });
    setBusy(false);
    if (err) { setError(err.message); return; }
    await refetch();
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('notifications:changed'));
  }

  const canWrite = Boolean(viewer?.isContributor);
  const writeLabel = descriptions.length === 0 ? 'Write a signed description' : 'Add another description';

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

      {descriptions.length === 0 ? (
        <p className="empty-state">No signed description yet.</p>
      ) : (
        <div className="descriptions-list">
          {descriptions.map((d) => {
            const isOwner = viewer?.userId === d.contributor.id;
            const isEditing = typeof mode === 'object' && mode?.action === 'edit' && mode.descriptionId === d.descriptionId;
            return (
              <article key={d.descriptionId} className="description-essay">
                {!isEditing && (
                  <>
                    <div className="prose">
                      {d.body.split(/\n\s*\n/).map((para, i) => <p key={i}>{para}</p>)}
                    </div>
                    <div className="by">
                      <span className="name">{d.contributor.displayName}</span>
                      {d.contributor.bioShort && (
                        <>
                          <span className="dot" aria-hidden="true"></span>
                          <span>{d.contributor.bioShort}</span>
                        </>
                      )}
                    </div>
                    {isOwner && (
                      <div className="owner-actions">
                        <button
                          type="button"
                          onClick={() => { setMode({ action: 'edit', descriptionId: d.descriptionId }); setError(null); }}
                          className="owner-btn"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemove(d.descriptionId)}
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
                  <EssayEditForm
                    initial={d.body}
                    contributor={{ name: viewer.displayName ?? d.contributor.displayName, bio: viewer.bioShort }}
                    submitting={busy}
                    onCancel={() => { setMode(null); setError(null); }}
                    onSubmit={(body) => handleEdit(d.descriptionId, body)}
                  />
                )}
              </article>
            );
          })}
        </div>
      )}

      {mode !== 'write' && canWrite && (
        <button
          type="button"
          onClick={() => { setMode('write'); setError(null); }}
          className="write-entry"
        >
          {writeLabel} &rarr;
        </button>
      )}
      {mode === 'write' && viewer && (
        <div className="mt-6 description-essay">
          <EssayEditForm
            initial=""
            placeholder="What is this piece, to you, as a working musician?"
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
        .descriptions-list { display: flex; flex-direction: column; gap: 40px; }
        .description-essay .prose {
          font-family: var(--font-serif);
          font-size: 17px;
          line-height: 1.72;
          color: var(--ink);
          max-width: 640px;
          margin: 0 0 18px;
        }
        .description-essay .prose p { margin: 0 0 14px; }
        .description-essay .prose p:last-child { margin-bottom: 0; }
        .description-essay .by {
          font-family: var(--font-sans);
          font-size: 13px;
          color: var(--ink);
          text-align: right;
          max-width: 640px;
        }
        .description-essay .by .name { font-weight: 500; }
        .description-essay .by .dot {
          display: inline-block;
          width: 3px; height: 3px;
          border-radius: 50%;
          background: var(--muted);
          margin: 0 8px;
          vertical-align: middle;
        }
        .description-essay .by span:not(.name):not(.dot) { color: var(--muted); }
        .owner-actions { display: flex; gap: 8px; margin-top: 14px; }
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
        }
        .write-entry:hover { color: var(--ink); }
      `}</style>
    </div>
  );
}

function EssayEditForm(props: {
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
  const disabled = props.submitting || value.trim() === '';

  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={8}
        placeholder={props.placeholder}
        style={{
          width: '100%',
          maxWidth: '640px',
          fontFamily: 'var(--font-serif)',
          fontSize: '17px',
          lineHeight: 1.72,
          color: 'var(--ink)',
          background: 'transparent',
          border: '0.5px solid var(--border-strong)',
          borderRadius: '8px',
          padding: '10px 12px',
          resize: 'vertical',
        }}
      />
      <div style={{ marginTop: '12px', fontFamily: 'var(--font-sans)', fontSize: '13px', textAlign: 'right', maxWidth: '640px' }}>
        <span style={{ fontWeight: 500 }}>{props.contributor.name}</span>
        {props.contributor.bio && (
          <>
            <span style={{ margin: '0 8px', color: 'var(--muted)' }}>·</span>
            <span style={{ color: 'var(--muted)' }}>{props.contributor.bio}</span>
          </>
        )}
      </div>
      <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
        <button
          type="button"
          onClick={() => props.onSubmit(value)}
          disabled={disabled}
          style={{
            background: 'var(--ink)',
            color: '#FFFFFF',
            border: 0,
            fontFamily: 'var(--font-sans)',
            fontSize: '13px',
            fontWeight: 500,
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
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
