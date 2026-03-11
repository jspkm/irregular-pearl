"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";

const PLAYLIST = [
  {
    title: "Fur Elise",
    performer: "JMC Han",
    url: "https://commons.wikimedia.org/wiki/Special:FilePath/For%20Elise%20%28F%C3%BCr%20Elise%29%20Beethoven%20JMC%20Han.ogg",
  },
  {
    title: "Clair de lune",
    performer: "Piano Solo Recording",
    url: "https://commons.wikimedia.org/wiki/Special:FilePath/Clair%20de%20lune%20%28Claude%20Debussy%29%20Suite%20bergamasque.ogg",
  },
  {
    title: "Nocturne Op. 9 No. 2",
    performer: "Membeth",
    url: "https://commons.wikimedia.org/wiki/Special:FilePath/Frederic%20Chopin%20-%20Nocturne%20Eb%20major%20Opus%209%2C%20number%202.ogg",
  },
];

function PlayerIcon() {
  return (
    <svg viewBox="0 0 110 110" role="img" focusable="false" className="retro-player-svg">
      <rect x="0" y="0" width="110" height="110" className="y2k-shell" />
      <rect x="10" y="10" width="90" height="38" className="y2k-screen" />
      <path d="M16 16 C34 8, 62 9, 94 17" className="y2k-gloss" />
      <circle cx="33" cy="29" r="9" className="y2k-reel" />
      <circle cx="77" cy="29" r="9" className="y2k-reel" />
      <circle cx="33" cy="29" r="2.5" className="y2k-core" />
      <circle cx="77" cy="29" r="2.5" className="y2k-core" />
      <rect x="14" y="60" width="82" height="30" className="y2k-controls" />
      <polygon points="49,67 49,83 63,75" className="y2k-play" />
      <rect x="68" y="68" width="4.5" height="14" className="y2k-bar" />
      <rect x="75" y="68" width="4.5" height="14" className="y2k-bar" />
      <circle cx="26" cy="75" r="4.5" className="y2k-button" />
      <circle cx="86" cy="75" r="4.5" className="y2k-button" />
    </svg>
  );
}

