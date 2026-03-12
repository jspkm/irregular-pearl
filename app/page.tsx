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
        style={{ "--scroll-dist": scrollDist } as React.CSSProperties}
        onAnimationEnd={() => setHasScrolledOnce(true)}
      >
        {title}
      </p>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────── */

export default function Home() {
  const { user, loading: authLoading, signInGoogle, signInEmail, signUpEmail, signOut, updateProfile, authError, clearError } = useAuth();

  const panelRef = useRef<HTMLDivElement>(null);
  const authPanelRef = useRef<HTMLElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const dragRef = useRef<{ id: number; offsetX: number; offsetY: number } | null>(null);
  const authDragRef = useRef<{ id: number; offsetX: number; offsetY: number } | null>(null);

  // Layout state
  const [ready, setReady] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [authPosition, setAuthPosition] = useState({ x: 0, y: 0 });
  const [minimized, setMinimized] = useState(false);

  // Playback state
  const [muted, setMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [trackIndex, setTrackIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [playedOrder, setPlayedOrder] = useState<number[]>([0]);

  // Data state
  const [allTracks, setAllTracks] = useState<Track[]>([]);
  const [currentTracks, setCurrentTracks] = useState<Track[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Playlist state
  const [masterPlaylist, setMasterPlaylist] = useState<Playlist | null>(null);
  const [userPlaylists, setUserPlaylists] = useState<Playlist[]>([]);
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const [playlistPanelOpen, setPlaylistPanelOpen] = useState(false);

  // Browse/add state
  const [browseOpen, setBrowseOpen] = useState(false);
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

  /* ── Position ───────────────────────────────────── */

  useEffect(() => {
    const panelWidth = 547;
    const panelHeight = 290;
    setPosition({
      x: Math.max(12, (window.innerWidth - panelWidth) / 2),
      y: Math.max(12, (window.innerHeight - panelHeight) / 2),
    });
    setAuthPosition({
      x: Math.max(12, window.innerWidth - 324 - 16),
      y: 38,
    });
    setProfilePosition({
      x: Math.max(12, Math.min(window.innerWidth - 276, window.innerWidth - 276)),
      y: 38,
    });
    setReady(true);
  }, []);

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
    setTrackIndex(rIdx);
    setCurrentTime(rPos);
    // Seek will happen once <audio> mounts for new track or immediately if same track
    requestAnimationFrame(() => {
      if (audioRef.current) {
        audioRef.current.currentTime = rPos;
      }
    });
  }, [currentTracks]);

  useEffect(() => {
    if (user || currentTracks.length === 0) return;
    radioAdvance();
  }, [user, currentTracks, radioAdvance]);

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

  const playNextTrack = useCallback(() => {
    setCurrentTime(0);
    setTrackIndex((i) => (i + 1) % currentTracks.length);
  }, [currentTracks.length]);

  const playPreviousTrack = useCallback(() => {
    setCurrentTime(0);
    setTrackIndex((i) => (i - 1 + currentTracks.length) % currentTracks.length);
  }, [currentTracks.length]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const track = currentTracks[trackIndex];
    if (!audioRef.current || !track) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = percentage * track.durationSeconds;
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
    if (!user) {
      radioAdvance();
    }
    try {
      await audio.play();
      setIsPlaying(true);
    } catch { }
  }, [isPlaying, user, radioAdvance]);

  /* ── Playlist Actions ───────────────────────────── */

  const switchPlaylist = (playlist: Playlist) => {
    const ordered = playlist.trackIds
      .map((id) => allTracks.find((t) => t.id === id))
      .filter(Boolean) as Track[];
    setCurrentTracks(ordered.length > 0 ? ordered : allTracks);
    setActivePlaylistId(playlist.id);
    setTrackIndex(0);
    setPlayedOrder([0]);
    setPlaylistPanelOpen(false);
  };

  const handleCreatePlaylist = async () => {
    if (!user || !newPlaylistName.trim()) return;
    try {
      await createPlaylist(user.uid, newPlaylistName.trim());
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

  if (currentTracks.length === 0) {
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
          key={currentTrack.id}
          ref={audioRef}
          src={currentTrack.audioUrl}
          autoPlay
          muted={muted}
          playsInline
          onEnded={user ? playNextTrack : radioAdvance}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
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
                  <p className="floating-player__composer">{currentTrack?.composer}</p>
                  <p className="floating-player__performer">
                    {currentTrack?.performers.join(", ")}
                    {currentTrack?.conductor && ` · cond. ${currentTrack.conductor}`}
                  </p>
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
                        width: `${currentTrack ? (currentTime / currentTrack.durationSeconds) * 100 : 0}%`
                      }}
                    >
                      <div className="floating-player__progress-tick" />
                    </div>
                  </div>
                  <span className="floating-player__time">
                    {currentTrack ? formatDuration(currentTrack.durationSeconds) : "0:00"}
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

                  {/* Playlist Manager Toggle (user only) */}
                  {user && (
                    <button
                      type="button"
                      className="floating-player__btn-playlists"
                      onClick={() => setPlaylistPanelOpen((v) => !v)}
                      aria-label="Manage playlists"
                      title="My Playlists"
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path className="icon-stroke" d="M4 6h16M4 10h16M4 14h10M4 18h7" />
                        <path className="icon-stroke" d="M19 14v6M16 17h6" />
                      </svg>
                    </button>
                  )}

                  {/* Browse Track DB */}
                  {user && (
                    <button
                      type="button"
                      className="floating-player__btn-browse"
                      onClick={() => setBrowseOpen((v) => !v)}
                      aria-label="Browse all tracks"
                      title="Browse All"
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <circle className="icon-stroke" cx="11" cy="11" r="7" />
                        <path className="icon-stroke" d="M21 21L16.65 16.65" />
                      </svg>
                    </button>
                  )}

                  <button
                    type="button"
                    className="floating-player__btn-slide"
                    onClick={() => setPlaylistOpen((v) => !v)}
                    aria-label={playlistOpen ? "Hide queue" : "Show queue"}
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
          </div>

          {/* Queue Sidebar */}
          <aside
            className={`floating-player__queue ${playlistOpen ? "is-open" : ""}`}
            style={{
              left: position.x + (panelRef.current?.offsetWidth ?? 360) + 8,
              top: position.y,
            }}
          >
            <div className="floating-player__queue-inner">
              <p className="floating-player__queue-label">
                {activePlaylist?.name ?? "Playlist"}
              </p>

              <p className="floating-player__queue-sublabel">Played</p>
              <ul className="floating-player__queue-list">
                {playedIndexes.length === 0 ? (
                  <li className="floating-player__queue-empty">No tracks played yet</li>
                ) : (
                  playedIndexes.slice(-5).map((index, entry) => (
                    <li key={`${index}-${entry}`}>
                      <span>{currentTracks[index]?.title}</span>
                      <small>{currentTracks[index]?.composer}</small>
                    </li>
                  ))
                )}
              </ul>

              <p className="floating-player__queue-sublabel">Now Playing</p>
              <div className="floating-player__queue-current">
                <span>{currentTrack?.title}</span>
                <small>
                  {currentTrack?.composer} · {currentTrack?.performers.join(", ")}
                </small>
              </div>

              <p className="floating-player__queue-sublabel">Up Next</p>
              <ul className="floating-player__queue-list">
                {upcomingIndexes.slice(0, 8).map((index) => (
                  <li key={`next-${index}`}>
                    <span>{currentTracks[index]?.title}</span>
                    <small>{currentTracks[index]?.composer}</small>
                  </li>
                ))}
                {upcomingIndexes.length > 8 && (
                  <li className="floating-player__queue-empty">
                    +{upcomingIndexes.length - 8} more…
                  </li>
                )}
              </ul>
            </div>
          </aside>

          {/* Playlist Manager Panel */}
          {user && playlistPanelOpen && (
            <aside
              className="playlist-manager"
              style={{
                left: position.x,
                top: position.y + (panelRef.current?.offsetHeight ?? 280) + 8,
              }}
            >
              <div className="playlist-manager__inner">
                <p className="playlist-manager__title">My Playlists</p>

                {/* Master Playlist */}
                <button
                  type="button"
                  className={`playlist-manager__item ${activePlaylistId === masterPlaylist?.id ? "is-active" : ""}`}
                  onClick={() => masterPlaylist && switchPlaylist(masterPlaylist)}
                >
                  <span>♫ {masterPlaylist?.name ?? "Master Playlist"}</span>
                  <small>{masterPlaylist?.trackIds.length ?? 0} tracks</small>
                </button>

                {/* User Playlists */}
                {userPlaylists.map((pl) => (
                  <div
                    key={pl.id}
                    className={`playlist-manager__item ${activePlaylistId === pl.id ? "is-active" : ""}`}
                  >
                    {renamingId === pl.id ? (
                      <div className="playlist-manager__rename-row">
                        <input
                          className="playlist-manager__input"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleRenamePlaylist()}
                          autoFocus
                        />
                        <button type="button" onClick={handleRenamePlaylist}>✓</button>
                        <button type="button" onClick={() => setRenamingId(null)}>✕</button>
                      </div>
                    ) : (
                      <>
                        <button type="button" className="playlist-manager__play-btn" onClick={() => switchPlaylist(pl)}>
                          <span>{pl.name}</span>
                          <small>{pl.trackIds.length} tracks</small>
                        </button>
                        <div className="playlist-manager__item-actions">
                          <button
                            type="button"
                            onClick={() => { setRenamingId(pl.id); setRenameValue(pl.name); }}
                            title="Rename"
                          >
                            ✎
                          </button>
                          <button type="button" onClick={() => handleDeletePlaylist(pl.id)} title="Delete">
                            ✕
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}

                {/* New Playlist */}
                {showNewPlaylist ? (
                  <div className="playlist-manager__new-row">
                    <input
                      className="playlist-manager__input"
                      placeholder="Playlist name"
                      value={newPlaylistName}
                      onChange={(e) => setNewPlaylistName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleCreatePlaylist()}
                      autoFocus
                    />
                    <button type="button" onClick={handleCreatePlaylist}>✓</button>
                    <button type="button" onClick={() => { setShowNewPlaylist(false); setNewPlaylistName(""); }}>✕</button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="playlist-manager__add-btn"
                    onClick={() => setShowNewPlaylist(true)}
                  >
                    + New Playlist
                  </button>
                )}
              </div>
            </aside>
          )}

          {/* Browse / Search Panel */}
          {user && browseOpen && (
            <aside
              className="browse-panel"
              style={{
                left: position.x + (panelRef.current?.offsetWidth ?? 360) + 8,
                top: position.y + (panelRef.current?.offsetHeight ?? 280) + 8,
              }}
            >
              <div className="browse-panel__inner">
                <p className="browse-panel__title">Browse All Tracks</p>
                <input
                  className="browse-panel__search"
                  placeholder="Search by title, composer, performer…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <ul className="browse-panel__list">
                  {filteredBrowseTracks.slice(0, 30).map((track) => {
                    const inActive = activePlaylist?.trackIds.includes(track.id);
                    return (
                      <li key={track.id} className="browse-panel__track">
                        <div className="browse-panel__track-info">
                          <span>{track.title}</span>
                          <small>
                            {track.composer} · {track.performers.join(", ")} ·{" "}
                            {formatDuration(track.durationSeconds)}
                          </small>
                        </div>
                        <div className="browse-panel__track-actions">
                          {/* Play now */}
                          <button
                            type="button"
                            title="Play now"
                            onClick={() => {
                              const idx = currentTracks.findIndex((t) => t.id === track.id);
                              if (idx >= 0) {
                                setTrackIndex(idx);
                              } else {
                                setCurrentTracks((prev) => [...prev, track]);
                                setTrackIndex(currentTracks.length);
                              }
                            }}
                          >
                            ▶
                          </button>
                          {/* Add to active user playlist */}
                          {activePlaylist &&
                            activePlaylist.ownerId === user.uid &&
                            !inActive && (
                              <button
                                type="button"
                                title={`Add to ${activePlaylist.name}`}
                                onClick={() => handleAddTrackToPlaylist(activePlaylist.id, track.id)}
                              >
                                +
                              </button>
                            )}
                          {activePlaylist &&
                            activePlaylist.ownerId === user.uid &&
                            inActive && (
                              <button
                                type="button"
                                title={`Remove from ${activePlaylist.name}`}
                                onClick={() => handleRemoveTrackFromPlaylist(activePlaylist.id, track.id)}
                              >
                                −
                              </button>
                            )}
                        </div>
                      </li>
                    );
                  })}
                  {filteredBrowseTracks.length > 30 && (
                    <li className="browse-panel__more">
                      Showing 30 of {filteredBrowseTracks.length}. Refine your search.
                    </li>
                  )}
                </ul>
              </div>
            </aside>
          )}
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
