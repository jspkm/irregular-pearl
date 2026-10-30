import { useEffect, useState, type FormEvent } from 'react';
import { supabase, hasSupabase } from '../lib/supabase';
import { useAuth } from '../lib/useAuth';

type Review = {
  id: string; review_type: string; title: string; subject: string; body: string;
  rating: number | null; event_date: string | null; external_url: string | null; created_at: string;
};
type ListItem = { id: string; position: number; title: string; note: string; external_url: string | null };
type CuratedList = { id: string; title: string; description: string; created_at: string; curated_list_items: ListItem[] };

const blankReview = { review_type: 'concert', title: '', subject: '', body: '', rating: '', event_date: '', external_url: '' };
const blankList = { title: '', description: '', items: '' };

function safeUrl(value: string | null) {
  if (!value) return null;
  try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) ? url.href : null; } catch { return null; }
}

export default function ProfileCulture({ userId }: { userId: string }) {
  const { user } = useAuth();
  const isOwner = user?.id === userId;
  const [reviews, setReviews] = useState<Review[]>([]);
  const [lists, setLists] = useState<CuratedList[]>([]);
  const [reviewForm, setReviewForm] = useState(blankReview);
  const [listForm, setListForm] = useState(blankList);
  const [composer, setComposer] = useState<'review' | 'list' | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const load = async () => {
    if (!hasSupabase) return;
    const client = supabase as any;
    const [{ data: reviewRows }, { data: listRows }] = await Promise.all([
      client.from('profile_reviews').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      client.from('curated_lists').select('*, curated_list_items(*)').eq('user_id', userId).order('created_at', { ascending: false }),
    ]);
    setReviews((reviewRows ?? []) as Review[]);
    setLists(((listRows ?? []) as CuratedList[]).map(list => ({ ...list, curated_list_items: [...(list.curated_list_items ?? [])].sort((a, b) => a.position - b.position) })));
  };

  useEffect(() => { void load(); }, [userId]);

  const submitReview = async (event: FormEvent) => {
    event.preventDefault();
    if (!isOwner || !reviewForm.title.trim() || !reviewForm.subject.trim() || !reviewForm.body.trim()) return;
    setSaving(true); setMessage('');
    const { error } = await (supabase as any).from('profile_reviews').insert({
      user_id: userId, review_type: reviewForm.review_type, title: reviewForm.title.trim(), subject: reviewForm.subject.trim(),
      body: reviewForm.body.trim(), rating: reviewForm.rating ? Number(reviewForm.rating) : null,
      event_date: reviewForm.event_date || null, external_url: safeUrl(reviewForm.external_url),
    });
    setSaving(false);
    if (error) { setMessage('The review could not be published. Please try again.'); return; }
    setReviewForm(blankReview); setComposer(null); await load();
  };

  const submitList = async (event: FormEvent) => {
    event.preventDefault();
    if (!isOwner || !listForm.title.trim()) return;
    const items = listForm.items.split('\n').map(line => line.trim()).filter(Boolean);
    if (!items.length) { setMessage('Add at least one item, with each item on a new line.'); return; }
    setSaving(true); setMessage('');
    const client = supabase as any;
    const { data: list, error } = await client.from('curated_lists').insert({ user_id: userId, title: listForm.title.trim(), description: listForm.description.trim() }).select('id').single();
    if (error || !list) { setSaving(false); setMessage('The list could not be published. Please try again.'); return; }
    const { error: itemError } = await client.from('curated_list_items').insert(items.map((title, index) => ({ list_id: list.id, position: index + 1, title })));
    setSaving(false);
    if (itemError) { await client.from('curated_lists').delete().eq('id', list.id); setMessage('The list could not be published. Please try again.'); return; }
    setListForm(blankList); setComposer(null); await load();
  };

  const removeReview = async (id: string) => { if (!isOwner) return; await (supabase as any).from('profile_reviews').delete().eq('id', id).eq('user_id', userId); await load(); };
  const removeList = async (id: string) => { if (!isOwner) return; await (supabase as any).from('curated_lists').delete().eq('id', id).eq('user_id', userId); await load(); };

  return (
    <div className="mt-10 border-t border-border pt-8">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div><p className="text-[11px] font-semibold tracking-[.12em] uppercase text-accent mb-1">Listening life</p><h2 className="font-display text-2xl">Reviews &amp; curated lists</h2></div>
        {isOwner && <div className="flex gap-2"><button onClick={() => setComposer(composer === 'review' ? null : 'review')} className="px-3 py-2 text-xs rounded-full border border-border hover:border-accent">Write a review</button><button onClick={() => setComposer(composer === 'list' ? null : 'list')} className="px-3 py-2 text-xs rounded-full bg-ink text-bg">Create a list</button></div>}
      </div>

      {composer === 'review' && <form onSubmit={submitReview} className="culture-form">
        <div className="grid md:grid-cols-2 gap-3"><label>Review type<select value={reviewForm.review_type} onChange={e => setReviewForm({...reviewForm, review_type:e.target.value})}><option value="concert">Concert</option><option value="opera">Opera</option><option value="recording">Recording</option><option value="venue">Venue</option><option value="other">Other</option></select></label><label>Rating<select value={reviewForm.rating} onChange={e => setReviewForm({...reviewForm, rating:e.target.value})}><option value="">No rating</option>{[5,4,3,2,1].map(n => <option key={n} value={n}>{n} / 5</option>)}</select></label></div>
        <label>Review title<input required maxLength={160} value={reviewForm.title} onChange={e => setReviewForm({...reviewForm,title:e.target.value})} placeholder="A memorable night at the Met" /></label>
        <label>What are you reviewing?<input required maxLength={160} value={reviewForm.subject} onChange={e => setReviewForm({...reviewForm,subject:e.target.value})} placeholder="Mahler Symphony No. 2 — New York Philharmonic" /></label>
        <label>Your review<textarea required maxLength={5000} rows={5} value={reviewForm.body} onChange={e => setReviewForm({...reviewForm,body:e.target.value})} /></label>
        <div className="grid md:grid-cols-2 gap-3"><label>Date<input type="date" value={reviewForm.event_date} onChange={e => setReviewForm({...reviewForm,event_date:e.target.value})} /></label><label>Related link<input type="url" value={reviewForm.external_url} onChange={e => setReviewForm({...reviewForm,external_url:e.target.value})} placeholder="https://…" /></label></div>
        <button disabled={saving} className="publish-button">{saving ? 'Publishing…' : 'Publish review'}</button>
      </form>}

      {composer === 'list' && <form onSubmit={submitList} className="culture-form">
        <label>List title<input required maxLength={160} value={listForm.title} onChange={e => setListForm({...listForm,title:e.target.value})} placeholder="Top 10 Mahler performances" /></label>
        <label>Short introduction<textarea maxLength={1000} rows={3} value={listForm.description} onChange={e => setListForm({...listForm,description:e.target.value})} /></label>
        <label>List items <span className="normal-case tracking-normal">— one per line, in order</span><textarea required rows={7} value={listForm.items} onChange={e => setListForm({...listForm,items:e.target.value})} placeholder={'Bernstein — Mahler 2, 1963\nAbbado — Mahler 9, 1999'} /></label>
        <button disabled={saving} className="publish-button">{saving ? 'Publishing…' : 'Publish list'}</button>
      </form>}
      {message && <p role="alert" className="text-sm text-error mb-6">{message}</p>}

      <div className="grid lg:grid-cols-2 gap-10">
        <section><h3 className="culture-heading">Reviews <span>{reviews.length}</span></h3>{reviews.length === 0 ? <p className="empty-copy">No reviews shared yet.</p> : <div className="divide-y divide-border">{reviews.map(review => <article key={review.id} className="py-5 first:pt-0"><div className="flex justify-between gap-3"><div><p className="review-meta">{review.review_type}{review.event_date ? ` · ${new Date(`${review.event_date}T12:00:00`).toLocaleDateString()}` : ''}</p><h4 className="font-display text-xl mt-1">{review.title}</h4></div>{review.rating && <span className="text-sm text-accent whitespace-nowrap">{'★'.repeat(review.rating)}<span className="text-tertiary">{'★'.repeat(5-review.rating)}</span></span>}</div><p className="text-xs text-muted mt-1">{review.subject}</p><p className="text-sm leading-6 mt-3 whitespace-pre-line">{review.body}</p><div className="flex gap-3 mt-3">{safeUrl(review.external_url) && <a href={safeUrl(review.external_url)!} target="_blank" rel="noopener noreferrer" className="text-xs text-accent">Concert or recording link ↗</a>}{isOwner && <button onClick={() => removeReview(review.id)} className="text-xs text-muted underline">Delete</button>}</div></article>)}</div>}</section>
        <section><h3 className="culture-heading">Curated lists <span>{lists.length}</span></h3>{lists.length === 0 ? <p className="empty-copy">No lists shared yet.</p> : <div className="space-y-5">{lists.map(list => <article key={list.id} className="border border-border rounded-lg p-5"><div className="flex justify-between gap-3"><h4 className="font-display text-xl">{list.title}</h4>{isOwner && <button onClick={() => removeList(list.id)} className="text-xs text-muted underline">Delete</button>}</div>{list.description && <p className="text-sm text-muted leading-6 mt-2">{list.description}</p>}<ol className="mt-4 space-y-3">{list.curated_list_items.map(item => <li key={item.id} className="grid grid-cols-[24px_1fr] gap-2 text-sm"><span className="font-mono text-xs text-accent pt-0.5">{String(item.position).padStart(2,'0')}</span><span>{item.title}{item.note && <small className="block text-muted mt-1">{item.note}</small>}</span></li>)}</ol></article>)}</div>}</section>
      </div>
      <style>{`.culture-form{margin-bottom:2rem;padding:1.25rem;border:1px solid var(--color-border);border-radius:.6rem;background:var(--color-bg-tint);display:grid;gap:.85rem}.culture-form label{display:grid;gap:.35rem;color:var(--color-muted);font-size:.68rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase}.culture-form input,.culture-form textarea,.culture-form select{width:100%;border:1px solid var(--color-border);border-radius:.35rem;background:var(--color-surface);color:var(--color-ink);padding:.65rem .75rem;font:inherit;font-size:.875rem;letter-spacing:normal;text-transform:none}.culture-form input:focus,.culture-form textarea:focus,.culture-form select:focus{outline:1px solid var(--color-accent);border-color:var(--color-accent)}.publish-button{justify-self:start;border-radius:999px;background:var(--color-accent);color:white;padding:.65rem 1rem;font-size:.8rem;font-weight:600}.culture-heading{display:flex;align-items:baseline;justify-content:space-between;border-bottom:1px solid var(--color-border);padding-bottom:.75rem;margin-bottom:1.25rem;font-family:var(--font-serif);font-size:1.25rem}.culture-heading span{font-family:var(--font-mono);font-size:.7rem;color:var(--color-tertiary)}.empty-copy{font-size:.85rem;color:var(--color-muted)}.review-meta{font-size:.65rem;text-transform:uppercase;letter-spacing:.1em;color:var(--color-accent)}`}</style>
    </div>
  );
}
