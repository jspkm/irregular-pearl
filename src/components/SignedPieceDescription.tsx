// Published signed piece descriptions. Per 7A the signed description
// renders as the piece's editorial essay, below the header, in Source Serif
// 4. The unsigned pieces.description stays elsewhere as an italic metadata
// strip (handled by PiecePageLayout.astro).
//
// Plural markup — typically one per piece, but supports N for plural-voice
// expansion. Contributor affordances mirror InterpretiveSchools + PerformersNotes.

import { useCallback, useEffect, useState } from 'react';
import { supabase, hasSupabase } from '../lib/supabase';
import { useAuth } from '../lib/useAuth';
import type { PublishedPieceDescription } from '../lib/pieceDescriptions';
import { fetchPendingDraftsOnPiece, type PendingDraft } from '../lib/contributionDrafts';
import VoteThumbs from './VoteThumbs';
import OwnerEditDelete from './OwnerEditDelete';
import PendingDraftCard from './PendingDraftCard';
import SignInPanel from './SignInPanel';
import ComposeDraftBlock from './ComposeDraftBlock';
import { useRequireAuth } from '../lib/useRequireAuth';

interface Props {
  pieceId: string;
  initialDescriptions: PublishedPieceDescription[];
  // Unsigned pieces.description text — rendered as a synthetic "Seed data"
  // card at the end of the stack. User-authored ties sort in front of it
  // (§2.5 ordering rule plus client-side append).
  seedDescription?: string | null;
  // Deterministic UUID from pieces.seed_description_vote_id. Used as the
  // votes.subject_id so the seed card can carry a thumbs affordance even
  // though it isn't a row in piece_descriptions. May be null while offline
  // or on a DB that predates migration 20260516.
  seedDescriptionVoteId?: string | null;
}

type StackItem =
  | { kind: 'user'; desc: PublishedPieceDescription }
  | { kind: 'seed'; body: string };

interface ViewerProfile {
  displayName: string | null;
  bioShort: string | null;
}

type Mode = null | 'write' | { action: 'edit'; descriptionId: string };

