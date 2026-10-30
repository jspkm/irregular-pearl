import { useEffect, useRef, useState } from 'react';
import { hasSupabase, supabase } from '../lib/supabase';
import { useRequireAuth } from '../lib/useRequireAuth';
import SignInPanel from './SignInPanel';
import '../styles/era-terms.css';

type Term = { id: string; term: string; definition: string; user_id?: string };
export default function EraTerms({ eraId, terms }: { eraId: string; terms: Term[] }) {
  const [added, setAdded] = useState<Term[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState('');
  const [definition, setDefinition] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const { user, gate, signInOpen, onClose, onSignedIn } = useRequireAuth();
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const addButton = useRef<HTMLButtonElement>(null);
  const db = supabase as any;
  useEffect(() => {
    let cancelled = false;
    if (hasSupabase) void db.from('glossary_era_terms').select('id, term, definition, user_id').eq('era_id', eraId).then(({ data, error }: any) => {
      if (cancelled) return;
      if (error) setError('Community terms could not be loaded. Please try again later.');
      else setAdded(data ?? []);
    });
    return () => { cancelled = true; };
  }, [eraId]);
  useEffect(() => { if (open) input.current?.focus(); }, [open]);
  useEffect(() => {
    const dismiss = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setActive(null); };
    const escape = (e: KeyboardEvent) => { if (e.key === 'Escape') setActive(null); };
    document.addEventListener('pointerdown', dismiss); document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', dismiss); document.removeEventListener('keydown', escape); };
  }, []);
  function close() { setOpen(false); addButton.current?.focus(); }
  async function save() {
    if (busy || !hasSupabase) return;
    const name = term.trim(); const text = definition.trim();
    if (!name || !text) { setError('Enter a term and its definition.'); return; }
    if ([...terms, ...added].some(t => t.term.toLowerCase() === name.toLowerCase())) { setError('This term already appears in this era.'); return; }
    setBusy(true); setError('');
    try {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError || !auth.user) throw new Error('Sign in required');
      const { data, error } = await db.from('glossary_era_terms').insert({ era_id: eraId, term: name, definition: text, user_id: auth.user.id }).select('id, term, definition, user_id').single();
      if (error) throw error;
      setAdded(previous => [...previous, data]); setTerm(''); setDefinition(''); setStatus(`${name} added.`); close();
    } catch { setError('The term could not be saved. Please try again.'); }
    finally { setBusy(false); }
  }
  const selected = [...terms, ...added].find(entry => entry.id === active);
  return <div className="era-terms" ref={root}>
    <div className="era-terms-heading"><h2 id="terms-title">Musical terms</h2><button ref={addButton} className="term-secondary" type="button" aria-expanded={open} aria-controls={`add-term-${eraId}`} onClick={() => { setOpen(!open); setError(''); }}>+ Add term</button></div>
    <p className="term-help">Hover over a term to read its definition, or select it.</p>
    {open && <form id={`add-term-${eraId}`} className="era-term-form" onSubmit={e => { e.preventDefault(); gate(() => void save()); }}>
      <label htmlFor={`term-name-${eraId}`}>Term</label><input ref={input} id={`term-name-${eraId}`} required maxLength={100} value={term} onChange={e => setTerm(e.target.value)} />
      <label htmlFor={`term-definition-${eraId}`}>Definition</label><textarea id={`term-definition-${eraId}`} required rows={3} maxLength={1200} value={definition} onChange={e => setDefinition(e.target.value)} />
      <p className="term-help">Add a concise, factual definition for this era.</p>
      {!hasSupabase && <p className="term-help">Adding shared terms requires a connected database. Saving is unavailable in this preview.</p>}
      <div className="term-form-actions"><button type="submit" className="term-primary" disabled={busy || !hasSupabase}>{busy ? 'Saving…' : user ? 'Add term' : 'Sign in to add term'}</button><button className="term-secondary" type="button" disabled={busy} onClick={close}>Cancel</button></div>
    </form>}
    {error && <p role="alert" className="term-error">{error}</p>}<p role="status" className="term-help">{status}</p>
    <div className="era-term-grid">{[...terms, ...added].sort((a,b) => a.term.localeCompare(b.term)).map(entry => <span className="era-term" id={`term-${entry.id}`} key={entry.id} onMouseEnter={() => setActive(entry.id)}>
      <button type="button" className={`era-term-trigger${active === entry.id ? ' is-active' : ''}`} aria-describedby={active === entry.id ? `definition-${entry.id}` : undefined} onFocus={() => setActive(entry.id)} onBlur={e => { if (!e.currentTarget.parentElement?.contains(e.relatedTarget)) setActive(null); }} onClick={() => setActive(entry.id)}>{entry.term}</button>
    </span>)}</div>
    <div className="era-definition-area">
      {selected ? <div className="era-term-definition" role="tooltip" id={`definition-${selected.id}`}>
        <strong>{selected.term}</strong><p>{selected.definition}</p>
      </div> : <p className="era-definition-hint">Hover over or select a term above to see its definition here.</p>}
    </div>
    {signInOpen && <SignInPanel onClose={onClose} onSignedIn={onSignedIn} title="Sign in to add a musical term" body={<>Share a term and its definition with other musicians.</>} />}
  </div>;
}