export default function Home() {
  const panelRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const dragRef = useRef<{ id: number; offsetX: number; offsetY: number } | null>(null);

  const [ready, setReady] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [minimized, setMinimized] = useState(false);
  const [muted, setMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [trackIndex, setTrackIndex] = useState(0);
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [playedOrder, setPlayedOrder] = useState<number[]>([0]);

  useEffect(() => {
    const panelWidth = 320;
    const panelHeight = 210;
    setPosition({
      x: Math.max(12, (window.innerWidth - panelWidth) / 2),
      y: Math.max(12, (window.innerHeight - panelHeight) / 2),
    });
    setReady(true);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    audio.muted = muted;
    if (!isPlaying) {
      return;
    }
    const playback = audio.play();
    if (playback) {
      playback.catch(() => {
        // Autoplay can still be blocked on some browsers.
      });
    }
  }, [isPlaying, muted, trackIndex]);

  useEffect(() => {
    setPlayedOrder((current) => {
      if (current[current.length - 1] === trackIndex) {
        return current;
      }
      return [...current, trackIndex];
    });
  }, [trackIndex]);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button")) {
      return;
    }
    const panel = panelRef.current;
    if (!panel) {
      return;
    }
    const bounds = panel.getBoundingClientRect();
    dragRef.current = {
      id: event.pointerId,
      offsetX: event.clientX - bounds.left,
      offsetY: event.clientY - bounds.top,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const dragState = dragRef.current;
    const panel = panelRef.current;
    if (!dragState || dragState.id !== event.pointerId || !panel) {
      return;
    }
    const maxX = window.innerWidth - panel.offsetWidth;
    const maxY = window.innerHeight - panel.offsetHeight;
    const nextX = Math.min(Math.max(0, event.clientX - dragState.offsetX), Math.max(0, maxX));
    const nextY = Math.min(Math.max(0, event.clientY - dragState.offsetY), Math.max(0, maxY));
    setPosition({ x: nextX, y: nextY });
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.id === event.pointerId) {
      dragRef.current = null;
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const playNextTrack = () => {
    setTrackIndex((index) => (index + 1) % PLAYLIST.length);
  };

  const playPreviousTrack = () => {
    setTrackIndex((index) => (index - 1 + PLAYLIST.length) % PLAYLIST.length);
  };

  const handleMuteToggle = async () => {
    const audio = audioRef.current;
    const nextMuted = !muted;
    setMuted(nextMuted);
    if (!audio) {
      return;
    }
    audio.muted = nextMuted;
    if (!nextMuted) {
      try {
        await audio.play();
      } catch {
        // If the browser blocks playback, keep UI responsive.
      }
    }
  };

  const handlePlayStopToggle = async () => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }
    try {
      await audio.play();
      setIsPlaying(true);
    } catch {
      // Some browsers may block resume until user interaction context is valid.
    }
  };

  const playedIndexes = playedOrder.slice(0, -1);
  const upcomingIndexes = PLAYLIST.map((_, index) => index)
    .filter((index) => index !== trackIndex)
    .sort((a, b) => {
      const distanceA = (a - trackIndex + PLAYLIST.length) % PLAYLIST.length;
      const distanceB = (b - trackIndex + PLAYLIST.length) % PLAYLIST.length;
      return distanceA - distanceB;
    });

  return (
    <main className="min-h-screen w-full bg-cotton-candy">
      <audio
        ref={audioRef}
        src={PLAYLIST[trackIndex].url}
        autoPlay
        muted={muted}
        playsInline
        onEnded={playNextTrack}
        onError={playNextTrack}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      <div className="retro-player-icon retro-player-icon--playing" aria-hidden="true">
        <PlayerIcon />
      </div>

      {ready && !minimized && (
        <>
          <div
            ref={panelRef}
            className="floating-player"
            style={{ left: position.x, top: position.y }}
          >
            <div
              className="floating-player__titlebar"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            >
              <span>Classical Playlist</span>
              <button
                type="button"
                className="floating-player__minimize"
                onClick={() => setMinimized(true)}
                aria-label="Minimize player"
              >
                _
              </button>
            </div>
            <div className="floating-player__body">
              <p className="floating-player__track">{PLAYLIST[trackIndex].title}</p>
              <p className="floating-player__performer">{PLAYLIST[trackIndex].performer}</p>
              <div className="floating-player__actions">
                <button
                  type="button"
                  className="floating-player__btn-mute"
                  onClick={handleMuteToggle}
                  aria-label={muted ? "Unmute" : "Mute"}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path className="icon-stroke" d="M5 9H9L13 5V19L9 15H5Z" />
                    {muted ? (
                      <path className="icon-stroke" d="M16 9L22 15M22 9L16 15" />
                    ) : (
                      <path className="icon-stroke" d="M16 9C17.5 10.4 17.5 13.6 16 15M18.5 7C21.8 10 21.8 14 18.5 17" />
                    )}
                  </svg>
                </button>
                <button type="button" onClick={playPreviousTrack} aria-label="Previous track">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path className="icon-stroke" d="M7 6V18" />
                    <path className="icon-fill" d="M19 6L10 12L19 18Z" />
                  </svg>
                </button>
                <button type="button" onClick={handlePlayStopToggle} aria-label={isPlaying ? "Stop" : "Play"}>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    {isPlaying ? (
                      <rect className="icon-fill" x="7" y="7" width="10" height="10" />
                    ) : (
                      <path className="icon-fill" d="M8 6L18 12L8 18Z" />
                    )}
                  </svg>
                </button>
                <button type="button" onClick={playNextTrack} aria-label="Next track">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path className="icon-stroke" d="M17 6V18" />
                    <path className="icon-fill" d="M5 6L14 12L5 18Z" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="floating-player__btn-slide"
                  onClick={() => setPlaylistOpen((value) => !value)}
                  aria-label={playlistOpen ? "Hide playlist" : "Show playlist"}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    {playlistOpen ? (
                      <path className="icon-stroke" d="M15 6L9 12L15 18" />
                    ) : (
                      <path className="icon-stroke" d="M9 6L15 12L9 18" />
                    )}
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <aside
            className={`floating-player__queue ${playlistOpen ? "is-open" : ""}`}
            style={{ left: position.x + (panelRef.current?.offsetWidth ?? 320) + 8, top: position.y }}
          >
            <div className="floating-player__queue-inner">
              <p className="floating-player__queue-label">Played</p>
              <ul className="floating-player__queue-list">
                {playedIndexes.length === 0 ? (
                  <li className="floating-player__queue-empty">No tracks played yet</li>
                ) : (
                  playedIndexes.map((index, entry) => (
                    <li key={`${index}-${entry}`}>
                      <span>{PLAYLIST[index].title}</span>
                      <small>{PLAYLIST[index].performer}</small>
                    </li>
                  ))
                )}
              </ul>

              <p className="floating-player__queue-label">Now Playing</p>
              <div className="floating-player__queue-current">
                <span>{PLAYLIST[trackIndex].title}</span>
                <small>{PLAYLIST[trackIndex].performer}</small>
              </div>

              <p className="floating-player__queue-label">Up Next</p>
              <ul className="floating-player__queue-list">
                {upcomingIndexes.map((index) => (
                  <li key={`next-${index}`}>
                    <span>{PLAYLIST[index].title}</span>
                    <small>{PLAYLIST[index].performer}</small>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </>
      )}

      {minimized && (
        <button
          type="button"
          className="player-dock"
          onClick={() => setMinimized(false)}
          aria-label="Open music player"
        >
          <span className="player-dock__text">Playing {muted ? "(Muted)" : ""}</span>
          <span className="player-dock__bars" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>
      )}
    </main>
  );
}
