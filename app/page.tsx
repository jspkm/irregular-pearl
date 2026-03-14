"use client";

import { useEffect, useRef, useState, useCallback, type PointerEvent } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getAllTracks,
  getMasterPlaylist,
  getUserPlaylists,
  createPlaylist,
  updatePlaylistTracks,
  renamePlaylist,
  deletePlaylist,
  getUserProfile,
  setUserProfile,
  onRadioStateChange,
  initRadioState,
  getTrackInsight,
} from "@/lib/firestore";
import { computeCurrentRadioPosition } from "@/lib/radio";
import type { Track, Playlist, RadioState } from "@/lib/types";


/* ── Helpers ────────────────────────────────────────── */

function formatDuration(seconds: number): string {
  const rounded = Math.floor(seconds);
  const m = Math.floor(rounded / 60);
  const s = rounded % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/* ── Duration Probe ────────────────────────────────── */

function probeAudioDuration(url: string): Promise<number | null> {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.preload = "metadata";
    const cleanup = () => { audio.src = ""; audio.load(); };
    audio.addEventListener("loadedmetadata", () => {
      const d = audio.duration;
      cleanup();
      resolve(isFinite(d) ? d : null);
    }, { once: true });
    audio.addEventListener("error", () => { cleanup(); resolve(null); }, { once: true });
    audio.src = url;
  });
}


/* ── Player Icon ────────────────────────────────────── */

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

function MusicNotesSimpleIcon() {
  return (
    <svg viewBox="0 0 256 256" aria-hidden="true">
      <path
        fill="currentColor"
        d="M212.92,17.69a8,8,0,0,0-6.86-1.45l-128,32A8,8,0,0,0,72,56V166.08A36,36,0,1,0,88,196V110.25l112-28v51.83A36,36,0,1,0,216,164V24A8,8,0,0,0,212.92,17.69ZM52,216a20,20,0,1,1,20-20A20,20,0,0,1,52,216ZM88,93.75V62.25l112-28v31.5ZM180,184a20,20,0,1,1,20-20A20,20,0,0,1,180,184Z"
      />
    </svg>
  );
}

function PlaylistIcon() {
  return (
    <svg viewBox="0 0 256 256" aria-hidden="true">
      <path
        fill="currentColor"
        d="M80,64a8,8,0,0,1,8-8H216a8,8,0,0,1,0,16H88A8,8,0,0,1,80,64Zm136,56H88a8,8,0,0,0,0,16H216a8,8,0,0,0,0-16Zm0,64H88a8,8,0,0,0,0,16H216a8,8,0,0,0,0-16ZM44,52A12,12,0,1,0,56,64,12,12,0,0,0,44,52Zm0,64a12,12,0,1,0,12,12A12,12,0,0,0,44,116Zm0,64a12,12,0,1,0,12,12A12,12,0,0,0,44,180Z"
      />
    </svg>
  );
}

/* ── Track Title Component ────────────────────────── */

function TrackTitle({
  title,
  trackId,
  onCopy,
  showTooltip,
}: {
  title: string;
  trackId: string;
  onCopy: () => void;
  showTooltip: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [scrollDist, setScrollDist] = useState("0px");
  const [hasScrolledOnce, setHasScrolledOnce] = useState(false);

  useEffect(() => {
    setHasScrolledOnce(false);
    setIsOverflowing(false);

    const detect = () => {
      if (textRef.current && containerRef.current) {
        // Use a small buffer (2px) to trigger scrolling if very close
        const ov = textRef.current.scrollWidth > (containerRef.current.clientWidth - 2);
        setIsOverflowing(ov);
        if (ov) {
          const dist = containerRef.current.clientWidth - textRef.current.scrollWidth;
          setScrollDist(`${dist}px`);
        }
      }
    };

    const rafId = requestAnimationFrame(() => setTimeout(detect, 50));
    return () => cancelAnimationFrame(rafId);
  }, [title, trackId]);

  return (
    <div className="floating-player__track-row">
      <div className="floating-player__track-container" ref={containerRef}>
        <p
          ref={textRef}
          className={`floating-player__track ${isOverflowing && !hasScrolledOnce ? "is-scrolling" : ""}`}
          style={{ "--scroll-dist": scrollDist, lineHeight: 1.1 } as React.CSSProperties}
          onAnimationEnd={() => setHasScrolledOnce(true)}
        >
          {title}
        </p>
      </div>
      <button
        type="button"
        className="track-copy-btn"
        onClick={onCopy}
        title="Copy track info"
        aria-label="Copy track info"
      >
        {showTooltip && <span className="insight-tooltip">Copied!</span>}
        <svg
          viewBox="0 0 256 256"
          fill="none"
          stroke="currentColor"
          strokeWidth="18"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="96" y="96" width="104" height="104" rx="16"></rect>
          <path d="M160 96V56a16 16 0 0 0-16-16H56a16 16 0 0 0-16 16v88a16 16 0 0 0 16 16h40"></path>
        </svg>
      </button>
    </div>
  );
}

/* ── Typewriter Effect ───────────────────────────── */

function TypewriterText({ text, speed = 40 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState("");
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    setDisplayed("");
    setIndex(0);
  }, [text]);

  useEffect(() => {
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayed((prev) => prev + text[index]);
        setIndex((prev) => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    }
  }, [index, text, speed]);

  // Auto-scroll to bottom of insights container as it types
  useEffect(() => {
    if (scrollRef.current?.parentElement) {
      scrollRef.current.parentElement.scrollTop = scrollRef.current.parentElement.scrollHeight;
    }
  }, [displayed]);
  return (
    <p 
      className="floating-player__insight" 
      ref={scrollRef}
      style={{ position: 'relative' }}
    >
      {displayed}
    </p>
  );
}

function TrackDialogContent({
  insight,
  messages,
  isLoading,
}: {
  insight: string;
  messages: Array<{ role: "user" | "assistant"; text: string }>;
  isLoading: boolean;
}) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current?.parentElement) {
      contentRef.current.parentElement.scrollTop = contentRef.current.parentElement.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <div ref={contentRef} className="floating-player__dialog-thread">
      <TypewriterText text={insight} speed={4} />
      {messages.map((message, index) => (
        <div
          key={`${message.role}-${index}-${message.text.slice(0, 24)}`}
          className={`floating-player__dialog-bubble floating-player__dialog-bubble--${message.role}`}
        >
          <p className="floating-player__dialog-text">{message.text}</p>
        </div>
      ))}
      {isLoading && (
        <div className="floating-player__dialog-bubble floating-player__dialog-bubble--assistant">
          <p className="floating-player__dialog-text">Thinking...</p>
        </div>
      )}
    </div>
  );
}

/* ── Main Component ─────────────────────────────────── */

