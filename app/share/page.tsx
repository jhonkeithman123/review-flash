"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  BrainCircuit,
  Check,
  FolderDown,
  Globe,
  Share2,
  Sparkles,
  User,
} from "lucide-react";
import { Deck } from "@/types/flashcard";
import { fetchSharedDeck, importDeck } from "@/lib/flashcardService";
import { FlashcardCard } from "@/components/flashcard-card";

function ShareContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const codeParam = searchParams.get("code") || "";
  const tokenParam = searchParams.get("token") || "";

  const [inputCode, setInputCode] = useState(codeParam);
  const [deck, setDeck] = useState<Deck | null>(null);
  const [loading, setLoading] = useState(Boolean(codeParam || tokenParam));
  const [previewCardIndex, setPreviewCardIndex] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [importedSuccess, setImportedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadSharedDeck = async (queryCode: string, queryToken?: string) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const target = queryToken || queryCode;
      const result = await fetchSharedDeck(target);
      if (result) {
        setDeck(result);
        setPreviewCardIndex(0);
      } else {
        setErrorMessage("Could not find a shared deck for this code or link. Please verify and try again.");
      }
    } catch (e: unknown) {
      console.error(e);
      setErrorMessage("An error occurred while retrieving the shared deck.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tokenParam || codeParam) {
      loadSharedDeck(codeParam, tokenParam);
    }
  }, [codeParam, tokenParam]);

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    loadSharedDeck(inputCode.trim());
  };

  const handleImportToLibrary = async () => {
    if (!deck) return;
    setIsImporting(true);
    try {
      await importDeck(deck);
      setImportedSuccess(true);
      setTimeout(() => {
        router.push("/decks");
      }, 1200);
    } catch (e) {
      console.error(e);
      setErrorMessage("Failed to save to your decks library.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-16">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/decks"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-cyan-300 transition"
        >
          &larr; Back to Deck Library
        </Link>
        <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
          <Globe size={13} />
          Shared Deck Hub
        </span>
      </div>

      {/* Manual Code Input Search Bar */}
      {!deck && !loading && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-cyan-500/10 text-cyan-400">
            <Share2 size={28} />
          </div>
          <h1 className="text-2xl font-bold text-white">Find a Shared Study Deck</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
            Enter a 6-character Deck Code (e.g. <span className="text-cyan-300 font-mono">RF-WEB01</span>) or paste the share link from a friend or classmate.
          </p>

          <form onSubmit={handleManualSearch} className="mx-auto mt-6 flex max-w-md gap-2">
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder="Enter Deck Code (RF-...) or Link"
              className="flex-1 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              className="rounded-2xl bg-cyan-500 px-6 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-400 transition cursor-pointer"
            >
              Search
            </button>
          </form>

          {errorMessage && (
            <p className="mt-4 text-xs text-rose-400">{errorMessage}</p>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-12 text-center text-slate-400">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
          <p className="text-sm">Fetching shared study deck…</p>
        </div>
      )}

      {/* Deck Preview & Import Box */}
      {deck && !loading && (
        <div className="space-y-8">
          {/* Deck Header Card */}
          <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-linear-to-br from-slate-900 via-slate-950 to-slate-900 p-6 sm:p-8 shadow-2xl">
            <div className="absolute top-0 right-0 -mt-8 -mr-8 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-300">
                  <Sparkles size={14} />
                  Shared Study Deck
                </div>
                <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
                  {deck.title}
                </h1>
                {deck.description && (
                  <p className="mt-2 text-sm text-slate-300 max-w-xl">
                    {deck.description}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  {deck.authorName && (
                    <span className="flex items-center gap-1">
                      <User size={13} className="text-slate-400" />
                      Shared by <strong className="text-slate-200">{deck.authorName}</strong>
                    </span>
                  )}
                  <span>&bull;</span>
                  <span>{deck.cards.length} Flashcards</span>
                  {deck.shareCode && (
                    <>
                      <span>&bull;</span>
                      <span className="font-mono text-cyan-400 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                        {deck.shareCode}
                      </span>
                    </>
                  )}
                  <span>&bull;</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                    {deck.accessControl?.defaultRole === "editor"
                      ? "✏️ Collaborative Edit"
                      : "🔒 Read-Only Access"}
                  </span>
                  {deck.shuffleQuestions && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-300 bg-violet-500/10 px-2 py-0.5 rounded-md border border-violet-500/20">
                      🔀 Auto-Shuffle
                    </span>
                  )}
                </div>

                {deck.tags && deck.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {deck.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs text-slate-300"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Import Action Buttons */}
              <div className="flex flex-col gap-2.5 shrink-0 sm:w-56">
                <button
                  type="button"
                  disabled={isImporting || importedSuccess}
                  onClick={handleImportToLibrary}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/20 hover:bg-cyan-400 transition disabled:opacity-75 cursor-pointer"
                >
                  {importedSuccess ? (
                    <>
                      <Check size={18} className="text-slate-950" />
                      <span>Added to Library!</span>
                    </>
                  ) : isImporting ? (
                    "Importing..."
                  ) : (
                    <>
                      <FolderDown size={18} />
                      <span>Import to My Decks</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={isImporting || importedSuccess}
                  onClick={async () => {
                    if (!deck) return;
                    setIsImporting(true);
                    try {
                      const imported = await importDeck(deck);
                      router.push(`/create?deckId=${imported.id}&mode=edit`);
                    } catch (e) {
                      console.error(e);
                      setIsImporting(false);
                    }
                  }}
                  className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-indigo-500/40 bg-indigo-500/10 px-4 py-2.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition cursor-pointer"
                >
                  <Sparkles size={14} />
                  <span>Clone &amp; Edit in Studio</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href={`/review?deckId=${deck.id}`}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-cyan-500 transition"
                  >
                    <BookOpen size={14} />
                    Study Now
                  </Link>
                  <Link
                    href={`/test?deckId=${deck.id}`}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-violet-500 transition"
                  >
                    <BrainCircuit size={14} />
                    Quiz Test
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Card Preview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                Card Preview ({deck.cards.length})
              </h2>
              {deck.cards.length > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewCardIndex((prev) =>
                        prev > 0 ? prev - 1 : deck.cards.length - 1
                      )
                    }
                    className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-300 hover:bg-slate-800 cursor-pointer"
                  >
                    &larr; Prev
                  </button>
                  <span className="text-xs text-slate-400">
                    {previewCardIndex + 1} of {deck.cards.length}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewCardIndex((prev) =>
                        (prev + 1) % deck.cards.length
                      )
                    }
                    className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-300 hover:bg-slate-800 cursor-pointer"
                  >
                    Next &rarr;
                  </button>
                </div>
              )}
            </div>

            {deck.cards[previewCardIndex] ? (
              <div className="flex justify-center py-4">
                <FlashcardCard card={deck.cards[previewCardIndex]} />
              </div>
            ) : (
              <p className="text-sm text-slate-400">This deck is currently empty.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SharePage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-12 text-center text-slate-400">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
          <p className="text-sm">Loading share hub…</p>
        </div>
      }
    >
      <ShareContent />
    </Suspense>
  );
}
