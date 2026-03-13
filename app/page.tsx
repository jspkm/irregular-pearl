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
} from "@/lib/firestore";
import type { Track, Playlist } from "@/lib/types";


/* ── Helpers ────────────────────────────────────────── */

function formatDuration(seconds: number): string {
  const rounded = Math.floor(seconds);
  const m = Math.floor(rounded / 60);
  const s = rounded % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/* ── Radio Clock ───────────────────────────────────── */

const RADIO_EPOCH = new Date("2026-01-01T00:00:00Z").getTime();

function computeRadioPosition(tracks: Track[]): { trackIndex: number; position: number } {
  if (tracks.length === 0) return { trackIndex: 0, position: 0 };
  const totalDuration = tracks.reduce((sum, t) => sum + t.durationSeconds, 0);
  if (totalDuration <= 0) return { trackIndex: 0, position: 0 };
  const elapsed = (Date.now() - RADIO_EPOCH) / 1000;
  let posInPlaylist = ((elapsed % totalDuration) + totalDuration) % totalDuration;
  for (let i = 0; i < tracks.length; i++) {
    if (posInPlaylist < tracks[i].durationSeconds) {
      return { trackIndex: i, position: posInPlaylist };
    }
    posInPlaylist -= tracks[i].durationSeconds;
  }
  return { trackIndex: 0, position: 0 };
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

/* ── Track Title Component ────────────────────────── */

function TrackTitle({ title, trackId }: { title: string; trackId: string }) {
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
  );
}

/* ── Typewriter Effect ───────────────────────────── */

function TypewriterText({ text, speed = 40, fullInfoToCopy }: { text: string; speed?: number; fullInfoToCopy?: string }) {
  const [displayed, setDisplayed] = useState("");
  const [index, setIndex] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);
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

  const isDone = index >= text.length && text.length > 0;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullInfoToCopy || text);
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 1500);
    } catch (err) {
      console.error("Failed to copy insight:", err);
    }
  };

  return (
    <p 
      className="floating-player__insight" 
      ref={scrollRef}
      style={{ fontSize: '14px', fontWeight: 550, position: 'relative' }}
    >
      {displayed}
      {isDone ? (
        <span style={{ display: 'inline-block', marginLeft: '4px' }}>
          <button 
            className="insight-copy-btn" 
            onClick={handleCopy}
            title="Copy to clipboard"
          >
            {showTooltip && <span className="insight-tooltip">Copied!</span>}
            <svg 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              style={{ width: '14px', height: '14px' }}
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
        </span>
      ) : (
        <span className="typewriter-cursor">_</span>
      )}
    </p>
  );
}

/* ── Main Component ─────────────────────────────────── */

