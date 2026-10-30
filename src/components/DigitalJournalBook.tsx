import { useEffect, useRef, useState } from 'react';
import '../styles/digital-journal.css';
type JournalEntry = { id: number; title: string; text: string; date: string };
export default function DigitalJournalBook({ entries, onRemove }: { entries: JournalEntry[]; onRemove: (id: number) => void }) {
  const [page, setPage] = useState(0);
  const [turn, setTurn] = useState<'next' | 'previous' | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pages = entries.flatMap(entry => {
    const chunks: string[] = [];
    let remaining = entry.text;
    while (remaining.length > 650) {
      const boundary = Math.max(remaining.lastIndexOf('\n', 650), remaining.lastIndexOf(' ', 650));
      const end = boundary > 0 ? boundary + 1 : 650;
      chunks.push(remaining.slice(0, end));
      remaining = remaining.slice(end);
    }
    chunks.push(remaining);
    return chunks.map((text, index) => ({ ...entry, text, continuation: index > 0 }));
  });
  // Keep blank paper available, including a spare spread after written entries.
  const totalPages = Math.max(8, Math.ceil(pages.length / 2) * 2 + 2);
  const currentPage = Math.min(page, totalPages - 2);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  function flip(direction: 'next' | 'previous') {
    if (turn) return;
    const next = currentPage + (direction === 'next' ? 2 : -2);
    if (next < 0 || next >= totalPages) return;
    setConfirmId(null);
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { setPage(next); return; }
    setTurn(direction);
    timer.current = setTimeout(() => { setPage(next); setTurn(null); }, 360);
  }
  return <div className="journal-reader" role="region" aria-label="Digital journal pages" tabIndex={0} onKeyDown={event => {
    if (event.target !== event.currentTarget) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); flip('next'); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); flip('previous'); }
  }}>
    <div className="journal-stack">
      <div className="journal-page-layers" aria-hidden="true">{[3, 2, 1].map(depth => <div key={depth} className={`journal-paper-layer journal-paper-layer-${depth}`}><span /><span /></div>)}</div>
    <div className={`journal-book journal-open-book${turn ? ` journal-flip-${turn}` : ''}`} aria-busy={!!turn}>
      {[0, 1].map(side => {
        const entry = pages[currentPage + side];
        return <article key={side} className={`journal-paper journal-${side === 0 ? 'left' : 'right'}-page`} aria-label={`Journal page ${currentPage + side + 1}`}>
          <div className="journal-page-content">
            <div className="journal-page-top"><span>My journal</span>{entry?.date && <time dateTime={entry.date}>{entry.date}</time>}</div>
            {entry ? <><h3>{entry.title}{entry.continuation ? ' (continued)' : ''}</h3><div className="journal-writing">{entry.text}</div></> : <div className="journal-blank"><h3>{!entries.length && side === 0 ? 'A new chapter' : 'Room for more'}</h3><p>{!entries.length && side === 0 ? 'Choose “Write an entry” above to begin your journal.' : 'Your next thoughts belong here.'}</p></div>}
          </div>
          <span className="journal-page-number">{currentPage + side + 1}</span>
        </article>;
      })}
    </div>
    </div>
    <nav className="journal-page-controls" aria-label="Journal page navigation">
      <button className="member-edit" type="button" disabled={currentPage === 0 || !!turn} onClick={() => flip('previous')}>← Previous page</button>
      <span aria-live="polite">Pages {currentPage + 1}–{currentPage + 2} of {totalPages}</span>
      <button className="member-edit" type="button" disabled={currentPage >= totalPages - 2 || !!turn} onClick={() => flip('next')}>Next page →</button>
    </nav>
    <div className="journal-entry-tools">{[...new Map(pages.slice(currentPage, currentPage + 2).map(entry => [entry.id, entry])).values()].map(entry => <div key={entry.id}>{confirmId === entry.id ? <><span>Remove “{entry.title}”?</span><button className="profile-text-button" type="button" onClick={() => { onRemove(entry.id); setConfirmId(null); }}>Remove</button><button className="profile-text-button" type="button" onClick={() => setConfirmId(null)}>Cancel</button></> : <button className="profile-text-button" type="button" onClick={() => setConfirmId(entry.id)}>Remove “{entry.title}”</button>}</div>)}</div>
  </div>;
}
