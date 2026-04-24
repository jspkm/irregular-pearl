// Published interpretive schools on a piece page, plus contributor
// affordances (write a school, edit own, remove own). Mirrors
// src/components/PerformersNotes.tsx, adapted for the multi-column grid
// treatment PRD describes for schools: "a multi-column grid of signed
// positions on wide viewports, collapsing to stacked cards on narrow ones."
//
// CM5: self-author entry is ALWAYS visible for eligible contributors
// (schools are plural by design; one contributor may hold multiple).
// Label adapts: "Write a school" when none exist, "Add another school"
// when at least one published school already exists on the piece.
//
// Reads SSR'd by PiecePageLayout; this island hydrates with the same data.

import { useCallback, useEffect, useState } from 'react';
import { supabase, hasSupabase } from '../lib/supabase';
import type { PublishedInterpretiveSchool } from '../lib/interpretiveSchools';
import { fetchPendingDraftsOnPiece, type PendingDraft } from '../lib/contributionDrafts';
import VoteThumbs from './VoteThumbs';
import OwnerEditDelete from './OwnerEditDelete';
import PendingDraftCard from './PendingDraftCard';
import SignInPanel from './SignInPanel';
import ComposeDraftBlock from './ComposeDraftBlock';

interface Props {
  pieceId: string;
  initialSchools: PublishedInterpretiveSchool[];
}

interface Viewer {
  userId: string | null;
  displayName: string | null;
  bioShort: string | null;
}

type Mode = null | 'write' | { action: 'edit'; schoolId: string };

