"use client";

import { useEffect, useMemo, useState } from "react";
import { QuizQuestion } from "@/components/quiz-question";
import { ProgressStats } from "@/components/progress-stats";
import {
  fetchFlashcards,
  fetchUserStats,
  recordTestSession,
} from "@/lib/flashcardService";
import { Flashcard, QuizQuestionItem, UserStats } from "@/types/flashcard";

const initialStats: UserStats = {
  reviewed: 0,
  correct: 0,
  accuracy: 100,
  totalTests: 0,
  streakDays: 1,
};

function buildQuizQuestions(cards: Flashcard[]): QuizQuestionItem[] {
  const pool = [...cards];
  return pool
    .map((card) => {
      const distractors = pool
        .filter((candidate) => candidate.id !== card.id)
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
        correctIndex,
      };
    })
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.min(6, cards.length));
}

export default function TestPage() {
  const [cards, setCards] = useState<Flashcard[]>([]);
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

  const questions = useMemo(() => buildQuizQuestions(cards), [cards]);
  const currentQuestion = questions[questionIndex];

  useEffect(() => {
    async function loadData() {
      const [flashcards, userStats] = await Promise.all([
        fetchFlashcards(),
        fetchUserStats(),
      ]);
      setCards(flashcards);
      setStats(userStats);
      setLoading(false);
    }
    loadData();
  }, []);

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
    return <div className="text-slate-300">Preparing quiz…</div>;
  }

  if (!cards.length || !questions.length) {
    return (
      <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6 text-slate-300">
        Add a few cards before starting a test session.
      </div>
    );
  }

  if (results.submitted) {
    const score = Math.round(
      (results.correct / Math.max(results.total, 1)) * 100,
    );

    return (
      <div className="space-y-6">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-cyan-300">
            Results
          </p>
          <h1 className="mt-2 text-3xl font-bold text-white">Quiz complete</h1>
        </div>

        <ProgressStats stats={stats} />

        <div className="rounded-3xl border border-slate-700 bg-slate-900 p-6 text-center">
          <p className="text-sm text-slate-400">Your score</p>
          <h2 className="mt-2 text-5xl font-bold text-white">{score}%</h2>
          <p className="mt-3 text-slate-300">
            {results.correct} / {results.total} correct
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 rounded-full bg-cyan-500 px-5 py-3 font-medium text-slate-950 hover:bg-cyan-400"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-cyan-300">
            Test mode
          </p>
          <h1 className="mt-2 text-3xl font-bold text-white">Quick quiz</h1>
        </div>

        <div className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-200">
          Time left:{" "}
          <span className="font-semibold text-cyan-300">{timeLeft}s</span>
        </div>
      </div>

      <ProgressStats stats={stats} />

      <div className="flex justify-center">
        {currentQuestion ? (
          <QuizQuestion
            question={currentQuestion.card}
            options={currentQuestion.options}
            selectedAnswer={selectedAnswer}
            onSelect={handleAnswer}
          />
        ) : null}
      </div>
    </div>
  );
}
