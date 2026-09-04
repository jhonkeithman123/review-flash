"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookOpen,
  BrainCircuit,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  ExternalLink,
  Flame,
  Gauge,
  HelpCircle,
  ListOrdered,
  Plus,
  RotateCcw,
  Shuffle,
  SlidersHorizontal,
  Sparkles,
  Timer,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import { QuizQuestion } from "@/components/quiz-question";
import { ProgressStats } from "@/components/progress-stats";
import { DeckSelector } from "@/components/deck-selector";
import {
  fetchDecks,
  fetchFlashcards,
  fetchUserStats,
  recordTestSession,
  shuffleArray,
} from "@/lib/flashcardService";
import { Deck, Flashcard, QuizQuestionItem, UserStats } from "@/types/flashcard";

const initialStats: UserStats = {
  reviewed: 0,
  correct: 0,
  accuracy: 100,
  totalTests: 0,
  streakDays: 1,
};

/**
 * Builds quiz questions with smart & adaptive distractor selection.
 * When adaptiveBoost > 0, distractor selection favors semantically close/matching
 * cards to create more nuanced, plausible, and challenging multiple-choice options.
 */
function buildAdaptiveQuizQuestions(
  cards: Flashcard[],
  allPool: Flashcard[],
  questionCountLimit?: number,
  adaptiveBoost: number = 0
): QuizQuestionItem[] {
  if (!cards.length) return [];
  const pool = cards.length >= 4 ? cards : allPool.length >= 4 ? allPool : cards;

  const baseCards = [...cards];
  const targetCards =
    questionCountLimit && questionCountLimit > 0
      ? baseCards.slice(0, questionCountLimit)
      : baseCards;

  return targetCards.map((card) => {
    // 1. Gather all candidates excluding exact same answer
    const candidates = pool.filter(
      (c) =>
        c.id !== card.id &&
        c.answer.trim().toLowerCase() !== card.answer.trim().toLowerCase()
    );

    // 2. Score candidates by similarity/plausibility
    const scoredCandidates = candidates.map((cand) => {
      let score = Math.random();

      if (adaptiveBoost > 0) {
        // Tag overlap
        const sharedTags = (cand.tags || []).filter((t) =>
          (card.tags || []).includes(t)
        ).length;
        score += sharedTags * 2.5 * (adaptiveBoost / 100);

        // Closeness in difficulty
        const diffDelta = Math.abs((cand.difficulty || 3) - (card.difficulty || 3));
        score += (5 - diffDelta) * 0.8 * (adaptiveBoost / 100);

        // Similar answer text length
        const lenDelta = Math.abs(cand.answer.length - card.answer.length);
        if (lenDelta < 18) {
          score += 1.5 * (adaptiveBoost / 100);
        }
      }

      return { answer: cand.answer, score };
    });

    // Sort by plausibility score descending
    scoredCandidates.sort((a, b) => b.score - a.score);

    const distractorAnswers: string[] = [];
    for (const cand of scoredCandidates) {
      if (!distractorAnswers.includes(cand.answer) && cand.answer !== card.answer) {
        distractorAnswers.push(cand.answer);
      }
      if (distractorAnswers.length >= 3) break;
    }

    // Generic distractors fallback if deck is small
    const genericFallbacks = [
      "Complementary secondary principle",
      "Inverse execution pattern",
      "Context-dependent edge case",
      "Alternate standard convention",
    ];
    let fallbackIndex = 0;
    while (distractorAnswers.length < 3) {
      const fallback = genericFallbacks[fallbackIndex % genericFallbacks.length];
      if (!distractorAnswers.includes(fallback) && fallback !== card.answer) {
        distractorAnswers.push(fallback);
      }
      fallbackIndex++;
    }

    const options = [card.answer, ...distractorAnswers.slice(0, 3)];
    const shuffled = [...options].sort(() => Math.random() - 0.5);
    const correctIndex = shuffled.indexOf(card.answer);

    return {
      card,
      options: shuffled,
      correctIndex: correctIndex !== -1 ? correctIndex : 0,
    };
  });
}

function TestContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialDeckParam = searchParams.get("deckId") || "all";

  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string>(initialDeckParam);
  const [allCards, setAllCards] = useState<Flashcard[]>([]);
  const [stats, setStats] = useState<UserStats>(initialStats);
  const [isShuffleActive, setIsShuffleActive] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem("rf_test_shuffle") === "true";
    } catch {
      return false;
    }
  });
  const [questionIndex, setQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [questionCountPreset, setQuestionCountPreset] = useState<string>("all");
  const [isUntimed, setIsUntimed] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(180);
  const [isOverviewDrawerOpen, setIsOverviewDrawerOpen] = useState(false);
  const [overviewFilter, setOverviewFilter] = useState<"all" | "unanswered" | "answered" | "flagged">("all");
  const [isConfirmSubmitOpen, setIsConfirmSubmitOpen] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [results, setResults] = useState<{
    correct: number;
    total: number;
    submitted: boolean;
    adaptivePeak: number;
  }>({ correct: 0, total: 0, submitted: false, adaptivePeak: 0 });
  const [loading, setLoading] = useState(true);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const navScrollRef = useRef<HTMLDivElement>(null);

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

  const activeDeck = decks.find((d) => d.id === selectedDeckId);
  const filteredCards = useMemo(() => {
    if (selectedDeckId === "all") return allCards;
    return activeDeck ? activeDeck.cards : allCards;
  }, [selectedDeckId, activeDeck, allCards]);

  const activeOrderedCards = useMemo(() => {
    if (isShuffleActive) {
      return shuffleArray([...filteredCards]);
    }
    return filteredCards;
  }, [filteredCards, isShuffleActive]);

  // Compute question limit integer
  const questionCountLimit = useMemo(() => {
    if (questionCountPreset === "all") return undefined;
    const parsed = parseInt(questionCountPreset, 10);
    return isNaN(parsed) ? undefined : parsed;
  }, [questionCountPreset]);

  // Dynamic Adaptive Difficulty calculation based on correct answers so far
  // Increases +5% per correct answer, capped at 70%
  const currentAdaptiveBoost = useMemo(() => {
    let correctCount = 0;
    // Calculate how many answered questions are correct
    for (const [idxStr, selected] of Object.entries(userAnswers)) {
      const idx = Number(idxStr);
      // We will match against card answer
      const card = activeOrderedCards[idx];
      if (card && card.answer.trim().toLowerCase() === selected.trim().toLowerCase()) {
        correctCount += 1;
      }
    }
    return Math.min(70, correctCount * 5);
  }, [userAnswers, activeOrderedCards]);

  // Build Quiz Questions based on selected deck & count limit (ALL cards by default!)
  const questions = useMemo(
    () => buildAdaptiveQuizQuestions(activeOrderedCards, allCards, questionCountLimit, currentAdaptiveBoost),
    [activeOrderedCards, allCards, questionCountLimit, currentAdaptiveBoost]
  );

  const currentQuestion = questions[questionIndex];

  // Broadcast live test/quiz context for AI Study Assistant (@mentions & deep website awareness)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const scorePct = results.total > 0 ? Math.round((results.correct / results.total) * 100) : 0;
      window.dispatchEvent(
        new CustomEvent("update-ai-context", {
          detail: {
            currentCard: currentQuestion?.card,
            deckTitle: activeDeck?.title,
            mode: "test",
            quizSummary: results.submitted
              ? `Completed Quiz on "${activeDeck?.title || "All Decks"}" with ${results.correct}/${results.total} correct (${scorePct}%), adaptive difficulty peak +${results.adaptivePeak}%`
              : `Active Quiz on "${activeDeck?.title || "All Decks"}", Question ${questionIndex + 1} of ${questions.length}`,
          },
        })
      );
    }
  }, [currentQuestion, activeDeck, results, questionIndex, questions.length]);

  // Set time limit dynamically when questions or time mode change
  useEffect(() => {
    if (questions.length > 0) {
      // 30 seconds per question (min 60 seconds)
      const allocatedSeconds = Math.max(60, questions.length * 30);
      setTimeLeft(allocatedSeconds);
    }
  }, [questions.length, isUntimed]);

  // Scroll active pill into view in quick nav
  useEffect(() => {
    if (navScrollRef.current) {
      const activeEl = navScrollRef.current.querySelector(`[data-index="${questionIndex}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }
  }, [questionIndex]);

  // Countdown timer
  useEffect(() => {
    if (loading || results.submitted || !questions.length || isUntimed) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          void handleFinishQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, results.submitted, questions.length, isUntimed]);

  const handleSelectDeck = (deckId: string) => {
    setSelectedDeckId(deckId);
    setQuestionIndex(0);
    setUserAnswers({});
    setFlaggedQuestions(new Set());
    setResults({ correct: 0, total: 0, submitted: false, adaptivePeak: 0 });
    if (deckId === "all") {
      router.push("/test");
    } else {
      router.push(`/test?deckId=${deckId}`);
    }
  };

  const handleToggleShuffle = () => {
    const nextShuffle = !isShuffleActive;
    const currentCardId = currentQuestion?.card?.id;

    // Map answers by card ID to preserve selections without index drift
    const answersByCardId: Record<string, string> = {};
    Object.entries(userAnswers).forEach(([idxStr, ans]) => {
      const q = questions[Number(idxStr)];
      if (q) answersByCardId[q.card.id] = ans;
    });

    const flaggedCardIds = new Set<string>();
    flaggedQuestions.forEach((idx) => {
      const q = questions[idx];
      if (q) flaggedCardIds.add(q.card.id);
    });

    setIsShuffleActive(nextShuffle);
    try {
      localStorage.setItem("rf_test_shuffle", JSON.stringify(nextShuffle));
    } catch {}

    const newCards = nextShuffle ? shuffleArray([...filteredCards]) : [...filteredCards];
    const newQuestions = buildAdaptiveQuizQuestions(newCards, allCards, questionCountLimit, currentAdaptiveBoost);

    const newUserAnswers: Record<number, string> = {};
    const newFlagged = new Set<number>();
    newQuestions.forEach((q, newIdx) => {
      if (answersByCardId[q.card.id]) {
        newUserAnswers[newIdx] = answersByCardId[q.card.id];
      }
      if (flaggedCardIds.has(q.card.id)) {
        newFlagged.add(newIdx);
      }
    });

    setUserAnswers(newUserAnswers);
    setFlaggedQuestions(newFlagged);

    // Keep user on the exact question they were currently viewing
    if (currentCardId) {
      const newIdx = newQuestions.findIndex((q) => q.card.id === currentCardId);
      setQuestionIndex(newIdx >= 0 ? newIdx : 0);
    }
  };

  const handleToggleFlag = (idx: number) => {
    setFlaggedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const handleAnswerSelect = (answer: string) => {
    if (!currentQuestion || results.submitted) return;

    setUserAnswers((prev) => ({
      ...prev,
      [questionIndex]: answer,
    }));

    if (autoAdvance && questionIndex < questions.length - 1) {
      setTimeout(() => {
        setQuestionIndex((prev) => prev + 1);
      }, 350);
    }
  };

  const handleFinishQuiz = async () => {
    if (results.submitted || !questions.length) return;

    const total = questions.length;
    let correct = 0;

    questions.forEach((q, idx) => {
      const selected = userAnswers[idx];
      if (selected && selected.trim().toLowerCase() === q.card.answer.trim().toLowerCase()) {
        correct++;
      }
    });

    const finalAdaptivePeak = Math.min(70, correct * 5);
    const updatedStats = await recordTestSession(correct, total);
    setStats(updatedStats);
    setResults({
      correct,
      total,
      submitted: true,
      adaptivePeak: finalAdaptivePeak,
    });
    setIsConfirmSubmitOpen(false);
    setIsOverviewDrawerOpen(false);
  };

  const answeredCount = Object.keys(userAnswers).length;
  const unansweredCount = questions.length - answeredCount;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const getDifficultyTierName = (boost: number) => {
    if (boost >= 60) return { name: "Mastery (Max 70%)", color: "text-rose-400", border: "border-rose-500/40", bg: "bg-rose-500/20" };
    if (boost >= 40) return { name: "Advanced Tier", color: "text-amber-400", border: "border-amber-500/40", bg: "bg-amber-500/20" };
    if (boost >= 20) return { name: "Challenging Tier", color: "text-cyan-400", border: "border-cyan-500/40", bg: "bg-cyan-500/20" };
    return { name: "Standard Baseline", color: "text-emerald-400", border: "border-emerald-500/40", bg: "bg-emerald-500/20" };
  };

  const activeTier = getDifficultyTierName(currentAdaptiveBoost);

  // Filter questions for the Overview Drawer
  const filteredOverviewQuestions = useMemo(() => {
    return questions.map((q, idx) => ({ q, idx })).filter(({ idx }) => {
      if (overviewFilter === "answered") return !!userAnswers[idx];
      if (overviewFilter === "unanswered") return !userAnswers[idx];
      if (overviewFilter === "flagged") return flaggedQuestions.has(idx);
      return true;
    });
  }, [questions, overviewFilter, userAnswers, flaggedQuestions]);

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-12 text-center text-slate-300">
        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
        <p className="text-sm">Preparing adaptive quiz session…</p>
      </div>
    );
  }

  if (results.submitted) {
    const score = Math.round((results.correct / Math.max(results.total, 1)) * 100);

    return (
      <div className="space-y-8 pb-12 animate-in fade-in duration-200">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">
            Quiz Assessment Completed
          </p>
          <h1 className="mt-1 text-3xl font-bold text-white sm:text-4xl">
            Quiz Results &amp; Review
          </h1>
        </div>

        <ProgressStats stats={stats} />

        {/* Results Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-linear-to-br from-slate-900 via-slate-950 to-slate-900 p-6 sm:p-8 text-center shadow-2xl">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
            Score for {selectedDeckId === "all" ? "All Decks Combined" : activeDeck?.title}
          </p>

          <h2 className="mt-2 text-6xl sm:text-7xl font-black text-cyan-300 tracking-tight">
            {score}%
          </h2>

          <p className="mt-3 text-base text-slate-200">
            You answered <span className="font-bold text-emerald-400">{results.correct}</span> of{" "}
            <span className="font-bold">{results.total}</span> questions correctly!
          </p>

          {/* Adaptive peak achieved badge */}
          {results.adaptivePeak > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/15 px-4 py-1.5 text-xs font-bold text-amber-300">
              <Flame size={15} className="text-amber-400 animate-pulse" />
              <span>
                Scaled to +{results.adaptivePeak}% AI Adaptive Difficulty ({getDifficultyTierName(results.adaptivePeak).name})
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.dispatchEvent(
                    new CustomEvent("open-ai-tutor", {
                      detail: {
                        deckTitle: activeDeck?.title,
                        prompt: `I just finished taking my quiz for deck "${
                          selectedDeckId === "all" ? "All Decks" : activeDeck?.title || "Study Set"
                        }" (${results.total} questions). I scored ${score}% (${results.correct}/${results.total} correct, reached +${results.adaptivePeak}% adaptive difficulty). Give me a 3-step study improvement plan to master any missed concepts!`,
                        mode: "test",
                      },
                    })
                  );
                }
              }}
              className="inline-flex items-center gap-2 rounded-full border border-indigo-500/50 bg-indigo-500/20 px-6 py-3 text-sm font-bold text-indigo-200 hover:bg-indigo-500/30 transition cursor-pointer"
            >
              <Sparkles size={16} className="text-amber-300" />
              AI Improvement Plan ✨
            </button>
            <button
              type="button"
              onClick={() => {
                setQuestionIndex(0);
                setUserAnswers({});
                setFlaggedQuestions(new Set());
                setResults({ correct: 0, total: 0, submitted: false, adaptivePeak: 0 });
                setTimeLeft(Math.max(60, questions.length * 30));
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

        {/* Detailed Question by Question Review */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <ListOrdered size={20} className="text-cyan-400" />
              <span>Question Breakdown &amp; Answer Review</span>
            </h3>
            <span className="text-xs text-slate-400">
              {results.correct} Correct · {results.total - results.correct} Incorrect
            </span>
          </div>

          <div className="grid gap-3.5">
            {questions.map((q, idx) => {
              const selected = userAnswers[idx];
              const isCorrect = selected && selected.trim().toLowerCase() === q.card.answer.trim().toLowerCase();
              const isFlagged = flaggedQuestions.has(idx);

              return (
                <div
                  key={q.card.id || idx}
                  className={`rounded-2xl border p-4.5 transition-all ${
                    isCorrect
                      ? "border-emerald-500/30 bg-emerald-950/10"
                      : selected
                      ? "border-rose-500/30 bg-rose-950/10"
                      : "border-slate-800 bg-slate-900/60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold ${
                          isCorrect
                            ? "bg-emerald-500 text-slate-950"
                            : selected
                            ? "bg-rose-500 text-white"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">
                        Difficulty {q.card.difficulty}/5
                      </span>
                      {isFlagged && (
                        <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded px-1.5 py-0.5">
                          🚩 Flagged
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (typeof window !== "undefined") {
                          window.dispatchEvent(
                            new CustomEvent("open-ai-tutor", {
                              detail: {
                                currentCard: q.card,
                                deckTitle: activeDeck?.title,
                                prompt: `On question #${idx + 1}: "${q.card.question}", I selected "${
                                  selected || "(Unanswered)"
                                }" but the correct answer is "${q.card.answer}". Explain why the correct answer is right and give a memorable analogy to never miss it again!`,
                                mode: "test",
                              },
                            })
                          );
                        }
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
                    >
                      <Sparkles size={12} className="text-amber-300" />
                      <span>Explain with AI</span>
                    </button>
                  </div>

                  <p className="mt-2 text-sm sm:text-base font-medium text-white leading-snug">
                    {q.card.question}
                  </p>

                  <div className="mt-3 grid gap-2 sm:grid-cols-2 text-xs">
                    <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-2.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                        Your Answer:
                      </span>
                      <span className={isCorrect ? "text-emerald-300 font-semibold" : selected ? "text-rose-300 font-semibold" : "text-slate-500 italic"}>
                        {selected || "No answer provided"}
                      </span>
                    </div>

                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-2.5">
                      <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-0.5">
                        Correct Answer:
                      </span>
                      <span className="text-emerald-200 font-semibold">
                        {q.card.answer}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-300">
            Quiz &amp; Adaptive Assessment
          </p>
          <h1 className="mt-1 text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            {selectedDeckId === "all" ? "Test All Decks" : `${activeDeck?.title || "Study Set"} Quiz`}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <DeckSelector
            decks={decks}
            selectedDeckId={selectedDeckId}
            onSelectDeck={handleSelectDeck}
            totalCardsCount={allCards.length}
          />

          {/* Question Count Preset Selector */}
          <div className="flex items-center gap-1 rounded-full border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-xs text-slate-300">
            <SlidersHorizontal size={12} className="text-slate-400" />
            <select
              value={questionCountPreset}
              onChange={(e) => {
                setQuestionCountPreset(e.target.value);
                setQuestionIndex(0);
                setUserAnswers({});
              }}
              className="bg-transparent text-xs font-semibold text-cyan-300 focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-slate-100">
                All Items ({filteredCards.length})
              </option>
              {filteredCards.length > 5 && (
                <option value="5" className="bg-slate-900 text-slate-100">
                  Quick 5
                </option>
              )}
              {filteredCards.length > 10 && (
                <option value="10" className="bg-slate-900 text-slate-100">
                  Top 10
                </option>
              )}
              {filteredCards.length > 20 && (
                <option value="20" className="bg-slate-900 text-slate-100">
                  20 Items
                </option>
              )}
            </select>
          </div>

          {/* Shuffle Questions Toggle */}
          <button
            type="button"
            onClick={handleToggleShuffle}
            title={isShuffleActive ? "Questions are shuffled - Click for sequential order" : "Click to shuffle questions randomly without losing progress"}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              isShuffleActive
                ? "border-cyan-500/60 bg-cyan-500/15 text-cyan-300 shadow-sm shadow-cyan-500/10"
                : "border-slate-800 bg-slate-900/90 text-slate-400 hover:border-slate-700 hover:text-white"
            }`}
          >
            <Shuffle size={12} className={isShuffleActive ? "text-cyan-400" : ""} />
            <span>{isShuffleActive ? "Shuffled" : "Sequential"}</span>
          </button>

          {/* Timer Display */}
          <button
            type="button"
            onClick={() => setIsUntimed(!isUntimed)}
            title={isUntimed ? "Timer is disabled (Practice Mode)" : "Click to switch to untimed practice"}
            className="flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-slate-200 hover:border-slate-500 transition cursor-pointer"
          >
            <Clock size={13} className={isUntimed ? "text-slate-500" : "text-cyan-400"} />
            {isUntimed ? (
              <span className="text-slate-400 font-mono">Untimed</span>
            ) : (
              <span className="font-mono font-bold text-cyan-300">{formatTime(timeLeft)}</span>
            )}
          </button>
        </div>
      </div>

      <ProgressStats stats={stats} />

      {!filteredCards.length || !questions.length ? (
        <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center">
          <h3 className="text-lg font-semibold text-white">Not enough cards for quiz</h3>
          <p className="mx-auto mt-1 max-w-sm text-xs text-slate-400">
            Add cards to this deck to generate adaptive multiple-choice questions.
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
        <div className="space-y-4">
          {/* QUESTION QUICK NAVIGATION STRIP & OVERVIEW BUTTON */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-3 shadow-md">
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Jump to Question:</span>
                <span className="font-semibold text-slate-200">
                  {questionIndex + 1} of {questions.length}
                </span>
                <span className="text-[11px] text-cyan-400">
                  ({answeredCount}/{questions.length} answered)
                </span>
              </div>

              {/* Button to open full Question Overview Drawer */}
              <button
                type="button"
                onClick={() => setIsOverviewDrawerOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-bold text-cyan-300 hover:bg-cyan-500/20 transition cursor-pointer shadow-sm"
              >
                <ListOrdered size={14} />
                <span>Question Overview 📑</span>
              </button>
            </div>

            {/* Horizontally Scrollable Question Pills */}
            <div
              ref={navScrollRef}
              className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none"
            >
              {questions.map((q, idx) => {
                const isCurrent = idx === questionIndex;
                const isAnswered = !!userAnswers[idx];
                const isFlagged = flaggedQuestions.has(idx);

                return (
                  <button
                    key={idx}
                    type="button"
                    data-index={idx}
                    onClick={() => setQuestionIndex(idx)}
                    title={`Question ${idx + 1}: ${q.card.question.slice(0, 40)}...`}
                    className={`relative flex h-9 min-w-9 shrink-0 items-center justify-center rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
                      isCurrent
                        ? "bg-cyan-400 text-slate-950 ring-2 ring-cyan-300 shadow-md shadow-cyan-400/30 scale-105"
                        : isAnswered
                        ? "bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/35"
                        : "bg-slate-950/80 text-slate-400 border border-slate-800 hover:border-slate-600 hover:text-slate-200"
                    }`}
                  >
                    <span>{idx + 1}</span>
                    {isFlagged && (
                      <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. ACTIVE QUESTION CARD */}
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center justify-between w-full max-w-2xl text-xs text-slate-400">
              <span className="font-semibold">
                Question {questionIndex + 1} of {questions.length}
              </span>
              {currentQuestion && (
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      window.dispatchEvent(
                        new CustomEvent("open-ai-tutor", {
                          detail: {
                            currentCard: currentQuestion.card,
                            deckTitle: activeDeck?.title,
                            prompt: `I'm currently taking a quiz on question #${questionIndex + 1}: "${currentQuestion.card.question}". Can you provide a subtle hint or conceptual clue without giving away the exact answer?`,
                            mode: "test",
                          },
                        })
                      );
                    }
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-300 hover:text-indigo-200 transition cursor-pointer"
                >
                  <Sparkles size={13} className="text-amber-300 animate-pulse" />
                  <span>Ask DITroy for Clue ✨</span>
                </button>
              )}
            </div>

            {currentQuestion && (
              <QuizQuestion
                question={currentQuestion.card}
                options={currentQuestion.options}
                selectedAnswer={userAnswers[questionIndex]}
                onSelect={handleAnswerSelect}
                questionNumber={questionIndex + 1}
                totalQuestions={questions.length}
                adaptiveBoost={currentAdaptiveBoost}
                isFlagged={flaggedQuestions.has(questionIndex)}
                onToggleFlag={() => handleToggleFlag(questionIndex)}
              />
            )}

            {/* 4. NAVIGATION & SUBMIT CONTROLS */}
            <div className="flex w-full max-w-2xl items-center justify-between gap-3 pt-2">
              <button
                type="button"
                disabled={questionIndex === 0}
                onClick={() => setQuestionIndex((prev) => Math.max(0, prev - 1))}
                className="flex items-center gap-1.5 rounded-2xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-xs sm:text-sm font-semibold text-slate-300 hover:border-slate-600 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shadow-sm"
              >
                <ArrowLeft size={16} />
                <span>Previous</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (unansweredCount > 0) {
                      setIsConfirmSubmitOpen(true);
                    } else {
                      void handleFinishQuiz();
                    }
                  }}
                  className="flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-3 text-xs sm:text-sm font-bold text-slate-950 hover:brightness-110 transition cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  <CheckCircle2 size={16} />
                  <span>Finish Quiz</span>
                </button>

                {questionIndex < questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                    className="flex items-center gap-1.5 rounded-2xl border border-cyan-500/50 bg-cyan-500/10 px-4 py-3 text-xs sm:text-sm font-bold text-cyan-300 hover:bg-cyan-500/20 transition cursor-pointer shadow-sm"
                  >
                    <span>Next</span>
                    <ArrowRight size={16} />
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. QUESTION OVERVIEW DRAWER / MODAL (WITH PREVIEWS) */}
      {isOverviewDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="relative flex flex-col w-full max-w-2xl max-h-[85dvh] rounded-3xl border border-slate-800 bg-slate-900/95 shadow-2xl overflow-hidden">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4 bg-slate-950/80">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300">
                  <ListOrdered size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">All Test Questions</h3>
                  <p className="text-xs text-slate-400">
                    {answeredCount} answered · {unansweredCount} remaining
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOverviewDrawerOpen(false)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 border-b border-slate-800/80 px-5 py-2.5 bg-slate-950/40 overflow-x-auto text-xs">
              <button
                type="button"
                onClick={() => setOverviewFilter("all")}
                className={`rounded-lg px-3 py-1 font-semibold transition cursor-pointer ${
                  overviewFilter === "all"
                    ? "bg-cyan-500 text-slate-950 font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                All ({questions.length})
              </button>
              <button
                type="button"
                onClick={() => setOverviewFilter("unanswered")}
                className={`rounded-lg px-3 py-1 font-semibold transition cursor-pointer ${
                  overviewFilter === "unanswered"
                    ? "bg-amber-500 text-slate-950 font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Unanswered ({unansweredCount})
              </button>
              <button
                type="button"
                onClick={() => setOverviewFilter("answered")}
                className={`rounded-lg px-3 py-1 font-semibold transition cursor-pointer ${
                  overviewFilter === "answered"
                    ? "bg-emerald-500 text-slate-950 font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Answered ({answeredCount})
              </button>
              <button
                type="button"
                onClick={() => setOverviewFilter("flagged")}
                className={`rounded-lg px-3 py-1 font-semibold transition cursor-pointer ${
                  overviewFilter === "flagged"
                    ? "bg-purple-500 text-white font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Flagged ({flaggedQuestions.size})
              </button>
            </div>

            {/* Question Previews List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {filteredOverviewQuestions.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No questions match this filter.
                </div>
              ) : (
                filteredOverviewQuestions.map(({ q, idx }) => {
                  const isCurrent = idx === questionIndex;
                  const selectedAnswer = userAnswers[idx];
                  const isFlagged = flaggedQuestions.has(idx);

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setQuestionIndex(idx);
                        setIsOverviewDrawerOpen(false);
                      }}
                      className={`group flex items-start gap-3 rounded-2xl border p-3 text-left transition-all cursor-pointer ${
                        isCurrent
                          ? "border-cyan-400 bg-cyan-500/10 shadow-sm shadow-cyan-500/10"
                          : selectedAnswer
                          ? "border-emerald-500/30 bg-slate-950/60 hover:border-emerald-500/50"
                          : "border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-900/60"
                      }`}
                    >
                      {/* Pill Badge */}
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl font-mono text-xs font-bold ${
                          isCurrent
                            ? "bg-cyan-400 text-slate-950"
                            : selectedAnswer
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {idx + 1}
                      </div>

                      {/* Question Text Preview & Status */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-slate-400">
                            Difficulty {q.card.difficulty}/5
                          </span>
                          {isFlagged && (
                            <span className="text-[10px] text-amber-400 font-semibold bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded">
                              🚩 Flagged
                            </span>
                          )}
                        </div>

                        {/* QUESTION TEXT PREVIEW SNIPPET */}
                        <p className="mt-1 text-xs sm:text-sm font-medium text-slate-100 line-clamp-2 leading-snug">
                          {q.card.question}
                        </p>

                        {/* Answer Status */}
                        <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                          {selectedAnswer ? (
                            <span className="text-emerald-400 truncate flex items-center gap-1">
                              <Check size={12} />
                              <span className="truncate">Selected: {selectedAnswer}</span>
                            </span>
                          ) : (
                            <span className="text-slate-500 italic">⏳ Not answered yet</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Actions */}
            <div className="border-t border-slate-800 p-3.5 bg-slate-950 flex justify-between items-center text-xs">
              <span className="text-slate-400">Click any card to jump immediately</span>
              <button
                type="button"
                onClick={() => {
                  setIsOverviewDrawerOpen(false);
                  if (unansweredCount > 0) {
                    setIsConfirmSubmitOpen(true);
                  } else {
                    void handleFinishQuiz();
                  }
                }}
                className="rounded-xl bg-emerald-500 px-4 py-2 font-bold text-slate-950 hover:bg-emerald-400 transition cursor-pointer"
              >
                Submit Quiz
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. SUBMIT CONFIRMATION DIALOG */}
      {isConfirmSubmitOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <AlertCircle size={24} />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">Unanswered Questions Remaining</h3>
              <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
                You have <span className="font-bold text-amber-400">{unansweredCount}</span> unanswered{" "}
                {unansweredCount === 1 ? "question" : "questions"} out of {questions.length}. Would you like to review them or submit now?
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsConfirmSubmitOpen(false);
                  setOverviewFilter("unanswered");
                  setIsOverviewDrawerOpen(true);
                }}
                className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition cursor-pointer"
              >
                Review Unanswered
              </button>
              <button
                type="button"
                onClick={() => void handleFinishQuiz()}
                className="flex-1 rounded-xl bg-cyan-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition cursor-pointer"
              >
                Submit Anyway
              </button>
            </div>
          </div>
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
          <p className="text-sm">Loading adaptive quiz session…</p>
        </div>
      }
    >
      <TestContent />
    </Suspense>
  );
}