export default function InterpretiveSchools({ pieceId, initialSchools }: Props) {
  const [schools, setSchools] = useState<PublishedInterpretiveSchool[]>(initialSchools);
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const [mode, setMode] = useState<Mode>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [pendingDrafts, setPendingDrafts] = useState<PendingDraft[]>([]);
  const [pageIdx, setPageIdx] = useState(0);
  const [signInOpen, setSignInOpen] = useState(false);

  const PAGE_SIZE = 3;
  const totalPages = Math.max(1, Math.ceil(schools.length / PAGE_SIZE));
  const safePage = Math.min(pageIdx, totalPages - 1);
  const pageStart = safePage * PAGE_SIZE;
  const visibleSchools = schools.slice(pageStart, pageStart + PAGE_SIZE);
  const prevPage = () => setPageIdx((i) => (totalPages === 0 ? 0 : (i - 1 + totalPages) % totalPages));
  const nextPage = () => setPageIdx((i) => (totalPages === 0 ? 0 : (i + 1) % totalPages));

  const loadViewer = useCallback(async () => {
    if (!hasSupabase) { setViewer({ userId: null, displayName: null, bioShort: null }); return; }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      setViewer({ userId: null, displayName: null, bioShort: null });
      return;
    }

    const { data } = await supabase
      .from('users')
      .select('display_name, contributor_bio_short')
      .eq('id', session.user.id)
      .single();

    setViewer({
      userId: session.user.id,
      displayName: data?.display_name ?? null,
      bioShort: data?.contributor_bio_short ?? null,
    });
  }, []);

  useEffect(() => { void loadViewer(); }, [loadViewer]);

  const refetchPendingDrafts = useCallback(async () => {
    if (!hasSupabase || !viewer?.userId) { setPendingDrafts([]); return; }
    const all = await fetchPendingDraftsOnPiece(pieceId);
    setPendingDrafts(all.filter((d) => d.kind === 'interpretive_school'));
  }, [pieceId, viewer?.userId]);
  useEffect(() => { void refetchPendingDrafts(); }, [refetchPendingDrafts]);

  function handleDraftResolved(draftId: string, message: string | null) {
    setPendingDrafts((prev) => prev.filter((d) => d.draftId !== draftId));
    if (message) setToast(message);
    void refetchSchools();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('notifications:changed'));
    }
  }

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  async function refetchSchools() {
    const { data } = await supabase
      .from('interpretive_schools')
      .select('id, contributor_id, current_version_id, name, tempo_cues, approved_by_contributor_at')
      .eq('piece_id', pieceId)
      .eq('status', 'published')
      .order('approved_by_contributor_at', { ascending: true });
    if (!data || data.length === 0) { setSchools([]); return; }

    const versionIds = data.map((s) => s.current_version_id).filter((x): x is string => Boolean(x));
    const contribIds = [...new Set(data.map((s) => s.contributor_id))];

    const [versionsRes, contribsRes] = await Promise.all([
      supabase.from('v_interpretive_school_versions_published').select('id, body, version_number, approved_at').in('id', versionIds),
      supabase.from('users').select('id, display_name, contributor_bio_short').in('id', contribIds),
    ]);
    const vById = new Map((versionsRes.data ?? []).map((v) => [v.id, v]));
    const cById = new Map((contribsRes.data ?? []).map((c) => [c.id, c]));

    const rows: PublishedInterpretiveSchool[] = [];
    for (const s of data) {
      if (!s.current_version_id) continue;
      const v = vById.get(s.current_version_id);
      const c = cById.get(s.contributor_id);
      if (!v || !c) continue;
      if (v.id === null || v.body === null || v.version_number === null) continue;
      rows.push({
        schoolId: s.id,
        versionId: v.id,
        name: s.name,
        body: v.body,
        tempoCues: (s.tempo_cues as Record<string, unknown> | null) ?? null,
        versionNumber: v.version_number,
        approvedAt: v.approved_at,
        contributor: { id: c.id, displayName: c.display_name, bioShort: c.contributor_bio_short ?? null },
      });
    }
    setSchools(rows);
  }

  async function handleWrite(name: string, body: string) {
    if (name.trim().length === 0) { setError('Name required.'); return; }
    if (body.trim().length === 0) { setError('Body required.'); return; }
    setBusy(true); setError(null);
    const { error: err } = await supabase.rpc('publish_contributor_interpretive_school', {
      p_piece_id: pieceId,
      p_name: name.trim(),
      p_body: body,
    });
    setBusy(false);
    if (err) { setError(err.message); return; }
    setMode(null);
    await refetchSchools();
  }

  async function handleEdit(schoolId: string, body: string) {
    if (body.trim().length === 0) { setError('Body required.'); return; }
    setBusy(true); setError(null);
    const { error: err } = await supabase.rpc('publish_contributor_interpretive_school_edit', {
      p_school_id: schoolId,
      p_body: body,
    });
    setBusy(false);
    if (err) { setError(err.message); return; }
    setMode(null);
    await refetchSchools();
  }

  async function handleRemove(schoolId: string) {
    setBusy(true); setError(null);
    const { error: err } = await supabase.rpc('remove_interpretive_school', { p_school_id: schoolId });
    setBusy(false);
    if (err) { setError(err.message); return; }
    await refetchSchools();
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('notifications:changed'));
  }

  // CM5: always visible. Any authed user can propose a school; anon sees
  // the entry and gets a sign-in panel on click.
  const canWrite = true;

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

      {toast && (
        <div role="status" className="pending-draft-toast">{toast}</div>
      )}

      <ComposeDraftBlock pieceId={pieceId} kind="interpretive_school" />

      {pendingDrafts.length > 0 && (
        <div className="pending-drafts-list">
          {pendingDrafts.map((d) => (
            <PendingDraftCard key={d.draftId} draft={d} onResolved={handleDraftResolved} />
          ))}
        </div>
      )}

      {schools.length > 0 && (
        <div className={`schools-grid schools-grid-${Math.min(visibleSchools.length, 3)}`}>
          {visibleSchools.map((s) => {
            const isOwner = viewer?.userId === s.contributor.id;
            const isEditing = typeof mode === 'object' && mode?.action === 'edit' && mode.schoolId === s.schoolId;
            return (
              <div key={s.schoolId} className="school-card">
                {!isEditing && (
                  <>
                    <div className="school-name">{s.name}</div>
                    {s.tempoCues && Object.keys(s.tempoCues).length > 0 && (
                      <div className="tempo-cues">
                        {Object.entries(s.tempoCues).map(([k, v]) => (
                          <span key={k}>
                            {k}: {typeof v === 'string' ? v : JSON.stringify(v)}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="prose">
                      {s.body.split(/\n\s*\n/).map((para, i) => <p key={i}>{para}</p>)}
                    </div>
                    <div className="by">
                      <span className="name">{s.contributor.displayName}</span>
                      {s.contributor.bioShort && (
                        <>
                          <span className="dot" aria-hidden="true"></span>
                          <span>{s.contributor.bioShort}</span>
                        </>
                      )}
                      {isOwner && (
                        <OwnerEditDelete
                          itemLabel="interpretive school"
                          onEdit={() => { setMode({ action: 'edit', schoolId: s.schoolId }); setError(null); }}
                          onDelete={() => handleRemove(s.schoolId)}
                          busy={busy}
                        />
                      )}
                      <VoteThumbs subjectTable="interpretive_schools" subjectId={s.schoolId} />
                    </div>
                  </>
                )}

                {isEditing && viewer && (
                  <EditForm
                    initialName={s.name}
                    initialBody={s.body}
                    showNameField={false}
                    contributor={{ name: viewer.displayName ?? s.contributor.displayName, bio: viewer.bioShort }}
                    submitting={busy}
                    onCancel={() => { setMode(null); setError(null); }}
                    onSubmit={(_name, body) => handleEdit(s.schoolId, body)}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {schools.length > PAGE_SIZE && (
        <div className="notes-pager">
          <button type="button" className="notes-pager-chev" aria-label="Previous schools" onClick={prevPage}>
            ←
          </button>
          <span className="notes-pager-indicator" aria-live="polite">
            {safePage + 1} <span className="notes-pager-sep">of</span> {totalPages}
          </span>
          <button type="button" className="notes-pager-chev" aria-label="Next schools" onClick={nextPage}>
            →
          </button>
        </div>
      )}

      {mode !== 'write' && canWrite && (
        <button
          type="button"
          onClick={() => {
            setError(null);
            if (!viewer?.userId) { setSignInOpen(true); return; }
            setMode('write');
          }}
          className="mvmt-add"
        >
          + Add a school
        </button>
      )}
      {mode === 'write' && viewer?.userId && (
        <div className="mt-6 school-card">
          <EditForm
            initialName=""
            initialBody=""
            showNameField={true}
            placeholder="What does this framing ask of a performer?"
            contributor={{ name: viewer.displayName ?? 'You', bio: viewer.bioShort }}
            submitting={busy}
            onCancel={() => { setMode(null); setError(null); }}
            onSubmit={handleWrite}
            submitLabel="Publish"
            submittingLabel="Publishing…"
          />
        </div>
      )}

      {signInOpen && (
        <SignInPanel
          onClose={() => setSignInOpen(false)}
          title="Sign in to write"
          body={
            <>Interpretive schools are signed — any registered user can propose one. Sign in or create an account to post yours.</>
          }
        />
      )}

      <style>{`
        .schools-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }
        @media (min-width: 768px) {
          .schools-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 1024px) {
          .schools-grid-3 { grid-template-columns: repeat(3, 1fr); }
        }
        .school-card {
          border: 0.5px solid var(--border);
          border-radius: 12px;
          padding: 20px 22px;
          background: var(--surface);
          display: flex;
          flex-direction: column;
        }
        .school-name {
          font-family: var(--font-sans);
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--ink);
          margin-bottom: 10px;
        }
        .tempo-cues {
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--muted);
          margin-bottom: 12px;
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }
        .school-card .prose {
          font-family: var(--font-serif);
          font-size: 16px;
          line-height: 1.68;
          color: var(--ink);
          margin: 0 0 14px;
        }
        .school-card .prose p { margin: 0 0 10px; }
        .school-card .prose p:last-child { margin-bottom: 0; }
        .school-card .by {
          font-family: var(--font-sans);
          font-size: 13px;
          color: var(--ink);
        }
        .school-card .by .name { font-weight: 500; }
        .school-card .by .dot {
          display: inline-block;
          width: 3px; height: 3px;
          border-radius: 50%;
          background: var(--muted);
          margin: 0 8px;
          vertical-align: middle;
        }
        .school-card .by span:not(.name):not(.dot) {
          color: var(--muted);
        }
      `}</style>
    </div>
  );
}

function EditForm(props: {
  initialName: string;
  initialBody: string;
  showNameField: boolean;
  placeholder?: string;
  contributor: { name: string; bio: string | null };
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (name: string, body: string) => void;
  submitLabel?: string;
  submittingLabel?: string;
}) {
  const [nameValue, setNameValue] = useState(props.initialName);
  const [bodyValue, setBodyValue] = useState(props.initialBody);
  const submitLabel = props.submitLabel ?? 'Save';
  const submittingLabel = props.submittingLabel ?? 'Saving…';
  const disabled = props.submitting || bodyValue.trim() === '' || (props.showNameField && nameValue.trim() === '');

  return (
    <div>
      {props.showNameField && (
        <input
          type="text"
          value={nameValue}
          onChange={(e) => setNameValue(e.target.value)}
          placeholder="School name (e.g. Historically informed)"
          style={{
            width: '100%',
            fontFamily: 'var(--font-sans)',
            fontSize: '13px',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--ink)',
            background: 'transparent',
            border: '0.5px solid var(--border-strong)',
            borderRadius: '8px',
            padding: '8px 12px',
            marginBottom: '10px',
          }}
        />
      )}
      <textarea
        value={bodyValue}
        onChange={(e) => setBodyValue(e.target.value)}
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
      <div style={{ marginTop: '12px', fontFamily: 'var(--font-sans)', fontSize: '13px' }}>
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
          onClick={() => props.onSubmit(nameValue, bodyValue)}
          disabled={disabled}
          style={{
            background: 'var(--ink)',
            color: 'var(--bg)',
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
