export interface TrackItem {
  id: string; // YouTube Video ID or custom ID
  title: string;
  artist: string;
  genre: string;
  artworkUrl?: string;
  duration?: string;
  isCustom?: boolean;
}

export interface StudyPlaylist {
  id: string;
  title: string;
  tagline: string;
  genre: string;
  emoji: string;
  badgeColor: string;
  artworkUrl: string;
  tracks: TrackItem[];
  playlistId?: string; // YouTube Playlist ID (if playlist-backed)
  isUserCustom?: boolean;
}

export const CURATED_PLAYLISTS: StudyPlaylist[] = [
  {
    id: "casual-game-bgm",
    title: "Casual Game Cozy BGM",
    tagline: "Relaxing Animal Crossing, Stardew Valley & Nintendo cafe vibes",
    genre: "Casual Gaming",
    emoji: "🎮",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    artworkUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80",
    tracks: [
      {
        id: "D5pe4V7E0eU",
        title: "Animal Crossing Cozy Study & Relax Mix",
        artist: "Nintendo Chill",
        genre: "Casual Game",
        artworkUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80",
        duration: "BGM Mix",
      },
      {
        id: "5wRWniH6928",
        title: "Cozy Nintendo & Stardew Valley Study Beats",
        artist: "Cozy Game Audio",
        genre: "Casual Game",
        artworkUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80",
        duration: "BGM Mix",
      },
      {
        id: "_tV5LEBDs7w",
        title: "Cozy Animal Crossing Cafe & Roost Beats",
        artist: "Nintendo Chill",
        genre: "Casual Game",
        artworkUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80",
        duration: "BGM Mix",
      },
      {
        id: "lTRiuFIWV54",
        title: "Relaxing Nintendo Game Music for Studying",
        artist: "Retro Game Relax",
        genre: "Casual Game",
        artworkUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80",
        duration: "Study Mix",
      },
    ],
  },
  {
    id: "lofi-beats",
    title: "Lo-Fi Study Beats",
    tagline: "Chilled hip hop beats to study, relax & concentrate to",
    genre: "Lo-Fi Chillhop",
    emoji: "☕",
    badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
    artworkUrl: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=400&q=80",
    tracks: [
      {
        id: "jfKfPfyJRdk",
        title: "Lofi Girl — Beats to Relax / Study to",
        artist: "Lofi Girl Records",
        genre: "Lo-Fi",
        artworkUrl: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=400&q=80",
        duration: "Live Stream",
      },
      {
        id: "5yx6BWlEvq4",
        title: "Chillhop Radio — Jazzy & Lofi Beats",
        artist: "Chillhop Music",
        genre: "Lo-Fi Jazz",
        artworkUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=400&q=80",
        duration: "Live Stream",
      },
      {
        id: "rUxyKA_-grg",
        title: "Midnight Study Session (Coffee & Rain)",
        artist: "Chill Lofi Hub",
        genre: "Lo-Fi",
        artworkUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&q=80",
        duration: "Study Mix",
      },
      {
        id: "kJQP7kiw5Fk",
        title: "Lofi Hip Hop Radio — 24/7 Chill Beats",
        artist: "Lofi Beats Lab",
        genre: "Lo-Fi",
        artworkUrl: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=400&q=80",
        duration: "Live Stream",
      },
    ],
  },
  {
    id: "deep-piano",
    title: "Deep Focus Piano",
    tagline: "Peaceful neoclassical piano melodies for maximum recall",
    genre: "Neoclassical",
    emoji: "🎹",
    badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
    artworkUrl: "https://images.unsplash.com/photo-1520523839898-50712128e469?auto=format&fit=crop&w=400&q=80",
    tracks: [
      {
        id: "4xDzrJKXOOY",
        title: "Peaceful Piano for Studying & Memorization",
        artist: "Neoclassical Collective",
        genre: "Piano",
        artworkUrl: "https://images.unsplash.com/photo-1520523839898-50712128e469?auto=format&fit=crop&w=400&q=80",
        duration: "Focus Mix",
      },
      {
        id: "WPni755-Krg",
        title: "Ludovico Einaudi & Yann Tiersen Piano Study Set",
        artist: "Modern Classical",
        genre: "Piano",
        artworkUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80",
        duration: "Study Mix",
      },
      {
        id: "1prweT95ODs",
        title: "Relaxing Studio Ghibli Piano Collection",
        artist: "Ghibli Piano Lounge",
        genre: "Piano",
        artworkUrl: "https://images.unsplash.com/photo-1520523839898-50712128e469?auto=format&fit=crop&w=400&q=80",
        duration: "Piano Mix",
      },
    ],
  },
  {
    id: "synthwave-coding",
    title: "Focus Synthwave & Chillwave",
    tagline: "Retro futuristic ambient synthwave for coding & flow state",
    genre: "Synthwave",
    emoji: "🌌",
    badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/40",
    artworkUrl: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=400&q=80",
    tracks: [
      {
        id: "UedTcufyrHc",
        title: "Cyberpunk & Retro Chillwave Study Drive",
        artist: "Neon Beats",
        genre: "Chillwave",
        artworkUrl: "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=400&q=80",
        duration: "Flow Mix",
      },
      {
        id: "7NOSDKb0HlU",
        title: "Lofi Synth Sunset Cruise",
        artist: "Synth Dream",
        genre: "Synthwave",
        artworkUrl: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=400&q=80",
        duration: "Study Mix",
      },
    ],
  },
  {
    id: "rain-coffee-jazz",
    title: "Cozy Rain & Coffee Jazz",
    tagline: "Warm cafe jazz acoustics layered with gentle rainfall",
    genre: "Coffee Jazz",
    emoji: "🌧️",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    artworkUrl: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=400&q=80",
    tracks: [
      {
        id: "Dx5qFachd3A",
        title: "Coffee Shop Rain Jazz — Relaxing Cafe Ambience",
        artist: "Cafe Music BGM",
        genre: "Smooth Jazz",
        artworkUrl: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=400&q=80",
        duration: "Cafe Mix",
      },
      {
        id: "2gkxfwX1i8I",
        title: "Rainy Tokyo Cafe Jazz Study Ambience",
        artist: "Tokyo Cafe Beats",
        genre: "Smooth Jazz",
        artworkUrl: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=400&q=80",
        duration: "Cafe Mix",
      },
    ],
  },
  {
    id: "alpha-waves",
    title: "Alpha Waves & 40Hz Focus",
    tagline: "Binaural frequencies scientifically proven for active recall",
    genre: "Binaural Beats",
    emoji: "🧠",
    badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/40",
    artworkUrl: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=400&q=80",
    tracks: [
      {
        id: "WPni755-Krg",
        title: "40Hz Gamma & Alpha Brain Waves for Memory Consolidation",
        artist: "NeuroFocus Sound Lab",
        genre: "Brainwave",
        artworkUrl: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=400&q=80",
        duration: "Deep Focus",
      },
    ],
  },
];

