// Collapsed recordings list. One row per recording: label + source chip.
// Clicking the row expands it inline and the iframe mounts (autoplay for
// YouTube + Vimeo where the URL carries ?autoplay=1). Clicking the row
// again collapses it and the iframe unmounts — this actually stops audio,
// which hiding-with-CSS would not.
//
// Single-open model: opening one row closes any other open row. Avoids
// layered playback from two providers at once.

import { useState } from 'react';

export interface RecordingCard {
  type: string;
  url: string;
  label: string;
  embedUrl: string | null;
}

interface Props {
  recordings: RecordingCard[];
}

export default function RecordingsList({ recordings }: Props) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  if (recordings.length === 0) {
    return <p className="empty-state">No reference recordings catalogued yet.</p>;
  }

  return (
    <ul className="rec-list">
      {recordings.map((r, i) => {
        const isOpen = openIdx === i;
        return (
          <li className={`rec-item${isOpen ? ' is-open' : ''}`} key={`${r.url}-${i}`}>
            <button
              type="button"
              className="rec-header"
              aria-expanded={isOpen}
              aria-controls={`rec-body-${i}`}
              onClick={() => setOpenIdx(isOpen ? null : i)}
            >
              <span className="rec-chevron" aria-hidden="true">{isOpen ? '▾' : '▸'}</span>
              <span className="rec-label">{r.label}</span>
              <span className="rec-source">{r.type.replace('_', ' ')}</span>
            </button>

            {isOpen && (
              <div id={`rec-body-${i}`} className="rec-body">
                {r.embedUrl ? (
                  <div className={`rec-frame rec-frame-${r.type}`}>
                    <iframe
                      src={r.embedUrl}
                      title={r.label}
                      loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                      allowFullScreen
                      referrerPolicy="strict-origin-when-cross-origin"
                    />
                  </div>
                ) : (
                  <p className="rec-fallback">
                    <a className="ext-ref" href={r.url} target="_blank" rel="noopener">
                      Open on source
                    </a>
                  </p>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
