import { useCallback, useEffect, useRef, useState } from 'react';
import { hasSupabase, supabase } from '../lib/supabase';
import { useAuth } from '../lib/useAuth';
import { useRequireAuth } from '../lib/useRequireAuth';
import SignInPanel from './SignInPanel';

type SubjectType = 'glossary_era_summary' | 'glossary_era_characteristics' | 'glossary_term_definition' | 'composer_summary';
type Comment = { id: string; userId: string; body: string; createdAt: string; author: string; username: string | null; average: number; count: number };

export default function SectionComments({ subjectType, subjectKey, summaryText }: { subjectType: SubjectType; subjectKey: string; summaryText?: string }) {
  const { user } = useAuth();
  const { signInOpen, onClose, onSignedIn, gate } = useRequireAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [viewerRatings, setViewerRatings] = useState<Record<string, number>>({});
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const previewRef = useRef<HTMLElement>(null);
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inline = summaryText !== undefined;
  function showPreview() {
    if (!inline || dialogRef.current?.open) return;
    if (previewTimer.current) clearTimeout(previewTimer.current);
    const preview = previewRef.current;
    const trigger = triggerRef.current;
    if (!preview || !trigger) return;
    if (!preview.matches(':popover-open')) preview.showPopover();
    const rect = trigger.getBoundingClientRect();
    const width = preview.getBoundingClientRect().width;
    const below = window.innerHeight - rect.bottom - 16;
    const above = rect.top - 16;
    const useBelow = below >= Math.min(preview.scrollHeight, 300) || below >= above;
    preview.style.maxHeight = `${Math.max(80, useBelow ? below : above)}px`;
    preview.style.left = `${Math.max(12, Math.min(rect.right - width, window.innerWidth - width - 12))}px`;
    preview.style.top = `${useBelow ? rect.bottom + 8 : Math.max(12, rect.top - preview.getBoundingClientRect().height - 8)}px`;
  }
  function hidePreviewSoon() {
    if (previewTimer.current) clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(() => {
      if (!previewRef.current?.contains(document.activeElement)) previewRef.current?.hidePopover();
    }, 180);
  }
  function openComments() {
    if (inline) previewRef.current?.hidePopover();
    dialogRef.current?.showModal();
  }
  useEffect(() => {
    const close = () => { if (inline) previewRef.current?.hidePopover(); };
    window.addEventListener('resize', close);
    window.addEventListener('scroll', close);
    return () => {
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', close);
      if (previewTimer.current) clearTimeout(previewTimer.current);
    };
  }, [inline]);
  const db = supabase as any;

  const refresh = useCallback(async () => {
    if (!hasSupabase) return;
    const { data: rows } = await db.from('section_comments').select('id, user_id, body, created_at')
      .eq('subject_type', subjectType).eq('subject_key', subjectKey).order('created_at', { ascending: false });
    if (!rows?.length) { setComments([]); return; }
    const ids = rows.map((row: any) => row.id);
    const userIds = [...new Set(rows.map((row: any) => row.user_id))];
    const [{ data: authors }, { data: ratings }] = await Promise.all([
      db.from('users').select('id, display_name, username').in('id', userIds),
      db.from('section_comment_ratings').select('comment_id, user_id, rating').in('comment_id', ids),
    ]);
    const authorMap = new Map((authors ?? []).map((author: any) => [author.id, author]));
    const grouped = new Map<string, number[]>();
    const mine: Record<string, number> = {};
    for (const rating of ratings ?? []) {
      const values = grouped.get(rating.comment_id) ?? [];
      values.push(rating.rating); grouped.set(rating.comment_id, values);
      if (rating.user_id === user?.id) mine[rating.comment_id] = rating.rating;
    }
    setViewerRatings(mine);
    setComments(rows.map((row: any) => {
      const values = grouped.get(row.id) ?? [];
      const author: any = authorMap.get(row.user_id);
      return { id: row.id, userId: row.user_id, body: row.body, createdAt: row.created_at,
        author: author?.display_name ?? 'Irregular Pearl member', username: author?.username ?? null,
        average: values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0, count: values.length };
    }).sort((a: Comment, b: Comment) => b.average - a.average || b.count - a.count || b.createdAt.localeCompare(a.createdAt)));
  }, [subjectType, subjectKey, user?.id]);

  useEffect(() => { void refresh(); }, [refresh]);

  async function submit() {
    if (!hasSupabase) { setError('Contributions are unavailable in this preview. Please connect the database to post.'); return; }
    if (!user || !body.trim() || busy) return;
    setBusy(true); setError(null);
    const { error: insertError } = await db.from('section_comments').insert({ subject_type: subjectType, subject_key: subjectKey, user_id: user.id, body: body.trim() });
    setBusy(false);
    if (insertError) { setError(insertError.message); return; }
    setBody(''); await refresh();
  }

  async function rate(commentId: string, rating: number) {
    if (!user) return;
    const { error: ratingError } = await db.from('section_comment_ratings').upsert(
      { comment_id: commentId, user_id: user.id, rating }, { onConflict: 'comment_id,user_id' });
    if (ratingError) { setError(ratingError.message); return; }
    await refresh();
  }

  async function remove(commentId: string) {
    const { error: removeError } = await db.from('section_comments').delete().eq('id', commentId);
    if (removeError) { setError(removeError.message); return; }
    await refresh();
  }

  return <>{summaryText}<div className={`section-comments${inline ? " section-comments-inline" : ""}`}>
    <button ref={triggerRef} onMouseEnter={showPreview} onMouseLeave={hidePreviewSoon} onFocus={showPreview} onBlur={hidePreviewSoon} className="section-comments-plus" type="button" aria-label={inline ? (subjectType === 'composer_summary' ? `View and add contributions to ${subjectKey}’s summary` : 'View and add contributions to this era summary') : "View and add comments"} aria-haspopup="dialog" onClick={openComments}>+</button>
    <aside ref={previewRef} popover={inline ? "auto" : undefined} onMouseEnter={showPreview} onMouseLeave={hidePreviewSoon} onFocus={showPreview} onBlur={hidePreviewSoon} className="section-comments-preview">
      {comments.length ? comments.slice(0, 3).map((comment) => <div className="preview-item" key={comment.id}><p>{comment.body}</p><span>— {comment.author}{comment.count ? ` · ${comment.average.toFixed(1)} pearls` : ''}</span></div>) : <p>No comments yet. Add an insight or suggest a correction.</p>}
      <button type="button" onClick={openComments}>See all comments</button>
    </aside>
    <dialog ref={dialogRef} className="section-comments-dialog" aria-label={inline ? (subjectType === 'composer_summary' ? `${subjectKey} summary contributions` : 'Era summary contributions') : "Comments"}>
      <div className="dialog-inner">
        <div className="close-row"><button type="button" aria-label="Close comments" onClick={() => dialogRef.current?.close()}>×</button></div>
        <div className="comment-list">
          {inline && <h2>{subjectType === 'composer_summary' ? `${subjectKey}: summary contributions` : 'Era summary contributions'}</h2>}
          {comments.length ? comments.map((comment) => <article className="comment" key={comment.id}>
            <p>{comment.body}</p>
            <footer><div><a href={comment.username ? `/@${comment.username}` : `/profile/${comment.userId}`}>{comment.author}</a><time>{new Date(comment.createdAt).toLocaleDateString()}</time></div><div className="actions">{user?.id === comment.userId && <button type="button" onClick={() => void remove(comment.id)}>Delete</button>}<Pearls average={comment.average} count={comment.count} value={viewerRatings[comment.id] ?? 0} onRate={(value) => gate(() => void rate(comment.id, value))} /></div></footer>
          </article>) : <p className="empty">No comments yet. Be the first to add an insight.</p>}
        </div>
        <section className="composer"><label htmlFor={`section-comment-${subjectType}-${subjectKey}`}>Add your comment</label><textarea id={`section-comment-${subjectType}-${subjectKey}`} rows={4} maxLength={1200} value={body} onChange={(event) => setBody(event.target.value)} placeholder="Offer context, a correction, or an insight…" onFocus={() => { if (!user) gate(() => undefined); }} /><div><span>{body.length}/1200</span><button type="button" disabled={!body.trim() || busy} onClick={() => gate(() => void submit())}>{busy ? 'Posting…' : 'Post comment'}</button></div>{error && <p className="error">{error}</p>}</section>
      </div>
    </dialog>
    {signInOpen && <SignInPanel onClose={onClose} onSignedIn={onSignedIn} title="Sign in to join the conversation" body={<>Sign in or create an account to comment and rate contributions.</>} />}
    <style>{`
      .section-comments{position:absolute;right:0;top:0;z-index:5;font-family:var(--font-sans)}
      .section-comments-plus{width:28px;height:28px;border:.5px solid var(--border-strong);border-radius:50%;background:var(--bg);color:var(--accent);font-size:21px;line-height:1;cursor:pointer;box-shadow:0 2px 10px rgb(0 0 0/.06)}
      .section-comments-preview{position:absolute;right:0;top:36px;width:min(330px,calc(100vw - 48px));padding:15px;border:.5px solid var(--border-strong);border-radius:10px;background:var(--bg);box-shadow:0 12px 36px rgb(0 0 0/.13);opacity:0;visibility:hidden;transform:translateY(-4px);transition:.15s}
      .section-comments:hover .section-comments-preview,.section-comments:focus-within .section-comments-preview{opacity:1;visibility:visible;transform:none}
      .section-comments-preview>p,.preview-item p{margin:0;font:14px/1.45 var(--font-serif)}.preview-item{padding:8px 0;border-bottom:.5px solid var(--border)}.preview-item span{color:var(--muted);font-size:11px}.section-comments-preview>button{margin-top:10px;padding:0;border:0;background:none;color:var(--accent);font-size:12px;cursor:pointer}
      .section-comments.section-comments-inline{display:inline-block;position:relative;right:auto;top:auto;margin-left:4px;vertical-align:middle}
      .section-comments-inline .section-comments-plus{width:20px;height:20px;min-width:20px;min-height:20px;padding:0;font-size:16px;box-shadow:none}
      .section-comments-inline .section-comments-preview{position:fixed;inset:auto;margin:0;max-height:calc(100dvh - 24px);overflow:auto;color:var(--ink);box-shadow:none;transform:none;transition:none}
      .section-comments-inline .section-comments-preview:popover-open{opacity:1;visibility:visible}
      .section-comments-inline .section-comments-preview:not(:popover-open){display:none}
      .section-comments-inline h2{font:500 18px/1.4 var(--font-sans);margin:0 0 16px}
      .section-comments-dialog{width:min(660px,calc(100vw - 32px));max-height:calc(100vh - 40px);padding:0;border:.5px solid var(--border-strong);border-radius:14px;background:var(--bg);color:var(--ink);box-shadow:0 24px 80px rgb(0 0 0/.22)}.section-comments-dialog::backdrop{background:rgb(20 18 16/.45);backdrop-filter:blur(2px)}
      .dialog-inner{padding:24px}.close-row{display:flex;justify-content:flex-end;height:24px}.close-row button{border:0;background:none;color:var(--muted);font-size:27px;cursor:pointer}.comment-list{max-height:380px;overflow:auto}.comment{padding:18px 2px;border-bottom:.5px solid var(--border)}.comment>p{margin:0 0 12px;white-space:pre-wrap;font:15px/1.6 var(--font-serif)}.comment footer,.comment footer>div{display:flex;align-items:center;justify-content:space-between;gap:10px}.comment footer a{color:var(--ink);font-size:12px;font-weight:600;text-decoration:none}.comment time{color:var(--muted);font-size:11px}.actions>button{border:0;background:none;color:var(--muted);font-size:11px;cursor:pointer}.empty{margin:24px 0;color:var(--muted);font:italic 15px var(--font-serif)}
      .composer{margin-top:22px}.composer label{display:block;margin-bottom:8px;font-size:12px;font-weight:600}.composer textarea{box-sizing:border-box;width:100%;padding:11px 12px;border:.5px solid var(--border-strong);border-radius:8px;background:transparent;color:var(--ink);resize:vertical;font:15px/1.5 var(--font-serif)}.composer>div{display:flex;align-items:center;justify-content:space-between;margin-top:8px}.composer span{color:var(--muted);font-size:11px}.composer button{border:0;border-radius:8px;padding:8px 14px;background:var(--ink);color:var(--bg);font-size:12px;cursor:pointer}.composer button:disabled{opacity:.45}.error{color:var(--color-error);font-size:12px}
      .pearls{display:flex;align-items:center;gap:6px}.pearl-buttons{display:flex;gap:2px}.pearl-button{width:19px;height:19px;padding:0;border:0;background:none;cursor:pointer}.pearl{display:block;width:13px;height:13px;margin:auto;border:.5px solid #9f8e9d;border-radius:48% 55% 46% 58%;transform:rotate(-12deg);background:radial-gradient(circle at 32% 28%,#fff 0 16%,#e8dfe8 42%,#bba8ba 100%);box-shadow:inset -1px -1px 2px rgb(80 53 77/.2);opacity:.3}.pearl-button.filled .pearl{opacity:1}.pearl-average{color:var(--muted);font-size:10px;white-space:nowrap}
    `}</style>
  </div></>;
}

function Pearls({ average, count, value, onRate }: { average:number; count:number; value:number; onRate:(value:number)=>void }) {
  const [hovered,setHovered]=useState(0); const fill=hovered||value||Math.round(average);
  return <div className="pearls"><span className="pearl-buttons" role="radiogroup" aria-label="Rate out of five pearls" onMouseLeave={()=>setHovered(0)}>{[1,2,3,4,5].map((n)=><button type="button" role="radio" aria-checked={value===n} aria-label={`${n} pearl${n===1?'':'s'}`} className={`pearl-button${n<=fill?' filled':''}`} onMouseEnter={()=>setHovered(n)} onFocus={()=>setHovered(n)} onBlur={()=>setHovered(0)} onClick={()=>onRate(n)}><span className="pearl" /></button>)}</span><span className="pearl-average">{count?`${average.toFixed(1)} (${count})`:'Rate'}</span></div>;
}
