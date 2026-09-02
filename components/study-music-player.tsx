"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  CURATED_PLAYLISTS,
  fetchCloudUserCustomPlaylists,
  loadStoredMusicSettings,
  loadUserCustomPlaylists,
  MusicPlayerSettings,
  parseMultipleYouTubeUrls,
  parseYouTubeMedia,
  saveStoredMusicSettings,
  saveUserCustomPlaylists,
  StudyPlaylist,
  TrackItem,
} from "@/lib/musicPlaylists";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cloud,
  Disc,
  ExternalLink,
  Flame,
  Gamepad2,
  HardDrive,
  Headphones,
  Heart,
  ListMusic,
  ListOrdered,
  Maximize2,
  Minimize2,
  Music,
  Pause,
  Play,
  Plus,
  Radio,
  Repeat,
  RotateCcw,
  Search,
  ShieldCheck,
  Shuffle,
  SkipBack,
  SkipForward,
  Sparkles,
  Trash2,
  Volume2,
  VolumeX,
  X,
  Zap,
} from "lucide-react";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds <= 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

export function StudyMusicPlayer() {
  // State
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [userCustomPlaylists, setUserCustomPlaylists] = useState<StudyPlaylist[]>([]);
  const [activePlaylist, setActivePlaylist] = useState<StudyPlaylist>(CURATED_PLAYLISTS[0]);
  const [queue, setQueue] = useState<TrackItem[]>(CURATED_PLAYLISTS[0].tracks);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const [isAutoplayEnabled, setIsAutoplayEnabled] = useState(true);
  const [isShuffleActive, setIsShuffleActive] = useState(false);
  const [autoFailover, setAutoFailover] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);

  const [isExpanded, setIsExpanded] = useState(false);
  const [isMiniCollapsed, setIsMiniCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<"playlists" | "queue" | "custom">("playlists");
  const [customInput, setCustomInput] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [customArtist, setCustomArtist] = useState("");
  const [statusNotice, setStatusNotice] = useState<{ text: string; type: "info" | "success" | "warn" } | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const playerRef = useRef<any>(null);
  const pendingTrackRef = useRef<TrackItem | null>(null);
  const watchdogTimerRef = useRef<any>(null);
  const timeProgressIntervalRef = useRef<any>(null);
  const consecutiveErrorsRef = useRef(0);

  // Up-to-date refs for callbacks inside events
  const queueRef = useRef<TrackItem[]>(queue);
  const currentTrackIndexRef = useRef<number>(currentTrackIndex);
  const isShuffleActiveRef = useRef<boolean>(isShuffleActive);
  const isPlayingRef = useRef<boolean>(isPlaying);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    currentTrackIndexRef.current = currentTrackIndex;
  }, [currentTrackIndex]);

  useEffect(() => {
    isShuffleActiveRef.current = isShuffleActive;
  }, [isShuffleActive]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const currentTrack = queue[currentTrackIndex] || queue[0];
  const allPlaylists = [...CURATED_PLAYLISTS, ...userCustomPlaylists];

  // 1. Load saved settings from localStorage
  useEffect(() => {
    const saved = loadStoredMusicSettings();
    setVolume(saved.volume);
    setIsMuted(saved.isMuted);
    setIsAutoplayEnabled(saved.autoPlayOnStudy ?? true);
    setAutoFailover(saved.autoFailover ?? true);

    const custom = loadUserCustomPlaylists();
    setUserCustomPlaylists(custom);

    const merged = [...CURATED_PLAYLISTS, ...custom];
    const foundPlaylist = merged.find((p) => p.id === saved.activePlaylistId) || CURATED_PLAYLISTS[0];
    setActivePlaylist(foundPlaylist);
    setQueue(foundPlaylist.tracks);
  }, []);

  // Listen for user auth state and sync cloud playlists from Firestore
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const cloudCustom = await fetchCloudUserCustomPlaylists(user.uid);
          if (cloudCustom && cloudCustom.length > 0) {
            setUserCustomPlaylists(cloudCustom);
          }
        } catch (e) {
          console.warn("Cloud music playlists sync note:", e);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Show auto-dismiss status notice
  const notify = (text: string, type: "info" | "success" | "warn" = "info", dur = 4000) => {
    setStatusNotice({ text, type });
    setTimeout(() => {
      setStatusNotice((current) => (current?.text === text ? null : current));
    }, dur);
  };

  // Browser Autoplay First-Interaction Unlock Listener
  useEffect(() => {
    if (!isAutoplayEnabled) return;

    const handleFirstInteraction = () => {
      if (playerRef.current && isPlayerReady && !isPlayingRef.current) {
        try {
          playerRef.current.playVideo();
          setIsPlaying(true);
        } catch (e) {
          console.warn("Autoplay interaction unlock:", e);
        }
      }
    };

    window.addEventListener("click", handleFirstInteraction, { once: true });
    window.addEventListener("touchstart", handleFirstInteraction, { once: true });
    window.addEventListener("keydown", handleFirstInteraction, { once: true });

    return () => {
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
    };
  }, [isAutoplayEnabled, isPlayerReady]);

  // Track Time & Duration Polling
  useEffect(() => {
    if (isPlaying && isPlayerReady && playerRef.current) {
      timeProgressIntervalRef.current = setInterval(() => {
        if (!isSeeking && playerRef.current?.getCurrentTime) {
          try {
            const curr = playerRef.current.getCurrentTime() || 0;
            const dur = playerRef.current.getDuration() || 0;
            setCurrentTime(curr);
            setDuration(dur);
          } catch {
            // ignore
          }
        }
      }, 400);
    } else {
      if (timeProgressIntervalRef.current) clearInterval(timeProgressIntervalRef.current);
    }

    return () => {
      if (timeProgressIntervalRef.current) clearInterval(timeProgressIntervalRef.current);
    };
  }, [isPlaying, isPlayerReady, isSeeking]);

  // Smart Auto-Failover to next available playlist
  const handleSmartFailover = (reason?: string) => {
    const currentIndex = CURATED_PLAYLISTS.findIndex((p) => p.id === activePlaylist.id);
    if (consecutiveErrorsRef.current >= 4) {
      setIsPlaying(false);
      notify("Music paused. Please choose another track or paste a custom YouTube link.", "info", 4000);
      return;
    }

    const nextIndex = (currentIndex + 1) % CURATED_PLAYLISTS.length;
    const fallbackPlaylist = CURATED_PLAYLISTS[nextIndex];

    console.warn(`[ReviewFlash Music] Auto-failover triggered. Switching to: ${fallbackPlaylist.title}`);
    setActivePlaylist(fallbackPlaylist);
    setQueue(fallbackPlaylist.tracks);
    setCurrentTrackIndex(0);

    const firstTrack = fallbackPlaylist.tracks[0];
    if (firstTrack) {
      loadAndPlayTrack(firstTrack, true);
    }

    notify(
      reason || `Auto-switched to ${fallbackPlaylist.title} to keep your study session flowing 🎵`,
      "success",
      5000
    );
  };

  // Next Track handler (referenced in callbacks)
  const handleNextTrack = () => {
    const q = queueRef.current;
    const currIdx = currentTrackIndexRef.current;
    const shuffleOn = isShuffleActiveRef.current;

    if (!q.length) return;

    if (q.length === 1 || (shuffleOn && q.length > 1)) {
      const allCuratedTracks = CURATED_PLAYLISTS.flatMap((p) => p.tracks);
      const randomTrack = allCuratedTracks[Math.floor(Math.random() * allCuratedTracks.length)];
      if (randomTrack) {
        loadAndPlayTrack(randomTrack, true);
        notify(`Up Next: ${randomTrack.title} 🎵`, "info", 3000);
        return;
      }
    }

    const nextIndex = (currIdx + 1) % q.length;
    setCurrentTrackIndex(nextIndex);
    const nextTrack = q[nextIndex];
    if (nextTrack) {
      loadAndPlayTrack(nextTrack, true);
    }
  };

  const handleNextTrackRef = useRef(handleNextTrack);
  useEffect(() => {
    handleNextTrackRef.current = handleNextTrack;
  });

  // Previous Track
  const handlePrevTrack = () => {
    if (!queue.length) return;
    const prevIndex = currentTrackIndex === 0 ? queue.length - 1 : currentTrackIndex - 1;
    setCurrentTrackIndex(prevIndex);
    const prevTrack = queue[prevIndex];
    if (prevTrack) {
      loadAndPlayTrack(prevTrack, true);
    }
  };

  // 2. Initialize YouTube IFrame API
  useEffect(() => {
    if (typeof window === "undefined") return;

    function initYTPlayer() {
      if (!window.YT || !window.YT.Player) return;
      if (playerRef.current) return;

      try {
        playerRef.current = new window.YT.Player("rf-yt-audio-player", {
          height: "100%",
          width: "100%",
          videoId: currentTrack ? currentTrack.id : "D5pe4V7E0eU",
          playerVars: {
            autoplay: isAutoplayEnabled ? 1 : 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            enablejsapi: 1,
            origin: typeof window !== "undefined" ? window.location.origin : undefined,
          },
          events: {
            onReady: (event: any) => {
              setIsPlayerReady(true);
              event.target.setVolume(volume);
              if (isMuted) {
                event.target.mute();
              } else {
                event.target.unMute();
              }

              if (pendingTrackRef.current) {
                const track = pendingTrackRef.current;
                pendingTrackRef.current = null;
                event.target.loadVideoById({
                  videoId: track.id,
                  startSeconds: 0,
                });
                setIsPlaying(true);
              } else if (isAutoplayEnabled) {
                try {
                  event.target.playVideo();
                } catch {
                  // Requires user gesture
                }
              }
            },
            onStateChange: (event: any) => {
              // 1 = PLAYING, 2 = PAUSED, 0 = ENDED, 3 = BUFFERING, 5 = CUED
              if (event.data === 1 || event.data === window.YT?.PlayerState?.PLAYING) {
                setIsPlaying(true);
                consecutiveErrorsRef.current = 0;
                if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
              } else if (event.data === 2 || event.data === window.YT?.PlayerState?.PAUSED) {
                setIsPlaying(false);
              } else if (event.data === 0 || event.data === window.YT?.PlayerState?.ENDED) {
                handleNextTrackRef.current();
              }
            },
            onError: (event: any) => {
              console.warn("YouTube Audio Player Notice - Code:", event.data);
              consecutiveErrorsRef.current += 1;

              if (autoFailover) {
                if (consecutiveErrorsRef.current <= 1 && queueRef.current.length > 1) {
                  notify("Current track unavailable. Trying next track in queue...", "warn", 2500);
                  setTimeout(() => handleNextTrackRef.current(), 1000);
                } else {
                  handleSmartFailover("Track restricted. Auto-switched to available study playlist 🎵");
                }
              } else {
                setIsPlaying(false);
                notify("Audio unavailable. Please select another playlist or paste a custom link.", "warn", 4000);
              }
            },
          },
        });
      } catch (e) {
        console.error("Failed to initialize YT Player", e);
      }
    }

    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        document.head.appendChild(tag);
      }
      window.onYouTubeIframeAPIReady = () => {
        initYTPlayer();
      };
    } else {
      initYTPlayer();
    }

    return () => {
      if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
    };
  }, [autoFailover, isAutoplayEnabled]);

  // 3. Load & Play Track
  const loadAndPlayTrack = (track: TrackItem, autoPlay = true) => {
    if (!track) return;

    if (!playerRef.current || !isPlayerReady) {
      pendingTrackRef.current = track;
      if (autoPlay) setIsPlaying(true);
      return;
    }

    try {
      if (typeof playerRef.current.loadVideoById === "function") {
        if (autoPlay) {
          playerRef.current.loadVideoById({
            videoId: track.id,
            startSeconds: 0,
          });
          setIsPlaying(true);

          if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
          if (autoFailover) {
            watchdogTimerRef.current = setTimeout(() => {
              if (!isPlayingRef.current && playerRef.current?.getPlayerState?.() !== 1) {
                handleSmartFailover("Audio stream did not respond. Auto-switching to available playlist.");
              }
            }, 6000);
          }
        } else {
          playerRef.current.cueVideoById({
            videoId: track.id,
            startSeconds: 0,
          });
        }
      }

      if (typeof playerRef.current.setVolume === "function") {
        playerRef.current.setVolume(volume);
      }
      if (isMuted && typeof playerRef.current.mute === "function") {
        playerRef.current.mute();
      } else if (!isMuted && typeof playerRef.current.unMute === "function") {
        playerRef.current.unMute();
      }
    } catch (e) {
      console.warn("Error loading track into YT player", e);
    }
  };

  // Play / Pause toggle with Direct Player State Inspection
  const handleTogglePlay = () => {
    if (!playerRef.current) {
      notify("Starting audio player...", "info", 1500);
      setIsPlaying(true);
      return;
    }

    try {
      let playerState = -1;
      if (typeof playerRef.current.getPlayerState === "function") {
        try {
          playerState = playerRef.current.getPlayerState();
        } catch {
          // ignore
        }
      }

      // If YouTube is playing (1) or buffering (3) OR isPlaying state is currently true, PAUSE IT!
      if (playerState === 1 || playerState === 3 || isPlaying) {
        if (typeof playerRef.current.pauseVideo === "function") {
          playerRef.current.pauseVideo();
        }
        setIsPlaying(false);
      } else {
        // Otherwise PLAY IT!
        if (typeof playerRef.current.playVideo === "function") {
          playerRef.current.playVideo();
        } else if (currentTrack && typeof playerRef.current.loadVideoById === "function") {
          playerRef.current.loadVideoById({
            videoId: currentTrack.id,
            startSeconds: 0,
          });
        }
        setIsPlaying(true);
      }
    } catch (e) {
      console.warn("Toggle play error", e);
      setIsPlaying((prev) => !prev);
    }
  };

  // Time Scrubbing / Seek Handler
  const handleSeekChange = (newTime: number) => {
    setCurrentTime(newTime);
    if (playerRef.current && isPlayerReady && typeof playerRef.current.seekTo === "function") {
      playerRef.current.seekTo(newTime, true);
    }
  };

  // Shuffle Toggle
  const handleToggleShuffle = () => {
    const nextShuffle = !isShuffleActive;
    setIsShuffleActive(nextShuffle);

    if (nextShuffle) {
      const current = queue[currentTrackIndex];
      const otherTracks = queue.filter((_, idx) => idx !== currentTrackIndex);
      const shuffledOthers = [...otherTracks].sort(() => Math.random() - 0.5);
      const newQueue = current ? [current, ...shuffledOthers] : queue;
      setQueue(newQueue);
      setCurrentTrackIndex(0);
      notify("Shuffle enabled 🔀 Queue randomized!", "info", 2500);
    } else {
      setQueue(activePlaylist.tracks);
      const origIndex = activePlaylist.tracks.findIndex((t) => t.id === currentTrack.id);
      setCurrentTrackIndex(origIndex >= 0 ? origIndex : 0);
      notify("Shuffle disabled ➡️ Sequential playback", "info", 2500);
    }
  };

  const [isImporting, setIsImporting] = useState(false);

  // Switch Playlist
  const handleSelectPlaylist = async (playlist: StudyPlaylist) => {
    setActivePlaylist(playlist);
    setQueue(playlist.tracks);
    setCurrentTrackIndex(0);

    const firstTrack = playlist.tracks[0];
    if (firstTrack) {
      loadAndPlayTrack(firstTrack, true);
    }

    // If this custom playlist has a playlistId and tracks need expansion, fetch separate songs
    if (playlist.playlistId && playlist.tracks.length <= 1) {
      try {
        const res = await fetch(`/api/youtube-playlist?list=${playlist.playlistId}`);
        const data = await res.json();
        if (Array.isArray(data.tracks) && data.tracks.length > 1) {
          setQueue(data.tracks);
          const updatedPlaylist = {
            ...playlist,
            tracks: data.tracks,
            tagline: `${data.tracks.length} separate tracks in queue`,
          };
          setActivePlaylist(updatedPlaylist);
          const updatedPlaylists = userCustomPlaylists.map((p) =>
            p.id === playlist.id ? updatedPlaylist : p
          );
          setUserCustomPlaylists(updatedPlaylists);
          saveUserCustomPlaylists(updatedPlaylists, currentUser?.uid);
          notify(`Separated ${data.tracks.length} songs into your queue! 🎵`, "info", 3000);
        }
      } catch (e) {
        console.warn("Background playlist expansion:", e);
      }
    }

    saveStoredMusicSettings({
      volume,
      isMuted,
      activePlaylistId: playlist.id,
      autoPlayOnStudy: isAutoplayEnabled,
      autoFailover,
    });
  };

  // Change Volume
  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
      if (playerRef.current && isPlayerReady && typeof playerRef.current.unMute === "function") {
        playerRef.current.unMute();
      }
    }
    if (playerRef.current && isPlayerReady && typeof playerRef.current.setVolume === "function") {
      playerRef.current.setVolume(newVolume);
    }
    saveStoredMusicSettings({
      volume: newVolume,
      isMuted,
      activePlaylistId: activePlaylist.id,
      autoPlayOnStudy: isAutoplayEnabled,
      autoFailover,
    });
  };

  // Toggle Mute
  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (playerRef.current && isPlayerReady) {
      if (nextMuted && typeof playerRef.current.mute === "function") {
        playerRef.current.mute();
      } else if (!nextMuted && typeof playerRef.current.unMute === "function") {
        playerRef.current.unMute();
        playerRef.current.setVolume(volume);
      }
    }
  };

  // Toggle Autoplay Setting
  const handleToggleAutoplay = () => {
    const nextVal = !isAutoplayEnabled;
    setIsAutoplayEnabled(nextVal);
    saveStoredMusicSettings({
      volume,
      isMuted,
      activePlaylistId: activePlaylist.id,
      autoPlayOnStudy: nextVal,
      autoFailover,
    });
    notify(nextVal ? "Autoplay enabled ⚡" : "Autoplay disabled", "info");
  };

  // Add Custom Link / Playlist / List of links to Queue
  const handleAddCustomTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;

    setIsImporting(true);
    notify("Extracting & separating playlist tracks...", "info", 2000);

    const singleMedia = parseYouTubeMedia(customInput);
    const multi = parseMultipleYouTubeUrls(customInput);

    // 1. If playlist link was passed, fetch the discrete songs from /api/youtube-playlist
    if (singleMedia.playlistId) {
      try {
        const res = await fetch(`/api/youtube-playlist?list=${singleMedia.playlistId}`);
        const data = await res.json();

        let extractedTracks: TrackItem[] = [];
        const playlistName =
          customTitle.trim() ||
          data.title ||
          `Imported Playlist (${singleMedia.playlistId.slice(0, 8)}...)`;

        if (Array.isArray(data.tracks) && data.tracks.length > 0) {
          extractedTracks = data.tracks;
        } else {
          // Fallback: single primary video or multi
          extractedTracks = [
            {
              id: singleMedia.videoId || "D5pe4V7E0eU",
              title: playlistName,
              artist: customArtist.trim() || data.author || "YouTube Music",
              genre: "Custom Playlist",
              artworkUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80",
              duration: "Track",
              isCustom: true,
            },
          ];
        }

        const newPlaylist: StudyPlaylist = {
          id: `user-playlist-${Date.now()}`,
          title: playlistName,
          tagline: `${extractedTracks.length} individual song${extractedTracks.length > 1 ? "s" : ""} in queue`,
          genre: "Custom Playlist",
          emoji: "📑",
          badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
          artworkUrl:
            extractedTracks[0]?.artworkUrl ||
            "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80",
          playlistId: singleMedia.playlistId,
          isUserCustom: true,
          tracks: extractedTracks,
        };

        const updatedPlaylists = [newPlaylist, ...userCustomPlaylists];
        setUserCustomPlaylists(updatedPlaylists);
        saveUserCustomPlaylists(updatedPlaylists, currentUser?.uid);

        setActivePlaylist(newPlaylist);
        setQueue(extractedTracks);
        setCurrentTrackIndex(0);

        if (extractedTracks[0]) {
          loadAndPlayTrack(extractedTracks[0], true);
        }

        notify(
          currentUser
            ? `Saved & queued ${extractedTracks.length} song(s) to your cloud account! ☁️`
            : `Separated & queued ${extractedTracks.length} song(s) to study queue! 🎧`,
          "success",
          4500
        );
        setCustomInput("");
        setCustomTitle("");
        setCustomArtist("");
        setActiveTab("queue");
      } catch (err) {
        console.warn("Error fetching playlist tracks:", err);
        notify("Imported playlist into queue. Loading audio...", "info");
      } finally {
        setIsImporting(false);
      }
      return;
    }

    // 2. Multiline list of URLs (e.g. 5 pasted YouTube links)
    if (multi.tracks.length > 0) {
      setQueue((prev) => [...prev, ...multi.tracks]);
      notify(`Added ${multi.tracks.length} individual song(s) to study queue! 🎵`, "success");
      setCustomInput("");
      setCustomTitle("");
      setCustomArtist("");
      setActiveTab("queue");
      setIsImporting(false);
      if (!isPlaying) {
        loadAndPlayTrack(multi.tracks[0], true);
      }
      return;
    }

    // 3. Single Video ID
    if (!singleMedia.videoId) {
      notify("Please enter a valid YouTube/YouTube Music video or playlist link.", "warn");
      setIsImporting(false);
      return;
    }

    const newTrackId = singleMedia.videoId;
    const newTrack: TrackItem = {
      id: newTrackId,
      title: customTitle.trim() || `Custom Track (${newTrackId})`,
      artist: customArtist.trim() || "Imported Stream",
      genre: "Custom URL",
      artworkUrl: `https://i.ytimg.com/vi/${newTrackId}/hqdefault.jpg`,
      duration: "Stream",
      isCustom: true,
    };

    setQueue((prev) => [...prev, newTrack]);
    notify(`Added "${newTrack.title}" to queue! 🎵`, "success");
    setCustomInput("");
    setCustomTitle("");
    setCustomArtist("");
    setActiveTab("queue");
    setIsImporting(false);
    if (!isPlaying) {
      loadAndPlayTrack(newTrack, true);
    }
  };

  // Remove Track from Queue
  const handleRemoveTrack = (indexToRemove: number) => {
    if (queue.length <= 1) return;
    setQueue((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    if (currentTrackIndex >= indexToRemove && currentTrackIndex > 0) {
      setCurrentTrackIndex((prev) => prev - 1);
    }
  };

  // Delete Custom User Playlist
  const handleDeleteCustomPlaylist = (playlistId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = userCustomPlaylists.filter((p) => p.id !== playlistId);
    setUserCustomPlaylists(updated);
    saveUserCustomPlaylists(updated, currentUser?.uid);
    if (activePlaylist.id === playlistId) {
      handleSelectPlaylist(CURATED_PLAYLISTS[0]);
    }
    notify(
      currentUser ? "Custom playlist removed from your cloud account." : "Custom playlist removed from local storage.",
      "info"
    );
  };

  return (
    <>
      {/* 1. YOUTUBE IFRAME AUDIO ENGINE (Positioned in-viewport at 2x2px with 0.01 opacity to avoid browser background throttling) */}
      <div
        className="fixed bottom-0 right-0 w-[2px] h-[2px] opacity-[0.01] pointer-events-none z-[-50] overflow-hidden"
        style={{ width: "2px", height: "2px" }}
        aria-hidden="true"
      >
        <div id="rf-yt-audio-player" />
      </div>

      {/* 2. COMPACT FLOATING MINI PLAYER (Bottom-Left) */}
      <div className="fixed bottom-4 left-4 z-40 max-w-xs sm:max-w-sm select-none animate-in fade-in slide-in-from-bottom-3 duration-200">
        {isMiniCollapsed ? (
          <button
            type="button"
            onClick={() => setIsMiniCollapsed(false)}
            title="Expand Study Audio Player"
            className="flex items-center gap-2 rounded-full border border-emerald-500/50 bg-slate-900/90 px-3.5 py-2 text-xs font-bold text-emerald-300 shadow-xl backdrop-blur-xl hover:bg-slate-900 hover:border-emerald-400 transition cursor-pointer"
          >
            <div className="relative flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20">
              <Headphones size={13} className="text-emerald-400" />
            </div>
            <span>Study Music</span>
            {isPlaying && (
              <span className="flex items-end gap-0.5 h-3">
                <span className="w-0.5 h-3 bg-emerald-400 animate-pulse" />
                <span className="w-0.5 h-2 bg-emerald-300 animate-pulse delay-75" />
                <span className="w-0.5 h-2.5 bg-emerald-400 animate-pulse delay-150" />
              </span>
            )}
          </button>
        ) : (
          <div className="flex flex-col gap-1.5 rounded-2xl border border-slate-800/90 bg-slate-950/95 p-2 sm:p-2.5 shadow-2xl shadow-slate-950/60 backdrop-blur-2xl ring-1 ring-slate-800">
            <div className="flex items-center gap-2.5">
              {/* Play/Pause Button */}
              <button
                type="button"
                onClick={handleTogglePlay}
                title={isPlaying ? "Pause study music" : "Play study music"}
                className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20 hover:scale-105 active:scale-95 transition cursor-pointer"
              >
                {isPlaying ? <Pause size={17} className="fill-slate-950" /> : <Play size={17} className="fill-slate-950 ml-0.5" />}
              </button>

              {/* Track Info (Click to open full Lounge) */}
              <div
                onClick={() => setIsExpanded(true)}
                className="min-w-0 flex-1 cursor-pointer pr-1 group"
                title="Click to open Study Music Lounge"
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 truncate">
                    {activePlaylist.emoji} {activePlaylist.genre}
                  </span>
                  {isPlaying && (
                    <span className="flex items-end gap-0.5 h-2.5 shrink-0">
                      <span className="w-0.5 h-2.5 bg-emerald-400 animate-bounce" />
                      <span className="w-0.5 h-1.5 bg-emerald-300 animate-bounce delay-100" />
                      <span className="w-0.5 h-2 bg-emerald-400 animate-bounce delay-200" />
                    </span>
                  )}
                </div>
                <p className="truncate text-xs font-bold text-white group-hover:text-cyan-300 transition">
                  {currentTrack?.title || "Casual Game Study BGM"}
                </p>
                <p className="truncate text-[10px] text-slate-400">
                  {currentTrack?.artist || "Nintendo & Cozy Chill"}
                </p>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={handleNextTrack}
                  title="Next song"
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-900 hover:text-white transition cursor-pointer"
                >
                  <SkipForward size={14} />
                </button>

                <button
                  type="button"
                  onClick={() => setIsExpanded(true)}
                  title="Open Study Music Lounge"
                  className="rounded-lg p-1.5 text-cyan-400 hover:bg-cyan-500/10 transition cursor-pointer"
                >
                  <ListMusic size={15} />
                </button>

                <button
                  type="button"
                  onClick={() => setIsMiniCollapsed(true)}
                  title="Minimize player"
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-900 hover:text-slate-300 transition cursor-pointer"
                >
                  <ChevronDown size={14} />
                </button>
              </div>
            </div>

            {/* Mini Progress Scrubber Bar */}
            {duration > 0 && (
              <div className="flex items-center gap-2 px-1 pt-0.5">
                <span className="text-[9px] font-mono text-slate-500">{formatTime(currentTime)}</span>
                <input
                  type="range"
                  min="0"
                  max={duration}
                  value={currentTime}
                  onMouseDown={() => setIsSeeking(true)}
                  onTouchStart={() => setIsSeeking(true)}
                  onChange={(e) => setCurrentTime(Number(e.target.value))}
                  onMouseUp={(e) => {
                    setIsSeeking(false);
                    handleSeekChange(Number((e.target as HTMLInputElement).value));
                  }}
                  onTouchEnd={(e) => {
                    setIsSeeking(false);
                    handleSeekChange(Number((e.target as HTMLInputElement).value));
                  }}
                  className="h-1 flex-1 accent-emerald-400 bg-slate-800 rounded-lg cursor-pointer"
                />
                <span className="text-[9px] font-mono text-slate-500">{formatTime(duration)}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. FULL STUDY MUSIC LOUNGE MODAL / DRAWER */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="relative flex flex-col w-full max-w-2xl max-h-[90dvh] rounded-3xl border border-slate-800 bg-slate-900/95 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5 bg-slate-950/80">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20">
                  <Headphones size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-white">Study Music Lounge</h3>
                    <span className="rounded bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 text-[9px] font-bold font-mono">
                      YouTube Audio
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Active recall soundtrack, progress scrubber &amp; queue
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Status / Auto-Failover Notification Banner */}
            {statusNotice && (
              <div
                className={`px-4 py-2 text-xs flex items-center justify-between gap-2 border-b animate-in fade-in duration-150 ${
                  statusNotice.type === "success"
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                    : statusNotice.type === "warn"
                    ? "bg-amber-500/15 border-amber-500/30 text-amber-300"
                    : "bg-cyan-500/15 border-cyan-500/30 text-cyan-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sparkles size={13} className="shrink-0 animate-pulse" />
                  <span>{statusNotice.text}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setStatusNotice(null)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  <X size={13} />
                </button>
              </div>
            )}

            {/* Hero Now Playing Section */}
            <div className="relative p-5 border-b border-slate-800/80 bg-gradient-to-b from-slate-950 to-slate-900 overflow-hidden">
              <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10">
                {/* Artwork Thumbnail */}
                <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-2xl overflow-hidden border border-slate-700/80 shadow-xl shrink-0 group">
                  <img
                    src={currentTrack?.artworkUrl || activePlaylist.artworkUrl}
                    alt={currentTrack?.title}
                    className={`h-full w-full object-cover transition-transform duration-500 ${
                      isPlaying ? "scale-105" : "scale-100 opacity-80"
                    }`}
                  />
                  {isPlaying && (
                    <div className="absolute inset-0 bg-slate-950/30 flex items-center justify-center">
                      <div className="flex items-end gap-1 h-5">
                        <span className="w-1 bg-emerald-400 rounded-full animate-bounce h-5" />
                        <span className="w-1 bg-cyan-400 rounded-full animate-bounce delay-100 h-3" />
                        <span className="w-1 bg-teal-400 rounded-full animate-bounce delay-200 h-4" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Track Details & Controls */}
                <div className="flex-1 min-w-0 text-center sm:text-left space-y-2">
                  <div className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-300">
                    <span>{activePlaylist.emoji}</span>
                    <span>{activePlaylist.title}</span>
                  </div>

                  <h4 className="text-base sm:text-lg font-bold text-white truncate">
                    {currentTrack?.title}
                  </h4>
                  <p className="text-xs text-slate-400 truncate">
                    {currentTrack?.artist}
                  </p>

                  {/* Time Progress Scrubber Bar */}
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-400 w-8 text-right">
                        {formatTime(currentTime)}
                      </span>
                      <input
                        type="range"
                        min="0"
                        max={duration || 100}
                        value={currentTime}
                        onMouseDown={() => setIsSeeking(true)}
                        onTouchStart={() => setIsSeeking(true)}
                        onChange={(e) => setCurrentTime(Number(e.target.value))}
                        onMouseUp={(e) => {
                          setIsSeeking(false);
                          handleSeekChange(Number((e.target as HTMLInputElement).value));
                        }}
                        onTouchEnd={(e) => {
                          setIsSeeking(false);
                          handleSeekChange(Number((e.target as HTMLInputElement).value));
                        }}
                        className="h-1.5 flex-1 accent-emerald-400 bg-slate-800 rounded-lg cursor-pointer"
                      />
                      <span className="text-[10px] font-mono text-slate-400 w-8 text-left">
                        {duration > 0 ? formatTime(duration) : "Live"}
                      </span>
                    </div>
                  </div>

                  {/* Playback Button Controls */}
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={handleToggleShuffle}
                      className={`rounded-xl p-2 transition cursor-pointer ${
                        isShuffleActive
                          ? "border border-emerald-500/60 bg-emerald-500/20 text-emerald-300 shadow-sm"
                          : "text-slate-400 hover:bg-slate-800 hover:text-white"
                      }`}
                      title={isShuffleActive ? "Shuffle is ON" : "Shuffle is OFF"}
                    >
                      <Shuffle size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={handlePrevTrack}
                      className="rounded-xl p-2 text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer"
                      title="Previous track"
                    >
                      <SkipBack size={18} />
                    </button>

                    <button
                      type="button"
                      onClick={handleTogglePlay}
                      className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/25 hover:scale-105 active:scale-95 transition cursor-pointer font-bold"
                    >
                      {isPlaying ? <Pause size={20} className="fill-slate-950" /> : <Play size={20} className="fill-slate-950 ml-0.5" />}
                    </button>

                    <button
                      type="button"
                      onClick={handleNextTrack}
                      className="rounded-xl p-2 text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer"
                      title="Next track"
                    >
                      <SkipForward size={18} />
                    </button>

                    {/* Volume Slider */}
                    <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                      <button
                        type="button"
                        onClick={handleToggleMute}
                        className="text-slate-400 hover:text-white transition cursor-pointer"
                        title={isMuted ? "Unmute" : "Mute"}
                      >
                        {isMuted || volume === 0 ? <VolumeX size={17} className="text-rose-400" /> : <Volume2 size={17} />}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={isMuted ? 0 : volume}
                        onChange={(e) => handleVolumeChange(Number(e.target.value))}
                        className="h-1.5 w-16 sm:w-24 accent-emerald-400 bg-slate-800 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-2.5 bg-slate-950/60 text-xs flex-wrap gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setActiveTab("playlists")}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-semibold transition cursor-pointer ${
                    activeTab === "playlists"
                      ? "bg-emerald-500 text-slate-950 font-bold"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Disc size={14} />
                  <span>Playlists ({allPlaylists.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("queue")}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-semibold transition cursor-pointer ${
                    activeTab === "queue"
                      ? "bg-emerald-500 text-slate-950 font-bold"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <ListOrdered size={14} />
                  <span>Queue ({queue.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("custom")}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-semibold transition cursor-pointer ${
                    activeTab === "custom"
                      ? "bg-emerald-500 text-slate-950 font-bold"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Plus size={14} />
                  <span>Paste Links / Playlist</span>
                </button>
              </div>

              {/* Autoplay & Auto-Failover Toggles */}
              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                <label
                  className="flex items-center gap-1.5 hover:text-slate-200 cursor-pointer select-none"
                  title="Automatically play audio on start"
                >
                  <input
                    type="checkbox"
                    checked={isAutoplayEnabled}
                    onChange={handleToggleAutoplay}
                    className="rounded border-slate-700 accent-emerald-500 cursor-pointer"
                  />
                  <span>Autoplay ⚡</span>
                </label>

                <label
                  className="flex items-center gap-1.5 hover:text-slate-200 cursor-pointer select-none"
                  title="Automatically switches to next available playlist if audio stream fails or is blocked"
                >
                  <input
                    type="checkbox"
                    checked={autoFailover}
                    onChange={(e) => {
                      setAutoFailover(e.target.checked);
                      saveStoredMusicSettings({
                        volume,
                        isMuted,
                        activePlaylistId: activePlaylist.id,
                        autoPlayOnStudy: isAutoplayEnabled,
                        autoFailover: e.target.checked,
                      });
                    }}
                    className="rounded border-slate-700 accent-emerald-500 cursor-pointer"
                  />
                  <span>Auto-Failover 🛡️</span>
                </label>
              </div>
            </div>

            {/* Tab 1: Playlists Grid (Curated + Custom User Playlists) */}
            {activeTab === "playlists" && (
              <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {allPlaylists.map((playlist) => {
                  const isSelected = activePlaylist.id === playlist.id;

                  return (
                    <div
                      key={playlist.id}
                      onClick={() => handleSelectPlaylist(playlist)}
                      className={`group relative flex items-center gap-3.5 rounded-2xl border p-3.5 text-left transition-all cursor-pointer ${
                        isSelected
                          ? "border-emerald-500/60 bg-emerald-950/20 ring-1 ring-emerald-500/40 shadow-lg shadow-emerald-500/10"
                          : "border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/80"
                      }`}
                    >
                      <div className="relative h-14 w-14 rounded-xl overflow-hidden border border-slate-800 shrink-0">
                        <img
                          src={playlist.artworkUrl}
                          alt={playlist.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        <div className="absolute top-1 left-1 rounded bg-slate-950/80 px-1 py-0.2 text-[10px]">
                          {playlist.emoji}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h5 className={`text-xs font-bold truncate ${isSelected ? "text-emerald-300" : "text-white"}`}>
                            {playlist.title}
                          </h5>
                          {isSelected && (
                            <span className="text-[10px] font-bold text-emerald-400 shrink-0">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                          {playlist.tagline}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span className={`inline-block rounded px-1.5 py-0.2 text-[9px] font-bold border ${playlist.badgeColor}`}>
                            {playlist.playlistId ? "Full YT Playlist" : `${playlist.tracks.length} tracks`}
                          </span>
                          {playlist.isUserCustom && (
                            <button
                              type="button"
                              onClick={(e) => handleDeleteCustomPlaylist(playlist.id, e)}
                              className="text-[10px] text-rose-400 hover:text-rose-300 p-0.5 hover:underline"
                              title="Delete custom playlist"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tab 2: Queue Management */}
            {activeTab === "queue" && (
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <div className="flex items-center justify-between pb-1 text-xs text-slate-400">
                  <span>Playing from: <strong className="text-white">{activePlaylist.title}</strong></span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleToggleShuffle}
                      className="text-[11px] text-cyan-400 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Shuffle size={12} />
                      <span>{isShuffleActive ? "Shuffled" : "Shuffle Queue"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSmartFailover("Switched to next available study playlist")}
                      className="text-[11px] text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <RotateCcw size={12} />
                      <span>Next Playlist</span>
                    </button>
                  </div>
                </div>

                {queue.map((track, idx) => {
                  const isCurrent = idx === currentTrackIndex;

                  return (
                    <div
                      key={`${track.id}-${idx}`}
                      className={`flex items-center justify-between gap-3 rounded-2xl border p-3 transition ${
                        isCurrent
                          ? "border-emerald-500/50 bg-emerald-950/30 text-emerald-200"
                          : "border-slate-800 bg-slate-950/60 hover:bg-slate-900/80"
                      }`}
                    >
                      <div
                        onClick={() => {
                          setCurrentTrackIndex(idx);
                          loadAndPlayTrack(track, true);
                        }}
                        className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                      >
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold ${
                            isCurrent ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {idx + 1}
                        </span>

                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-bold truncate ${isCurrent ? "text-emerald-300" : "text-white"}`}>
                            {track.title}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {track.artist} · {track.genre}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isCurrent && isPlaying ? (
                          <span className="text-[10px] font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/20">
                            Playing 🎵
                          </span>
                        ) : null}

                        {queue.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveTrack(idx)}
                            className="text-slate-500 hover:text-rose-400 p-1.5 transition cursor-pointer"
                            title="Remove from queue"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tab 3: Add Custom Link / Playlist / List of links */}
            {activeTab === "custom" && (
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 space-y-2 text-xs text-slate-300">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-bold text-white">
                      <Sparkles size={15} className="text-cyan-400" />
                      <span>Paste YouTube &amp; YouTube Music Playlists or Link Lists</span>
                    </div>
                    {currentUser ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 shrink-0">
                        <Cloud size={10} /> Cloud Sync Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 border border-slate-700 px-2 py-0.5 text-[10px] font-medium text-slate-400 shrink-0">
                        <HardDrive size={10} /> Local Storage Only
                      </span>
                    )}
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    {currentUser
                      ? "Custom playlists are automatically saved to your cloud account so they follow you on any device."
                      : "Custom playlists are saved locally in your browser. Sign in anytime to sync them across your devices."}
                  </p>
                </div>

                <form onSubmit={handleAddCustomTrack} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      YouTube / YouTube Music URL(s) or Playlist *
                    </label>
                    <textarea
                      rows={3}
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      placeholder="Paste single link, full playlist (list=PL...), or multiple links (one per line)..."
                      required
                      className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none resize-none font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Playlist / Track Title (Optional)
                      </label>
                      <input
                        type="text"
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                        placeholder="e.g. My Study Mix"
                        className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Artist / Category (Optional)
                      </label>
                      <input
                        type="text"
                        value={customArtist}
                        onChange={(e) => setCustomArtist(e.target.value)}
                        placeholder="e.g. Favorite Chill OST"
                        className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isImporting}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3 text-xs font-bold text-slate-950 hover:brightness-110 disabled:opacity-60 transition cursor-pointer shadow-md"
                  >
                    {isImporting ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                        <span>Extracting &amp; Queuing Songs...</span>
                      </>
                    ) : (
                      <>
                        <Plus size={15} />
                        <span>Separate Songs &amp; Play Soundtrack</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
