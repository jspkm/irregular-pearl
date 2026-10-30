import { useEffect, useRef, useState } from 'react';
import type { SummaryComment } from '../lib/summaryComments';
import { hasSupabase, supabase } from '../lib/supabase';
import { useAuth } from '../lib/useAuth';
import { useRequireAuth } from '../lib/useRequireAuth';
import SignInPanel from './SignInPanel';

interface Props {
  pieceId: string;
  summaryText?: string;
  initialComments: SummaryComment[];
}

// Intentionally minimal panel: prior comments followed by the composer.

export default function SummaryComments({ pieceId, initialComments, summaryText }: Props) {
  const { user } = useAuth();
  const { signInOpen, onClose, onSignedIn, gate } = useRequireAuth();
  const [comments, setComments] = useState(initialComments);
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewerRatings, setViewerRatings] = useState<Record<string, number>>({});
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const previewRef = useRef<HTMLElement>(null);
  const closePreviewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showPreview() {
    if (closePreviewTimer.current) clearTimeout(closePreviewTimer.current);
    const preview = previewRef.current;
    const trigger = triggerRef.current;
    if (!preview || !trigger || dialogRef.current?.open) return;
    if (!preview.matches(':popover-open')) preview.showPopover();
    const rect = trigger.getBoundingClientRect();
    const width = preview.getBoundingClientRect().width;
    const below = window.innerHeight - rect.bottom - 16;
    const above = rect.top - 16;
    const useBelow = below >= Math.min(preview.scrollHeight, 300) || below >= above;
    const available = Math.max(80, useBelow ? below : above);
    preview.style.maxHeight = `${available}px`;
    preview.style.left = `${Math.max(12, Math.min(rect.right - width, window.innerWidth - width - 12))}px`;
    preview.style.top = `${useBelow ? rect.bottom + 8 : Math.max(12, rect.top - preview.getBoundingClientRect().height - 8)}px`;
  }

  function hidePreviewSoon() {
    if (closePreviewTimer.current) clearTimeout(closePreviewTimer.current);
    closePreviewTimer.current = setTimeout(() => {
      if (previewRef.current?.contains(document.activeElement)) return;
      previewRef.current?.hidePopover();
    }, 180);
  }

  useEffect(() => {
    const closePreview = () => previewRef.current?.hidePopover();
    window.addEventListener('resize', closePreview);
    window.addEventListener('scroll', closePreview);
    return () => {
      window.removeEventListener('resize', closePreview);
      window.removeEventListener('scroll', closePreview);
      if (closePreviewTimer.current) clearTimeout(closePreviewTimer.current);
    };
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const closeOnBackdrop = (event: MouseEvent) => {
      if (event.target === dialog) dialog.close();
    };
    dialog.addEventListener('click', closeOnBackdrop);
    return () => dialog.removeEventListener('click', closeOnBackdrop);
  }, []);

  useEffect(() => {
    if (!user || !hasSupabase || comments.length === 0) {
      setViewerRatings({});
      return;
    }
    let cancelled = false;
    void supabase
      .from('piece_summary_comment_ratings')
      .select('comment_id, rating')
      .eq('user_id', user.id)
      .in('comment_id', comments.map((comment) => comment.id))
      .then(({ data }) => {
        if (!cancelled) setViewerRatings(Object.fromEntries((data ?? []).map((row) => [row.comment_id, row.rating])));
      });
    return () => { cancelled = true; };
  }, [user, comments.length]);

  async function refresh() {
    if (!hasSupabase) return;
    const { data } = await supabase
      .from('piece_summary_comments')
      .select('id, piece_id, user_id, body, created_at')
      .eq('piece_id', pieceId)
      .order('created_at', { ascending: false });
    if (!data) return;
    const userIds = [...new Set(data.map((row) => row.user_id))];
    const { data: authors } = await supabase.from('users').select('id, display_name, username').in('id', userIds);
    const authorById = new Map((authors ?? []).map((author) => [author.id, author]));
    const refreshed = data.map((row) => {
      const author = authorById.get(row.user_id);
      return {
        id: row.id,
        pieceId: row.piece_id,
        userId: row.user_id,
        body: row.body,
        createdAt: row.created_at,
        author: { displayName: author?.display_name ?? 'Irregular Pearl member', username: author?.username ?? null },
      };
    });
    const { data: ratings } = await supabase
      .from('piece_summary_comment_ratings')
      .select('comment_id, rating')
      .in('comment_id', refreshed.map((comment) => comment.id));
    const grouped = new Map<string, number[]>();
    for (const rating of ratings ?? []) {
      const values = grouped.get(rating.comment_id) ?? [];
      values.push(rating.rating);
      grouped.set(rating.comment_id, values);
    }
    setComments(refreshed.map((comment) => {
      const values = grouped.get(comment.id) ?? [];
      return {
        ...comment,
        averageRating: values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0,
        ratingCount: values.length,
      };
    }).sort((a, b) => b.averageRating - a.averageRating || b.ratingCount - a.ratingCount || b.createdAt.localeCompare(a.createdAt)));
  }

  async function submit() {
    const trimmed = body.trim();
    if (!user || !trimmed || busy) return;
    setBusy(true);
    setError(null);
    const { error: insertError } = await supabase.from('piece_summary_comments').insert({
      piece_id: pieceId,
      user_id: user.id,
      body: trimmed,
    });
    setBusy(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setBody('');
    await refresh();
  }

  async function remove(commentId: string) {
    const { error: deleteError } = await supabase.from('piece_summary_comments').delete().eq('id', commentId);
    if (deleteError) { setError(deleteError.message); return; }
    setComments((current) => current.filter((comment) => comment.id !== commentId));
  }

  async function rate(commentId: string, rating: number) {
    if (!user) return;
    const previous = viewerRatings[commentId];
    setViewerRatings((current) => ({ ...current, [commentId]: rating }));
    const { error: ratingError } = await supabase
      .from('piece_summary_comment_ratings')
      .upsert({ comment_id: commentId, user_id: user.id, rating }, { onConflict: 'comment_id,user_id' });
    if (ratingError) {
      setViewerRatings((current) => {
        const next = { ...current };
        if (previous) next[commentId] = previous;
        else delete next[commentId];
        return next;
      });
      setError(ratingError.message);
      return;
    }
    await refresh();
  }

  function open() {
    previewRef.current?.hidePopover();
    dialogRef.current?.showModal();
  }

  return (
    <>
    {summaryText}
    <div className={summaryText !== undefined ? "summary-comments summary-comments-inline" : "summary-comments"}>
      <button
        type="button"
        className="summary-comments-plus"
        ref={triggerRef}
        onMouseEnter={showPreview}
        onMouseLeave={hidePreviewSoon}
        onFocus={showPreview}
        onBlur={hidePreviewSoon}
        aria-label="View and add comments about this summary"
        aria-haspopup="dialog"
        onClick={open}
      >
        +
      </button>

      <aside ref={previewRef} popover="auto" onMouseEnter={showPreview} onMouseLeave={hidePreviewSoon} onFocus={showPreview} onBlur={hidePreviewSoon} className="summary-comments-preview" aria-label="Top-rated summary comments">
        <strong>{comments.length ? 'Top community insights' : 'Add to this summary'}</strong>
        {comments.length ? (
          comments.slice(0, 3).map((comment) => (
            <div className="preview-comment" key={comment.id}>
              <p>{comment.body}</p>
              <span>— {comment.author.displayName}{comment.ratingCount > 0 ? ` · ${comment.averageRating.toFixed(1)} pearls` : ''}</span>
            </div>
          ))
        ) : (
          <p className="preview-empty">Share context, a correction, or something listeners should notice.</p>
        )}
        <button type="button" onClick={open}>See all comments</button>
      </aside>

      <dialog ref={dialogRef} className="summary-comments-dialog" aria-label="Summary comments">
        <div className="dialog-sheet">
          <div className="dialog-close-row">
            <button type="button" className="dialog-close" aria-label="Close comments" onClick={() => dialogRef.current?.close()}>×</button>
          </div>

          <div className="comment-list">
            {comments.length ? comments.map((comment) => (
              <article className="comment" key={comment.id}>
                <p>{comment.body}</p>
                <footer>
                  <div>
                    <a href={comment.author.username ? `/@${comment.author.username}` : `/profile/${comment.userId}`}>
                      {comment.author.displayName}
                    </a>
                    <time dateTime={comment.createdAt}>{new Date(comment.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</time>
                  </div>
                  <div className="comment-actions">
                    {user?.id === comment.userId && <button type="button" onClick={() => void remove(comment.id)}>Delete</button>}
                    <PearlRating
                      average={comment.averageRating}
                      count={comment.ratingCount}
                      value={viewerRatings[comment.id] ?? 0}
                      onRate={(rating) => gate(() => void rate(comment.id, rating))}
                    />
                  </div>
                </footer>
              </article>
            )) : <p className="comments-empty">No comments yet. Be the first to add an insight.</p>}
          </div>

          <section className="comment-composer">
            <label htmlFor={`summary-comment-${pieceId}`}>Add your comment</label>
            <textarea
              id={`summary-comment-${pieceId}`}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              maxLength={1200}
              rows={4}
              placeholder="Offer context, a correction, or a listening insight…"
              onFocus={() => { if (!user) gate(() => undefined); }}
            />
            <div className="composer-footer">
              <span>{body.length}/1200</span>
              <button type="button" disabled={!body.trim() || busy} onClick={() => gate(() => void submit())}>
                {busy ? 'Posting…' : 'Post comment'}
              </button>
            </div>
            {error && <p className="comment-error" role="alert">{error}</p>}
          </section>
        </div>
      </dialog>

      {signInOpen && (
        <SignInPanel
          onClose={onClose}
          onSignedIn={onSignedIn}
          title="Sign in to join the conversation"
          body={<>Comments are connected to member profiles. Sign in or create an account to add yours.</>}
        />
      )}

      <style>{`
        .summary-comments { position: absolute; top: 14px; right: 14px; z-index: 4; font-family: var(--font-sans); }
        .summary-comments .summary-comments-plus { width: 20px; height: 20px; min-width: 20px; min-height: 20px; padding: 0; border-radius: 50%; border: .5px solid var(--border-strong); background: var(--bg); color: var(--accent); font: 400 16px/1 var(--font-sans); cursor: pointer; display: grid; place-items: center; box-shadow: 0 2px 10px rgb(0 0 0 / .06); transition: transform .15s ease, background .15s ease; }
        .summary-comments-plus:hover, .summary-comments-plus:focus-visible { transform: scale(1.08); background: var(--paper, #fff); }
        .summary-comments-preview { position: fixed; inset: auto; margin: 0; width: min(330px, calc(100vw - 24px)); box-sizing: border-box; overflow-y: auto; overflow-wrap: anywhere; padding: 16px; border: .5px solid var(--border-strong); border-radius: 10px; color: var(--ink); background: var(--bg); box-shadow: 0 12px 36px rgb(0 0 0 / .13); font-family: var(--font-sans); }
        .summary-comments-preview strong { display: block; margin-bottom: 10px; font-size: 12px; letter-spacing: .06em; text-transform: uppercase; }
        .preview-comment { padding: 9px 0; border-top: .5px solid var(--border); }
        .preview-comment p, .preview-empty { margin: 0; color: var(--ink); font: 14px/1.45 var(--font-serif); white-space: pre-wrap; }
        .preview-comment span { display: block; margin-top: 5px; color: var(--muted); font-size: 11px; }
        .summary-comments-preview > button { margin-top: 12px; padding: 0; border: 0; background: none; color: var(--accent); font: 500 12px var(--font-sans); cursor: pointer; }
        .summary-comments-dialog { width: min(660px, calc(100vw - 32px)); max-height: min(760px, calc(100vh - 40px)); padding: 0; border: .5px solid var(--border-strong); border-radius: 14px; color: var(--ink); background: var(--bg); box-shadow: 0 24px 80px rgb(0 0 0 / .22); }
        .summary-comments-dialog::backdrop { background: rgb(20 18 16 / .45); backdrop-filter: blur(2px); }
        .dialog-sheet { padding: 24px; }
        .dialog-close-row { display: flex; justify-content: flex-end; height: 24px; }
        .dialog-close { border: 0; background: none; color: var(--muted); font-size: 27px; line-height: 1; cursor: pointer; }
        .comment-list { max-height: 390px; overflow-y: auto; }
        .comment { padding: 18px 2px; border-bottom: .5px solid var(--border); }
        .comment > p { margin: 0 0 12px; white-space: pre-wrap; font: 15px/1.6 var(--font-serif); }
        .comment footer, .comment footer > div { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .comment footer a { color: var(--ink); font-size: 12px; font-weight: 600; text-decoration: none; }
        .comment time { color: var(--muted); font-size: 11px; }
        .comment-actions > button { border: 0; background: none; color: var(--muted); font-size: 11px; cursor: pointer; }
        .pearl-rating { display: flex; align-items: center; gap: 7px; }
        .pearl-buttons { display: flex; gap: 3px; }
        .pearl-button { width: 19px; height: 19px; padding: 0; border: 0; background: none; cursor: pointer; }
        .pearl { display: block; width: 13px; height: 13px; margin: auto; border: .5px solid #9f8e9d; border-radius: 48% 55% 46% 58%; transform: rotate(-12deg); background: radial-gradient(circle at 32% 28%, #fff 0 16%, #e8dfe8 42%, #bba8ba 100%); box-shadow: inset -1px -1px 2px rgb(80 53 77 / .2); opacity: .32; transition: transform .12s ease, opacity .12s ease; }
        .pearl-button.is-filled .pearl, .pearl-button:hover .pearl { opacity: 1; transform: rotate(-12deg) scale(1.14); }
        .pearl-average { min-width: 48px; color: var(--muted); font-size: 10px; white-space: nowrap; }
        .comments-empty { margin: 28px 0; color: var(--muted); font: italic 15px var(--font-serif); }
        .comment-composer { margin-top: 22px; }
        .comment-composer label { display: block; margin-bottom: 8px; font-size: 12px; font-weight: 600; }
        .comment-composer textarea { box-sizing: border-box; width: 100%; resize: vertical; padding: 11px 12px; border: .5px solid var(--border-strong); border-radius: 8px; color: var(--ink); background: transparent; font: 15px/1.5 var(--font-serif); }
        .composer-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; }
        .composer-footer span { color: var(--muted); font-size: 11px; }
        .composer-footer button { border: 0; border-radius: 8px; padding: 8px 14px; background: var(--ink); color: var(--bg); font: 500 12px var(--font-sans); cursor: pointer; }
        .composer-footer button:disabled { opacity: .45; cursor: not-allowed; }
        .comment-error { color: var(--color-error); font-size: 12px; }
        .summary-comments.summary-comments-inline { display: inline-block; position: relative; top: auto; right: auto; margin-left: 4px; vertical-align: middle; }
        @media (max-width: 640px) { .summary-comments { top: 10px; right: 10px; } .dialog-sheet { padding: 18px; } }
      `}</style>
    </div>
    </>
  );
}

function PearlRating({ average, count, value, onRate }: {
  average: number;
  count: number;
  value: number;
  onRate: (rating: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  const filledThrough = hovered || value || Math.round(average);
  return (
    <div className="pearl-rating" aria-label={count ? `${average.toFixed(1)} out of 5 pearls from ${count} ratings` : 'Not yet rated'}>
      <span className="pearl-buttons" role="radiogroup" aria-label="Rate this comment out of five pearls" onMouseLeave={() => setHovered(0)}>
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            type="button"
            role="radio"
            aria-checked={value === rating}
            aria-label={`${rating} pearl${rating === 1 ? '' : 's'}`}
            className={`pearl-button${rating <= filledThrough ? ' is-filled' : ''}`}
            onMouseEnter={() => setHovered(rating)}
            onFocus={() => setHovered(rating)}
            onBlur={() => setHovered(0)}
            onClick={() => onRate(rating)}
          >
            <span className="pearl" aria-hidden="true" />
          </button>
        ))}
      </span>
      <span className="pearl-average">{count ? `${average.toFixed(1)} (${count})` : 'Rate'}</span>
    </div>
  );
}
