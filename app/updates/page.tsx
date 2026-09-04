"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Code2,
  Cpu,
  ExternalLink,
  Flame,
  FolderKanban,
  GitBranch,
  GitCommit,
  GraduationCap,
  HelpCircle,
  History,
  Layers,
  Lock,
  PlusCircle,
  Rocket,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Tag,
  Users,
  Wand2,
  Zap,
} from "lucide-react";
import { APP_VERSION, APP_CODENAME, APP_RELEASE_DATE, VERSIONS_BY_TAG } from "@/lib/version";

interface ChangeItem {
  type: "feat" | "ai" | "improve" | "fix" | "sec";
  title: string;
  desc: string;
  tags?: string[];
}

interface VersionLog {
  version: string;
  codename: string;
  releaseDate: string;
  isLatest?: boolean;
  highlightSummary: string;
  category: "major" | "ai" | "collab" | "studio";
  badgeColor: string;
  changes: ChangeItem[];
  stats?: {
    componentsAdded?: number;
    testsPassed?: string;
    perfIncrease?: string;
  };
}

const UPDATE_LOGS: VersionLog[] = [
  {
    ...VERSIONS_BY_TAG["v2.1.0"],
    isLatest: true,
    category: "major",
    badgeColor: "from-cyan-400 via-teal-400 to-indigo-500",
    highlightSummary:
      "A delightful minor update bringing origin-anchored spring growth animations, real-time adaptive height growth for floating menus, directional swiping for music lounge tabs, and a sliding pill segmented navbar.",
    stats: {
      componentsAdded: 4,
      testsPassed: "100%",
      perfIncrease: "60fps GPU-accelerated spring animations",
    },
    changes: [
      {
        type: "feat",
        title: "Origin-Anchored Spring Growth & Blossoming Modals",
        desc: "Interactive Tour and What's New modals now dynamically capture trigger button click coordinates and spring-grow outward to the center of the viewport, reverse-shrinking back into the button when dismissed.",
        tags: ["Spring Animation", "Physics Motion", "Modal Growth"],
      },
      {
        type: "feat",
        title: "Real-Time Adaptive Height Growth & No Snapping",
        desc: "Study Music Lounge and Interactive Tour now monitor content height in real-time with ResizeObserver, smoothly animating card dimensions (cubic-bezier) when advancing steps, toggling tabs, or queuing songs.",
        tags: ["Smooth Height", "ResizeObserver", "No Snapping"],
      },
      {
        type: "feat",
        title: "Intelligent Directional Tab Swiping",
        desc: "Switching between Playlists, Queue, and Custom Paste Links in the Study Music Lounge dynamically slides tab content left or right depending on whether you navigate forward or backward.",
        tags: ["Directional Swipe", "Tab Navigation", "Study Music"],
      },
      {
        type: "feat",
        title: "Gliding Segmented Navbar Indicator Pill",
        desc: "Desktop navigation links (Decks, Review, Test, Create) now feature a cyan pill that physically glides across the navigation track with directional entering transitions.",
        tags: ["Gliding Pill", "Navbar", "Segmented Control"],
      },
      {
        type: "improve",
        title: "Interactive Micro-Animations Across Menus",
        desc: "Added 90° morphing rotation to the mobile 3-line hamburger menu, 180° chevron flipping on the Help button, and spring hover badges on all menu items.",
        tags: ["Micro-Animations", "Hamburger Morph", "Help Menu"],
      },
    ],
  },
  {
    ...VERSIONS_BY_TAG["v2.0.0"],
    isLatest: false,
    category: "major",
    badgeColor: "from-emerald-400 via-teal-400 to-cyan-500",
    highlightSummary:
      "A massive milestone release introducing the Study Music Lounge with YouTube Audio Engine, full playlist & multiline URL importing, Smart Auto-Failover, Facebook OAuth Sign-In, and Non-Resetting Persistent Quiz & Review Shuffle.",
    stats: {
      componentsAdded: 7,
      testsPassed: "100%",
      perfIncrease: "0ms tap latency & auto audio recovery",
    },
    changes: [
      {
        type: "feat",
        title: "Study Music Lounge with YouTube Audio Engine",
        desc: "Embedded ambient audio engine playing relaxing Casual Game Cozy BGM, Lo-Fi study beats, Peaceful Piano, Synthwave, and Alpha Waves in the background across all study pages with persistent audio playback.",
        tags: ["Study Music", "YouTube Audio", "BGM", "Casual Gaming"],
      },
      {
        type: "feat",
        title: "Full YouTube & YT Music Playlist Importer",
        desc: "Paste entire YouTube or YouTube Music playlist links (list=PL...) to automatically import them as custom study soundtracks, or paste multiline batch links to queue multiple tracks at once.",
        tags: ["Playlist Importer", "YouTube Music", "Batch Queue"],
      },
      {
        type: "feat",
        title: "Music Time Scrubber & Browser Autoplay Unlock",
        desc: "Interactive seek scrubber bar allows rewinding and skipping to any timestamp in a song. Includes browser interaction audio unlocking and an Autoplay toggle in settings.",
        tags: ["Time Scrubber", "Seek Bar", "Autoplay"],
      },
      {
        type: "ai",
        title: "Smart Auto-Failover & Self-Healing Playback",
        desc: "If any video encounters regional or copyright playback restrictions (Error 150/101), ReviewFlash automatically switches to the next available working study soundtrack seamlessly without interrupting your study session.",
        tags: ["Smart Failover", "Auto-Switching", "Error 150 Guard"],
      },
      {
        type: "feat",
        title: "Non-Resetting Persistent Quiz & Review Shuffle",
        desc: "Shuffling test questions or flashcard reviews no longer resets you to Question 1! You stay on the exact card you are viewing, with your shuffle mode saved to memory across refreshes.",
        tags: ["Smart Shuffle", "Memory Persistence", "No Drift"],
      },
      {
        type: "sec",
        title: "Continue with Facebook Authentication",
        desc: "Added 1-click instant Facebook OAuth sign-in with Firebase Auth alongside email/password, enabling instant study set sync and collaboration across devices.",
        tags: ["Facebook Login", "Firebase Auth", "OAuth"],
      },
      {
        type: "improve",
        title: "In-App WebView Touch & Safe-Area Optimization",
        desc: "Optimized 100dvh viewport scaling, safe-area bottom padding (env(safe-area-inset-bottom)), and zero-delay touch responses for Facebook and Messenger in-app browsers.",
        tags: ["Facebook WebView", "Messenger", "100dvh", "Safe Area"],
      },
    ],
  },
  {
    ...VERSIONS_BY_TAG["v1.4.0"],
    isLatest: false,
    category: "ai",
    badgeColor: "from-cyan-500 to-indigo-500",
    highlightSummary:
      "Introduced Dual-Engine Smart Auto-Detect with DITroy Cloud AI Context Synthesizer, dedicated Help & FAQ Knowledge Base, interactive Live Parser Playground, and dropdown-powered responsive navigation.",
    stats: {
      componentsAdded: 6,
      testsPassed: "100%",
      perfIncrease: "3x faster creation",
    },
    changes: [
      {
        type: "ai",
        title: "Dual-Engine Smart Auto-Detect System",
        desc: "Added instant toggle between Native Client-Side Regex Parser (instant sub-millisecond parsing for numbered lists, bold answers, delimiters) and DITroy Cloud AI Smart Detect (synthesizes new Q&A cards directly from raw paragraphs or extracts irregular messy notes).",
        tags: ["DITroy AI", "Regex", "Auto-Detect", "Context Synthesizer"],
      },
      {
        type: "feat",
        title: "Dedicated Help & FAQ Knowledge Base (/help)",
        desc: "Created a full Help Center with interactive insertion format cheat sheets, copyable study templates, searchable accordion FAQs, and science-backed active recall learning tips.",
        tags: ["Help Center", "FAQ", "Study Guide"],
      },
      {
        type: "feat",
        title: "Live Parser Playground Simulator",
        desc: "Added an in-browser interactive simulator on the Help page allowing learners to type or paste text and watch Review Flash detect questions and answers in real-time with instant visual feedback.",
        tags: ["Simulator", "Live Preview", "Interactive"],
      },
      {
        type: "improve",
        title: "Dropdown-Powered Modern Navbar",
        desc: "Refactored top navigation to eliminate overlapping buttons across all screen sizes. Introduced clean Help & Resources dropdown, compact User Profile card, and segmented core nav bar.",
        tags: ["UI/UX", "Responsive", "Navigation"],
      },
      {
        type: "ai",
        title: "Cloud DITroy AI Backend on Render",
        desc: "Integrated live FastAPI cloud backend on Render powered by Groq LLM (openai/gpt-oss-120b) with automatic cold-start handling and smart URL resolution.",
        tags: ["Cloud AI", "Groq", "Render", "FastAPI"],
      },
      {
        type: "improve",
        title: "1-Click Sample Insertion Templates",
        desc: "Added sample prompt chips in both Native and AI creator modes so learners can test multi-format exam questions, bold cloze, and raw note synthesis in 1 click.",
        tags: ["Templates", "Quick Start"],
      },
    ],
  },
  {
    ...VERSIONS_BY_TAG["v1.3.0"],
    category: "major",
    badgeColor: "from-indigo-500 to-purple-500",
    highlightSummary:
      "Embedded DITroy AI Study Tutor floating drawer with active recall coaching, mnemonic generation, Leitner 5-box spaced repetition algorithm, and guided app walkthrough tour.",
    stats: {
      componentsAdded: 5,
      testsPassed: "100%",
      perfIncrease: "+40% retention",
    },
    changes: [
      {
        type: "ai",
        title: "DITroy AI Study Tutor Drawer",
        desc: "Interactive conversational AI drawer attached to flashcard study sessions. Capable of explaining complex terms with analogies, creating memorable mnemonics, giving progressive hints without spoiling answers, and generating multiple-choice quizzes.",
        tags: ["AI Tutor", "Mnemonics", "Hints", "Quiz Generation"],
      },
      {
        type: "feat",
        title: "SM-2 / Leitner Spaced Repetition Scheduling",
        desc: "Engineered smart spaced repetition intervals (Box 1: 1 day, Box 2: 3 days, Box 3: 7 days, Box 4: 14 days, Box 5: 30 days) that dynamically prioritize difficult or forgotten cards.",
        tags: ["Spaced Repetition", "SM-2", "Algorithm"],
      },
      {
        type: "feat",
        title: "Interactive App Walkthrough Tour",
        desc: "Step-by-step interactive onboarding tour teaching new learners how to build decks, review with active recall, test retention, and invite study collaborators.",
        tags: ["Onboarding", "Tour Guide"],
      },
      {
        type: "improve",
        title: "Interactive Study Analytics & Heatmap",
        desc: "Added visual study streak counters, cards mastered tracker, and real-time accuracy scoring per study session.",
        tags: ["Analytics", "Progress Tracking"],
      },
    ],
  },
  {
    ...VERSIONS_BY_TAG["v1.2.0"],
    category: "collab",
    badgeColor: "from-emerald-500 to-cyan-500",
    highlightSummary:
      "Introduced real-time deck collaboration with granular role-based access control (Owner, Editor, Viewer), 6-character share codes, and Firebase Authentication.",
    stats: {
      componentsAdded: 4,
      testsPassed: "100%",
      perfIncrease: "Real-time sync",
    },
    changes: [
      {
        type: "sec",
        title: "Granular Role-Based Permissions (RBAC)",
        desc: "Deck creators can share decks with precise permissions: View Only (learners can review & test), Editor (study partners can add/edit cards), or transfer Ownership.",
        tags: ["RBAC", "Collaboration", "Security"],
      },
      {
        type: "feat",
        title: "6-Character Deck Share Codes & 1-Click Import",
        desc: "Generate short unique share codes (e.g. #CS101) allowing peers to instantly load and clone shared study decks into their own library.",
        tags: ["Share Codes", "Social Learning"],
      },
      {
        type: "feat",
        title: "Deck Forking & 'Save as My Own Copy'",
        desc: "Viewers of public or shared decks can fork a full independent copy to their own collection and customize it without altering the original.",
        tags: ["Forking", "Cloning"],
      },
      {
        type: "sec",
        title: "Firebase Auth & Anonymous Session Sync",
        desc: "Full user authentication supporting Google One-Tap Sign In, Email/Password, and persistent anonymous Guest IDs with cloud sync.",
        tags: ["Firebase Auth", "Google Sign-In"],
      },
    ],
  },
  {
    ...VERSIONS_BY_TAG["v1.1.0"],
    category: "studio",
    badgeColor: "from-amber-500 to-rose-500",
    highlightSummary:
      "Built the step-by-step Deck Studio with interactive flip card previews, rich text markdown formatting, multi-tag categorization, and 1–5 difficulty calibration.",
    stats: {
      componentsAdded: 4,
      testsPassed: "100%",
      perfIncrease: "60 FPS animations",
    },
    changes: [
      {
        type: "feat",
        title: "Step-by-Step Deck Creator Studio",
        desc: "Comprehensive 3-step creation flow: 1. Deck Details & Tags, 2. Smart Paste & Detection, 3. Review, Edit & Difficulty Calibration.",
        tags: ["Studio", "Card Editor"],
      },
      {
        type: "feat",
        title: "Markdown & Bold Cloze Deletion",
        desc: "Support for bold term cloze conversion (e.g. `• The **mitochondria** is...` auto-generates fill-in-the-blank question and answers).",
        tags: ["Markdown", "Cloze Deletion"],
      },
      {
        type: "feat",
        title: "1 to 5 Difficulty Calibration",
        desc: "Tag cards with difficulty ratings from Level 1 (Easy) to Level 5 (Mastery Challenge) for fine-grained study sessions.",
        tags: ["Difficulty", "Calibration"],
      },
      {
        type: "improve",
        title: "Firebase Firestore Cloud Sync & LocalStorage Fallback",
        desc: "Seamless dual-layer persistence: works offline with browser storage and automatically syncs to Cloud Firestore when connected.",
        tags: ["Firestore", "Offline Support"],
      },
    ],
  },
  {
    ...VERSIONS_BY_TAG["v1.0.0"],
    category: "major",
    badgeColor: "from-blue-500 to-cyan-500",
    highlightSummary:
      "Initial launch of Review Flash: smooth 3D flip card animations, self-assessment scoring, dynamic study sessions, and audio sound effects.",
    stats: {
      componentsAdded: 8,
      testsPassed: "100%",
      perfIncrease: "Initial Release",
    },
    changes: [
      {
        type: "feat",
        title: "Interactive 3D Flashcard Flip Engine",
        desc: "High-performance hardware-accelerated 3D card flipping with keyboard shortcuts (Space to flip, 1-4 for rating, Left/Right for navigation).",
        tags: ["Flashcards", "3D Flip", "Shortcuts"],
      },
      {
        type: "feat",
        title: "Practice & Exam Test Modes",
        desc: "Flexible study modes: Free Practice (browse at your own pace) and Exam Simulation (timed recall with end-of-test score report).",
        tags: ["Exam Mode", "Practice Mode"],
      },
      {
        type: "feat",
        title: "Audio Feedback & Confetti Celebrations",
        desc: "Subtle pleasant sound effects for correct/incorrect answers and full-screen confetti bursts when finishing study decks.",
        tags: ["Audio SFX", "Confetti", "Gamification"],
      },
    ],
  },
];

