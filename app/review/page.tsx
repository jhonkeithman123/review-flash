"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  Plus,
  RotateCcw,
  Share2,
  Shuffle,
  Sparkles,
} from "lucide-react";
import { FlashcardCard } from "@/components/flashcard-card";
import { ProgressStats } from "@/components/progress-stats";
import { DeckSelector } from "@/components/deck-selector";
import { ShareDeckModal } from "@/components/share-deck-modal";
import {
  fetchDecks,
  fetchFlashcards,
  fetchUserStats,
  recordReviewResult,
  shuffleArray,
} from "@/lib/flashcardService";
import { Deck, Flashcard, UserStats } from "@/types/flashcard";

const initialStats: UserStats = {
  reviewed: 0,
  correct: 0,
  accuracy: 100,
  totalTests: 0,
  streakDays: 1,
};

function ReviewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialDeckParam = searchParams.get("deckId") || "all";

  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string>(initialDeckParam);
  const [allCards, setAllCards] = useState<Flashcard[]>([]);
  const [activeCards, setActiveCards] = useState<Flashcard[]>([]);
  const [isShuffleActive, setIsShuffleActive] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stats, setStats] = useState<UserStats>(initialStats);
  const [loading, setLoading] = useState(true);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [submittingAction, setSubmittingAction] = useState<"mastered" | "learning" | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [deckList, flashcards, userStats] = await Promise.all([
      fetchDecks(),
      fetchFlashcards(),
      fetchUserStats(),
    ]);
    setDecks(deckList);
    setAllCards(flashcards);
    setStats(userStats);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Sync state if url param changes
  useEffect(() => {
    const p = searchParams.get("deckId");
    if (p) setSelectedDeckId(p);
  }, [searchParams]);

  const activeDeck = decks.find((d) => d.id === selectedDeckId);

  // Compute active study cards & shuffle status
  useEffect(() => {
    const baseCards = selectedDeckId === "all"
      ? allCards
      : activeDeck ? activeDeck.cards : allCards;

    const shouldShuffle = activeDeck?.shuffleQuestions ?? isShuffleActive;
    setIsShuffleActive(shouldShuffle);

    if (shouldShuffle) {
      setActiveCards(shuffleArray(baseCards));
    } else {
      setActiveCards(baseCards);
    }
    setCurrentIndex(0);
  }, [selectedDeckId, activeDeck, allCards]);

  const handleToggleShuffle = () => {
    const nextShuffle = !isShuffleActive;
    setIsShuffleActive(nextShuffle);
    if (nextShuffle) {
      setActiveCards(shuffleArray(activeCards));
    } else {
      const baseCards = selectedDeckId === "all"
        ? allCards
        : activeDeck ? activeDeck.cards : allCards;
      setActiveCards(baseCards);
    }
    setCurrentIndex(0);
  };

  const handleReshuffleSession = () => {
    setActiveCards(shuffleArray(activeCards));
    setCurrentIndex(0);
  };

  const handleSelectDeck = (deckId: string) => {
    setSelectedDeckId(deckId);
    setCurrentIndex(0);
    if (deckId === "all") {
      router.push("/review");
    } else {
      router.push(`/review?deckId=${deckId}`);
    }
  };

  const currentCard = activeCards[currentIndex];

  const handleReview = async (remembered: boolean) => {
    if (!currentCard || submittingAction !== null) return;
    setSubmittingAction(remembered ? "mastered" : "learning");

    try {
      await recordReviewResult(currentCard.id, remembered);

      // Update local card difficulty state
      setActiveCards((prev) =>
        prev.map((card) =>
          card.id === currentCard.id
            ? {
                ...card,
                difficulty: remembered
                  ? Math.max(1, card.difficulty - 1)
                  : Math.min(5, card.difficulty + 1),
              }
            : card,
        ),
      );

      setStats((prev) => {
        const reviewed = prev.reviewed + 1;
        const correct = prev.correct + (remembered ? 1 : 0);
        return {
          ...prev,
          reviewed,
          correct,
          accuracy: reviewed ? Math.round((correct / reviewed) * 100) : 100,
        };
      });

      // Brief smooth transition feedback so user sees the success state before moving to next card
      await new Promise((resolve) => setTimeout(resolve, 200));

      setCurrentIndex((prev) => {
        if (activeCards.length <= 1) return 0;
        return (prev + 1) % activeCards.length;
      });
    } catch (e) {
      console.error("Failed to record review result", e);
    } finally {
      setSubmittingAction(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-12 text-center text-slate-300">
        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
        <p className="text-sm">Loading review deck…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header & Deck Selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">
            Active Recall Mode
          </p>
          <h1 className="mt-1 text-3xl font-bold text-white sm:text-4xl">
            {selectedDeckId === "all" ? "Review All Flashcards" : activeDeck?.title || "Review Study Deck"}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <DeckSelector
            decks={decks}
            selectedDeckId={selectedDeckId}
            onSelectDeck={handleSelectDeck}
            totalCardsCount={allCards.length}
          />

          {/* Shuffle Questions Toggle Button */}
          <button
            type="button"
            onClick={handleToggleShuffle}
            title={isShuffleActive ? "Questions are shuffled each take" : "Click to enable shuffle"}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
              isShuffleActive
                ? "border border-cyan-400 bg-cyan-500/20 text-cyan-300 shadow-sm shadow-cyan-500/20"
                : "border border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-200"
            }`}
          >
            <Shuffle size={14} className={isShuffleActive ? "text-cyan-300 animate-pulse" : ""} />
            <span>{isShuffleActive ? "Shuffled" : "Shuffle Off"}</span>
          </button>

          {isShuffleActive && activeCards.length > 1 && (
            <button
              type="button"
              onClick={handleReshuffleSession}
              title="Reshuffle current take"
              className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>Reshuffle Take</span>
            </button>
          )}

          {activeDeck && (
            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3.5 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition cursor-pointer"
            >
              <Share2 size={14} />
              Share Deck
            </button>
          )}
        </div>
      </div>

      <ProgressStats stats={stats} />

      {!activeCards.length ? (
        <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center">
          <h3 className="text-lg font-semibold text-white">No flashcards in this deck</h3>
          <p className="mx-auto mt-1 max-w-sm text-xs text-slate-400">
            Add cards to this deck or switch to another study set to begin reviewing.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href={activeDeck ? `/create?deckId=${activeDeck.id}` : "/create"}
              className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition"
            >
              <Plus size={15} />
              Add Cards Now
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-[2.5rem] border border-slate-800 bg-slate-900/60 p-5 shadow-2xl shadow-slate-950/40 sm:p-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              Card {currentIndex + 1} of {activeCards.length}
              {isShuffleActive && (
                <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                  🔀 Shuffled
                </span>
              )}
            </div>
            {currentCard && (
              <div className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs text-slate-300">
                Difficulty {currentCard.difficulty}/5
              </div>
            )}
          </div>

          <div className="mx-auto flex max-w-2xl flex-col items-center gap-6">
            {currentCard && <FlashcardCard card={currentCard} />}

            <div className="flex w-full flex-col gap-3 sm:flex-row">
              <button
                type="button"
                disabled={submittingAction !== null}
                onClick={() => handleReview(true)}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-4 text-base font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer select-none"
              >
                {submittingAction === "mastered" ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                    <span>Recording Mastered…</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={19} />
                    <span>Got it (Mastered)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={submittingAction !== null}
                onClick={() => handleReview(false)}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-5 py-4 text-base font-bold text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer select-none"
              >
                {submittingAction === "learning" ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-rose-300 border-t-transparent" />
                    <span>Saving for Review…</span>
                  </>
                ) : (
                  <>
                    <RotateCcw size={18} />
                    <span>Still Learning (Review Again)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeDeck && (
        <ShareDeckModal
          deck={activeDeck}
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          onDeckUpdated={(updated) => {
            setDecks((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
          }}
        />
      )}
    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-12 text-center text-slate-300">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
          <p className="text-sm">Loading review session…</p>
        </div>
      }
    >
      <ReviewContent />
    </Suspense>
  );
}
