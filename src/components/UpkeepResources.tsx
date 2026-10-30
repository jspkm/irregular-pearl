import { useEffect, useRef, useState } from 'react';
import { hasSupabase } from '../lib/supabase';
import { useRequireAuth } from '../lib/useRequireAuth';
import { deleteResource, loadResources, ownVotes, saveResource, validateResource, voteResource, type HelpfulnessVote, type ResourceEntry, type ResourceInput } from '../lib/upkeepResources';
import SignInPanel from './SignInPanel';

const blank: ResourceInput = { topic: '', title: '', publisher: '', scope: '', summary: '', url: '' };
const fields = [
  { key: 'topic', label: 'Topic', max: 120 },
  { key: 'title', label: 'Resource title', max: 240 },
  { key: 'url', label: 'Resource URL', max: 2000 },
  { key: 'publisher', label: 'Publisher or organization', max: 160 },
  { key: 'scope', label: 'Instrument or voice scope', max: 160 },
  { key: 'summary', label: 'Short factual description', max: 1200 },
] as const;

export default function UpkeepResources({ category, level, initial, intro }: { category: string; level: string; initial: ResourceEntry[]; intro: string }) {
  const { user, gate, signInOpen, onClose, onSignedIn } = useRequireAuth();
  const [resources, setResources] = useState(initial);
  const [votes, setVotes] = useState<Record<string, HelpfulnessVote>>({});
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | undefined>();
  const [draft, setDraft] = useState<ResourceInput>(blank);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [status, setStatus] = useState('');
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const addButton = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (open) input.current?.focus(); }, [open, editing]);
  useEffect(() => {
    let cancelled = false;
    setVotes({});
    if (!hasSupabase) return;
    void (async () => {
      try {
        const rows = await loadResources(category, level);
        if (cancelled) return;
        // Preserve curated references if the migration has not seeded this category yet.
        if (!rows.length && initial.length) throw new Error('Resources are not initialized');
        setResources(rows); setReady(true); setError('');
        if (user) {
          const mine = await ownVotes(user.id, rows.map(row => row.id));
          if (!cancelled) setVotes(mine);
        }
      } catch {
        if (!cancelled) { setReady(false); setError('Community submissions and voting could not be loaded. Please try again later.'); }
      }
    })();
    return () => { cancelled = true; };
  }, [category, level, user?.id]);

  function closeForm() { setOpen(false); setEditing(undefined); setDraft(blank); setFormError(''); addButton.current?.focus(); }
  async function refresh() { setResources(await loadResources(category, level)); }
  async function submit() {
    if (busy || !ready) return;
    setFormError('');
    let value: ResourceInput;
    try { value = validateResource(draft); } catch (err) { setFormError((err as Error).message); return; }
    if (resources.some(row => row.id !== editing && new URL(row.url).href === value.url)) { setFormError('This URL is already listed in this category.'); return; }
    setBusy(true);
    try {
      await saveResource(category, level, value, editing);
      closeForm(); setStatus(editing ? 'Resource updated.' : 'Resource added.');
      try { await refresh(); } catch { setError('Saved successfully, but the list could not refresh. Reload the page to see the change.'); }
    } catch { setFormError('The resource could not be saved. Please try again.'); }
    finally { setBusy(false); }
  }
  async function vote(row: ResourceEntry, desired: HelpfulnessVote) {
    if (busy || !ready) return;
    const next = votes[row.id] === desired ? 0 : desired;
    setBusy(true); setError('');
    try {
      await voteResource(row.id, next);
      setVotes(previous => { const updated = { ...previous }; if (next) updated[row.id] = next; else delete updated[row.id]; return updated; });
      setStatus(next ? 'Helpfulness vote saved.' : 'Vote removed.');
      try { await refresh(); } catch { setError('Your vote was saved. Reload to update the resource order.'); }
    } catch { setError('Your vote could not be saved. Please try again.'); }
    finally { setBusy(false); }
  }
  async function remove(id: string) {
    if (busy || !ready) return;
    setBusy(true); setError('');
    try { await deleteResource(id); setResources(previous => previous.filter(row => row.id !== id)); setConfirmRemove(null); setStatus('Resource removed.'); }
    catch { setError('The resource could not be removed. Please try again.'); }
    finally { setBusy(false); }
  }
  function edit(row: ResourceEntry) {
    setDraft({ topic: row.topic, title: row.title, url: row.url, publisher: row.publisher, scope: row.scope, summary: row.summary });
    setEditing(row.id); setOpen(true); setFormError('');
  }
  return <section className="upkeep-resources" aria-label={`${level} ${category} upkeep resources`}>
    <p className="upkeep-resource-intro">{intro}</p>
    <p className="upkeep-community-notice">Found a resource useful? Select Helpful or Less helpful to share your experience. Your votes help higher-quality resources become more visible to other musicians.</p>
    {!hasSupabase && <p className="upkeep-community-notice">Submitting resources and voting require a connected database. They are unavailable in this preview.</p>}
    {hasSupabase && !ready && !error && <p className="upkeep-community-notice">Loading community resources…</p>}
    <div className="upkeep-resource-heading"><button ref={addButton} type="button" className="upkeep-secondary" aria-expanded={open} aria-controls="upkeep-resource-form" disabled={busy} onClick={() => { if (open) closeForm(); else { setDraft(blank); setEditing(undefined); setFormError(''); setOpen(true); } }}>+ Add resource</button></div>
    {open && <form id="upkeep-resource-form" className="upkeep-resource-form" onSubmit={event => { event.preventDefault(); gate(() => void submit()); }}>
      <h3>{editing ? 'Edit resource' : 'Add a resource'}</h3>
      <p>Describe what the source covers. Your submission will be attributed to your profile.</p>
      {fields.map(field => <div className="upkeep-field" key={field.key}><label htmlFor={`upkeep-${field.key}`}>{field.label}</label>{field.key === 'summary'
        ? <textarea id={`upkeep-${field.key}`} required maxLength={field.max} rows={3} value={draft[field.key]} aria-describedby={formError ? 'upkeep-form-error' : undefined} onChange={event => setDraft(previous => ({ ...previous, [field.key]: event.target.value }))} />
        : <input ref={field.key === 'topic' ? input : undefined} id={`upkeep-${field.key}`} type={field.key === 'url' ? 'url' : 'text'} required maxLength={field.max} value={draft[field.key]} aria-describedby={formError ? 'upkeep-form-error' : undefined} onChange={event => setDraft(previous => ({ ...previous, [field.key]: event.target.value }))} />}</div>)}
      {formError && <p className="upkeep-error" id="upkeep-form-error" role="alert">{formError}</p>}
      <div className="upkeep-form-actions"><button className="upkeep-primary" type="submit" disabled={!ready || busy}>{busy ? 'Saving…' : user ? editing ? 'Save changes' : 'Add resource' : 'Sign in to submit'}</button><button className="upkeep-secondary" type="button" disabled={busy} onClick={closeForm}>Cancel</button></div>
    </form>}
    {error && <p className="upkeep-error" role="alert">{error}</p>}<p className="upkeep-status" role="status">{status}</p>
    <ul className="upkeep-resource-list">
    {resources.map(row => <li key={row.id}><article className="upkeep-resource">
      <h3>{row.topic}</h3><p className="upkeep-resource-meta">{row.publisher} · {row.scope}</p><p className="upkeep-resource-summary">{row.summary}</p>
      <a href={row.url}>{row.title} <span aria-hidden="true">↗</span></a>
      {row.user_id ? <p className="upkeep-resource-reviewed">Submitted by <a href={`/profile/${row.user_id}`}>{row.author ?? 'Irregular Pearl member'}</a> · Community resource</p>
        : row.reviewed_at && <p className="upkeep-resource-reviewed">Source reviewed <time dateTime={row.reviewed_at}>{new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(row.reviewed_at))}</time></p>}
      <div className="upkeep-resource-actions"><span>Was this helpful?</span>
        <button type="button" className="upkeep-secondary" aria-label={`Helpful: ${row.title}`} aria-pressed={votes[row.id] === 1} disabled={!ready || busy || user?.id === row.user_id} onClick={() => gate(() => void vote(row, 1))}>Helpful</button>
        <button type="button" className="upkeep-secondary" aria-label={`Less helpful: ${row.title}`} aria-pressed={votes[row.id] === -1} disabled={!ready || busy || user?.id === row.user_id} onClick={() => gate(() => void vote(row, -1))}>Less helpful</button>
        {user?.id === row.user_id && <><button type="button" className="upkeep-secondary" disabled={busy} onClick={() => edit(row)}>Edit</button><button type="button" className="upkeep-secondary" disabled={busy} onClick={() => setConfirmRemove(row.id)}>Remove</button><span className="upkeep-own-note">Others can vote on your resource.</span></>}
      </div>
      {confirmRemove === row.id && <div className="upkeep-remove-confirm"><span>Remove this resource?</span><button className="upkeep-secondary" type="button" disabled={busy} onClick={() => void remove(row.id)}>Remove resource</button><button className="upkeep-secondary" type="button" disabled={busy} onClick={() => setConfirmRemove(null)}>Cancel</button></div>}
    </article></li>)}
    </ul>
    {signInOpen && <SignInPanel onClose={onClose} onSignedIn={onSignedIn} title="Sign in to contribute" body={<>Submit upkeep resources and vote on how helpful you find them.</>} />}
  </section>;
}
