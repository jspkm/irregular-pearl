import { useEffect, useId, useRef, useState } from 'react';
import { livingComposers, composerCareerStages } from '../data/livingComposers';
import { hasSupabase, supabase } from '../lib/supabase';
import { useRequireAuth } from '../lib/useRequireAuth';
import SignInPanel from './SignInPanel';
import '../styles/era-terms.css';
export default function AddComposer({ existingNames, initialStage = 'early-career' }: { existingNames: string[]; initialStage?: string }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [stage, setStage] = useState(initialStage);
  const [work, setWork] = useState('');
  const [source, setSource] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const { gate, signInOpen, onClose, onSignedIn } = useRequireAuth();
  useEffect(() => { if (open) input.current?.focus(); }, [open]);
  function close() { setOpen(false); trigger.current?.focus(); }
  async function save() {
    if (!hasSupabase || busy) return;
    const cleanName = name.trim();
    if (!cleanName) { setError('Enter the composer’s full name.'); return; }
    if ([...existingNames, ...livingComposers.map(entry => entry.name)].some(entry => entry.trim().toLocaleLowerCase() === cleanName.toLocaleLowerCase())) { setError('This composer is already in the directory.'); return; }
    try { const url = new URL(source); if (!['https:', 'http:'].includes(url.protocol)) throw new Error(); }
    catch { setError('Enter an official website or institutional profile using https:// or http://.'); return; }
    setBusy(true); setError('');
    try {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError || !auth.user) throw new Error();
      const { error } = await (supabase as any).from('community_composers').insert({ name: cleanName, stage, notable_work: work.trim(), source_url: source.trim(), user_id: auth.user.id });
      if (error) { setError(error.code === '23505' ? 'This composer is already in the directory.' : 'The composer could not be saved. Please try again.'); return; }
      window.location.href = `/pieces?view=living&career=${encodeURIComponent(stage)}`;
    } catch { setError('The composer could not be saved. Please try again.'); }
    finally { setBusy(false); }
  }
  return <div className="add-composer">
    <button ref={trigger} className="term-secondary" type="button" aria-expanded={open} aria-controls={`${id}-form`} onClick={() => open ? close() : setOpen(true)}>+ Add composer</button>
    {open && <form id={`${id}-form`} className="era-term-form" onSubmit={event => { event.preventDefault(); gate(() => void save()); }}>
      <p className="term-help">Add a living composer to the shared directory. Please use factual information and link to their official website or an institutional profile.</p>
      <label htmlFor={`${id}-name`}>Full name</label><input id={`${id}-name`} ref={input} value={name} onChange={event => setName(event.target.value)} required maxLength={150} />
      <label htmlFor={`${id}-stage`}>Career stage</label><select id={`${id}-stage`} value={stage} onChange={event => setStage(event.target.value)}>{composerCareerStages.map(entry => <option key={entry.id} value={entry.id}>{entry.label}</option>)}</select>
      <label htmlFor={`${id}-work`}>Notable composition (optional)</label><input id={`${id}-work`} value={work} onChange={event => setWork(event.target.value)} maxLength={300} />
      <label htmlFor={`${id}-source`}>Official website or institutional profile</label><input id={`${id}-source`} type="url" value={source} onChange={event => setSource(event.target.value)} required maxLength={2000} placeholder="https://" />
      {!hasSupabase && <p className="term-help">Adding composers requires a connected database. Saving is unavailable in this preview.</p>}
      {error && <p className="term-error" role="alert">{error}</p>}
      <div className="term-form-actions"><button className="term-primary" type="submit" disabled={busy || !hasSupabase}>{busy ? 'Saving…' : 'Add composer'}</button><button className="term-secondary" type="button" onClick={close} disabled={busy}>Cancel</button></div>
    </form>}
    {signInOpen && <SignInPanel onClose={onClose} onSignedIn={onSignedIn} title="Sign in to add a composer" body={<>Help others discover living composers.</>} />}
    <style>{`.add-composer{margin:16px 0}.add-composer select{box-sizing:border-box;width:100%;min-height:44px;padding:8px 12px;border:.5px solid var(--border-strong);border-radius:8px;background:var(--surface);color:var(--ink);font:15px var(--font-sans)}.add-composer button:focus-visible{outline:1px solid var(--accent);outline-offset:3px}`}</style>
  </div>;
}