const UPCOMING_ROADMAP = [
  {
    target: "v1.5.0",
    title: "Voice & Speech Synthesis Flashcards",
    desc: "AI audio pronunciation of flashcard questions and answers in 20+ languages with hands-free voice answering.",
    status: "In Development 🛠️",
  },
  {
    target: "v1.6.0",
    title: "PDF & Document Auto-Importer",
    desc: "Upload lecture slides (.pdf, .pptx) or lecture notes to automatically generate a complete categorized flashcard deck in seconds.",
    status: "Planned 📋",
  },
  {
    target: "v1.7.0",
    title: "Multiplayer Live Study Battles",
    desc: "Real-time multiplayer flashcard quiz duels with classroom leaderboards and live study rooms.",
    status: "Planned 📋",
  },
];

export default function UpdatesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedVersions, setExpandedVersions] = useState<Record<string, boolean>>({
    "v1.4.0": true,
    "v1.3.0": true,
  });

  const toggleVersion = (version: string) => {
    setExpandedVersions((prev) => ({
      ...prev,
      [version]: !prev[version],
    }));
  };

  const filteredLogs = UPDATE_LOGS.filter((log) => {
    const matchesCategory =
      selectedCategory === "all" || log.category === selectedCategory;

    const query = searchQuery.toLowerCase().trim();
    if (!query) return matchesCategory;

    const matchesVersion = log.version.toLowerCase().includes(query);
    const matchesCodename = log.codename.toLowerCase().includes(query);
    const matchesSummary = log.highlightSummary.toLowerCase().includes(query);
    const matchesChanges = log.changes.some(
      (c) =>
        c.title.toLowerCase().includes(query) ||
        c.desc.toLowerCase().includes(query) ||
        c.tags?.some((t) => t.toLowerCase().includes(query))
    );

    return matchesCategory && (matchesVersion || matchesCodename || matchesSummary || matchesChanges);
  });

  const getTypeBadge = (type: ChangeItem["type"]) => {
    switch (type) {
      case "ai":
        return {
          label: "AI Feature 🤖",
          className: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
        };
      case "feat":
        return {
          label: "New Feature ✨",
          className: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
        };
      case "improve":
        return {
          label: "Improvement ⚡",
          className: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
        };
      case "sec":
        return {
          label: "Security 🔐",
          className: "bg-purple-500/20 text-purple-300 border-purple-500/40",
        };
      case "fix":
        return {
          label: "Bug Fix 🐞",
          className: "bg-rose-500/20 text-rose-300 border-rose-500/40",
        };
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6">
      <div className="mx-auto max-w-5xl space-y-12">
        {/* HEADER SECTION */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-semibold text-cyan-300">
            <Sparkles size={14} className="text-cyan-400 animate-pulse" />
            <span>Product Updates &amp; Changelog</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            What&apos;s New in{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
              ReviewFlash
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-sm sm:text-base text-slate-400">
            Explore our release history, new AI capabilities, speed enhancements, and features built to maximize your active recall retention.
          </p>

          {/* Quick Stats Pill Bar */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-1.5 text-xs">
              <Rocket size={14} className="text-cyan-400" />
              <span className="text-slate-400">Latest Release:</span>
              <span className="font-bold text-white">v1.4.0</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-1.5 text-xs">
              <Cpu size={14} className="text-indigo-400" />
              <span className="text-slate-400">AI Model:</span>
              <span className="font-bold text-white">DITroy (Groq 120B)</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-1.5 text-xs">
              <Layers size={14} className="text-emerald-400" />
              <span className="text-slate-400">Total Releases:</span>
              <span className="font-bold text-white">{UPDATE_LOGS.length} Versions</span>
            </div>
          </div>
        </div>

        {/* SEARCH & CATEGORY FILTER BAR */}
        <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search updates (e.g. AI Tutor, Auto-Detect, Permissions, Markdown)..."
                className="w-full rounded-xl border border-slate-800 bg-slate-950/90 pl-10 pr-4 py-2 text-xs text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-400 transition"
              />
            </div>

            {/* Quick Filter Chips */}
            <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
              {[
                { id: "all", label: "All Releases" },
                { id: "ai", label: "AI & Intelligence 🤖" },
                { id: "collab", label: "Collaboration 🤝" },
                { id: "studio", label: "Deck Studio 📝" },
                { id: "major", label: "Major Releases 🚀" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                    selectedCategory === tab.id
                      ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-bold"
                      : "border border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* VERSION HISTORY TIMELINE */}
        <div className="space-y-8 relative">
          {/* Vertical timeline line */}
          <div className="hidden sm:block absolute left-4 top-6 bottom-6 w-0.5 bg-gradient-to-b from-cyan-500 via-indigo-500 to-slate-800" />

          {filteredLogs.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center space-y-3">
              <History size={32} className="mx-auto text-slate-600" />
              <p className="text-sm text-slate-400">
                No update logs matching &quot;{searchQuery}&quot; found.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
                className="text-xs text-cyan-400 hover:underline cursor-pointer"
              >
                Clear search and filters
              </button>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isExpanded = expandedVersions[log.version] ?? true;

              return (
                <div
                  key={log.version}
                  className="relative sm:pl-10 space-y-4 animate-in fade-in duration-200"
                >
                  {/* Timeline dot icon */}
                  <div className="hidden sm:flex absolute left-1.5 top-5 h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full bg-slate-950 border-2 border-cyan-400 shadow-md shadow-cyan-500/30">
                    <div className="h-2 w-2 rounded-full bg-cyan-400" />
                  </div>

                  {/* Version Card */}
                  <div
                    className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                      log.isLatest
                        ? "border-cyan-500/40 bg-gradient-to-b from-slate-900/90 to-slate-950/90 shadow-xl shadow-cyan-500/5"
                        : "border-slate-800 bg-slate-900/50 hover:border-slate-700"
                    }`}
                  >
                    {/* Header */}
                    <div className="p-5 sm:p-6 space-y-3 border-b border-slate-800/80">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span
                            className={`rounded-xl bg-gradient-to-r ${log.badgeColor} px-3 py-1 text-xs font-black text-slate-950 shadow-sm`}
                          >
                            {log.version}
                          </span>

                          {log.isLatest && (
                            <span className="flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                              Latest Version
                            </span>
                          )}

                          <h2 className="text-base sm:text-xl font-bold text-white">
                            {log.codename}
                          </h2>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Calendar size={13} className="text-slate-500" />
                            <span>{log.releaseDate}</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => toggleVersion(log.version)}
                            className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs text-slate-400 hover:text-white hover:border-slate-700 transition cursor-pointer"
                          >
                            {isExpanded ? "Collapse" : "Expand"}
                          </button>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                        {log.highlightSummary}
                      </p>

                      {/* Performance / Stat pills */}
                      {log.stats && (
                        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                          {log.stats.perfIncrease && (
                            <span className="rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-2 py-0.5 font-medium">
                              ⚡ {log.stats.perfIncrease}
                            </span>
                          )}
                          {log.stats.testsPassed && (
                            <span className="rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 font-medium">
                              ✅ {log.stats.testsPassed} Tests Verified
                            </span>
                          )}
                          {log.stats.componentsAdded && (
                            <span className="rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 font-medium">
                              🧩 +{log.stats.componentsAdded} Components
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Change Items Breakdown */}
                    {isExpanded && (
                      <div className="p-5 sm:p-6 space-y-4 bg-slate-950/40 animate-in fade-in duration-150">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Key Enhancements &amp; Changes ({log.changes.length})
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                          {log.changes.map((item, idx) => {
                            const badge = getTypeBadge(item.type);

                            return (
                              <div
                                key={idx}
                                className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 space-y-2 hover:border-slate-700 transition"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${badge.className}`}
                                    >
                                      {badge.label}
                                    </span>
                                    <h3 className="text-xs sm:text-sm font-bold text-slate-100">
                                      {item.title}
                                    </h3>
                                  </div>
                                </div>

                                <p className="text-xs text-slate-400 leading-relaxed">
                                  {item.desc}
                                </p>

                                {item.tags && item.tags.length > 0 && (
                                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                    {item.tags.map((t, tidx) => (
                                      <span
                                        key={tidx}
                                        className="rounded-full bg-slate-800/80 px-2 py-0.5 text-[10px] font-mono text-slate-300"
                                      >
                                        #{t}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* UPCOMING ROADMAP PREVIEW */}
        <div className="rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/30 via-slate-900/60 to-slate-950 p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-indigo-500/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
                <Flame size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Upcoming Roadmap &amp; Future Vision
                </h3>
                <p className="text-xs text-indigo-200/80">
                  Sneak peek into upcoming features engineered for deeper learning retention.
                </p>
              </div>
            </div>

            <Link
              href="/create"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-indigo-400 transition cursor-pointer shadow-md shadow-indigo-500/20"
            >
              <PlusCircle size={14} />
              <span>Create New Deck</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {UPCOMING_ROADMAP.map((item, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-indigo-900/40 bg-slate-900/70 p-4 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-bold text-indigo-300 font-mono">
                    {item.target}
                  </span>
                  <span className="text-[10px] text-amber-300/90 font-medium">
                    {item.status}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-slate-100">
                  {item.title}
                </h4>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* BOTTOM QUICK NAVIGATION BAR */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800 text-xs text-slate-400">
          <div>
            ReviewFlash is continuously updated to deliver the most effective active recall learning experience.
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/help"
              className="flex items-center gap-1 hover:text-cyan-300 transition"
            >
              <HelpCircle size={14} />
              <span>Help &amp; FAQ Center</span>
            </Link>
            <Link
              href="/decks"
              className="flex items-center gap-1 hover:text-cyan-300 transition"
            >
              <FolderKanban size={14} />
              <span>My Study Decks</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