export default function SignedPieceDescription({ pieceId, initialDescriptions, seedDescription, seedDescriptionVoteId }: Props) {
  const { user } = useAuth();
  const [descriptions, setDescriptions] = useState<PublishedPieceDescription[]>(initialDescriptions);
  const [profile, setProfile] = useState<ViewerProfile>({ displayName: null, bioShort: null });
  const [mode, setMode] = useState<Mode>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [pendingDrafts, setPendingDrafts] = useState<PendingDraft[]>([]);
  const [stackIdx, setStackIdx] = useState(0);
  const {
    signInOpen,
    onClose: signInOnClose,
    onSignedIn: signInOnSignedIn,
    gate,
  } = useRequireAuth();

  const stackItems: StackItem[] = [
    ...descriptions.map((desc) => ({ kind: 'user' as const, desc })),
    ...(seedDescription && seedDescription.trim().length > 0
      ? [{ kind: 'seed' as const, body: seedDescription }]
      : []),
  ];
  const safeIdx = stackItems.length === 0 ? 0 : Math.min(stackIdx, stackItems.length - 1);
  const active = stackItems[safeIdx];
  const prev = () => setStackIdx((i) => (stackItems.length === 0 ? 0 : (i - 1 + stackItems.length) % stackItems.length));
  const next = () => setStackIdx((i) => (stackItems.length === 0 ? 0 : (i + 1) % stackItems.length));

  useEffect(() => {
    let cancelled = false;
    if (!hasSupabase || !user) {
      setProfile({ displayName: null, bioShort: null });
      return;
    }
    (async () => {
      const { data } = await supabase
        .from('users')
        .select('display_name, contributor_bio_short')
        .eq('id', user.id)
        .single();
      if (cancelled) return;
      setProfile({
        displayName: data?.display_name ?? null,
        bioShort: data?.contributor_bio_short ?? null,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const refetchPendingDrafts = useCallback(async () => {
    if (!hasSupabase || !user) { setPendingDrafts([]); return; }
    const all = await fetchPendingDraftsOnPiece(pieceId);
    setPendingDrafts(all.filter((d) => d.kind === 'piece_description'));
  }, [pieceId, user]);
  useEffect(() => { void refetchPendingDrafts(); }, [refetchPendingDrafts]);

  function handleDraftResolved(draftId: string, message: string | null) {
    setPendingDrafts((prev) => prev.filter((d) => d.draftId !== draftId));
    if (message) setToast(message);
    void refetch();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('notifications:changed'));
    }
  }

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

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
      supabase.from('users').select('id, display_name, username, contributor_bio_short').in('id', contribIds),
    ]);
    const vById = new Map((versionsRes.data ?? []).map((v) => [v.id, v]));
    const cById = new Map((contribsRes.data ?? []).map((c) => [c.id, c]));

    const rows: PublishedPieceDescription[] = [];
    for (const d of data) {
      if (!d.current_version_id) continue;
      const v = vById.get(d.current_version_id);
      const c = cById.get(d.contributor_id);
      if (!v || !c) continue;
      if (v.id === null || v.body === null || v.version_number === null) continue;
      rows.push({
        descriptionId: d.id,
        versionId: v.id,
        body: v.body,
        versionNumber: v.version_number,
        approvedAt: v.approved_at,
        contributor: { id: c.id, displayName: c.display_name, username: c.username ?? null, bioShort: c.contributor_bio_short ?? null },
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

  // Any authed user can write. Anon sees the entry and gets a sign-in
  // panel on click.
  const canWrite = true;
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

      {toast && (
        <div role="status" className="pending-draft-toast">{toast}</div>
      )}

      <ComposeDraftBlock pieceId={pieceId} kind="piece_description" />

      {pendingDrafts.length > 0 && (
        <div className="pending-drafts-list">
          {pendingDrafts.map((d) => (
            <PendingDraftCard key={d.draftId} draft={d} onResolved={handleDraftResolved} />
          ))}
        </div>
      )}

      {stackItems.length === 0 ? (
        <p className="empty-state">No signed description yet.</p>
      ) : (
        <div className={`desc-stack${stackItems.length > 1 ? ' has-more' : ''}`}>
          {/* Visual "behind" cards imply the stack depth. Non-interactive. */}
          {stackItems.length > 2 && <div className="desc-stack-behind depth-2" aria-hidden="true" />}
          {stackItems.length > 1 && <div className="desc-stack-behind depth-1" aria-hidden="true" />}

          {active?.kind === 'user' ? (
            (() => {
              const d = active.desc;
              const isOwner = user?.id === d.contributor.id;
              const isEditing = typeof mode === 'object' && mode?.action === 'edit' && mode.descriptionId === d.descriptionId;
              return (
                <article className="description-essay desc-stack-top">
                  {!isEditing && (
                    <>
                      <div className="prose">
                        {d.body.split(/\n\s*\n/).map((para, i) => <p key={i}>{para}</p>)}
                      </div>
                      <div className="by">
                        <div className="by-left">
                          <a className="name" href={d.contributor.username ? `/@${d.contributor.username}` : `/profile/${d.contributor.id}`}>{d.contributor.displayName}</a>
                          {d.contributor.bioShort && (
                            <>
                              <span className="dot" aria-hidden="true"></span>
                              <span>{d.contributor.bioShort}</span>
                            </>
                          )}
                        </div>
                        <div className="by-right">
                          {isOwner && (
                            <OwnerEditDelete
                              itemLabel="piece description"
                              onEdit={() => { setMode({ action: 'edit', descriptionId: d.descriptionId }); setError(null); }}
                              onDelete={() => handleRemove(d.descriptionId)}
                              busy={busy}
                            />
                          )}
                          <VoteThumbs subjectTable="piece_descriptions" subjectId={d.descriptionId} />
                        </div>
                      </div>
                    </>
                  )}
                  {isEditing && user && (
                    <EssayEditForm
                      initial={d.body}
                      contributor={{ name: profile.displayName ?? d.contributor.displayName, bio: profile.bioShort }}
                      submitting={busy}
                      onCancel={() => { setMode(null); setError(null); }}
                      onSubmit={(body) => handleEdit(d.descriptionId, body)}
                    />
                  )}
                </article>
              );
            })()
          ) : (
            active && (
              <article className="description-essay desc-stack-top desc-seed">
                <div className="prose">
                  {active.body.split(/\n\s*\n/).map((para, i) => <p key={i}>{para}</p>)}
                </div>
                {seedDescriptionVoteId && (
                  <div className="desc-seed-vote">
                    <VoteThumbs subjectTable="pieces_seed_description" subjectId={seedDescriptionVoteId} />
                  </div>
                )}
              </article>
            )
          )}

          {stackItems.length > 1 && (
            <div className="desc-stack-controls">
              <button type="button" className="desc-stack-chev" aria-label="Previous description" onClick={prev}>
                ←
              </button>
              <span className="desc-stack-indicator" aria-live="polite">
                {safeIdx + 1} <span className="desc-stack-sep">of</span> {stackItems.length}
              </span>
              <button type="button" className="desc-stack-chev" aria-label="Next description" onClick={next}>
                →
              </button>
            </div>
          )}
        </div>
      )}

      {mode !== 'write' && canWrite && (
        <button
          type="button"
          onClick={() => {
            setError(null);
            gate(() => setMode('write'));
          }}
          className="write-entry"
        >
          {writeLabel} &rarr;
        </button>
      )}
      {mode === 'write' && user && (
        <div className="mt-6 description-essay">
          <EssayEditForm
            initial=""
            placeholder="What is this piece, to you, as a working musician?"
            contributor={{ name: profile.displayName ?? 'You', bio: profile.bioShort }}
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
          onClose={signInOnClose}
          onSignedIn={signInOnSignedIn}
          title="Sign in to write"
          body={
            <>Signed descriptions are authored — any registered user can publish their take on a piece. Sign in or create an account to post yours.</>
          }
        />
      )}

      <style>{`
        .descriptions-list { display: flex; flex-direction: column; gap: 40px; }
        .description-essay .prose {
          font-family: var(--font-serif);
          font-size: 17px;
          line-height: 1.72;
          color: var(--ink);
          margin: 0 0 18px;
        }
        .description-essay .prose p { margin: 0 0 14px; }
        .description-essay .prose p:last-child { margin-bottom: 0; }
        .description-essay .by {
          font-family: var(--font-sans);
          font-size: 13px;
          color: var(--ink);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
        }
        .description-essay .by-left {
          display: flex;
          align-items: center;
          gap: 0;
          flex: 1 1 auto;
          min-width: 0;
        }
        .description-essay .by-right {
          display: flex;
          align-items: center;
          gap: 6px;
          flex: 0 0 auto;
        }
        .description-essay .by .name { font-weight: 500; text-decoration: none; color: inherit; }
        .description-essay .by .dot {
          display: inline-block;
          width: 3px; height: 3px;
          border-radius: 50%;
          background: var(--muted);
          margin: 0 8px;
          vertical-align: middle;
        }
        .description-essay .by span:not(.name):not(.dot) { color: var(--muted); }
        .desc-seed-vote {
          margin-top: 10px;
          display: flex;
          justify-content: flex-end;
        }
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
      <div style={{ marginTop: '12px', fontFamily: 'var(--font-sans)', fontSize: '13px', textAlign: 'right' }}>
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
