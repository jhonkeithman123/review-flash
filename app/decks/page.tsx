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
  Globe,
  Import,
  Layers,
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
  getCurrentUserEmail,
  getCurrentUserId,
  getUserDeckRole,
  importDeck,
} from "@/lib/flashcardService";
import { ShareDeckModal } from "@/components/share-deck-modal";

export default function DecksPage() {
  const router = useRouter();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sharingDeck, setSharingDeck] = useState<Deck | null>(null);

  // Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importInput, setImportInput] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Firebase Public Starter Decks Modal
  const [isPublicDecksModalOpen, setIsPublicDecksModalOpen] = useState(false);
  const [publicDecks, setPublicDecks] = useState<Deck[]>([]);
  const [publicDecksLoading, setPublicDecksLoading] = useState(false);

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
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      await deleteDeck(deckId);
      setDecks((prev) => prev.filter((d) => d.id !== deckId));
      setStatusMessage(`Deck "${title}" removed.`);
    }
  };

  const handleDuplicate = async (deck: Deck) => {
    const duplicated = await importDeck(deck, `${deck.title} (Copy)`);
    setDecks((prev) => [duplicated, ...prev]);
    setStatusMessage(`Duplicated "${deck.title}".`);
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

  const handleOpenPublicDecks = async () => {
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
          <button
            type="button"
            onClick={handleOpenPublicDecks}
            className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/40 bg-indigo-500/10 px-4 py-2.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition cursor-pointer"
          >
            <Cloud size={15} />
            Firebase Starter Decks
          </button>

          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:border-cyan-500 hover:text-cyan-300 transition cursor-pointer"
          >
            <Import size={15} />
            Import by Code
          </button>

          <Link
            href="/create"
            className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-500/20 hover:bg-cyan-400 transition"
          >
            <Plus size={16} />
            New Study Set
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

      {/* Search Bar */}
      <div className="relative max-w-md">
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
              className="inline-flex items-center gap-2 rounded-full bg-cyan-500 px-5 py-2.5 text-xs font-semibold text-slate-950 hover:bg-cyan-400 transition"
            >
              <Plus size={15} />
              Create Flashcard Set
            </Link>
            <button
              type="button"
              onClick={handleOpenPublicDecks}
              className="inline-flex items-center gap-2 rounded-full border border-indigo-500/40 bg-indigo-500/10 px-5 py-2.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition cursor-pointer"
            >
              <Cloud size={15} />
              Load Firebase Starter Decks
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
                className="group relative flex flex-col justify-between rounded-3xl border border-slate-800 bg-linear-to-b from-slate-900/90 to-slate-950/90 p-5 shadow-xl transition hover:-translate-y-1 hover:border-cyan-500/50 hover:shadow-cyan-500/10"
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
                        onClick={() => setSharingDeck(deck)}
                        title="Share Deck"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-cyan-300 transition cursor-pointer"
                      >
                        <Share2 size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDuplicate(deck)}
                        title="Duplicate Deck"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition cursor-pointer"
                      >
                        <Copy size={15} />
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
      )}

      {/* Share Modal Dialog */}
      {sharingDeck && (
        <ShareDeckModal
          deck={sharingDeck}
          isOpen={Boolean(sharingDeck)}
          onClose={() => setSharingDeck(null)}
        />
      )}

      {/* Import Modal Dialog */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center justify-between pb-4">
                <div className="flex items-center gap-2 text-cyan-300">
                  <Import size={20} />
                  <h3 className="text-lg font-bold text-white">Import Study Deck</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleImportSubmit} className="space-y-4">
                <p className="text-xs text-slate-400">
                  Enter a 6-character Deck Code (e.g. <code className="text-cyan-300">WEB-DEV-01</code> or <code className="text-cyan-300">RF-ABCD12</code>) or paste the full share link:
                </p>

                <input
                  type="text"
                  value={importInput}
                  onChange={(e) => setImportInput(e.target.value)}
                  placeholder="Paste Code (RF-...) or Share URL"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 p-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-500"
                />

                {importError && (
                  <p className="text-xs text-rose-400">{importError}</p>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsImportModalOpen(false)}
                    className="rounded-full border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={importLoading || !importInput.trim()}
                    className="rounded-full bg-cyan-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400 disabled:opacity-50 cursor-pointer"
                  >
                    {importLoading ? "Fetching Deck..." : "Import Deck"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Firebase Starter Decks Modal */}
      {isPublicDecksModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2 text-indigo-400">
                  <Cloud size={20} />
                  <h3 className="text-lg font-bold text-white">Firebase Public Starter Decks</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPublicDecksModalOpen(false)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="mt-4 space-y-3 max-h-96 overflow-y-auto pr-1">
                {publicDecksLoading ? (
                  <div className="py-8 text-center text-slate-400">
                    <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
                    <p className="text-xs">Loading public decks from Firebase Firestore…</p>
                  </div>
                ) : publicDecks.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 text-xs">
                    <p>No public starter decks found in Firebase Firestore.</p>
                    <p className="mt-1 text-slate-500">Run <code className="text-cyan-300 font-mono">bun run seed:firebase</code> to populate.</p>
                  </div>
                ) : (
                  publicDecks.map((pDeck) => (
                    <div
                      key={pDeck.id}
                      className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 flex items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <h4 className="font-semibold text-slate-100 text-sm">{pDeck.title}</h4>
                        <p className="text-xs text-slate-400 line-clamp-1">{pDeck.description}</p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                          <span>{pDeck.cards?.length || 0} cards</span>
                          {pDeck.shareCode && (
                            <span className="font-mono text-cyan-400">Code: {pDeck.shareCode}</span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleImportPublicDeck(pDeck)}
                        className="shrink-0 inline-flex items-center gap-1 rounded-xl bg-cyan-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition cursor-pointer"
                      >
                        <Plus size={14} />
                        Add to Library
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-5 flex justify-end border-t border-slate-800 pt-3">
                <button
                  type="button"
                  onClick={() => setIsPublicDecksModalOpen(false)}
                  className="rounded-full border border-slate-700 px-4 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 cursor-pointer"
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