export default function Home() {
  const { user, loading: authLoading, signInGoogle, signInEmail, signUpEmail, signOut, updateProfile, authError, clearError } = useAuth();

  const panelRef = useRef<HTMLDivElement>(null);
  const authPanelRef = useRef<HTMLDivElement>(null);
  const sidebarScrollRef = useRef<HTMLDivElement>(null);
  const activeTrackRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const radioStateRef = useRef<RadioState | null>(null);
  const dragRef = useRef<{ id: number; offsetX: number; offsetY: number } | null>(null);
  const authDragRef = useRef<{ id: number; offsetX: number; offsetY: number } | null>(null);

  // Layout state
  const [ready, setReady] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [panelSize, setPanelSize] = useState({ width: 0, height: 0 });
  const [authPosition, setAuthPosition] = useState({ x: 0, y: 0 });
  const [minimized, setMinimized] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Playback state
  const [muted, setMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [trackIndex, setTrackIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [forceReload, setForceReload] = useState(0);
  const actualDuration = useRef<number | null>(null);
  const [playedOrder, setPlayedOrder] = useState<number[]>([0]);
  const [isPlaylistCollapsed, setIsPlaylistCollapsed] = useState(false);
  const [insight, setInsight] = useState("");
  const [showCopyTooltip, setShowCopyTooltip] = useState(false);
  const [activePlayerTab, setActivePlayerTab] = useState<"track-chat" | "playlists">("track-chat");
  const [chatQuestion, setChatQuestion] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [dialogMessages, setDialogMessages] = useState<Array<{ role: "user" | "assistant"; text: string }>>([]);
  const [playlistDialogMessages, setPlaylistDialogMessages] = useState<Array<{ role: "user" | "assistant"; text: string }>>([]);

  // Data state
  const [allTracks, setAllTracks] = useState<Track[]>([]);
  const [currentTracks, setCurrentTracks] = useState<Track[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Playlist state
  const [masterPlaylist, setMasterPlaylist] = useState<Playlist | null>(null);
  const [userPlaylists, setUserPlaylists] = useState<Playlist[]>([]);
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const [expandedPlaylistId, setExpandedPlaylistId] = useState<string | null | undefined>(undefined);
  const [trackDropdownOpenId, setTrackDropdownOpenId] = useState<string | null>(null);
  // Browse/add state
  const [searchQuery, setSearchQuery] = useState("");

  // New playlist dialog
  const [showNewPlaylist, setShowNewPlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");

  // Rename dialog
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // Auth panel state
  const [authPanelOpen, setAuthPanelOpen] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authDisplayName, setAuthDisplayName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  // Profile panel state
  const [profilePanelOpen, setProfilePanelOpen] = useState(false);
  const [profilePhotoURL, setProfilePhotoURL] = useState<string | null>(null);
  const profileDragRef = useRef<{ id: number; offsetX: number; offsetY: number } | null>(null);
  const profilePanelRef = useRef<HTMLElement>(null);
  const [profilePosition, setProfilePosition] = useState({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatAbortRef = useRef<AbortController | null>(null);

  /* ── Data Loading ───────────────────────────────── */

  const loadData = useCallback(async () => {
    setDataLoading(true);
    try {
      // Load tracks first (always needed)
      const tracks = await getAllTracks();
      setAllTracks(tracks);
      setCurrentTracks(tracks);

      // Try loading master playlist
      try {
        const master = await getMasterPlaylist();
        setMasterPlaylist(master);
        if (master) {
          const ordered = master.trackIds
            .map((id) => tracks.find((t) => t.id === id))
            .filter(Boolean) as Track[];
          if (ordered.length > 0) {
            setCurrentTracks(ordered);
          }
          setActivePlaylistId(master.id);
        }
      } catch (err) {
        console.error("Failed to load master playlist:", err);
      }

      // Try loading user playlists
      if (user) {
        try {
          const playlists = await getUserPlaylists(user.uid);
          setUserPlaylists(playlists);
        } catch (err) {
          console.error("Failed to load user playlists:", err);
        }
      } else {
        // Clear user state on logout
        setUserPlaylists([]);
      }
    } catch (err) {
      console.error("Failed to load tracks:", err);
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      loadData();
    }
  }, [authLoading, loadData]);

  // Probe actual audio durations and correct mismatches (skip already-verified tracks)
  useEffect(() => {
    const unverified = allTracks.filter((t) => !t.durationVerified);
    if (unverified.length === 0) return;
    let cancelled = false;
    (async () => {
      const corrections: { id: string; durationSeconds: number }[] = [];
      const verified: string[] = [];
      // Probe in parallel (batches of 4 to avoid overwhelming the browser)
      for (let i = 0; i < unverified.length; i += 4) {
        const batch = unverified.slice(i, i + 4);
        const results = await Promise.all(
          batch.map(async (track) => {
            const actual = await probeAudioDuration(track.audioUrl);
            if (actual && Math.abs(actual - track.durationSeconds) > 2) {
              return { id: track.id, durationSeconds: Math.round(actual), corrected: true };
            }
            return { id: track.id, durationSeconds: track.durationSeconds, corrected: false };
          })
        );
        if (cancelled) return;
        for (const r of results) {
          if (r) {
            verified.push(r.id);
            if (r.corrected) corrections.push({ id: r.id, durationSeconds: r.durationSeconds });
          }
        }
      }
      if (cancelled) return;
      // Mark all probed tracks as verified; apply duration corrections
      const correctionMap = new Map(corrections.map((c) => [c.id, c.durationSeconds]));
      const verifiedSet = new Set(verified);
      const applyUpdates = (tracks: Track[]) =>
        tracks.map((t) => {
          if (!verifiedSet.has(t.id)) return t;
          const corrected = correctionMap.get(t.id);
          return { ...t, durationVerified: true, ...(corrected != null ? { durationSeconds: corrected } : {}) };
        });
      setAllTracks(applyUpdates);
      setCurrentTracks(applyUpdates);
      // Fire-and-forget Firestore corrections (also sets durationVerified)
      for (const c of corrections) {
        fetch("/api/correct-duration", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(c),
        }).catch(() => {});
      }
      // Mark tracks with correct duration as verified in Firestore too
      const alreadyCorrect = verified.filter((id) => !correctionMap.has(id));
      for (const id of alreadyCorrect) {
        const track = allTracks.find((t) => t.id === id);
        if (track) {
          fetch("/api/correct-duration", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ trackId: id, durationSeconds: track.durationSeconds }),
          }).catch(() => {});
        }
      }
    })();
    return () => { cancelled = true; };
  }, [allTracks.length]); // Only re-run when track count changes

  /* ──Track Insight (server-generated, cached in Firestore) ── */

  const currentTrackId = currentTracks[trackIndex]?.id;
  useEffect(() => {
    if (!currentTrackId) return;

    let isMounted = true;
    const fetchInsight = async () => {
      setInsight("");

      // Read cached insight from Firestore (server generates it on track change)
      try {
        const cached = await getTrackInsight(currentTrackId);
        if (cached && isMounted) {
          setInsight(cached);
          return;
        }
      } catch { }

      // Cache not ready yet — poll with backoff (server may still be generating)
      const delays = [2000, 3000, 5000, 8000, 12000];
      for (const delay of delays) {
        if (!isMounted) return;
        await new Promise((r) => setTimeout(r, delay));
        try {
          const cached = await getTrackInsight(currentTrackId);
          if (cached && isMounted) {
            setInsight(cached);
            return;
          }
        } catch { }
      }

      if (isMounted) setInsight("");
    };

    fetchInsight();
    return () => { isMounted = false; };
  }, [currentTrackId]);

  useEffect(() => {
    setChatQuestion("");
    setDialogMessages([]);
    setChatLoading(false);
    chatAbortRef.current?.abort();
    chatAbortRef.current = null;
  }, [currentTrackId]);

  /* ── Position ───────────────────────────────────── */

  const computePositions = useCallback(() => {
    const viewport = window.visualViewport;
    const w = Math.round(viewport?.width ?? window.innerWidth);
    const h = Math.round(viewport?.height ?? window.innerHeight);
    const offsetLeft = Math.round(viewport?.offsetLeft ?? 0);
    const offsetTop = Math.round(viewport?.offsetTop ?? 0);
    const mobile = w <= 640;
    setIsMobile(mobile);
    const isMobileViewport = mobile;
    const panelWidth = isMobileViewport ? w - 16 : Math.min(1094, w - 24);
    const panelTop = isMobileViewport
      ? Math.max(8, offsetTop + 8)
      : Math.max(12, (h - Math.min(860, h - 24)) / 2);
    const panelBottomMargin = isMobileViewport ? 8 : 12;
    const panelHeight = isMobileViewport
      ? Math.max(240, h - (panelTop - offsetTop) - panelBottomMargin)
      : Math.min(860, h - 24);
    setPanelSize({ width: panelWidth, height: panelHeight });
    setPosition({
      x: isMobileViewport ? Math.max(8, offsetLeft + 8) : Math.max(12, (w - panelWidth) / 2),
      y: panelTop,
    });
    setAuthPosition({
      x: isMobileViewport ? Math.max(12, offsetLeft + 12) : Math.max(12, w - 324 - 16),
      y: isMobileViewport ? Math.max(12, offsetTop + 12) : 38,
    });
    setProfilePosition({
      x: isMobileViewport ? Math.max(12, offsetLeft + 12) : Math.max(12, w - 276),
      y: isMobileViewport ? Math.max(12, offsetTop + 12) : 38,
    });
  }, []);

  useEffect(() => {
    computePositions();
    setReady(true);

    const handleResize = () => computePositions();
    window.addEventListener("resize", handleResize);
    window.visualViewport?.addEventListener("resize", handleResize);
    window.visualViewport?.addEventListener("scroll", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.visualViewport?.removeEventListener("resize", handleResize);
      window.visualViewport?.removeEventListener("scroll", handleResize);
    };
  }, [computePositions]);

  // Load profile photo from Firestore
  useEffect(() => {
    if (!user) {
      setProfilePhotoURL(null);
      setProfilePanelOpen(false);
      return;
    }
    // Use Firebase Auth photoURL first
    if (user.photoURL) {
      setProfilePhotoURL(user.photoURL);
    }
    // Then check Firestore for custom avatar
    getUserProfile(user.uid).then((profile) => {
      if (profile?.photoURL) {
        setProfilePhotoURL(profile.photoURL);
      }
    }).catch(() => {});
  }, [user]);

  /* ── Audio ──────────────────────────────────────── */

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = muted;
    if (!isPlaying) { audio.pause(); return; }
    // Only needed for play/mute toggles — track changes are handled by key+autoPlay
    const playback = audio.play();
    if (playback) playback.catch(() => { });
  }, [isPlaying, muted]);

  useEffect(() => {
    setPlayedOrder((current) => {
      if (current[current.length - 1] === trackIndex) return current;
      return [...current, trackIndex];
    });
  }, [trackIndex]);

  /* ── Radio Sync (server-driven) ────────────────── */

  const isRadioMode = !user || activePlaylistId === masterPlaylist?.id;

  // Advance radio via server API (client Firestore rules block direct writes)
  const advanceRadioViaApi = useCallback((expectedIndex: number, nextIndex: number) => {
    fetch("/api/advance-radio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expectedIndex, nextIndex }),
    }).catch(() => {});
  }, []);

  // Subscribe to Firestore radioState when in radio mode
  useEffect(() => {
    if (!isRadioMode || currentTracks.length === 0) return;

    // Initialize radio state if it doesn't exist
    initRadioState(0).catch(() => {});

    const unsub = onRadioStateChange((state) => {
      if (!state) return;
      radioStateRef.current = state;

      const { trackIndex: rIdx, position: rPos } = computeCurrentRadioPosition(
        currentTracks,
        state.startedAtMillis,
        state.trackIndex
      );

      // If we've gone past the stored track, advance the server state
      if (rIdx !== state.trackIndex) {
        advanceRadioViaApi(state.trackIndex, rIdx);
        return; // The snapshot will fire again with the updated state
      }

      setTrackIndex((prev) => (prev === rIdx ? prev : rIdx));
      setCurrentTime(rPos);

      // Seek the audio element — only if already loaded (readyState >= 1)
      const audio = audioRef.current;
      if (audio && isFinite(rPos) && audio.readyState >= 1) {
        audio.currentTime = rPos;
      }
    });

    return unsub;
  }, [isRadioMode, currentTracks, masterPlaylist?.id]);

  // Radio clock: drives progress bar from server state and corrects audio drift
  useEffect(() => {
    if (!isRadioMode || currentTracks.length === 0) return;
    const tick = () => {
      const state = radioStateRef.current;
      if (!state) return;
      const { trackIndex: rIdx, position: rPos } = computeCurrentRadioPosition(
        currentTracks,
        state.startedAtMillis,
        state.trackIndex
      );
      // Track has advanced past the stored index — update server state
      if (rIdx !== state.trackIndex) {
        advanceRadioViaApi(state.trackIndex, rIdx);
        return;
      }
      // Update progress bar from computed position (independent of audio element)
      setTrackIndex((prev) => (prev === rIdx ? prev : rIdx));
      setCurrentTime(rPos);
      // Correct audio drift if playing and drifted >2s
      const audio = audioRef.current;
      if (audio && !audio.paused && audio.readyState >= 1) {
        const drift = Math.abs(audio.currentTime - rPos);
        if (drift > 2) audio.currentTime = rPos;
      }
    };
    tick(); // run immediately
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isRadioMode, currentTracks]);

  // Scroll to active track when the playlists tab is visible
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (activePlayerTab === "playlists") {
      // Clear any pending scroll
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
      scrollTimerRef.current = setTimeout(() => {
        const element = activeTrackRef.current;
        const container = sidebarScrollRef.current;
        if (!element || !container) return;

        const containerRect = container.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        const relativeTop = elementRect.top - containerRect.top + container.scrollTop;
        const scrollTarget = relativeTop - (container.clientHeight / 2) + (elementRect.height / 2);

        container.scrollTop = scrollTarget;
      }, 400);
    }
  }, [activePlayerTab, trackIndex]);

  /* ── Drag ───────────────────────────────────────── */

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button, input")) return;
    const panel = panelRef.current;
    if (!panel) return;
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
    if (!dragState || dragState.id !== event.pointerId || !panel) return;
    const maxX = window.innerWidth - panel.offsetWidth;
    const maxY = window.innerHeight - panel.offsetHeight;
    setPosition({
      x: Math.min(Math.max(0, event.clientX - dragState.offsetX), Math.max(0, maxX)),
      y: Math.min(Math.max(0, event.clientY - dragState.offsetY), Math.max(0, maxY)),
    });
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.id === event.pointerId) {
      dragRef.current = null;
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  /* ── Auth Drag ────────────────────────────────── */

  const handleAuthPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button, input")) return;
    const panel = authPanelRef.current;
    if (!panel) return;
    const bounds = panel.getBoundingClientRect();
    authDragRef.current = {
      id: event.pointerId,
      offsetX: event.clientX - bounds.left,
      offsetY: event.clientY - bounds.top,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleAuthPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const dragState = authDragRef.current;
    const panel = authPanelRef.current;
    if (!dragState || dragState.id !== event.pointerId || !panel) return;
    const maxX = window.innerWidth - panel.offsetWidth;
    const maxY = window.innerHeight - panel.offsetHeight;
    setAuthPosition({
      x: Math.min(Math.max(0, event.clientX - dragState.offsetX), Math.max(0, maxX)),
      y: Math.min(Math.max(0, event.clientY - dragState.offsetY), Math.max(0, maxY)),
    });
  };

  const handleAuthPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (authDragRef.current?.id === event.pointerId) {
      authDragRef.current = null;
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  /* ── Profile Drag ────────────────────────────── */

  const handleProfilePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button, input")) return;
    const panel = profilePanelRef.current;
    if (!panel) return;
    const bounds = panel.getBoundingClientRect();
    profileDragRef.current = {
      id: event.pointerId,
      offsetX: event.clientX - bounds.left,
      offsetY: event.clientY - bounds.top,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleProfilePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const dragState = profileDragRef.current;
    const panel = profilePanelRef.current;
    if (!dragState || dragState.id !== event.pointerId || !panel) return;
    const maxX = window.innerWidth - panel.offsetWidth;
    const maxY = window.innerHeight - panel.offsetHeight;
    setProfilePosition({
      x: Math.min(Math.max(0, event.clientX - dragState.offsetX), Math.max(0, maxX)),
      y: Math.min(Math.max(0, event.clientY - dragState.offsetY), Math.max(0, maxY)),
    });
  };

  const handleProfilePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (profileDragRef.current?.id === event.pointerId) {
      profileDragRef.current = null;
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  /* ── Profile Photo Upload ─────────────────────── */

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Read as base64 data URI
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUri = ev.target?.result as string;
      if (!dataUri) return;

      // Resize to 128x128 to keep Firestore doc small
      const canvas = document.createElement("canvas");
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const img = new Image();
      img.onload = async () => {
        const size = Math.min(img.width, img.height);
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;
        ctx.drawImage(img, sx, sy, size, size, 0, 0, 128, 128);
        const resized = canvas.toDataURL("image/jpeg", 0.8);

        setProfilePhotoURL(resized);
        try {
          await setUserProfile(user.uid, { photoURL: resized });
          await updateProfile({ photoURL: resized });
        } catch (err) {
          console.error("Failed to save profile photo:", err);
        }
      };
      img.src = dataUri;
    };
    reader.readAsDataURL(file);
  };

  /* ── Derived: user display info ──────────────── */

  const userFirstName = user?.displayName
    ? user.displayName.split(" ")[0]
    : null;

  /* ── Playback Controls ──────────────────────────── */

  const playPreviousTrack = () => {
    if (isRadioMode) return;
    setTrackIndex((prev) => (prev - 1 + currentTracks.length) % currentTracks.length);
  };

  const advanceTrack = useCallback(() => {
    setIsPlaying(true);
    const prev = trackIndex;
    const next = (prev + 1) % currentTracks.length;

    // In radio mode, advance via server API (client can't write radioState directly)
    if (isRadioMode) {
      advanceRadioViaApi(prev, next);
      // The onSnapshot listener will update trackIndex for all clients
      // But if it's a single-track playlist, force reload
      if (next === prev) setForceReload((r) => r + 1);
      actualDuration.current = null;
      return;
    }

    if (next === prev) setForceReload((r) => r + 1);
    setTrackIndex(next);
    actualDuration.current = null;
  }, [currentTracks.length, trackIndex, isRadioMode]);

  const playNextTrack = () => {
    if (isRadioMode) return;
    advanceTrack();
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isRadioMode) return;

    const track = currentTracks[trackIndex];
    if (!audioRef.current || !track) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const duration = actualDuration.current ?? track.durationSeconds;
    const newTime = percentage * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleMuteToggle = useCallback(async () => {
    const audio = audioRef.current;
    const nextMuted = !muted;
    setMuted(nextMuted);
    if (!audio) return;
    audio.muted = nextMuted;
    // Always call play() on unmute — Safari requires play() within user gesture
    // even if audio is already "playing" muted via autoPlay.
    try { await audio.play(); } catch { }
  }, [muted]);

  const handlePlayStopToggle = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }
    // Radio mode: re-sync to live position on resume
    if (isRadioMode && radioStateRef.current && currentTracks.length > 0) {
      const { trackIndex: rIdx, position: rPos } = computeCurrentRadioPosition(
        currentTracks,
        radioStateRef.current.startedAtMillis,
        radioStateRef.current.trackIndex
      );
      setTrackIndex(rIdx);
      setCurrentTime(rPos);
      if (audio && isFinite(rPos)) audio.currentTime = rPos;
      try { await audio.play(); } catch { }
      setIsPlaying(true);
      return;
    }
    try {
      await audio.play();
      setIsPlaying(true);
    } catch { }
  }, [isPlaying, isRadioMode, currentTracks]);

  /* ── Playlist Actions ───────────────────────────── */

  const switchPlaylist = (playlist: Playlist) => {
    const ordered = playlist.trackIds
      .map((id) => allTracks.find((t) => t.id === id))
      .filter(Boolean) as Track[];
    setCurrentTracks(ordered);
    setActivePlaylistId(playlist.id);
    setTrackIndex(0);
    setPlayedOrder([0]);
  };

  const handleCreatePlaylist = async () => {
    if (!user || !newPlaylistName.trim()) return;
    try {
      const trackIds = currentTracks.map((t) => t.id);
      await createPlaylist(user.uid, newPlaylistName.trim(), trackIds);
      const playlists = await getUserPlaylists(user.uid);
      setUserPlaylists(playlists);
      setNewPlaylistName("");
      setShowNewPlaylist(false);
    } catch (err) {
      console.error("Failed to create playlist:", err);
    }
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    if (!user) return;
    try {
      await deletePlaylist(playlistId);
      const playlists = await getUserPlaylists(user.uid);
      setUserPlaylists(playlists);
      if (activePlaylistId === playlistId && masterPlaylist) {
        switchPlaylist(masterPlaylist);
      }
    } catch (err) {
      console.error("Failed to delete playlist:", err);
    }
  };

  const handleRenamePlaylist = async () => {
    if (!renamingId || !renameValue.trim()) return;
    try {
      await renamePlaylist(renamingId, renameValue.trim());
      const playlists = await getUserPlaylists(user!.uid);
      setUserPlaylists(playlists);
      setRenamingId(null);
      setRenameValue("");
    } catch (err) {
      console.error("Failed to rename:", err);
    }
  };

  const handlePlaylistChatSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!chatQuestion.trim() || chatLoading) return;

    const question = chatQuestion.trim();
    const lowered = question.toLowerCase();
    const quotedName = question.match(/"([^"]+)"/)?.[1]?.trim() ?? null;
    const byName = (name: string) =>
      userPlaylists.find((playlist) => playlist.name.toLowerCase() === name.trim().toLowerCase()) ?? null;

    setChatLoading(true);
    setChatQuestion("");
    setPlaylistDialogMessages((current) => [...current, { role: "user", text: question }]);

    try {
      if (!user) {
        throw new Error("Sign in to create and manage playlists.");
      }

      if (/^(create|save|make)\b/.test(lowered) && lowered.includes("playlist")) {
        const createdName =
          quotedName ??
          question.match(/(?:called|named|as)\s+(.+)$/i)?.[1]?.trim() ??
          newPlaylistName.trim();

        if (!createdName) {
          throw new Error("Tell me what to call the playlist, like \"save this queue as Late Night\".");
        }

        const trackIds = currentTracks.map((track) => track.id);
        await createPlaylist(user.uid, createdName, trackIds);
        const playlists = await getUserPlaylists(user.uid);
        setUserPlaylists(playlists);
        setShowNewPlaylist(false);
        setNewPlaylistName("");
        setPlaylistDialogMessages((current) => [
          ...current,
          { role: "assistant", text: `Saved the current queue as "${createdName}".` },
        ]);
        return;
      }

      if (/^(rename)\b/.test(lowered) && lowered.includes(" to ")) {
        const renameMatch = question.match(/rename\s+(.+?)\s+to\s+(.+)$/i);
        if (!renameMatch) {
          throw new Error("Try a rename like \"rename Favorites to Morning Music\".");
        }
        const currentName = renameMatch[1].replace(/^playlist\s+/i, "").trim().replace(/^"|"$/g, "");
        const nextName = renameMatch[2].trim().replace(/^"|"$/g, "");
        const playlist = byName(currentName);
        if (!playlist) {
          throw new Error(`I couldn't find a playlist named "${currentName}".`);
        }
        await renamePlaylist(playlist.id, nextName);
        const playlists = await getUserPlaylists(user.uid);
        setUserPlaylists(playlists);
        setRenamingId(null);
        setRenameValue("");
        setPlaylistDialogMessages((current) => [
          ...current,
          { role: "assistant", text: `Renamed "${currentName}" to "${nextName}".` },
        ]);
        return;
      }

      if (/^(delete|remove)\b/.test(lowered) && lowered.includes("playlist")) {
        const deleteName =
          quotedName ??
          question.match(/(?:delete|remove)\s+playlist\s+(.+)$/i)?.[1]?.trim()?.replace(/^"|"$/g, "");
        if (!deleteName) {
          throw new Error("Tell me which playlist to remove.");
        }
        const playlist = byName(deleteName);
        if (!playlist) {
          throw new Error(`I couldn't find a playlist named "${deleteName}".`);
        }
        await handleDeletePlaylist(playlist.id);
        setPlaylistDialogMessages((current) => [
          ...current,
          { role: "assistant", text: `Deleted "${deleteName}".` },
        ]);
        return;
      }

      if (/^(open|play|switch)\b/.test(lowered) && lowered.includes("playlist")) {
        const targetName =
          quotedName ??
          question.match(/(?:open|play|switch(?:\s+to)?)\s+playlist\s+(.+)$/i)?.[1]?.trim()?.replace(/^"|"$/g, "");
        if (!targetName) {
          throw new Error("Tell me which playlist to open.");
        }
        const playlist = byName(targetName);
        if (!playlist) {
          throw new Error(`I couldn't find a playlist named "${targetName}".`);
        }
        switchPlaylist(playlist);
        setPlaylistDialogMessages((current) => [
          ...current,
          { role: "assistant", text: `Opened "${playlist.name}".` },
        ]);
        return;
      }

      const availablePlaylists = userPlaylists.length
        ? userPlaylists.map((playlist) => playlist.name).join(", ")
        : "none yet";
      setPlaylistDialogMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: `I can save the current queue, rename a playlist, delete one, or open one. Right now you have ${availablePlaylists}.`,
        },
      ]);
    } catch (err) {
      setPlaylistDialogMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: err instanceof Error ? err.message : "I couldn't manage that playlist just now.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  }, [chatLoading, chatQuestion, currentTracks, handleDeletePlaylist, newPlaylistName, switchPlaylist, user, userPlaylists]);

  const handleAddTrackToPlaylist = async (playlistId: string, trackId: string) => {
    const playlist = userPlaylists.find((p) => p.id === playlistId);
    if (!playlist) return;
    if (playlist.trackIds.includes(trackId)) return;
    const newIds = [...playlist.trackIds, trackId];
    try {
      await updatePlaylistTracks(playlistId, newIds);
      const playlists = await getUserPlaylists(user!.uid);
      setUserPlaylists(playlists);

      // If currently playing this playlist, refresh tracks
      if (activePlaylistId === playlistId) {
        const ordered = newIds
          .map((id) => allTracks.find((t) => t.id === id))
          .filter(Boolean) as Track[];
        setCurrentTracks(ordered);
      }
    } catch (err) {
      console.error("Failed to add track:", err);
    }
  };

  const handleRemoveTrackFromPlaylist = async (playlistId: string, trackId: string) => {
    const playlist = userPlaylists.find((p) => p.id === playlistId);
    if (!playlist) return;
    const newIds = playlist.trackIds.filter((id) => id !== trackId);
    try {
      await updatePlaylistTracks(playlistId, newIds);
      const playlists = await getUserPlaylists(user!.uid);
      setUserPlaylists(playlists);

      if (activePlaylistId === playlistId) {
        const ordered = newIds
          .map((id) => allTracks.find((t) => t.id === id))
          .filter(Boolean) as Track[];
        setCurrentTracks(ordered.length > 0 ? ordered : allTracks);
        if (trackIndex >= ordered.length) setTrackIndex(0);
      }
    } catch (err) {
      console.error("Failed to remove track:", err);
    }
  };

  /* ── Derived ────────────────────────────────────── */

  const currentTrack = currentTracks[trackIndex] ?? null;
  const fullInfoToCopy = currentTrack
    ? `${currentTrack.title}\nComposer: ${currentTrack.composer}\nPerformer: ${currentTrack.performers.join(", ")}${currentTrack.conductor ? `\nConductor: ${currentTrack.conductor}` : ""}\nDuration: ${formatDuration(currentTrack.durationSeconds)}\nVenue: ${masterPlaylist?.id === activePlaylistId ? "European Archive" : (userPlaylists.find((pl) => pl.id === activePlaylistId)?.name || "Irregular Pearl")}\n\nInsight:\n${insight}\n\n© 2026 Irregular Pearl`
    : insight;

  const handleCopyTrackInfo = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(fullInfoToCopy);
      setShowCopyTooltip(true);
      setTimeout(() => setShowCopyTooltip(false), 1500);
    } catch (err) {
      console.error("Failed to copy track info:", err);
    }
  }, [fullInfoToCopy]);

  const handleTrackChatSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentTrack || !chatQuestion.trim() || chatLoading) return;

    const question = chatQuestion.trim();
    const controller = new AbortController();
    chatAbortRef.current?.abort();
    chatAbortRef.current = controller;
    setChatLoading(true);
    setChatQuestion("");
    setDialogMessages((current) => [...current, { role: "user", text: question }]);

    try {
      const response = await fetch("/api/track-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          question,
          track: {
            title: currentTrack.title,
            composer: currentTrack.composer,
            performers: currentTrack.performers,
            conductor: currentTrack.conductor,
          },
        }),
      });

      const responseText = await response.text();
      let data: { answer?: string; error?: string } = {};
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        throw new Error("The track chat service returned an unexpected response.");
      }

      if (!response.ok) {
        throw new Error(data.error || "Unable to answer this question right now.");
      }

      setDialogMessages((current) => [...current, { role: "assistant", text: data.answer || "" }]);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }
      console.error("Track chat failed:", err);
      setDialogMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: err instanceof Error ? err.message : "Unable to answer this question right now.",
        },
      ]);
    } finally {
      if (chatAbortRef.current === controller) {
        chatAbortRef.current = null;
      }
      setChatLoading(false);
    }
  }, [chatLoading, chatQuestion, currentTrack]);

  const handleTrackChatStop = useCallback(() => {
    chatAbortRef.current?.abort();
    chatAbortRef.current = null;
    setChatLoading(false);
  }, []);

  const handleChatSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    if (activePlayerTab === "playlists") {
      void handlePlaylistChatSubmit(e);
      return;
    }
    void handleTrackChatSubmit(e);
  }, [activePlayerTab, handlePlaylistChatSubmit, handleTrackChatSubmit]);

  const chatPlaceholder =
    activePlayerTab === "playlists"
      ? "Manage your playlist..."
      : "Ask anything about this track...";
  const chatAriaLabel =
    activePlayerTab === "playlists"
      ? "Manage your playlist"
      : "Ask Gemini about this track";
  const activePlaylist =
    activePlaylistId === masterPlaylist?.id
      ? masterPlaylist
      : userPlaylists.find((p) => p.id === activePlaylistId) ?? masterPlaylist;

  const playedIndexes = playedOrder.slice(0, -1);
  const upcomingIndexes = currentTracks
    .map((_, index) => index)
    .filter((index) => index !== trackIndex)
    .sort((a, b) => {
      const dA = (a - trackIndex + currentTracks.length) % currentTracks.length;
      const dB = (b - trackIndex + currentTracks.length) % currentTracks.length;
      return dA - dB;
    });

  const filteredBrowseTracks = searchQuery.trim()
    ? allTracks.filter(
      (t) =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.composer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.performers.some((p) => p.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    : allTracks;

  /* ── Loading State ──────────────────────────────── */

  if (dataLoading || !ready) {
    return (
      <main className="min-h-screen w-full bg-cotton-candy">
        <div className="loading-overlay">
          <PlayerIcon />
          <p className="loading-text">Loading Classical Collection…</p>
        </div>
      </main>
    );
  }

  if (allTracks.length === 0) {
    return (
      <main className="min-h-screen w-full bg-cotton-candy">
        <div className="loading-overlay">
          <PlayerIcon />
          <p className="loading-text">No tracks found. Run the seed script first.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full bg-cotton-candy">
      {currentTrack && (
        <audio
          key={`${currentTrack.id}-${forceReload}`}
          ref={audioRef}
          src={currentTrack.audioUrl}
          autoPlay
          muted={muted}
          playsInline
          onEnded={advanceTrack}
          onLoadedMetadata={() => {
            const audio = audioRef.current;
            // In radio mode, seek to the computed live position
            if (isRadioMode && radioStateRef.current && audio) {
              const { trackIndex: rIdx, position: rPos } = computeCurrentRadioPosition(
                currentTracks,
                radioStateRef.current.startedAtMillis,
                radioStateRef.current.trackIndex
              );
              // If we've drifted past this track, advance server state
              if (rIdx !== radioStateRef.current.trackIndex) {
                advanceRadioViaApi(radioStateRef.current.trackIndex, rIdx);
              } else if (isFinite(rPos)) {
                audio.currentTime = rPos;
              }
            }
            if (audio && isFinite(audio.duration)) {
              actualDuration.current = audio.duration;
              const track = currentTracks[trackIndex];
              if (track && !track.durationVerified && Math.abs(audio.duration - track.durationSeconds) > 2) {
                const corrected = Math.round(audio.duration);
                setCurrentTracks((prev) =>
                  prev.map((t) =>
                    t.id === track.id ? { ...t, durationSeconds: corrected, durationVerified: true } : t
                  )
                );
                fetch("/api/correct-duration", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ trackId: track.id, durationSeconds: corrected }),
                }).catch(() => {});
              }
            }
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => {
            if (audioRef.current?.ended) return;
            if (isRadioMode) return;
            setIsPlaying(false);
          }}
          onTimeUpdate={(e) => { if (!isRadioMode) setCurrentTime(e.currentTarget.currentTime); }}
          onError={() => {
            console.warn(`Audio failed to load: ${currentTrack?.title}`);
            advanceTrack();
          }}
        />
      )}

      <div className="retro-player-icon retro-player-icon--playing" aria-hidden="true">
        <PlayerIcon />
      </div>

      {!user && (
        <div 
          className="membership-header" 
          onClick={() => setAuthPanelOpen(true)}
          title="Sign in or register"
        >
          <div className="membership-header__icon-box">
            <img 
              src="/piano-keys.png" 
              alt="Logo" 
              style={{ width: '14px', height: '14px', objectFit: 'contain' }}
            />
          </div>
          <div className="membership-header__text">
            BECOME A MEMBER / LOG IN
          </div>
        </div>
      )}

      {user && (
        <div 
          className="membership-header membership-header--logged-in" 
          onClick={() => setProfilePanelOpen((v) => !v)}
          title="My Profile"
        >
          <div className="membership-header__icon-box">
            <img 
              src="/piano-keys.png" 
              alt="Logo" 
              style={{ width: '14px', height: '14px', objectFit: 'contain' }}
            />
          </div>
          <div className="membership-header__text">
            {userFirstName || "Member"}
          </div>
        </div>
      )}

      {!minimized && (
        <>
          <div
            ref={panelRef}
            className="floating-player"
            style={{ left: position.x, top: position.y, width: panelSize.width, height: panelSize.height }}
          >
            {/* Title Bar */}
            <div
              className="floating-player__titlebar"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            >
              <span>Irregular Pearl</span>
              <div className="floating-player__titlebar-actions">

                <button
                  type="button"
                  className="floating-player__minimize"
                  onClick={() => setMinimized(true)}
                  aria-label="Minimize player"
                >
                  _
                </button>
              </div>
            </div>


            {/* Body */}
            <div className="floating-player__body">
              <div className="floating-player__content-top">
                <div className="floating-player__track-info">
                  {/* Track Info (Isolated Component) */}
                  {currentTrack && (
                    <TrackTitle 
                      title={currentTrack.title} 
                      trackId={currentTrack.id} 
                      onCopy={handleCopyTrackInfo}
                      showTooltip={showCopyTooltip}
                    />
                  )}
                  <p className="floating-player__composer">{currentTrack?.composer}</p>
                  <p className="floating-player__performer">
                    {currentTrack?.performers.join(", ")}
                    {currentTrack?.conductor && ` · cond. ${currentTrack.conductor}`}
                  </p>
                  <div className="floating-player__section-rule" aria-hidden="true">
                    <span className="floating-player__section-rule-ornament" />
                  </div>
                  <div className="floating-player__tab-row" role="tablist" aria-label="Player panels">
                    <button
                      type="button"
                      className={`floating-player__tab ${activePlayerTab === "track-chat" ? "is-active" : ""}`}
                      role="tab"
                      aria-selected={activePlayerTab === "track-chat"}
                      aria-label="Track chat"
                      title="Track chat"
                      onClick={() => setActivePlayerTab("track-chat")}
                    >
                      <MusicNotesSimpleIcon />
                    </button>
                    <span className="floating-player__tab-divider" aria-hidden="true" />
                    <button
                      type="button"
                      className={`floating-player__tab ${activePlayerTab === "playlists" ? "is-active" : ""}`}
                      role="tab"
                      aria-selected={activePlayerTab === "playlists"}
                      aria-label="Playlists"
                      title="Playlists"
                      onClick={() => setActivePlayerTab("playlists")}
                    >
                      <PlaylistIcon />
                    </button>
                  </div>

                  <div className="floating-player__insight-container">
                    <div
                      className={`floating-player__panel ${activePlayerTab === "track-chat" ? "is-active" : "is-hidden"}`}
                      aria-hidden={activePlayerTab !== "track-chat"}
                    >
                      <TrackDialogContent insight={insight} messages={dialogMessages} isLoading={chatLoading} />
                    </div>
                    <div
                      className={`floating-player__panel ${activePlayerTab === "playlists" ? "is-active" : "is-hidden"}`}
                      aria-hidden={activePlayerTab !== "playlists"}
                    >
                      <div className="playlist-tab">
                        <div className="playlist-tab__manager">
                          <div ref={sidebarScrollRef} className="playlist-tab__list">
                            <ul className="floating-player__sidebar-list">
                              {[masterPlaylist, ...userPlaylists.slice().sort((a, b) => {
                                const timeA = a.updatedAt ? (typeof a.updatedAt === "number" ? a.updatedAt : new Date(a.updatedAt as any).getTime()) : 0;
                                const timeB = b.updatedAt ? (typeof b.updatedAt === "number" ? b.updatedAt : new Date(b.updatedAt as any).getTime()) : 0;
                                return timeB - timeA;
                              })].filter(Boolean).map((pl) => {
                                const isActive = activePlaylistId === pl!.id;
                                const isExpanded = expandedPlaylistId === undefined ? isActive : expandedPlaylistId === pl!.id;

                                return (
                                  <li key={pl!.id} style={{ marginBottom: "8px", padding: 0, background: "transparent" }}>
                                    <button
                                      type="button"
                                      className={`playlist-tab__playlist-toggle ${isActive ? "is-active" : ""}`}
                                      onClick={() => {
                                        setExpandedPlaylistId(isExpanded ? null : pl!.id);
                                      }}
                                      aria-expanded={isExpanded}
                                    >
                                      <svg className={`playlist-tab__caret ${isExpanded ? "is-expanded" : ""}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M6 9l6 6 6-6" />
                                      </svg>
                                      <div className="playlist-tab__playlist-name">
                                        {pl!.name === "Master Playlist" ? "Classical Masterworks" : pl!.name}
                                      </div>
                                    </button>

                                    {isExpanded && (
                                      <div className="playlist-tab__tracks-grid">
                                        {(() => {
                                          const plTracks = pl!.trackIds
                                            .map((id) => allTracks.find((t) => t.id === id))
                                            .filter(Boolean) as Track[];

                                          if (plTracks.length === 0) {
                                            return <div className="floating-player__sidebar-empty" style={{ fontSize: "11px", padding: "4px 0", marginLeft: "22px" }}>No tracks</div>;
                                          }

                                          return plTracks.map((track, index) => {
                                            const isPlaying = isActive && index === trackIndex;
                                            const isOwnedPlaylist = pl!.id !== masterPlaylist?.id;
                                            return (
                                              <div
                                                key={`${track.id}-${index}`}
                                                ref={isPlaying ? activeTrackRef : null}
                                                className={`playlist-tab__track-card ${isPlaying ? "is-playing" : ""}`}
                                              >
                                                {user && (
                                                  <div style={{ position: "relative", display: "flex", alignItems: "flex-start", flexShrink: 0 }}>
                                                    <button
                                                      type="button"
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        setTrackDropdownOpenId(trackDropdownOpenId === track.id ? null : track.id);
                                                      }}
                                                      style={{ background: "none", border: "none", color: "#855081", width: "14px", height: "14px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "16px", fontWeight: "bold", padding: "0" }}
                                                      title="Add to playlist"
                                                    >
                                                      +
                                                    </button>

                                                    {trackDropdownOpenId === track.id && (
                                                      <div style={{ position: "absolute", left: "0", top: "100%", marginTop: "4px", background: "#fff4fc", border: "1px solid #d79bc1", borderRadius: "4px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", zIndex: 10, width: "160px", maxHeight: "200px", overflowY: "auto", padding: "4px 0" }}>
                                                        {userPlaylists
                                                          .slice()
                                                          .sort((a, b) => {
                                                            const timeA = a.updatedAt ? (typeof a.updatedAt === "number" ? a.updatedAt : new Date(a.updatedAt as any).getTime()) : 0;
                                                            const timeB = b.updatedAt ? (typeof b.updatedAt === "number" ? b.updatedAt : new Date(b.updatedAt as any).getTime()) : 0;
                                                            return timeB - timeA;
                                                          })
                                                          .map((upl) => {
                                                            const hasTrack = upl.trackIds.includes(track.id);
                                                            return (
                                                              <button
                                                                key={upl.id}
                                                                type="button"
                                                                onClick={async (e) => {
                                                                  e.stopPropagation();
                                                                  if (hasTrack) await handleRemoveTrackFromPlaylist(upl.id, track.id);
                                                                  else await handleAddTrackToPlaylist(upl.id, track.id);
                                                                  setTrackDropdownOpenId(null);
                                                                }}
                                                                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "6px 12px", border: "none", background: "transparent", color: "#855081", fontSize: "11px", textAlign: "left", cursor: "pointer" }}
                                                              >
                                                                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{upl.name}</span>
                                                                {hasTrack && <span style={{ color: "#be70a6", marginLeft: "4px" }}>✓</span>}
                                                              </button>
                                                            );
                                                          })}
                                                      </div>
                                                    )}
                                                  </div>
                                                )}
                                                <div
                                                  style={{ flex: 1, minWidth: 0, cursor: isOwnedPlaylist ? "pointer" : "default" }}
                                                  onClick={() => {
                                                    if (!isOwnedPlaylist) return;
                                                    switchPlaylist(pl!);
                                                    setTrackIndex(index);
                                                    setPlayedOrder([index]);
                                                    if (muted) setMuted(false);
                                                    setIsPlaying(true);
                                                  }}
                                                >
                                                  <div className={`playlist-tab__track-title ${isPlaying ? "is-playing" : ""}`}>{track.title}</div>
                                                  <div className={`playlist-tab__track-composer ${isPlaying ? "is-playing" : ""}`}>{track.composer}</div>
                                                </div>
                                              </div>
                                            );
                                          });
                                        })()}
                                      </div>
                                    )}

                                    {user && pl!.id !== masterPlaylist?.id && (
                                      <div className="playlist-tab__item-actions">
                                        {renamingId === pl!.id ? (
                                          <div className="playlist-manager__rename-row">
                                            <input
                                              className="playlist-manager__input"
                                              value={renameValue}
                                              onChange={(e) => setRenameValue(e.target.value)}
                                              onKeyDown={(e) => e.key === "Enter" && void handleRenamePlaylist()}
                                              autoFocus
                                            />
                                            <button type="button" onClick={() => void handleRenamePlaylist()}>✓</button>
                                            <button type="button" onClick={() => { setRenamingId(null); setRenameValue(""); }}>✕</button>
                                          </div>
                                        ) : (
                                          <div className="playlist-manager__item-actions">
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setRenamingId(pl!.id);
                                                setRenameValue(pl!.name);
                                              }}
                                              aria-label={`Rename ${pl!.name}`}
                                            >
                                              ✎
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => void handleDeletePlaylist(pl!.id)}
                                              aria-label={`Delete ${pl!.name}`}
                                            >
                                              ✕
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </li>
                                );
                              })}
                            </ul>
                            {!user && (
                              <p className="floating-player__sidebar-empty">Sign in to save, rename, and manage playlists.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <form className="floating-player__chat-form" onSubmit={handleChatSubmit}>
                    <div className="floating-player__chat-input-row">
                      <div className="floating-player__chat-input-shell">
                        <textarea
                          className="floating-player__chat-input"
                          value={chatQuestion}
                          onChange={(e) => setChatQuestion(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              e.currentTarget.form?.requestSubmit();
                            }
                          }}
                          placeholder={chatPlaceholder}
                          aria-label={chatAriaLabel}
                          disabled={(activePlayerTab === "track-chat" && !currentTrack) || chatLoading}
                          rows={2}
                        />
                        <button
                          type={chatLoading ? "button" : "submit"}
                          className="floating-player__chat-submit"
                          disabled={!chatLoading && (!chatQuestion.trim() || (activePlayerTab === "track-chat" && !currentTrack))}
                          aria-label={chatLoading ? "Stop response" : "Send question"}
                          onClick={chatLoading ? handleTrackChatStop : undefined}
                        >
                          {chatLoading ? (
                            <svg viewBox="0 0 256 256" aria-hidden="true">
                              <circle cx="128" cy="128" r="96" fill="#121212" />
                              <rect x="88" y="88" width="80" height="80" rx="10" fill="#ffffff" />
                            </svg>
                          ) : (
                            <svg viewBox="0 0 256 256" aria-hidden="true">
                              <circle cx="128" cy="128" r="96" fill="#121212" />
                              <path
                                d="M128 176V80M88 120L128 80L168 120"
                                fill="none"
                                stroke="#ffffff"
                                strokeWidth="16"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>

                {/* Album Cover */}
                {currentTrack?.albumCover && (
                  <img
                    className="floating-player__cover"
                    src={currentTrack.albumCover}
                    alt={`${currentTrack.title} cover`}
                  />
                )}
              </div>

              <div className="floating-player__controls-bottom">
                <div className="floating-player__timeline">
                  <span className="floating-player__time">
                    {formatDuration(currentTime)}
                  </span>
                  <div className="floating-player__progress-bg" onClick={user ? handleSeek : undefined} style={{ cursor: user ? 'pointer' : 'default' }}>
                    <div
                      className="floating-player__progress-fill"
                      style={{
                        width: `${currentTrack ? (currentTime / (actualDuration.current ?? currentTrack.durationSeconds)) * 100 : 0}%`
                      }}
                    >
                      <div className="floating-player__progress-tick" />
                    </div>
                  </div>
                  <span className="floating-player__time">
                    {currentTrack ? `-${formatDuration(Math.max(0, (actualDuration.current ?? currentTrack.durationSeconds) - currentTime))}` : "0:00"}
                  </span>
                </div>

                {/* Controls */}
                <div className="floating-player__actions">
                  <button type="button" className="floating-player__btn-mute" onClick={handleMuteToggle} aria-label={muted ? "Unmute" : "Mute"}>
                    <svg viewBox="0 0 256 256" aria-hidden="true">
                      <path className="icon-stroke" d="M80 96H120L168 56V200L120 160H80Z" />
                      {muted ? (
                        <path className="icon-stroke" d="M192 96L232 136M232 96L192 136" />
                      ) : (
                        <path className="icon-stroke" d="M192 104C204 116 204 140 192 152M216 80C240 104 240 152 216 176" />
                      )}
                    </svg>
                  </button>
                  {user && activePlaylistId && masterPlaylist && activePlaylistId !== masterPlaylist.id && (
                    <>
                      <button type="button" onClick={handlePlayStopToggle} aria-label={isPlaying ? "Stop" : "Play"}>
                        <svg viewBox="0 0 256 256" aria-hidden="true">
                          {isPlaying ? (
                            <path className="icon-fill" d="M96 72H120V184H96ZM136 72H160V184H136Z" />
                          ) : (
                            <path className="icon-fill" d="M96 72L184 128L96 184Z" />
                          )}
                        </svg>
                      </button>
                      <button type="button" onClick={playPreviousTrack} aria-label="Previous track">
                        <svg viewBox="0 0 256 256" aria-hidden="true">
                          <path className="icon-stroke" d="M80 64V192" />
                          <path className="icon-fill" d="M192 72L104 128L192 184Z" />
                        </svg>
                      </button>
                      <button type="button" onClick={playNextTrack} aria-label="Next track">
                        <svg viewBox="0 0 256 256" aria-hidden="true">
                          <path className="icon-stroke" d="M176 64V192" />
                          <path className="icon-fill" d="M64 72L152 128L64 184Z" />
                        </svg>
                      </button>
                    </>
                  )}

                </div>
              </div>
            </div>
          </div>
          {/* Independent Auth Panel */}
          {!user && authPanelOpen && (
            <aside 
              ref={authPanelRef}
              className="floating-auth"
              style={{ left: authPosition.x, top: authPosition.y }}
            >
              <div 
                className="floating-auth__titlebar"
                onPointerDown={handleAuthPointerDown}
                onPointerMove={handleAuthPointerMove}
                onPointerUp={handleAuthPointerUp}
              >
                <span>{isSignUp ? "Create Account" : "Sign In"}</span>
                <button 
                  type="button" 
                  className="floating-auth__close"
                  onClick={() => setAuthPanelOpen(false)}
                >
                  ✕
                </button>
              </div>
              <div className="floating-auth__body">
                {authError && (
                  <p className="auth-panel__error">{authError}</p>
                )}

                <button
                  type="button"
                  className="auth-panel__google-btn"
                  onClick={() => { signInGoogle(); setAuthPanelOpen(false); }}
                >
                  Sign in with Google
                </button>

                <div className="auth-panel__divider">
                  <span>or</span>
                </div>

                <form
                  className="auth-panel__form"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (isSignUp) {
                      await signUpEmail(authEmail, authPassword, authDisplayName.trim() || undefined);
                    } else {
                      await signInEmail(authEmail, authPassword);
                    }
                    if (!authError) {
                      setAuthPanelOpen(false);
                      setAuthEmail("");
                      setAuthPassword("");
                      setAuthDisplayName("");
                    }
                  }}
                >
                  {isSignUp && (
                    <input
                      className="auth-panel__input"
                      type="text"
                      placeholder="Display Name"
                      value={authDisplayName}
                      onChange={(e) => setAuthDisplayName(e.target.value)}
                      required
                      autoComplete="name"
                    />
                  )}
                  <input
                    className="auth-panel__input"
                    type="email"
                    placeholder="Email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                  <input
                    className="auth-panel__input"
                    type="password"
                    placeholder="Password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                  />
                  <button type="submit" className="auth-panel__submit-btn">
                    {isSignUp ? "Create Account" : "Sign In"}
                  </button>
                </form>

                <button
                  type="button"
                  className="auth-panel__toggle"
                  onClick={() => { setIsSignUp((v) => !v); clearError(); }}
                >
                  {isSignUp ? "Already have an account? Sign in" : "Need an account? Sign up"}
                </button>
              </div>
            </aside>
          )}

          {/* Profile Panel (logged-in) */}
          {user && profilePanelOpen && (
            <aside
              ref={profilePanelRef}
              className="profile-panel"
              style={{ left: profilePosition.x, top: profilePosition.y }}
            >
              <div
                className="profile-panel__titlebar"
                onPointerDown={handleProfilePointerDown}
                onPointerMove={handleProfilePointerMove}
                onPointerUp={handleProfilePointerUp}
              >
                <span>My Profile</span>
                <button
                  type="button"
                  className="profile-panel__close"
                  onClick={() => setProfilePanelOpen(false)}
                >
                  ✕
                </button>
              </div>
              <div className="profile-panel__body">
                {/* Avatar */}
                <div
                  className="profile-panel__avatar-wrapper"
                  onClick={() => fileInputRef.current?.click()}
                  title="Click to change photo"
                >
                  {profilePhotoURL ? (
                    <img
                      src={profilePhotoURL}
                      alt="Profile"
                      className="profile-panel__avatar"
                    />
                  ) : (
                    <div className="profile-panel__avatar-placeholder">
                      {userFirstName ? userFirstName[0].toUpperCase() : "?"}
                    </div>
                  )}
                  <div className="profile-panel__avatar-overlay">📷</div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handlePhotoUpload}
                  />
                </div>

                {/* Name */}
                <p className="profile-panel__name">
                  {user.displayName || user.email || "Member"}
                </p>
                <p className="profile-panel__email">
                  {user.email}
                </p>

                {/* Sign Out */}
                <button
                  type="button"
                  className="profile-panel__signout-btn"
                  onClick={async () => {
                    await signOut();
                    setProfilePanelOpen(false);
                  }}
                >
                  Sign Out
                </button>
              </div>
            </aside>
          )}
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
