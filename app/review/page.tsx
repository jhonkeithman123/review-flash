"use client";

import { useCallback, useEffect, useState } from "react";
import { FlashcardCard } from "@/components/flashcard-card";
import { ProgressStats } from "@/components/progress-stats";
import {
  fetchFlashcards,
  fetchUserStats,
  recordReviewResult,
} from "@/lib/flashcardService";
import { Flashcard, UserStats } from "@/types/flashcard";

const initialStats: UserStats = {
  reviewed: 0,
  correct: 0,
  accuracy: 100,
  totalTests: 0,
  streakDays: 1,
};

export default function ReviewPage() {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stats, setStats] = useState<UserStats>(initialStats);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [flashcards, userStats] = await Promise.all([
      fetchFlashcards(),
      fetchUserStats(),
    ]);
    setCards(flashcards);
    setStats(userStats);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const currentCard = cards[currentIndex];

  const handleReview = async (remembered: boolean) => {
    if (!currentCard) return;
    await recordReviewResult(currentCard.id, remembered);
    setCards((prev) =>
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

    setCurrentIndex((prev) => {
      if (cards.length <= 1) return 0;
      return (prev + 1) % cards.length;
    });
  };

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8 text-center text-slate-300">
        Loading review deck…
      </div>
    );
  }

  if (!cards.length) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-300">
        No flashcards yet. Create one to begin your review flow.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
            Review mode
          </p>
          <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
            Study your deck
          </h1>
        </div>

        <div className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-200">
          Card{" "}
          <span className="mx-1 font-semibold text-cyan-300">
            {currentIndex + 1}
          </span>{" "}
          / {cards.length}
        </div>
      </div>

      <ProgressStats stats={stats} />

      <div className="rounded-[2rem] border border-slate-800 bg-slate-900/60 p-4 shadow-2xl shadow-slate-950/30 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400">
            <span className="h-2 w-2 rounded-full bg-cyan-400" />
            active review
          </div>
          <div className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs text-slate-300">
            Difficulty {currentCard.difficulty}/5
          </div>
        </div>

        <div className="mx-auto flex max-w-2xl flex-col items-center gap-6">
          <FlashcardCard card={currentCard} />

          <div className="flex w-full flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => handleReview(true)}
              className="flex-1 rounded-2xl bg-emerald-500 px-5 py-4 text-base font-semibold text-slate-950 transition hover:bg-emerald-400"
            >
              Got it
            </button>
            <button
              type="button"
              onClick={() => handleReview(false)}
              className="flex-1 rounded-2xl border border-amber-400/70 bg-amber-500/10 px-5 py-4 text-base font-semibold text-amber-100 transition hover:bg-amber-500/20"
            >
              Need practice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
