"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen, BrainCircuit, Plus, RotateCcw, Sparkles } from "lucide-react";
import { QuizQuestion } from "@/components/quiz-question";
import { ProgressStats } from "@/components/progress-stats";
import { DeckSelector } from "@/components/deck-selector";
import {
  fetchDecks,
  fetchFlashcards,
  fetchUserStats,
  recordTestSession,
} from "@/lib/flashcardService";
import { Deck, Flashcard, QuizQuestionItem, UserStats } from "@/types/flashcard";

const initialStats: UserStats = {
  reviewed: 0,
  correct: 0,
  accuracy: 100,
  totalTests: 0,
  streakDays: 1,
};

function buildQuizQuestions(cards: Flashcard[], allPool: Flashcard[]): QuizQuestionItem[] {
  if (!cards.length) return [];
  const pool = cards.length >= 4 ? cards : allPool.length >= 4 ? allPool : cards;

  return [...cards]
    .map((card) => {
      const distractors = pool
        .filter((candidate) => candidate.id !== card.id && candidate.answer !== card.answer)
        .map((candidate) => candidate.answer);
      const options = [...new Set([card.answer, ...distractors].slice(0, 4))];
      while (options.length < 4) {
        options.push("Other correct concept");
      }
      const shuffled = [...options].sort(() => Math.random() - 0.5);
      const correctIndex = shuffled.indexOf(card.answer);

      return {
        card,
        options: shuffled,
        correctIndex: correctIndex !== -1 ? correctIndex : 0,
      };
    })
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.min(10, cards.length));
}

function TestContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialDeckParam = searchParams.get("deckId") || "all";

  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string>(initialDeckParam);
  const [allCards, setAllCards] = useState<Flashcard[]>([]);
  const [stats, setStats] = useState<UserStats>(initialStats);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | undefined>(
    undefined,
  );
  const [timeLeft, setTimeLeft] = useState(90);
  const [results, setResults] = useState<{
    correct: number;
    total: number;
    submitted: boolean;
  }>({ correct: 0, total: 0, submitted: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
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
    }
    loadData();
  }, []);

  useEffect(() => {
    const p = searchParams.get("deckId");
    if (p) setSelectedDeckId(p);
  }, [searchParams]);

  const handleSelectDeck = (deckId: string) => {
    setSelectedDeckId(deckId);
    setQuestionIndex(0);
    setSelectedAnswer(undefined);
    setResults({ correct: 0, total: 0, submitted: false });
    setTimeLeft(90);
    if (deckId === "all") {
      router.push("/test");
    } else {
      router.push(`/test?deckId=${deckId}`);
    }
  };

  const activeDeck = decks.find((d) => d.id === selectedDeckId);
  const filteredCards = useMemo(() => {
    if (selectedDeckId === "all") return allCards;
    return activeDeck ? activeDeck.cards : allCards;
  }, [selectedDeckId, activeDeck, allCards]);

  const questions = useMemo(
    () => buildQuizQuestions(filteredCards, allCards),
    [filteredCards, allCards]
  );
  const currentQuestion = questions[questionIndex];

  useEffect(() => {
    if (loading || results.submitted || !questions.length || !currentQuestion)
      return;

    const timer = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          finishQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [loading, results.submitted, questions.length, currentQuestion]);

  const finishQuiz = async () => {
    if (results.submitted) return;

    const total = questions.length || 0;
    const correct = questions.filter((question, idx) => {
      if (!question) return false;
      return (
        idx < questionIndex + 1 &&
        question.options[question.correctIndex] ===
          (idx === questionIndex ? selectedAnswer : undefined)
      );
    }).length;

    const updatedStats = await recordTestSession(correct, total);
    setStats(updatedStats);
    setResults({ correct, total, submitted: true });
  };

  const handleAnswer = (answer: string) => {
    if (!currentQuestion || results.submitted) return;
    setSelectedAnswer(answer);

    const isCorrect =
      currentQuestion.options[currentQuestion.correctIndex] === answer;
    const nextCorrect = isCorrect ? results.correct + 1 : results.correct;
    const nextTotal = questionIndex + 1;

    setResults((prev) => ({ ...prev, correct: nextCorrect, total: nextTotal }));

    setTimeout(() => {
      if (questionIndex === questions.length - 1) {
        void finishQuiz();
        return;
      }
      setQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(undefined);
    }, 500);
  };

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-12 text-center text-slate-300">
        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
        <p className="text-sm">Preparing quiz session…</p>
      </div>
    );
  }

  if (results.submitted) {
    const score = Math.round(
      (results.correct / Math.max(results.total, 1)) * 100,
    );

    return (
      <div className="space-y-8 pb-12">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">
            Quiz Results
          </p>
          <h1 className="mt-1 text-3xl font-bold text-white sm:text-4xl">
            Quiz Complete!
          </h1>
        </div>

        <ProgressStats stats={stats} />

        <div className="rounded-3xl border border-slate-700 bg-slate-900/90 p-8 text-center shadow-2xl">
          <p className="text-sm text-slate-400">Score for {selectedDeckId === "all" ? "All Decks" : activeDeck?.title}</p>
          <h2 className="mt-2 text-6xl font-black text-cyan-300">{score}%</h2>
          <p className="mt-3 text-base text-slate-200">
            You got <span className="font-bold text-emerald-400">{results.correct}</span> out of{" "}
            <span className="font-bold">{results.total}</span> questions correct!
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setQuestionIndex(0);
                setSelectedAnswer(undefined);
                setResults({ correct: 0, total: 0, submitted: false });
                setTimeLeft(90);
              }}
              className="inline-flex items-center gap-2 rounded-full bg-cyan-500 px-6 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-400 transition cursor-pointer"
            >
              <RotateCcw size={16} />
              Retake Quiz
            </button>
            <Link
              href={selectedDeckId === "all" ? "/review" : `/review?deckId=${selectedDeckId}`}
              className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950 px-6 py-3 text-sm font-semibold text-slate-200 hover:border-slate-500 transition"
            >
              <BookOpen size={16} />
              Review Flashcards
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header & Deck Selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-300">
            Quiz Assessment
          </p>
          <h1 className="mt-1 text-3xl font-bold text-white sm:text-4xl">
            {selectedDeckId === "all" ? "Test All Decks" : `${activeDeck?.title || "Study Set"} Quiz`}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <DeckSelector
            decks={decks}
            selectedDeckId={selectedDeckId}
            onSelectDeck={handleSelectDeck}
            totalCardsCount={allCards.length}
          />

          <div className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-medium text-slate-200">
            Time Left:{" "}
            <span className="font-mono font-bold text-cyan-300">{timeLeft}s</span>
          </div>
        </div>
      </div>

      <ProgressStats stats={stats} />

      {!filteredCards.length || !questions.length ? (
        <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center">
          <h3 className="text-lg font-semibold text-white">Not enough cards for quiz</h3>
          <p className="mx-auto mt-1 max-w-sm text-xs text-slate-400">
            Add at least 2 cards to this deck to generate multiple-choice questions.
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
        <div className="flex flex-col items-center gap-4">
          <div className="text-xs text-slate-400">
            Question {questionIndex + 1} of {questions.length}
          </div>
          {currentQuestion ? (
            <QuizQuestion
              question={currentQuestion.card}
              options={currentQuestion.options}
              selectedAnswer={selectedAnswer}
              onSelect={handleAnswer}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}

export default function TestPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-12 text-center text-slate-400">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
          <p className="text-sm">Loading quiz…</p>
        </div>
      }
    >
      <TestContent />
    </Suspense>
  );
}
