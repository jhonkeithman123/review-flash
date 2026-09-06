"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  BrainCircuit,
  Cloud,
  Copy,
  Crown,
  Edit2,
  GitFork,
  Globe,
  Import,
  Layers,
  LayoutGrid,
  List,
  Lock,
  Plus,
  Search,
  Share2,
  Shield,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Deck } from "@/types/flashcard";
import {
  deleteDeck,
  fetchDecks,
  fetchPublicStarterDecks,
  fetchSharedDeck,
  forkDeck,
  getCurrentUserEmail,
  getCurrentUserId,
  getUserDeckRole,
  importDeck,
} from "@/lib/flashcardService";
import { ShareDeckModal } from "@/components/share-deck-modal";
import { useConfirm } from "@/components/confirm-prompt";

export default function DecksPage() {
  const router = useRouter();
  const { confirm } = useConfirm();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sharingDeck, setSharingDeck] = useState<Deck | null>(null);
  const [shareOrigin, setShareOrigin] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedMode = localStorage.getItem("rf_decks_view_mode") as "grid" | "list";
      if (savedMode === "grid" || savedMode === "list") {
        setViewMode(savedMode);
      }
    }
  }, []);

  const handleToggleViewMode = (mode: "grid" | "list") => {
    setViewMode(mode);
    try {
      localStorage.setItem("rf_decks_view_mode", mode);
    } catch {}
  };

  const handleOpenShareModal = (deck: Deck, e?: React.MouseEvent) => {
    setShareOrigin(getOriginFromEvent(e));
    setSharingDeck(deck);
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("practical-tut-action", {
          detail: { action: "open-share" },
        })
      );
    }
  };

  // Import Modal State & Origin-Anchored Spring Animation
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImportRendered, setIsImportRendered] = useState(false);
  const [isImportVisible, setIsImportVisible] = useState(false);
  const [importOrigin, setImportOrigin] = useState<{ x: number; y: number } | null>(null);
  const [importInput, setImportInput] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Firebase Public Starter Decks Modal & Origin-Anchored Spring Animation
  const [isPublicDecksModalOpen, setIsPublicDecksModalOpen] = useState(false);
  const [isPublicRendered, setIsPublicRendered] = useState(false);
  const [isPublicVisible, setIsPublicVisible] = useState(false);
  const [publicDecksOrigin, setPublicDecksOrigin] = useState<{ x: number; y: number } | null>(null);
  const [publicDecks, setPublicDecks] = useState<Deck[]>([]);
  const [publicDecksLoading, setPublicDecksLoading] = useState(false);

  const getOriginFromEvent = (e?: React.MouseEvent) => {
    if (!e) return null;
    if (e.clientX !== 0 || e.clientY !== 0) {
      return { x: e.clientX, y: e.clientY };
    }
    const rect = (e.currentTarget as HTMLElement)?.getBoundingClientRect?.();
    if (rect) {
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }
    return null;
  };

  // Smooth two-frame RAF spring animation hooks for Import modal
  useEffect(() => {
    if (isImportModalOpen) {
      setIsImportRendered(true);
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsImportVisible(true);
        });
      });
      return () => cancelAnimationFrame(raf);
    } else {
      setIsImportVisible(false);
      const timer = setTimeout(() => {
        setIsImportRendered(false);
      }, 340);
      return () => clearTimeout(timer);
    }
  }, [isImportModalOpen]);

  // Smooth two-frame RAF spring animation hooks for Public Decks modal
  useEffect(() => {
    if (isPublicDecksModalOpen) {
      setIsPublicRendered(true);
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsPublicVisible(true);
        });
      });
      return () => cancelAnimationFrame(raf);
    } else {
      setIsPublicVisible(false);
      const timer = setTimeout(() => {
        setIsPublicRendered(false);
      }, 340);
      return () => clearTimeout(timer);
    }
  }, [isPublicDecksModalOpen]);

  // Escape key handler to dismiss modals
  useEffect(() => {
    if (!isImportModalOpen && !isPublicDecksModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsImportModalOpen(false);
        setIsPublicDecksModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isImportModalOpen, isPublicDecksModalOpen]);

  // Calculate dynamic transform to spring-grow out of the activating button
  const getModalSpringStyle = (
    origin: { x: number; y: number } | null,
    isVisible: boolean
  ) => {
    if (typeof window === "undefined") return {};

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    const targetX = origin ? origin.x : centerX;
    const targetY = origin ? origin.y : centerY - 30;

    const deltaX = targetX - centerX;
    const deltaY = targetY - centerY;

    if (isVisible) {
      return {
        transform: "translate3d(0px, 0px, 0px) scale(1)",
        opacity: 1,
        transition:
          "transform 380ms cubic-bezier(0.34, 1.3, 0.64, 1), opacity 250ms ease-out",
      };
    } else {
      return {
        transform: `translate3d(${deltaX}px, ${deltaY}px, 0px) scale(0.04)`,
        opacity: 0,
        pointerEvents: "none" as const,
        transition:
          "transform 300ms cubic-bezier(0.4, 0, 0.2, 1), opacity 220ms ease-in",
      };
    }
  };

  const loadDecks = async () => {
    setLoading(true);
    const data = await fetchDecks();
    setDecks(data);
    setLoading(false);
  };

  useEffect(() => {
    loadDecks();
  }, []);

  const handleDelete = async (deckId: string, title: string) => {
    const isConfirmed = await confirm({
      title: "Delete Flashcard Deck?",
      message: (
        <span>
          Are you sure you want to permanently delete <strong className="text-white font-semibold">&ldquo;{title}&rdquo;</strong>? All associated cards and study progress will be removed.
        </span>
      ),
      confirmText: "Yes, Delete Deck",
      cancelText: "No, Keep Deck",
      variant: "danger",
    });

    if (isConfirmed) {
      await deleteDeck(deckId);
      setDecks((prev) => prev.filter((d) => d.id !== deckId));
      setStatusMessage(`Deck "${title}" removed.`);
    }
  };

  const handleForkDeck = async (deck: Deck) => {
    const forked = await forkDeck(deck, `${deck.title} (Fork)`);
    setDecks((prev) => [forked, ...prev.filter((d) => d.id !== forked.id)]);
    setStatusMessage(`Forked "${deck.title}" into your library with full Owner permissions!`);
  };

  const handleOpenImportModal = (e?: React.MouseEvent) => {
    setImportOrigin(getOriginFromEvent(e));
    setIsImportModalOpen(true);
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importInput.trim()) return;

    setImportLoading(true);
    setImportError(null);

    try {
      const query = importInput.trim();
      const shared = await fetchSharedDeck(query);
      if (!shared) {
        setImportError(
          "Could not locate deck with this share code or link in Firebase. Please check and try again."
        );
        setImportLoading(false);
        return;
      }

      const imported = await importDeck(shared);
      setDecks((prev) => [imported, ...prev]);
      setIsImportModalOpen(false);
      setImportInput("");
      setStatusMessage(`Successfully imported "${imported.title}" with ${imported.cards.length} cards!`);
    } catch (err: unknown) {
      console.error(err);
      setImportError("Import failed. Please check the code or token format.");
    } finally {
      setImportLoading(false);
    }
  };

  const handleOpenPublicDecks = async (e?: React.MouseEvent) => {
    setPublicDecksOrigin(getOriginFromEvent(e));
    setIsPublicDecksModalOpen(true);
    setPublicDecksLoading(true);
    const pub = await fetchPublicStarterDecks();
    setPublicDecks(pub);
    setPublicDecksLoading(false);
  };

  const handleImportPublicDeck = async (pDeck: Deck) => {
    const imported = await importDeck(pDeck);
    setDecks((prev) => [imported, ...prev]);
    setIsPublicDecksModalOpen(false);
    setStatusMessage(`Added "${pDeck.title}" from Firebase to your decks!`);
  };

  const filteredDecks = decks.filter(
    (deck) =>
      deck.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deck.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      deck.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalCards = decks.reduce((sum, d) => sum + d.cards.length, 0);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">
            <Layers size={14} className="text-cyan-400" />
            Deck Library
          </div>
          <h1 className="mt-1 text-3xl font-bold text-white sm:text-4xl">
            My Study Decks
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {decks.length} study sets &bull; {totalCards} total flashcards
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* 1. Firebase Starter Decks Button with Ambient Glow, Shimmer & Pulse Dot */}
          <button
            type="button"
            onClick={(e) => handleOpenPublicDecks(e)}
            className="group relative inline-flex items-center gap-2 rounded-full border border-indigo-500/40 bg-gradient-to-r from-indigo-500/15 via-indigo-600/10 to-cyan-500/15 px-4 py-2.5 text-xs font-semibold text-indigo-200 hover:border-indigo-400 hover:text-white hover:shadow-lg hover:shadow-indigo-500/25 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer overflow-hidden"
          >
            {/* Ambient Shimmer Sheen */}
            <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

            <Cloud
              size={15}
              className="text-indigo-400 group-hover:text-indigo-200 group-hover:scale-110 group-hover:-translate-y-0.5 transition-all duration-300 ease-out"
            />
            <span className="relative font-medium">Firebase Starter Decks</span>

            {/* Live Indicator Ping Dot */}
            <span className="flex h-2 w-2 relative ml-0.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
          </button>

          {/* 2. Import by Code Button with Hover Spring & Directional Icon Dive */}
          <button
            type="button"
            onClick={(e) => handleOpenImportModal(e)}
            className="group relative inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/90 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:border-cyan-400 hover:text-cyan-300 hover:shadow-lg hover:shadow-cyan-500/20 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer overflow-hidden"
          >
            {/* Subtle Cyan Shimmer Sheen */}
            <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-cyan-400/15 to-transparent pointer-events-none" />

            <Import
              size={15}
              className="text-cyan-400 group-hover:text-cyan-300 group-hover:scale-110 group-hover:translate-y-0.5 transition-all duration-300 ease-out"
            />
            <span className="relative font-medium">Import by Code</span>
          </button>

          {/* 3. New Study Set Button with Rotating Plus Icon */}
          <Link
            href="/create"
            className="group inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-teal-400 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-105 active:scale-95 transition-all duration-200"
          >
            <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300 ease-out" />
            <span>New Study Set</span>
          </Link>
        </div>
      </div>

      {/* Status banner */}
      {statusMessage && (
        <div className="flex items-center justify-between rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-200">
          <span>{statusMessage}</span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-xs opacity-70 hover:opacity-100 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Search Bar & View Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative w-full max-w-md">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search decks by title or tag..."
            className="w-full rounded-2xl border border-slate-800 bg-slate-900/80 py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-500"
          />
        </div>

        {/* View Mode Toggle: Grid Tiles vs Compact List */}
        <div className="flex items-center gap-1 rounded-2xl border border-slate-800 bg-slate-900/90 p-1 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => handleToggleViewMode("grid")}
            title="Grid Tile View"
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              viewMode === "grid"
                ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <LayoutGrid size={14} />
            <span>Grid</span>
          </button>
          <button
            type="button"
            onClick={() => handleToggleViewMode("list")}
            title="List Row View"
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              viewMode === "list"
                ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <List size={14} />
            <span>List</span>
          </button>
        </div>
      </div>

      {/* Decks Grid */}
      {loading ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-12 text-center text-slate-400">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
          <p className="text-sm">Loading your study sets…</p>
        </div>
      ) : filteredDecks.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-cyan-500/10 text-cyan-400">
            <Layers size={28} />
          </div>
          <h3 className="text-lg font-semibold text-white">No decks found</h3>
          <p className="mx-auto mt-1 max-w-sm text-xs text-slate-400">
            {searchQuery
              ? `No decks match "${searchQuery}". Try a different keyword.`
              : "Your deck library is currently clean. Create your first flashcard deck or import starter decks from Firebase!"}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/create"
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-teal-400 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-105 active:scale-95 transition-all duration-200"
            >
              <Plus size={15} className="group-hover:rotate-90 transition-transform duration-300 ease-out" />
              <span>Create Flashcard Set</span>
            </Link>
            <button
              type="button"
              onClick={(e) => handleOpenPublicDecks(e)}
              className="group inline-flex items-center gap-2 rounded-full border border-indigo-500/40 bg-gradient-to-r from-indigo-500/15 via-indigo-600/10 to-cyan-500/15 px-5 py-2.5 text-xs font-semibold text-indigo-300 hover:border-indigo-400 hover:text-white hover:shadow-lg hover:shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <Cloud size={15} className="text-indigo-400 group-hover:scale-110 group-hover:-translate-y-0.5 transition-all duration-300 ease-out" />
              <span>Load Firebase Starter Decks</span>
            </button>
          </div>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDecks.map((deck) => {
            const avgDiff = deck.cards.length
              ? (
                  deck.cards.reduce((acc, c) => acc + c.difficulty, 0) /
                  deck.cards.length
                ).toFixed(1)
              : "3.0";

            const role = getUserDeckRole(deck, getCurrentUserId(), getCurrentUserEmail());

            return (
              <div
                key={deck.id}
                className="group relative flex flex-col justify-between rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl transition hover:-translate-y-1 hover:border-cyan-500/50 hover:shadow-cyan-500/10 min-h-[260px]"
              >
                <div>
                  {/* Top Bar */}
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-xs font-semibold text-cyan-300">
                        {deck.cards.length} {deck.cards.length === 1 ? "card" : "cards"}
                      </span>

                      {/* Explicit Role Badge */}
                      {role === "owner" ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                          <Crown size={11} />
                          Owner
                        </span>
                      ) : role === "editor" ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold text-indigo-300">
                          <Shield size={11} />
                          Editor
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                          <Lock size={11} />
                          Read-Only
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <Link
                        href={`/create?deckId=${deck.id}&mode=edit`}
                        title={role === "viewer" ? "Fork & Customize Personal Copy" : "Edit Deck & Cards"}
                        className={`rounded-lg p-1.5 transition cursor-pointer ${
                          role === "viewer"
                            ? "text-amber-400 hover:bg-amber-500/10"
                            : "text-slate-400 hover:bg-slate-800 hover:text-cyan-300"
                        }`}
                      >
                        <Edit2 size={15} />
                      </Link>
                      <button
                        type="button"
                        data-tut="share-deck-btn"
                        onClick={(e) => handleOpenShareModal(deck, e)}
                        title="Share Deck & Access"
                        className="group/share rounded-lg p-1.5 text-slate-400 hover:bg-cyan-500/15 hover:text-cyan-300 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-cyan-500/20"
                      >
                        <Share2 size={15} className="group-hover/share:rotate-12 group-hover/share:scale-110 transition-transform duration-200" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleForkDeck(deck)}
                        title="Fork Deck (Create Personal Copy)"
                        className="group/fork rounded-lg p-1.5 text-slate-400 hover:bg-cyan-500/15 hover:text-cyan-300 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-cyan-500/20"
                      >
                        <GitFork size={15} className="group-hover/fork:rotate-12 transition-transform duration-200" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(deck.id, deck.title)}
                        title={role === "viewer" ? "Remove from Library" : "Delete Deck"}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition cursor-pointer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg font-bold text-white group-hover:text-cyan-200 transition line-clamp-1">
                    {deck.title}
                  </h3>
                  {deck.description ? (
                    <p className="mt-1 text-xs text-slate-400 line-clamp-2">
                      {deck.description}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs italic text-slate-500">
                      No description provided
                    </p>
                  )}

                  {/* Tags */}
                  {deck.tags && deck.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {deck.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md border border-slate-800 bg-slate-950 px-2 py-0.5 text-[10px] text-slate-400"
                        >
                          #{tag}
                        </span>
                      ))}
                      {deck.tags.length > 3 && (
                        <span className="rounded-md bg-slate-900 px-1.5 py-0.5 text-[10px] text-slate-500">
                          +{deck.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="mt-5 border-t border-slate-800/80 pt-4">
                  <div className="mb-3 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Avg. Difficulty: {avgDiff}/5</span>
                    <Link
                      href={`/create?deckId=${deck.id}`}
                      className="text-cyan-400 hover:underline"
                    >
                      + Add Cards
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href={`/review?deckId=${deck.id}`}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-cyan-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400 transition"
                    >
                      <BookOpen size={14} />
                      Review
                    </Link>
                    <Link
                      href={`/test?deckId=${deck.id}`}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-violet-500/40 bg-violet-500/10 px-3 py-2 text-xs font-semibold text-violet-300 hover:bg-violet-500/20 transition"
                    >
                      <BrainCircuit size={14} />
                      Quiz
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List Mode (Clean Horizontal Rows) */
        <div className="space-y-3">
          {filteredDecks.map((deck) => {
            const avgDiff = deck.cards.length
              ? (
                  deck.cards.reduce((acc, c) => acc + c.difficulty, 0) /
                  deck.cards.length
                ).toFixed(1)
              : "3.0";

            const role = getUserDeckRole(deck, getCurrentUserId(), getCurrentUserEmail());

            return (
              <div
                key={deck.id}
                className="group relative flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg hover:border-cyan-500/40 hover:bg-slate-900/95 transition-all duration-200"
              >
                {/* Left: Info & Meta */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 text-xs font-semibold text-cyan-300">
                      {deck.cards.length} {deck.cards.length === 1 ? "card" : "cards"}
                    </span>
                    {role === "owner" ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                        <Crown size={11} />
                        Owner
                      </span>
                    ) : role === "editor" ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold text-indigo-300">
                        <Shield size={11} />
                        Editor
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                        <Lock size={11} />
                        Read-Only
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400">
                      Avg. Diff: {avgDiff}/5
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-cyan-200 transition truncate">
                    {deck.title}
                  </h3>

                  {deck.description && (
                    <p className="text-xs text-slate-400 line-clamp-1">
                      {deck.description}
                    </p>
                  )}

                  {deck.tags && deck.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {deck.tags.slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md border border-slate-800 bg-slate-950 px-2 py-0.5 text-[10px] text-slate-400"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800/80 shrink-0">
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/create?deckId=${deck.id}&mode=edit`}
                      title={role === "viewer" ? "Fork & Customize Personal Copy" : "Edit Deck & Cards"}
                      className={`rounded-lg p-1.5 transition cursor-pointer ${
                        role === "viewer"
                          ? "text-amber-400 hover:bg-amber-500/10"
                          : "text-slate-400 hover:bg-slate-800 hover:text-cyan-300"
                      }`}
                    >
                      <Edit2 size={15} />
                    </Link>
                    <button
                      type="button"
                      data-tut="share-deck-btn"
                      onClick={(e) => handleOpenShareModal(deck, e)}
                      title="Share Deck & Access"
                      className="group/share rounded-lg p-1.5 text-slate-400 hover:bg-cyan-500/15 hover:text-cyan-300 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-cyan-500/20"
                    >
                      <Share2 size={15} className="group-hover/share:rotate-12 group-hover/share:scale-110 transition-transform duration-200" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleForkDeck(deck)}
                      title="Fork Deck (Create Personal Copy)"
                      className="group/fork rounded-lg p-1.5 text-slate-400 hover:bg-cyan-500/15 hover:text-cyan-300 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-cyan-500/20"
                    >
                      <GitFork size={15} className="group-hover/fork:rotate-12 transition-transform duration-200" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(deck.id, deck.title)}
                      title={role === "viewer" ? "Remove from Library" : "Delete Deck"}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/review?deckId=${deck.id}`}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-cyan-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950 hover:bg-cyan-400 transition"
                    >
                      <BookOpen size={13} />
                      <span>Review</span>
                    </Link>
                    <Link
                      href={`/test?deckId=${deck.id}`}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-violet-500/40 bg-violet-500/10 px-3.5 py-1.5 text-xs font-semibold text-violet-300 hover:bg-violet-500/20 transition"
                    >
                      <BrainCircuit size={13} />
                      <span>Quiz</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Share Modal Dialog with Origin-Anchored Spring Growth Animation */}
      {sharingDeck && (
        <ShareDeckModal
          deck={sharingDeck}
          isOpen={Boolean(sharingDeck)}
          origin={shareOrigin}
          onClose={() => {
            setSharingDeck(null);
            setShareOrigin(null);
          }}
          onDeckUpdated={(updated) => {
            setDecks((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
          }}
        />
      )}

      {/* Import Modal Dialog with Origin-Anchored Spring Growth Animation */}
      {isImportRendered && (
        <div
          onClick={() => setIsImportModalOpen(false)}
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ease-out ${
            isImportVisible
              ? "bg-slate-950/80 backdrop-blur-md opacity-100 pointer-events-auto"
              : "bg-slate-950/0 backdrop-blur-none opacity-0 pointer-events-none"
          }`}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={getModalSpringStyle(importOrigin, isImportVisible)}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-cyan-500/40 bg-slate-900/95 shadow-2xl shadow-cyan-500/10 origin-center"
          >
            <div className="p-6">
              <div className="flex items-center justify-between pb-4">
                <div className="flex items-center gap-2.5 text-cyan-300">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-inner">
                    <Import size={18} className="animate-bounce" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Import Study Deck</h3>
                    <p className="text-[11px] text-slate-400">Add shared cards directly to your library</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleImportSubmit} className="space-y-4 pt-1">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Enter a 6-character Deck Code (e.g.{" "}
                  <code className="rounded bg-cyan-500/10 px-1.5 py-0.5 font-mono text-cyan-300 border border-cyan-500/20">
                    WEB-DEV-01
                  </code>{" "}
                  or{" "}
                  <code className="rounded bg-cyan-500/10 px-1.5 py-0.5 font-mono text-cyan-300 border border-cyan-500/20">
                    RF-ABCD12
                  </code>
                  ) or paste the full share link:
                </p>

                <div className="relative">
                  <input
                    type="text"
                    value={importInput}
                    onChange={(e) => setImportInput(e.target.value)}
                    placeholder="Paste Code (RF-...) or Share URL"
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 p-3.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition duration-200"
                    autoFocus
                  />
                </div>

                {importError && (
                  <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-2.5 text-xs text-rose-300 animate-in fade-in duration-200">
                    {importError}
                  </div>
                )}

                <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => setIsImportModalOpen(false)}
                    className="rounded-full border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:scale-105 active:scale-95 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={importLoading || !importInput.trim()}
                    className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500 px-5 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-500/25 hover:bg-cyan-400 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition cursor-pointer"
                  >
                    {importLoading ? (
                      <>
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                        <span>Fetching Deck...</span>
                      </>
                    ) : (
                      <>
                        <Import size={14} />
                        <span>Import Deck</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Firebase Starter Decks Modal with Origin-Anchored Spring Growth Animation */}
      {isPublicRendered && (
        <div
          onClick={() => setIsPublicDecksModalOpen(false)}
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ease-out ${
            isPublicVisible
              ? "bg-slate-950/80 backdrop-blur-md opacity-100 pointer-events-auto"
              : "bg-slate-950/0 backdrop-blur-none opacity-0 pointer-events-none"
          }`}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={getModalSpringStyle(publicDecksOrigin, isPublicVisible)}
            className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-indigo-500/40 bg-slate-900/95 shadow-2xl shadow-indigo-500/10 origin-center flex flex-col max-h-[85vh]"
          >
            <div className="p-6 flex flex-col flex-1 overflow-hidden">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5 text-indigo-400">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 shadow-inner">
                    <Cloud size={18} className="animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Firebase Public Starter Decks</h3>
                    <p className="text-[11px] text-slate-400">Curated cloud starter sets ready to study</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPublicDecksModalOpen(false)}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="mt-4 space-y-3 overflow-y-auto pr-1 flex-1">
                {publicDecksLoading ? (
                  <div className="py-12 text-center text-slate-400">
                    <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
                    <p className="text-xs">Loading public decks from Firebase Firestore…</p>
                  </div>
                ) : publicDecks.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    <p>No public starter decks found in Firebase Firestore.</p>
                    <p className="mt-1.5 text-slate-500">
                      Run <code className="text-cyan-300 font-mono bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">bun run seed:firebase</code> to populate.
                    </p>
                  </div>
                ) : (
                  publicDecks.map((pDeck) => (
                    <div
                      key={pDeck.id}
                      className="group rounded-2xl border border-slate-800 bg-slate-950/70 p-4 flex items-center justify-between gap-3 hover:border-indigo-500/40 hover:bg-slate-950/90 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-200"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <h4 className="font-semibold text-slate-100 text-sm group-hover:text-indigo-200 transition">
                          {pDeck.title}
                        </h4>
                        <p className="text-xs text-slate-400 line-clamp-1">{pDeck.description}</p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                          <span className="rounded bg-slate-800/60 px-1.5 py-0.5 font-medium text-slate-300">
                            {pDeck.cards?.length || 0} cards
                          </span>
                          {pDeck.shareCode && (
                            <span className="font-mono text-cyan-400 font-medium">
                              Code: {pDeck.shareCode}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleImportPublicDeck(pDeck)}
                        className="shrink-0 inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:scale-105 active:scale-95 shadow-sm shadow-cyan-500/20 transition cursor-pointer"
                      >
                        <Plus size={14} />
                        <span>Add to Library</span>
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-5 flex justify-end border-t border-slate-800 pt-3">
                <button
                  type="button"
                  onClick={() => setIsPublicDecksModalOpen(false)}
                  className="rounded-full border border-slate-700 px-4 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:scale-105 active:scale-95 transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