export default function Home() {
  const { user, loading: authLoading, signInGoogle, signInEmail, signUpEmail, signOut, updateProfile, authError, clearError } = useAuth();

  const panelRef = useRef<HTMLDivElement>(null);
  const authPanelRef = useRef<HTMLDivElement>(null);
  const sidebarScrollRef = useRef<HTMLDivElement>(null);
  const activeTrackRef = useRef<HTMLLIElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const pendingRadioSeek = useRef<number | null>(null);
  const advancedAt = useRef<number>(0);
  const dragRef = useRef<{ id: number; offsetX: number; offsetY: number } | null>(null);
  const authDragRef = useRef<{ id: number; offsetX: number; offsetY: number } | null>(null);

  // Layout state
  const [ready, setReady] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
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
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [playedOrder, setPlayedOrder] = useState<number[]>([0]);
  const [isPlaylistCollapsed, setIsPlaylistCollapsed] = useState(false);
  const [insight, setInsight] = useState("");

  // Data state
  const [allTracks, setAllTracks] = useState<Track[]>([]);
  const [currentTracks, setCurrentTracks] = useState<Track[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Playlist state
  const [masterPlaylist, setMasterPlaylist] = useState<Playlist | null>(null);
  const [userPlaylists, setUserPlaylists] = useState<Playlist[]>([]);
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const [expandedPlaylistId, setExpandedPlaylistId] = useState<string | null>(null);
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

  /* ── Musical Insight ────────────────────────────── */

  useEffect(() => {
    const track = currentTracks[trackIndex];
    if (!track) return;

    let isMounted = true;
    const getInsight = async () => {
      setInsight("");
      try {
        const res = await fetch("/api/musical-interest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: track.title,
            composer: track.composer,
            performers: track.performers
          })
        });
        const data = await res.json();
        if (isMounted) {
          setInsight(data.insight || "Musical history in every note.");
        }
      } catch (err) {
        if (isMounted) setInsight("Distilled musical elegance.");
      }
    };

    getInsight();
    return () => { isMounted = false; };
  }, [trackIndex, currentTracks]);

  /* ── Position ───────────────────────────────────── */

  const computePositions = useCallback(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const mobile = w <= 640;
    setIsMobile(mobile);
    const isMobile = mobile;
    const panelWidth = isMobile ? w - 16 : Math.min(547, w - 24);
    const panelHeight = isMobile ? 280 : 330;
    setPosition({
      x: isMobile ? 8 : Math.max(12, (w - panelWidth) / 2),
      y: isMobile ? 32 : Math.max(12, (h - panelHeight) / 2),
    });
    setAuthPosition({
      x: isMobile ? 12 : Math.max(12, w - 324 - 16),
      y: isMobile ? 50 : 38,
    });
    setProfilePosition({
      x: isMobile ? 12 : Math.max(12, w - 276),
      y: isMobile ? 50 : 38,
    });
  }, []);

  useEffect(() => {
    computePositions();
    setReady(true);

    const handleResize = () => computePositions();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
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

  /* ── Radio Sync (non-logged-in) ────────────────── */

  const radioAdvance = useCallback(() => {
    const { trackIndex: rIdx, position: rPos } = computeRadioPosition(currentTracks);
    pendingRadioSeek.current = rPos;
    setTrackIndex(rIdx);
    setCurrentTime(rPos);
    // If same track (audio element stays), seek immediately
    if (audioRef.current) {
      audioRef.current.currentTime = rPos;
    }
    // If track changes, onLoadedMetadata will apply pendingRadioSeek
  }, [currentTracks]);

  useEffect(() => {
    // Sync to radio if not logged in OR if the active playlist is the Master Playlist
    const isMasterPlaylist = activePlaylistId === masterPlaylist?.id;
    if ((!user || isMasterPlaylist) && currentTracks.length > 0) {
      radioAdvance();
    }
  }, [user, currentTracks, radioAdvance, activePlaylistId, masterPlaylist?.id]);

  // Scroll to active track when playlist sidebar opens
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (playlistOpen) {
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
    // Only re-trigger on sidebar open, not on trackIndex changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playlistOpen]);

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
    if (activePlaylistId === masterPlaylist?.id) return;
    if (!user) return;
    setTrackIndex((prev) => (prev - 1 + currentTracks.length) % currentTracks.length);
  };

  const advanceTrack = useCallback(() => {
    advancedAt.current = Date.now();
    setIsPlaying(true); // Keep playback active for the next track
    setTrackIndex((prev) => {
      const next = (prev + 1) % currentTracks.length;
      if (next === prev) setForceReload((r) => r + 1);
      return next;
    });
    actualDuration.current = null;
  }, [currentTracks.length]);

  const playNextTrack = () => {
    if (!user) return;
    advanceTrack();
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    // Disable seeking if Master Playlist (radio) is active
    if (activePlaylistId === masterPlaylist?.id) return;

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
    if (!nextMuted) {
      try { await audio.play(); } catch { }
    }
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
    if (!user || activePlaylistId === masterPlaylist?.id) {
      radioAdvance();
      // radioAdvance sets trackIndex + pendingRadioSeek.
      // If track changes, new <audio> mounts with autoPlay + onLoadedMetadata seeks.
      // If same track, we seeked immediately above — just resume playback.
      try { await audio.play(); } catch { }
      setIsPlaying(true);
      return;
    }
    try {
      await audio.play();
      setIsPlaying(true);
    } catch { }
  }, [isPlaying, user, radioAdvance, activePlaylistId, masterPlaylist?.id]);

  useEffect(() => {
    const radioInterval = setInterval(() => {
      if (isPlaying && (activePlaylistId === masterPlaylist?.id || !user)) {
        // Skip radio sync briefly after onEnded advance to prevent override
        if (Date.now() - advancedAt.current < 3000) return;
        radioAdvance();
      }
    }, 1000);
    return () => clearInterval(radioInterval);
  }, [isPlaying, user, radioAdvance, activePlaylistId, masterPlaylist?.id]);

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
            if (pendingRadioSeek.current !== null && audioRef.current) {
              audioRef.current.currentTime = pendingRadioSeek.current;
              pendingRadioSeek.current = null;
            }
            const audio = audioRef.current;
            if (audio && isFinite(audio.duration)) {
              actualDuration.current = audio.duration;
              // Auto-correct if actual duration differs by >2s
              const track = currentTracks[trackIndex];
              if (track && Math.abs(audio.duration - track.durationSeconds) > 2) {
                const corrected = Math.round(audio.duration);
                // Update local state so computeRadioPosition uses correct duration
                setCurrentTracks((prev) =>
                  prev.map((t) =>
                    t.id === track.id ? { ...t, durationSeconds: corrected } : t
                  )
                );
                // Also correct in Firestore for future sessions
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
            // Don't mark as paused when audio ended naturally — advanceTrack handles it
            if (audioRef.current?.ended) return;
            setIsPlaying(false);
          }}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
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
            style={{ left: position.x, top: position.y }}
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
                    />
                  )}
                  <p className="floating-player__composer" style={{ margin: '-8px 0 4px 12px', fontWeight: 400 }}>{currentTrack?.composer}</p>
                  <p className="floating-player__performer" style={{ margin: '0', fontSize: '16px', fontWeight: 500 }}>
                    {currentTrack?.performers.join(", ")}
                    {currentTrack?.conductor && ` · cond. ${currentTrack.conductor}`}
                  </p>
                  
                  {/* Dynamic Insight */}
                  <div className="floating-player__insight-container">
                    <TypewriterText 
                      text={insight} 
                      speed={180} 
                      fullInfoToCopy={currentTrack ? `${currentTrack.title}\nComposer: ${currentTrack.composer}\nPerformer: ${currentTrack.performers.join(", ")}${currentTrack.conductor ? `\nConductor: ${currentTrack.conductor}` : ""}\nDuration: ${formatDuration(currentTrack.durationSeconds)}\nVenue: ${masterPlaylist?.id === activePlaylistId ? "European Archive" : (userPlaylists.find(pl => pl.id === activePlaylistId)?.name || "Irregular Pearl")}\n\nInsight:\n${insight}\n\n© 2026 Irregular Pearl` : insight}
                    />
                  </div>
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
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path className="icon-stroke" d="M5 9H9L13 5V19L9 15H5Z" />
                      {muted ? (
                        <path className="icon-stroke" d="M16 9L22 15M22 9L16 15" />
                      ) : (
                        <path className="icon-stroke" d="M16 9C17.5 10.4 17.5 13.6 16 15M18.5 7C21.8 10 21.8 14 18.5 17" />
                      )}
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
                  {user && (
                    <button type="button" onClick={playPreviousTrack} aria-label="Previous track">
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path className="icon-stroke" d="M7 6V18" />
                        <path className="icon-fill" d="M19 6L10 12L19 18Z" />
                      </svg>
                    </button>
                  )}
                  {user && (
                    <button type="button" onClick={playNextTrack} aria-label="Next track">
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path className="icon-stroke" d="M17 6V18" />
                        <path className="icon-fill" d="M5 6L14 12L5 18Z" />
                      </svg>
                    </button>
                  )}

                  {/* Playlist Manager Toggle */}
                  <button
                    type="button"
                    className="floating-player__btn-slide"
                    onClick={() => {
                      const opening = !playlistOpen;
                      setPlaylistOpen(opening);
                      // Reset expandedPlaylistId so active playlist auto-expands via fallback
                      if (opening) {
                        setExpandedPlaylistId(null);
                      }
                    }}
                    aria-label={playlistOpen ? "Hide playlists" : "Show playlists"}
                    title="Playlists"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path className="icon-stroke" d="M4 6h16M4 10h16M4 14h10M4 18h7" />
                      <path className="icon-stroke" d="M19 14v6M16 17h6" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <aside
            className={`floating-player__sidebar ${playlistOpen ? "is-open" : ""}`}
            style={
              isMobile
                ? {}
                : (() => {
                    const w = window.innerWidth;
                    const sidebarWidth = w <= 960 ? Math.min(300, w - 24) : 340;
                    const sidebarLeft = position.x + (panelRef.current?.offsetWidth ?? 547) + 8;
                    const maxLeft = w - sidebarWidth - 8;
                    return {
                      left: Math.min(sidebarLeft, Math.max(8, maxLeft)),
                      top: 60,
                      bottom: 60,
                    };
                  })()
            }
          >
            <div className="floating-player__sidebar-inner" style={{ padding: '0', display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div className="floating-player__sidebar-titlebar">
                <span>PLAYLISTS</span>
                <div className="floating-player__titlebar-actions">
                  <button
                    type="button"
                    className="floating-player__sidebar-close"
                    onClick={() => { setPlaylistOpen(false); setExpandedPlaylistId(null); }}
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div 
                ref={sidebarScrollRef}
                style={{ flex: 1, overflowY: 'auto', padding: '12px', minHeight: 0 }}
              >
                <ul className="floating-player__sidebar-list">
                  {[masterPlaylist, ...userPlaylists.slice().sort((a,b) => {
                    const timeA = a.updatedAt ? (typeof a.updatedAt === 'number' ? a.updatedAt : new Date(a.updatedAt as any).getTime()) : 0;
                    const timeB = b.updatedAt ? (typeof b.updatedAt === 'number' ? b.updatedAt : new Date(b.updatedAt as any).getTime()) : 0;
                    return timeB - timeA;
                  })].filter(Boolean).map((pl) => {
                    const isActive = activePlaylistId === pl!.id;
                    const isExpanded = expandedPlaylistId !== null ? expandedPlaylistId === pl!.id : isActive;
                    
                    return (
                      <li key={pl!.id} style={{ marginBottom: '8px', padding: 0, background: 'transparent' }}>
                        <div 
                          onClick={() => {
                            setExpandedPlaylistId(isExpanded ? null : pl!.id);
                          }}
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px', 
                            cursor: 'pointer',
                            padding: '4px 0',
                            fontWeight: isActive ? 'bold' : 'normal',
                            color: isActive ? '#855081' : '#be70a6'
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s', color: '#855081' }}>
                            <path d="M6 9l6 6 6-6" />
                          </svg>
                          <span style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {pl!.name === "Master Playlist" ? "Classical Masterworks" : pl!.name}
                          </span>
                        </div>

                        {isExpanded && (
                          <ul className="floating-player__sidebar-list" style={{ marginTop: '0', marginLeft: '0' }}>
                            {(() => {
                              const plTracks = pl!.trackIds
                                .map(id => allTracks.find(t => t.id === id))
                                .filter(Boolean) as Track[];
                                
                              if (plTracks.length === 0) {
                                return <li className="floating-player__sidebar-empty" style={{ fontSize: '11px', padding: '4px 0', marginLeft: '22px' }}>No tracks</li>;
                              }
                              
                              return plTracks.map((track, index) => {
                                const isPlaying = isActive && index === trackIndex;
                                return (
                                  <li 
                                    key={`${track.id}-${index}`} 
                                    ref={isPlaying ? activeTrackRef : null}
                                    className={isPlaying ? "currently-playing" : ""}
                                    style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', padding: '4px 0' }}
                                  >
                                    {user && (
                                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setTrackDropdownOpenId(trackDropdownOpenId === track.id ? null : track.id);
                                          }}
                                          style={{ background: 'none', border: 'none', color: '#855081', width: '14px', height: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', padding: '0' }}
                                          title="Add to playlist"
                                        >
                                          +
                                        </button>
                                        
                                        {trackDropdownOpenId === track.id && (
                                          <div style={{ position: 'absolute', left: '0', top: '100%', marginTop: '4px', background: '#fff4fc', border: '1px solid #d79bc1', borderRadius: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10, width: '160px', maxHeight: '200px', overflowY: 'auto', padding: '4px 0' }}>
                                            <div style={{ padding: '4px 8px', fontSize: '10px', color: '#916088', borderBottom: '1px solid #f2cde6', marginBottom: '4px' }}>Add to playlist:</div>
                                            {userPlaylists
                                              .slice()
                                              .sort((a, b) => {
                                                const timeA = a.updatedAt ? (typeof a.updatedAt === 'number' ? a.updatedAt : new Date(a.updatedAt as any).getTime()) : 0;
                                                const timeB = b.updatedAt ? (typeof b.updatedAt === 'number' ? b.updatedAt : new Date(b.updatedAt as any).getTime()) : 0;
                                                return timeB - timeA;
                                              })
                                              .map(upl => {
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
                                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '6px 12px', border: 'none', background: 'transparent', color: '#855081', fontSize: '11px', textAlign: 'left', cursor: 'pointer' }}
                                                  >
                                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{upl.name}</span>
                                                    {hasTrack && <span style={{ color: '#be70a6', marginLeft: '4px' }}>✓</span>}
                                                  </button>
                                                );
                                              })}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                    <div 
                                      style={{ flex: 1, minWidth: 0, cursor: pl!.id === masterPlaylist?.id ? 'default' : 'pointer' }}
                                      onClick={() => {
                                        if (pl!.id === masterPlaylist?.id) return;
                                        switchPlaylist(pl!);
                                        setTrackIndex(index);
                                        setPlayedOrder([index]);
                                        if (muted) setMuted(false);
                                        setIsPlaying(true);
                                      }}
                                    >
                                      <div className="track-title" style={{ fontSize: '12px', color: isPlaying ? '#855081' : '#be70a6', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: isPlaying ? 'bold' : 'normal' }}>{track.title}</div>
                                      <div className="track-composer" style={{ fontSize: '10px', color: isPlaying ? '#916088' : '#d79bc1', fontStyle: 'italic', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.composer}</div>
                                    </div>
                                  </li>
                                );
                              });
                            })()}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>

              {user && (
                <div style={{ padding: '12px', borderTop: '1px solid #f2cde6', background: '#ffeefa' }}>
                  {showNewPlaylist ? (
                    <div className="playlist-manager__new-row">
                      <input
                        className="playlist-manager__input"
                        placeholder="Save current queue as..."
                        value={newPlaylistName}
                        onChange={(e) => setNewPlaylistName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleCreatePlaylist()}
                        autoFocus
                        style={{ padding: '6px', fontSize: '12px', border: '1px solid #d79bc1', borderRadius: '4px', flex: 1 }}
                      />
                      <button type="button" onClick={handleCreatePlaylist} style={{ padding: '6px 10px', border: '1px solid #be70a6', background: '#eab8d9', color: '#fff', borderRadius: '4px', cursor: 'pointer', marginLeft: '4px' }}>✓</button>
                      <button type="button" onClick={() => { setShowNewPlaylist(false); setNewPlaylistName(""); }} style={{ padding: '6px 10px', border: '1px solid #eab8d9', background: '#fff', color: '#be70a6', borderRadius: '4px', cursor: 'pointer', marginLeft: '4px' }}>✕</button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="playlist-manager__add-btn"
                      onClick={() => setShowNewPlaylist(true)}
                      style={{ padding: '8px', width: '100%', border: '1px dashed #d79bc1', background: 'transparent', color: '#855081', fontSize: '12px', cursor: 'pointer', textAlign: 'center', fontWeight: 'bold', borderRadius: '4px' }}
                    >
                      + Save Queue as Playlist
                    </button>
                  )}
                </div>
              )}
            </div>
          </aside>
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
