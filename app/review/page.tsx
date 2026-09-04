"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
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

interface ReviewHistoryItem {
  index: number;
  cardId: string;
  rated: boolean;
  remembered?: boolean;
  previousDifficulty?: number;
}

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
  const [reviewHistory, setReviewHistory] = useState<ReviewHistoryItem[]>([]);
  const [stats, setStats] = useState<UserStats>(initialStats);
  const [loading, setLoading] = useState(true);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const lastActionTimestamp = useRef<number>(0);

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
    setReviewHistory([]);
  }, [selectedDeckId, activeDeck, allCards]);

  const handleToggleShuffle = () => {
    const nextShuffle = !isShuffleActive;
    setIsShuffleActive(nextShuffle);
    try {
      localStorage.setItem("rf_review_shuffle", JSON.stringify(nextShuffle));
    } catch {}

    const currentlyViewedCard = activeCards[currentIndex];
    let newCardList: Flashcard[] = [];

    if (nextShuffle) {
      newCardList = shuffleArray(activeCards);
    } else {
      const baseCards = selectedDeckId === "all"
        ? allCards
        : activeDeck ? activeDeck.cards : allCards;
      newCardList = baseCards;
    }

    setActiveCards(newCardList);
    setReviewHistory([]);

    // Keep user on the exact card they were studying
    if (currentlyViewedCard) {
      const newIdx = newCardList.findIndex((c) => c.id === currentlyViewedCard.id);
      setCurrentIndex(newIdx >= 0 ? newIdx : 0);
    }
  };

  const handleReshuffleSession = () => {
    const currentlyViewedCard = activeCards[currentIndex];
    const reshuffled = shuffleArray(activeCards);
    setActiveCards(reshuffled);
    setReviewHistory([]);
    if (currentlyViewedCard) {
      const newIdx = reshuffled.findIndex((c) => c.id === currentlyViewedCard.id);
      setCurrentIndex(newIdx >= 0 ? newIdx : 0);
    }
  };

  const handleSelectDeck = (deckId: string) => {
    setSelectedDeckId(deckId);
    setCurrentIndex(0);
    setReviewHistory([]);
    if (deckId === "all") {
      router.push("/review");
    } else {
      router.push(`/review?deckId=${deckId}`);
    }
  };

  const currentCard = activeCards[currentIndex];

  // Broadcast live review context for AI Study Assistant (@mentions & deep website awareness)
  useEffect(() => {
    if (typeof window !== "undefined" && currentCard) {
      window.dispatchEvent(
        new CustomEvent("update-ai-context", {
          detail: {
            currentCard,
            deckTitle: activeDeck?.title,
            mode: "review",
            reviewProgress: activeCards.length > 0 ? `Card ${currentIndex + 1} of ${activeCards.length}` : undefined,
            stats,
          },
        })
      );
    }
  }, [currentCard, activeDeck, currentIndex, activeCards.length, stats]);

  const handleReview = useCallback((remembered: boolean) => {
    const now = Date.now();
    // 100ms debounce guard to prevent accidental rapid double-tap skips
    if (now - lastActionTimestamp.current < 100) return;
    lastActionTimestamp.current = now;

    const cardToRecord = activeCards[currentIndex];
    if (!cardToRecord) return;

    // 1. SAVE TO REVIEW HISTORY FOR BACKTRACKING:
    setReviewHistory((prev) => [
      ...prev,
      {
        index: currentIndex,
        cardId: cardToRecord.id,
        rated: true,
        remembered,
        previousDifficulty: cardToRecord.difficulty,
      },
    ]);

    // 2. INSTANT OPTIMISTIC ADVANCE (0ms perceived latency):
    setCurrentIndex((prev) => {
      if (activeCards.length <= 1) return 0;
      return (prev + 1) % activeCards.length;
    });

    // 3. INSTANT STATS & CARD DIFFICULTY UPDATE:
    setActiveCards((prev) =>
      prev.map((card) =>
        card.id === cardToRecord.id
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

    // 4. ASYNC BACKGROUND PERSISTENCE (Non-blocking):
    recordReviewResult(cardToRecord.id, remembered).catch((err) => {
      console.warn("Background review result persistence error:", err);
    });
  }, [activeCards, currentIndex]);

  const handlePreviousCard = useCallback(() => {
    const now = Date.now();
    if (now - lastActionTimestamp.current < 100) return;
    lastActionTimestamp.current = now;

    if (reviewHistory.length > 0) {
      const lastItem = reviewHistory[reviewHistory.length - 1];
      setReviewHistory((prev) => prev.slice(0, -1));
      setCurrentIndex(lastItem.index);

      // Roll back stats if this card was previously rated
      if (lastItem.rated) {
        setStats((prev) => {
          const reviewed = Math.max(0, prev.reviewed - 1);
          const correct = Math.max(0, prev.correct - (lastItem.remembered ? 1 : 0));
          return {
            ...prev,
            reviewed,
            correct,
            accuracy: reviewed > 0 ? Math.round((correct / reviewed) * 100) : 100,
          };
        });

        if (lastItem.previousDifficulty !== undefined) {
          setActiveCards((prev) =>
            prev.map((c) =>
              c.id === lastItem.cardId ? { ...c, difficulty: lastItem.previousDifficulty! } : c
            )
          );
        }
      }
    } else if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [reviewHistory, currentIndex]);

  const handleSkipCard = useCallback(() => {
    const now = Date.now();
    if (now - lastActionTimestamp.current < 100) return;
    lastActionTimestamp.current = now;

    const cardToSkip = activeCards[currentIndex];
    if (!cardToSkip || activeCards.length <= 1) return;

    setReviewHistory((prev) => [
      ...prev,
      {
        index: currentIndex,
        cardId: cardToSkip.id,
        rated: false,
      },
    ]);

    setCurrentIndex((prev) => (prev + 1) % activeCards.length);
  }, [activeCards, currentIndex]);

  const canGoPrevious = reviewHistory.length > 0 || currentIndex > 0;

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName || "").toLowerCase();
      if (
        tag === "input" ||
        tag === "textarea" ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      if (e.key === "ArrowLeft" || e.key === "p" || e.key === "P") {
        if (canGoPrevious) {
          e.preventDefault();
          handlePreviousCard();
        }
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleSkipCard();
      } else if (e.key === "1") {
        e.preventDefault();
        handleReview(true);
      } else if (e.key === "2") {
        e.preventDefault();
        handleReview(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canGoPrevious, handlePreviousCard, handleSkipCard, handleReview]);

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
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                <span className="h-2 w-2 rounded-full bg-cyan-400" />
                Card {currentIndex + 1} of {activeCards.length}
                {isShuffleActive && (
                  <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                    🔀 Shuffled
                  </span>
                )}
              </div>

              {/* Quick Stepper */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePreviousCard}
                  disabled={!canGoPrevious}
                  title="Previous card (Left Arrow or P)"
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-700/80 bg-slate-950/80 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:border-cyan-500/40 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                >
                  <ChevronLeft size={14} />
                  <span className="hidden xs:inline">Prev</span>
                </button>
                <button
                  type="button"
                  onClick={handleSkipCard}
                  title="Skip to next card (Right Arrow)"
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-700/80 bg-slate-950/80 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:border-cyan-500/40 hover:text-white transition cursor-pointer"
                >
                  <span className="hidden xs:inline">Next</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {currentCard && (
              <div className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs text-slate-300">
                Difficulty {currentCard.difficulty}/5
              </div>
            )}
          </div>

          <div className="mx-auto flex max-w-2xl flex-col items-center gap-6">
            {currentCard && <FlashcardCard card={currentCard} />}

            {/* AI Tutor Quick Actions for Active Card */}
            {currentCard && (
              <div className="flex w-full items-center justify-between gap-2 rounded-2xl border border-indigo-500/30 bg-indigo-950/20 px-4 py-2.5 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
                  <Sparkles size={14} className="text-amber-300 animate-pulse" />
                  <span>DITroy AI Study Assistant</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        window.dispatchEvent(
                          new CustomEvent("open-ai-tutor", {
                            detail: {
                              currentCard,
                              deckTitle: activeDeck?.title,
                              prompt: `Explain the formal concept behind this card and connect it with an analogy. Keep it compact (no greeting, under 200 words so all 4 points fit):
Question: "${currentCard.question}" -> Answer: "${currentCard.answer}"

1. What is that? (Formal definition, 1-2 sentences)
2. How did it come to that? (How it works under the hood, 2 concise bullets)
3. Why is it like that? (Purpose & why it matters, 1-2 sentences)
4. Intuitive Analogy (Relatable analogy linked to the mechanics, 1-2 sentences)`,
                              mode: "review",
                            },
                          })
                        );
                      }
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-indigo-500/40 bg-indigo-600/20 px-2.5 py-1 text-xs font-medium text-indigo-200 hover:bg-indigo-600/30 transition cursor-pointer active:scale-95"
                    title="Deep explanation covering formal concept, mechanics, why it matters, and analogy"
                  >
                    <span>💡 Explain Concept</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        window.dispatchEvent(
                          new CustomEvent("open-ai-tutor", {
                            detail: {
                              currentCard,
                              deckTitle: activeDeck?.title,
                              prompt: `Give me a memorable mnemonic or memory trick to remember this: "${currentCard.question}" -> "${currentCard.answer}"`,
                              mode: "review",
                            },
                          })
                        );
                      }
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-purple-500/40 bg-purple-600/20 px-2.5 py-1 text-xs font-medium text-purple-200 hover:bg-purple-600/30 transition cursor-pointer active:scale-95"
                  >
                    <span>🧠 Mnemonic</span>
                  </button>
                </div>
              </div>
            )}

            <div className="flex w-full flex-col gap-3">
              <div className="flex w-full flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => handleReview(true)}
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-4 text-base font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition active:scale-[0.98] hover:bg-emerald-400 cursor-pointer select-none"
                >
                  <CheckCircle2 size={19} />
                  <span>Got it (Mastered)</span>
                  <span className="hidden md:inline-block ml-1 rounded bg-black/20 px-1.5 py-0.5 text-[10px] font-mono text-slate-950">
                    [1]
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleReview(false)}
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-5 py-4 text-base font-bold text-rose-300 transition active:scale-[0.98] hover:bg-rose-500/20 cursor-pointer select-none"
                >
                  <RotateCcw size={18} />
                  <span>Still Learning (Review Again)</span>
                  <span className="hidden md:inline-block ml-1 rounded bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-mono text-rose-300">
                    [2]
                  </span>
                </button>
              </div>

              {/* Secondary Navigation Row: Backtrack to previous card & Skip */}
              <div className="flex w-full items-center justify-between gap-3 pt-1 text-xs text-slate-400">
                <button
                  type="button"
                  onClick={handlePreviousCard}
                  disabled={!canGoPrevious}
                  title="Return to previous card (Left Arrow or P)"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2.5 font-medium text-slate-200 transition hover:border-slate-700 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-sm"
                >
                  <ChevronLeft size={15} />
                  <span>Previous Card</span>
                  <kbd className="hidden sm:inline-block rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400 border border-slate-700">
                    ←
                  </kbd>
                </button>

                <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-500">
                  <span>Hotkeys:</span>
                  <span className="rounded bg-slate-950 px-1.5 py-0.5 text-[10px] text-slate-400 border border-slate-800">
                    ← Prev
                  </span>
                  <span className="rounded bg-slate-950 px-1.5 py-0.5 text-[10px] text-emerald-400/90 border border-slate-800">
                    1 Got it
                  </span>
                  <span className="rounded bg-slate-950 px-1.5 py-0.5 text-[10px] text-rose-400/90 border border-slate-800">
                    2 Review
                  </span>
                  <span className="rounded bg-slate-950 px-1.5 py-0.5 text-[10px] text-slate-400 border border-slate-800">
                    → Skip
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleSkipCard}
                  title="Skip card without recording a rating (Right Arrow)"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2.5 font-medium text-slate-200 transition hover:border-slate-700 hover:bg-slate-800 cursor-pointer shadow-sm"
                >
                  <span>Skip Card</span>
                  <ChevronRight size={15} />
                  <kbd className="hidden sm:inline-block rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400 border border-slate-700">
                    →
                  </kbd>
                </button>
              </div>
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
