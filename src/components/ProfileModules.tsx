import { useId, useState } from 'react';
import '../styles/profile-modules.css';
import DigitalJournalBook from './DigitalJournalBook';
type Kind = 'calendar' | 'lists' | 'journal';
type Entry = { id: number; title: string; text: string; date: string; eventType?: 'performing' | 'attending' | 'other' };
const features: { kind: Kind; title: string; description: string }[] = [
  { kind: 'calendar', title: 'Calendar', description: 'Keep track of your own performances and the concerts you attend, past or upcoming.' },
  { kind: 'lists', title: 'Lists', description: 'Collect music, recordings, books, or anything you want to share.' },
  { kind: 'journal', title: 'Digital journal', description: 'Keep notes, reflections, and stories from your life in music.' },
];
export default function ProfileModules() {
  const [selected, setSelected] = useState<Kind[]>([]);
  const [entries, setEntries] = useState<Record<Kind, Entry[]>>({ calendar: [], lists: [], journal: [] });
  const [customizing, setCustomizing] = useState(true);
  return <div className="profile-modules">
    <div className="profile-modules-toolbar"><h2>Your page</h2><button className="member-edit" type="button" aria-expanded={customizing} aria-controls="profile-feature-options" onClick={() => setCustomizing(!customizing)}>Choose features</button></div>
    {customizing && <section id="profile-feature-options" className="profile-feature-options" aria-label="Choose profile features">
      <p>Make room for what matters to you. Choose as few or as many sections as you like.</p>
      <div>{features.map(feature => <label key={feature.kind}><input type="checkbox" checked={selected.includes(feature.kind)} onChange={event => setSelected(previous => event.target.checked ? [...previous, feature.kind] : previous.filter(kind => kind !== feature.kind))} /><span><strong>{feature.title}</strong><small>{feature.description}</small></span></label>)}</div>
      <p className="profile-preview-note">Preview only — entries and layout changes are not saved. Hiding a section keeps its entries until you refresh.</p>
    </section>}
    {!selected.length && <p className="profile-modules-empty">Your page is a blank slate. Choose a feature above to begin.</p>}
    {features.filter(feature => selected.includes(feature.kind)).map(feature => <ProfileModule key={feature.kind} feature={feature} entries={entries[feature.kind]} onAdd={entry => setEntries(previous => ({ ...previous, [feature.kind]: [...previous[feature.kind], { ...entry, id: Date.now() + Math.random() }] }))} onDelete={id => setEntries(previous => ({ ...previous, [feature.kind]: previous[feature.kind].filter(entry => entry.id !== id) }))} onHide={() => setSelected(previous => previous.filter(kind => kind !== feature.kind))} />)}
  </div>;
}
function ProfileModule({ feature, entries, onAdd, onDelete, onHide }: { feature: typeof features[number]; entries: Entry[]; onAdd: (entry: Omit<Entry, 'id'>) => void; onDelete: (id: number) => void; onHide: () => void }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [date, setDate] = useState('');
  const [eventType, setEventType] = useState<'performing' | 'attending' | 'other'>('performing');
  const [status, setStatus] = useState('');
  const [removing, setRemoving] = useState<number | null>(null);
  const isList = feature.kind === 'lists';
  const action = feature.kind === 'calendar' ? 'Add event' : isList ? 'Create list' : 'Write an entry';
  const sorted = feature.kind === 'calendar' ? [...entries].sort((a,b) => a.date.localeCompare(b.date)) : [...entries].reverse();
  return <section className="profile-module" aria-labelledby={`${id}-heading`}>
    <header><div><h2 id={`${id}-heading`}>{feature.title}</h2><p>{feature.description}</p></div><div><button type="button" className="member-edit" aria-expanded={open} aria-controls={`${id}-form`} onClick={() => setOpen(!open)}>+ {action}</button><button type="button" className="profile-text-button" onClick={onHide} aria-label={`Hide ${feature.title}`}>Hide section</button></div></header>
    {open && <form id={`${id}-form`} className="member-form profile-module-form" onSubmit={event => { event.preventDefault(); if (!title.trim() || (isList && !text.trim())) return; onAdd({ title: title.trim(), text: text.trim(), date, ...(feature.kind === 'calendar' ? { eventType } : {}) }); setTitle(''); setText(''); setDate(''); setOpen(false); setStatus(`${feature.kind === 'calendar' ? 'Event' : isList ? 'List' : 'Journal entry'} added to preview.`); }}>
      <label htmlFor={`${id}-title`}>{isList ? 'List name' : 'Title'}<input autoFocus id={`${id}-title`} required maxLength={150} value={title} onChange={event => setTitle(event.target.value)} /></label>
      {feature.kind === 'calendar' && <label htmlFor={`${id}-event-type`}>Event type<select id={`${id}-event-type`} value={eventType} onChange={event => setEventType(event.target.value as typeof eventType)}><option value="performing">My performance</option><option value="attending">Watching / attending</option><option value="other">Rehearsal or other event</option></select></label>}
      {!isList && <label htmlFor={`${id}-date`}>Date{feature.kind === 'journal' ? ' (optional)' : ''}<input id={`${id}-date`} type="date" required={feature.kind === 'calendar'} value={date} onChange={event => setDate(event.target.value)} /></label>}
      <label htmlFor={`${id}-text`}>{isList ? 'Items (one per line)' : feature.kind === 'calendar' ? 'Details (optional)' : 'Journal entry'}<textarea id={`${id}-text`} rows={isList ? 5 : 4} required={feature.kind !== 'calendar'} maxLength={10000} value={text} onChange={event => setText(event.target.value)} /></label>
      <div><button className="member-edit" type="submit">Add to preview</button><button className="member-edit" type="button" onClick={() => setOpen(false)}>Cancel</button></div>
    </form>}
    <p className="profile-preview-note" role="status">{status}</p>
    {feature.kind === 'journal' && <DigitalJournalBook entries={entries} onRemove={onDelete} />}
    {feature.kind !== 'journal' && !entries.length && <p className="profile-modules-empty">{feature.kind === 'calendar' ? 'No dates added yet.' : isList ? 'No lists yet.' : 'Your journal is ready for its first entry.'}</p>}
    {feature.kind !== 'journal' && sorted.map(entry => <article className="profile-module-entry" key={entry.id}>
      {entry.date && <time dateTime={entry.date}>{new Date(`${entry.date}T12:00:00`).toLocaleDateString(undefined, { year:'numeric', month:'short', day:'numeric' })}</time>}
      {entry.eventType && <p className="profile-event-type">{entry.eventType === 'performing' ? 'My performance' : entry.eventType === 'attending' ? 'Watching / attending' : 'Rehearsal or other event'}</p>}
      <h3>{entry.title}</h3>
      {isList ? <ol>{entry.text.split('\n').filter(line => line.trim()).map((line,index) => <li key={index}>{line}</li>)}</ol> : <p className="profile-entry-body">{entry.text}</p>}
      {removing === entry.id ? <div className="profile-remove-confirm">Remove this entry? <button className="profile-text-button" type="button" onClick={() => { onDelete(entry.id); setRemoving(null); }}>Remove</button><button className="profile-text-button" type="button" onClick={() => setRemoving(null)}>Cancel</button></div> : <button className="profile-text-button" type="button" onClick={() => setRemoving(entry.id)} aria-label={`Remove ${entry.title}`}>Remove</button>}
    </article>)}
  </section>;
}
