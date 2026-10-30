import { useEffect, useRef, useState } from 'react';
import { hasSupabase, supabase } from '../lib/supabase';
import { useRequireAuth } from '../lib/useRequireAuth';
import SignInPanel from './SignInPanel';
import '../styles/era-terms.css';
import '../styles/era-knowledge.css';

type Entry = { id: string; name: string; description: string; user_id: string; author: string; username: string | null };
type Props = { eraId: string; kind: 'characteristic' | 'theory'; entries: { name: string; description: string }[] };
export default function EraKnowledge({ eraId, kind, entries }: Props) {
  const theory = kind === 'theory';
  const noun = theory ? 'concept' : 'characteristic';
  const title = theory ? 'Music theory concepts' : 'Key musical characteristics';
  const headingId = theory ? 'theory-title' : 'characteristics-title';
  const formId = `era-${kind}-${eraId}`;
  const [added, setAdded] = useState<Entry[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const { user, gate, signInOpen, onClose, onSignedIn } = useRequireAuth();
  const db = supabase as any;
  useEffect(() => {
    let cancelled = false;
    if (hasSupabase) void db.from('glossary_era_entries').select('id, name, description, user_id').eq('era_id', eraId).eq('kind', kind).order('created_at').then(async ({ data, error }: any) => {
      if (cancelled) return;
      if (error) { setError('Community additions could not be loaded. Please try again later.'); return; }
      if (!data?.length) { setAdded([]); return; }
      const { data: authors } = await db.from('users').select('id, display_name, username').in('id', [...new Set(data.map((entry: any) => entry.user_id))]);
      if (cancelled) return;
      setAdded(data.map((entry: any) => { const author = authors?.find((a: any) => a.id === entry.user_id); return { ...entry, author: author?.display_name || 'Irregular Pearl member', username: author?.username ?? null }; }));
    });
    return () => { cancelled = true; };
  }, [eraId, kind]);
  useEffect(() => { if (open) input.current?.focus(); }, [open]);
  function close() { setOpen(false); setEditing(null); setName(''); setDescription(''); setError(''); trigger.current?.focus(); }
  async function save() {
    if (!hasSupabase || busy) return;
    const cleanName = name.trim(); const cleanDescription = description.trim();
    if (!cleanName || (theory && !cleanDescription)) { setError(`Enter ${theory ? 'a concept and its explanation' : 'a characteristic'}.`); return; }
    if ([...entries, ...added.filter(entry => entry.id !== editing)].some(entry => entry.name.trim().toLowerCase() === cleanName.toLowerCase())) { setError(`This ${noun} already appears in this era.`); return; }
    setBusy(true); setError('');
    try {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError || !auth.user) throw new Error('Sign in required');
      const fields = { name: cleanName, description: theory ? cleanDescription : '' };
      const query = editing ? db.from('glossary_era_entries').update(fields).eq('id', editing).eq('user_id', auth.user.id) : db.from('glossary_era_entries').insert({ ...fields, era_id: eraId, kind, user_id: auth.user.id });
      const { data, error } = await query.select('id, name, description, user_id').single();
      if (error) throw error;
      const { data: author } = await db.from('users').select('display_name, username').eq('id', auth.user.id).maybeSingle();
      const saved = { ...data, author: author?.display_name || 'Irregular Pearl member', username: author?.username ?? null };
      setAdded(previous => editing ? previous.map(entry => entry.id === editing ? saved : entry) : [...previous, saved]);
      setStatus(`${theory ? 'Concept' : 'Characteristic'} ${editing ? 'updated' : 'added'}.`); close();
    } catch { setError('Your contribution could not be saved. Please try again.'); }
    finally { setBusy(false); }
  }
  async function remove(entry: Entry) {
    if (busy) return;
    setBusy(true); setError('');
    const { error } = await db.from('glossary_era_entries').delete().eq('id', entry.id).eq('user_id', user?.id);
    if (error) setError('Your contribution could not be deleted. Please try again.');
    else { setAdded(previous => previous.filter(item => item.id !== entry.id)); setStatus('Contribution deleted.'); }
    setBusy(false);
  }
  function credit(entry: Entry) {
    return <div className="era-entry-credit"><a href={entry.username ? `/@${entry.username}` : `/profile/${entry.user_id}`}>— {entry.author}</a>{user?.id === entry.user_id && <><button type="button" disabled={busy} onClick={() => { setEditing(entry.id); setName(entry.name); setDescription(entry.description); setOpen(true); setError(''); }}>Edit</button><button type="button" disabled={busy} onClick={() => void remove(entry)}>Delete</button></>}</div>;
  }
  return <div className="era-knowledge">
    <div className="era-terms-heading"><h2 id={headingId}>{title}</h2><button ref={trigger} className="term-secondary" type="button" aria-expanded={open} aria-controls={formId} onClick={() => { if (open) close(); else { setOpen(true); setError(''); } }}>+ Add {noun}</button></div>
    {open && <form id={formId} className="era-term-form" onSubmit={event => { event.preventDefault(); gate(() => void save()); }}>
      <label htmlFor={`${formId}-name`}>{theory ? 'Concept' : 'Characteristic'}</label><input ref={input} id={`${formId}-name`} required maxLength={theory ? 100 : 600} value={name} onChange={event => setName(event.target.value)} />
      {theory && <><label htmlFor={`${formId}-description`}>Explanation</label><textarea id={`${formId}-description`} required rows={3} maxLength={1200} value={description} onChange={event => setDescription(event.target.value)} /></>}
      <p className="term-help">Share a concise contribution relevant to this era. It will appear under your name.</p>
      {!hasSupabase && <p className="term-help">Adding shared contributions requires a connected database. Saving is unavailable in this preview.</p>}
      <div className="term-form-actions"><button className="term-primary" type="submit" disabled={busy || !hasSupabase}>{busy ? 'Saving…' : editing ? 'Save changes' : user ? `Add ${noun}` : `Sign in to add ${noun}`}</button><button className="term-secondary" type="button" disabled={busy} onClick={close}>Cancel</button></div>
    </form>}
    {error && <p className="term-error" role="alert">{error}</p>}<p className="term-help" role="status">{status}</p>
    {theory ? <dl className="era-knowledge-theory">{entries.map((entry, index) => <div key={`reference-${index}`}><dt>{entry.name}</dt><dd>{entry.description}</dd></div>)}{added.map(entry => <div key={entry.id}><dt>{entry.name}</dt><dd>{entry.description}{credit(entry)}</dd></div>)}</dl> : <ul className="era-knowledge-characteristics">{entries.map((entry, index) => <li key={`reference-${index}`}>{entry.name}</li>)}{added.map(entry => <li key={entry.id}>{entry.name}{credit(entry)}</li>)}</ul>}
    {signInOpen && <SignInPanel onClose={onClose} onSignedIn={onSignedIn} title={`Sign in to add a ${noun}`} body={<>Share your knowledge of this musical era.</>} />}
  </div>;
}