/**
 * Universal YouTube & YouTube Music URL parser.
 * Extracts video ID or playlist ID from any standard link.
 */
export function parseYouTubeMedia(input: string): {
  videoId?: string;
  playlistId?: string;
  isPlaylist: boolean;
} {
  const trimmed = input.trim();
  if (!trimmed) return { isPlaylist: false };

  // 1. Direct 11-char Video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return { videoId: trimmed, isPlaylist: false };
  }

  // 2. Playlist Parameter (supports list=PL..., list=RD..., list=OLAK5uy...)
  const playlistMatch = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  if (playlistMatch && playlistMatch[1]) {
    const videoMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    return {
      playlistId: playlistMatch[1],
      videoId: videoMatch ? videoMatch[1] : undefined,
      isPlaylist: true,
    };
  }

  // 3. Standard YouTube or YouTube Music watch URL
  const videoMatch =
    trimmed.match(/(?:v=|\/embed\/|\/watch\?v=|\/shorts\/|youtu\.be\/|music\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/);
  if (videoMatch && videoMatch[1]) {
    return { videoId: videoMatch[1], isPlaylist: false };
  }

  return { isPlaylist: false };
}

/**
 * Parses multiple links or video IDs from a multiline or comma/space-separated text block.
 */
export function parseMultipleYouTubeUrls(rawText: string): {
  tracks: TrackItem[];
  playlists: { playlistId: string; videoId?: string }[];
} {
  const lines = rawText
    .split(/[\n,\r]+/)
    .map((l) => l.trim())
    .filter(Boolean);

  const tracks: TrackItem[] = [];
  const playlists: { playlistId: string; videoId?: string }[] = [];
  const seenIds = new Set<string>();

  lines.forEach((line) => {
    const parsed = parseYouTubeMedia(line);
    if (parsed.playlistId) {
      playlists.push({ playlistId: parsed.playlistId, videoId: parsed.videoId });
    }
    if (parsed.videoId && !seenIds.has(parsed.videoId)) {
      seenIds.add(parsed.videoId);
      tracks.push({
        id: parsed.videoId,
        title: `Custom Track ${tracks.length + 1} (${parsed.videoId})`,
        artist: "Imported Link",
        genre: "Custom URL",
        artworkUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80",
        duration: "Stream",
        isCustom: true,
      });
    }
  });

  return { tracks, playlists };
}

const STORAGE_MUSIC_SETTINGS = "rf_study_music_settings_v1";
const STORAGE_CUSTOM_PLAYLISTS = "rf_study_custom_playlists_v1";

export interface MusicPlayerSettings {
  volume: number;
  isMuted: boolean;
  activePlaylistId: string;
  autoPlayOnStudy: boolean;
  autoFailover: boolean;
}

export function loadStoredMusicSettings(): MusicPlayerSettings {
  if (typeof window === "undefined") {
    return {
      volume: 45,
      isMuted: false,
      activePlaylistId: "casual-game-bgm",
      autoPlayOnStudy: true,
      autoFailover: true,
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_MUSIC_SETTINGS);
    if (raw) {
      return { autoFailover: true, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.warn("Failed to load music settings from localStorage", e);
  }

  return {
    volume: 45,
    isMuted: false,
    activePlaylistId: "casual-game-bgm",
    autoPlayOnStudy: true,
    autoFailover: true,
  };
}

export function saveStoredMusicSettings(settings: MusicPlayerSettings) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_MUSIC_SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.warn("Failed to save music settings to localStorage", e);
  }
}

export function loadUserCustomPlaylists(): StudyPlaylist[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_CUSTOM_PLAYLISTS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn("Failed to load custom playlists", e);
  }
  return [];
}

export function saveUserCustomPlaylists(playlists: StudyPlaylist[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_CUSTOM_PLAYLISTS, JSON.stringify(playlists));
  } catch (e) {
    console.warn("Failed to save custom playlists", e);
  }
}
