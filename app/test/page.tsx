"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Award,
  Bookmark,
  BookOpen,
  BrainCircuit,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  ExternalLink,
  Flame,
  Folder,
  Gauge,
  HelpCircle,
  History,
  Layers,
  ListOrdered,
  Plus,
  RotateCcw,
  Shuffle,
  Sparkles,
  Timer,
  Trophy,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import { QuizQuestion } from "@/components/quiz-question";
import { ProgressStats } from "@/components/progress-stats";
import { DeckSelector } from "@/components/deck-selector";
import { DeckSetSelector } from "@/components/deck-set-selector";
import { TestHistoryModal } from "@/components/test-history-modal";
import { QuestionOverviewModal } from "@/components/question-overview-modal";
import {
  clearActiveTestState,
  fetchActiveTestState,
  fetchDecks,
  fetchFlashcards,
  fetchUserStats,
  recordTestSession,
  saveActiveTestState,
  saveTestRecord,
  shuffleArray,
} from "@/lib/flashcardService";
import { divideCardsIntoSets } from "@/lib/setDivider";
import {
  generateBatchSmartDistractorsWithAI,
  generateHeuristicSmartDistractors,
  generateSmartDistractorsWithAI,
} from "@/lib/ditroy";
import {
  ActiveTestState,
  Deck,
  DeckCardSet,
  DeckScoreBreakdown,
  DeckSetDivisionConfig,
  Flashcard,
  QuizQuestionItem,
  TestRecord,
  UserStats,
} from "@/types/flashcard";

const initialStats: UserStats = {
  reviewed: 0,
  correct: 0,
  accuracy: 100,
  totalTests: 0,
  streakDays: 1,
};

/**
 * Builds stable quiz questions with intelligent, logically relative distractors.
 * Distractor order is generated once per take and remains completely static during answering.
 */
function buildStableQuizQuestions(
  cards: Flashcard[],
  allPool: Flashcard[],
  questionCountLimit?: number,
  adaptiveLevel: number = 1
): QuizQuestionItem[] {
  if (!cards.length) return [];
  const targetCards =
    questionCountLimit && questionCountLimit > 0
      ? cards.slice(0, questionCountLimit)
      : cards;

  return targetCards.map((card) => {
    // 1. Check if cached AI distractors exist for this card & adaptive level
    let distractorAnswers: string[] = [];
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(`rf_ai_dist_${card.id}_${adaptiveLevel}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length >= 3) {
            distractorAnswers = parsed
              .map((s) => String(s).trim())
              .filter((s) => s.length > 0 && s.toLowerCase() !== card.answer.trim().toLowerCase())
              .slice(0, 3);
          }
        }
      } catch {}
    }

    // 2. Fallback to smart heuristic generator (detects keys, ports, HTTP codes, numbers, tags, etc.)
    if (distractorAnswers.length < 3) {
      distractorAnswers = generateHeuristicSmartDistractors(card, allPool, adaptiveLevel);
    }

    const options = [card.answer, ...distractorAnswers.slice(0, 3)];
    const shuffled = shuffleArray(options);
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
  const [setDivisionConfig, setSetDivisionConfig] = useState<DeckSetDivisionConfig>({
    enabled: false,
    mode: "count",
    value: 1,
    namingStyle: "letters",
  });
  const [activeSetIndex, setActiveSetIndex] = useState<number>(0);
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
  const [questionDirection, setQuestionDirection] = useState<"next" | "prev" | "jump">("jump");
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [questionCountPreset, setQuestionCountPreset] = useState<string>("all");
  const [isUntimed, setIsUntimed] = useState<boolean>(false);
  const [questions, setQuestions] = useState<QuizQuestionItem[]>([]);
  const [adaptiveStreak, setAdaptiveStreak] = useState<number>(0);
  const [adaptivePeak, setAdaptivePeak] = useState<number>(0);
  const [isGeneratingAiDistractors, setIsGeneratingAiDistractors] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(180);
  const [isOverviewDrawerOpen, setIsOverviewDrawerOpen] = useState(false);
  const [overviewOrigin, setOverviewOrigin] = useState<{ x: number; y: number } | null>(null);
  const [overviewFilter, setOverviewFilter] = useState<"all" | "unanswered" | "answered" | "flagged">("all");
  const [isConfirmSubmitOpen, setIsConfirmSubmitOpen] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyOrigin, setHistoryOrigin] = useState<{ x: number; y: number } | null>(null);
  const [hasResumedState, setHasResumedState] = useState(false);
  const [currentTestRecord, setCurrentTestRecord] = useState<TestRecord | null>(null);
  const [results, setResults] = useState<{
    correct: number;
    total: number;
    submitted: boolean;
    adaptivePeak: number;
  }>({ correct: 0, total: 0, submitted: false, adaptivePeak: 0 });
  const [loading, setLoading] = useState(true);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const navScrollRef = useRef<HTMLDivElement>(null);

  const handleOpenHistoryModal = (e?: React.MouseEvent) => {
    if (e && (e.clientX !== 0 || e.clientY !== 0)) {
      setHistoryOrigin({ x: e.clientX, y: e.clientY });
    } else {
      const rect = (e?.currentTarget as HTMLElement)?.getBoundingClientRect?.();
      if (rect) {
        setHistoryOrigin({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
      } else {
        setHistoryOrigin(null);
      }
    }
    setIsHistoryModalOpen(true);
  };

  const handleOpenOverviewModal = (e?: React.MouseEvent) => {
    if (e && (e.clientX !== 0 || e.clientY !== 0)) {
      setOverviewOrigin({ x: e.clientX, y: e.clientY });
    } else {
      const rect = (e?.currentTarget as HTMLElement)?.getBoundingClientRect?.();
      if (rect) {
        setOverviewOrigin({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
      } else {
        setOverviewOrigin(null);
      }
    }
    setIsOverviewDrawerOpen(true);
  };

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

  // Auto-hydrate deck set division configuration from saved deck
  useEffect(() => {
    if (activeDeck?.setDivision) {
      setSetDivisionConfig(activeDeck.setDivision);
    } else {
      setSetDivisionConfig({
        enabled: false,
        mode: "count",
        value: 1,
        namingStyle: "letters",
      });
    }
    setActiveSetIndex(0);
  }, [selectedDeckId, activeDeck]);

  const rawDeckCards = useMemo(() => {
    if (selectedDeckId === "all") return allCards;
    return activeDeck ? activeDeck.cards : allCards;
  }, [selectedDeckId, activeDeck, allCards]);

  const deckSets: DeckCardSet[] = useMemo(() => {
    return divideCardsIntoSets(rawDeckCards, setDivisionConfig, setDivisionConfig.namingStyle);
  }, [rawDeckCards, setDivisionConfig]);

  const activeSet = deckSets[activeSetIndex] || deckSets[0];
  const filteredCards = useMemo(() => {
    return activeSet ? activeSet.cards : rawDeckCards;
  }, [activeSet, rawDeckCards]);

  // Compute question limit integer
  const questionCountLimit = useMemo(() => {
    if (questionCountPreset === "all") return undefined;
    const parsed = parseInt(questionCountPreset, 10);
    return isNaN(parsed) ? undefined : parsed;
  }, [questionCountPreset]);

  // Adaptive difficulty tier: Level 1 (0-1 streak), Level 2 (2-3 streak), Level 3 (4+ streak)
  const currentAdaptiveLevel = useMemo(() => {
    if (adaptiveStreak >= 4) return 3;
    if (adaptiveStreak >= 2) return 2;
    return 1;
  }, [adaptiveStreak]);

  // Dynamic Adaptive Difficulty percentage boost calculation based on correct answers and peak streak
  const currentAdaptiveBoost = useMemo(() => {
    let correctCount = 0;
    for (const [idxStr, selected] of Object.entries(userAnswers)) {
      const idx = Number(idxStr);
      const q = questions[idx];
      if (q && q.card.answer.trim().toLowerCase() === selected.trim().toLowerCase()) {
        correctCount += 1;
      }
    }
    const streakBonus = adaptiveStreak * 10;
    return Math.min(70, correctCount * 5 + streakBonus);
  }, [userAnswers, questions, adaptiveStreak]);

  // Check and restore active in-progress test or build fresh quiz questions
  useEffect(() => {
    if (!filteredCards.length || loading) {
      if (!loading && !filteredCards.length) setQuestions([]);
      return;
    }

    let isMounted = true;

    async function initQuizQuestions() {
      // 1. Check if there is an active saved in-progress test for this deck
      const savedState = await fetchActiveTestState(selectedDeckId);
      if (
        isMounted &&
        savedState &&
        Array.isArray(savedState.questions) &&
        savedState.questions.length > 0 &&
        savedState.deckId === selectedDeckId
      ) {
        setQuestions(savedState.questions);
        setQuestionIndex(savedState.questionIndex || 0);
        setUserAnswers(savedState.userAnswers || {});
        setFlaggedQuestions(new Set(savedState.flaggedIndices || []));
        setTimeLeft(
          savedState.timeLeft !== undefined
            ? savedState.timeLeft
            : Math.max(60, savedState.questions.length * 30)
        );
        setIsUntimed(savedState.isUntimed || false);
        setIsShuffleActive(savedState.isShuffleActive || false);
        setAdaptiveStreak(savedState.adaptiveStreak || 0);
        setAdaptivePeak(savedState.adaptivePeak || 0);
        setQuestionCountPreset(savedState.questionCountPreset || "all");
        setHasResumedState(true);
        return;
      }

      // 2. Otherwise generate fresh quiz questions
      if (isMounted) {
        const baseCards = isShuffleActive ? shuffleArray([...filteredCards]) : [...filteredCards];
        const initialQs = buildStableQuizQuestions(baseCards, allCards, questionCountLimit, currentAdaptiveLevel);
        setQuestions(initialQs);
        setQuestionIndex(0);
        setUserAnswers({});
        setFlaggedQuestions(new Set());
        setAdaptiveStreak(0);
        setAdaptivePeak(0);
        setTimeLeft(Math.max(60, initialQs.length * 30));
        setHasResumedState(false);
      }
    }

    initQuizQuestions();

    return () => {
      isMounted = false;
    };
  }, [selectedDeckId, isShuffleActive, questionCountPreset, loading, filteredCards.length, setDivisionConfig, activeSetIndex]);

  const timeLeftRef = useRef<number>(timeLeft);
  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  // Auto-save active test in-progress state to local storage & database (debounced to protect write stream)
  useEffect(() => {
    if (loading || results.submitted || !questions.length) return;

    const hasAnswers = Object.keys(userAnswers).length > 0;
    const hasFlags = flaggedQuestions.size > 0;
    if (!hasAnswers && !hasFlags && questionIndex === 0) return;

    const stateToSave: ActiveTestState = {
      deckId: selectedDeckId,
      questionIndex,
      questions,
      userAnswers,
      flaggedIndices: Array.from(flaggedQuestions),
      timeLeft: timeLeftRef.current,
      isUntimed,
      isShuffleActive,
      adaptiveStreak,
      adaptivePeak,
      questionCountPreset,
      lastUpdated: Date.now(),
    };

    saveActiveTestState(stateToSave);
  }, [
    selectedDeckId,
    questionIndex,
    questions,
    userAnswers,
    flaggedQuestions,
    isUntimed,
    isShuffleActive,
    adaptiveStreak,
    adaptivePeak,
    questionCountPreset,
    loading,
    results.submitted,
  ]);

  // Save current progress on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!loading && !results.submitted && questions.length > 0) {
        const hasAnswers = Object.keys(userAnswers).length > 0;
        const hasFlags = flaggedQuestions.size > 0;
        if (hasAnswers || hasFlags || questionIndex > 0) {
          saveActiveTestState({
            deckId: selectedDeckId,
            questionIndex,
            questions,
            userAnswers,
            flaggedIndices: Array.from(flaggedQuestions),
            timeLeft: timeLeftRef.current,
            isUntimed,
            isShuffleActive,
            adaptiveStreak,
            adaptivePeak,
            questionCountPreset,
            lastUpdated: Date.now(),
          });
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [
    selectedDeckId,
    questionIndex,
    questions,
    userAnswers,
    flaggedQuestions,
    isUntimed,
    isShuffleActive,
    adaptiveStreak,
    adaptivePeak,
    questionCountPreset,
    loading,
    results.submitted,
  ]);

  // Asynchronous background enrichment with DITroy AI Smart Distractors
  useEffect(() => {
    let mounted = true;
    if (!questions.length || loading) return;

    const uncachedCards = questions
      .map((q) => q.card)
      .filter((card) => {
        if (typeof window === "undefined") return false;
        try {
          return !localStorage.getItem(`rf_ai_dist_${card.id}_${currentAdaptiveLevel}`);
        } catch {
          return true;
        }
      });

    if (uncachedCards.length === 0) return;

    setIsGeneratingAiDistractors(true);
    generateBatchSmartDistractorsWithAI(uncachedCards, {
      difficultyLevel: currentAdaptiveLevel,
      deckTitle: activeDeck?.title,
      poolCards: allCards,
    })
      .then((distractorMap) => {
        if (!mounted) return;
        setIsGeneratingAiDistractors(false);

        setQuestions((prevQuestions) => {
          return prevQuestions.map((q, idx) => {
            // NEVER alter questions already answered by user
            if (userAnswers[idx] !== undefined) return q;

            const aiDistractors = distractorMap[q.card.id];
            if (aiDistractors && aiDistractors.length >= 3) {
              const options = [q.card.answer, ...aiDistractors.slice(0, 3)];
              const shuffled = shuffleArray(options);
              return {
                ...q,
                options: shuffled,
                correctIndex: shuffled.indexOf(q.card.answer),
              };
            }
            return q;
          });
        });
      })
      .catch(() => {
        if (mounted) setIsGeneratingAiDistractors(false);
      });

    return () => {
      mounted = false;
    };
  }, [selectedDeckId, questionCountLimit, isShuffleActive, loading]);

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
    setQuestionDirection("jump");
    const targetDeck = decks.find((d) => d.id === deckId);
    if (targetDeck?.setDivision) {
      setSetDivisionConfig(targetDeck.setDivision);
    } else {
      setSetDivisionConfig({
        enabled: false,
        mode: "count",
        value: 1,
        namingStyle: "letters",
      });
    }
    setActiveSetIndex(0);
    setQuestionIndex(0);
    setUserAnswers({});
    setFlaggedQuestions(new Set());
    setAdaptiveStreak(0);
    setAdaptivePeak(0);
    setResults({ correct: 0, total: 0, submitted: false, adaptivePeak: 0 });
    setCurrentTestRecord(null);
    setHasResumedState(false);
    if (deckId === "all") {
      router.push("/test");
    } else {
      router.push(`/test?deckId=${deckId}`);
    }
  };

  const handleStartFreshQuiz = async () => {
    await clearActiveTestState(selectedDeckId);
    setHasResumedState(false);
    const baseCards = isShuffleActive ? shuffleArray([...filteredCards]) : [...filteredCards];
    const freshQuestions = buildStableQuizQuestions(baseCards, allCards, questionCountLimit, 1);
    setQuestions(freshQuestions);
    setQuestionIndex(0);
    setUserAnswers({});
    setFlaggedQuestions(new Set());
    setAdaptiveStreak(0);
    setAdaptivePeak(0);
    setResults({ correct: 0, total: 0, submitted: false, adaptivePeak: 0 });
    setCurrentTestRecord(null);
    setTimeLeft(Math.max(60, freshQuestions.length * 30));
  };

  const handleRetakeMissedQuestions = () => {
    if (!currentTestRecord?.missedCardIds || currentTestRecord.missedCardIds.length === 0) return;
    const missedIdsSet = new Set(currentTestRecord.missedCardIds);
    const missedCards = allCards.filter((c) => missedIdsSet.has(c.id));
    if (!missedCards.length) return;

    const freshQuestions = buildStableQuizQuestions(missedCards, allCards, undefined, 1);
    setQuestions(freshQuestions);
    setQuestionIndex(0);
    setUserAnswers({});
    setFlaggedQuestions(new Set());
    setAdaptiveStreak(0);
    setAdaptivePeak(0);
    setResults({ correct: 0, total: 0, submitted: false, adaptivePeak: 0 });
    setCurrentTestRecord(null);
    setTimeLeft(Math.max(60, freshQuestions.length * 30));
    setHasResumedState(false);
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
    const newQuestions = buildStableQuizQuestions(newCards, allCards, questionCountLimit, currentAdaptiveLevel);

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

    setQuestions(newQuestions);
    setUserAnswers(newUserAnswers);
    setFlaggedQuestions(newFlagged);

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

    const isCorrect = answer.trim().toLowerCase() === currentQuestion.card.answer.trim().toLowerCase();

    // Update streak and adaptive peak
    if (isCorrect) {
      const nextStreak = adaptiveStreak + 1;
      setAdaptiveStreak(nextStreak);
      setAdaptivePeak((prev) => Math.max(prev, nextStreak));
    } else {
      setAdaptiveStreak(0);
    }

    // Set answer in user state (does NOT re-shuffle options!)
    setUserAnswers((prev) => ({
      ...prev,
      [questionIndex]: answer,
    }));

    if (autoAdvance && questionIndex < questions.length - 1) {
      setTimeout(() => {
        setQuestionDirection("next");
        setQuestionIndex((prev) => prev + 1);
      }, 350);
    }
  };

  const handleFinishQuiz = async () => {
    if (results.submitted || !questions.length) return;

    const total = questions.length;
    let correct = 0;
    const missedCardIds: string[] = [];

    // Group questions by deck to calculate separated score per deck
    const deckGroups = new Map<string, { total: number; correct: number; deckTitle: string }>();

    questions.forEach((q, idx) => {
      const cardDeckId = q.card.deckId || selectedDeckId;
      const foundDeck = decks.find((d) => d.id === cardDeckId);
      const dTitle =
        foundDeck?.title ||
        (selectedDeckId === "all" ? "General Flashcards" : activeDeck?.title || "Study Set");
      const existing = deckGroups.get(cardDeckId) || { total: 0, correct: 0, deckTitle: dTitle };
      existing.total += 1;

      const selected = userAnswers[idx];
      const isCorrect =
        selected && selected.trim().toLowerCase() === q.card.answer.trim().toLowerCase();
      if (isCorrect) {
        correct++;
        existing.correct += 1;
      } else {
        missedCardIds.push(q.card.id);
      }

      deckGroups.set(cardDeckId, existing);
    });

    const deckBreakdowns: DeckScoreBreakdown[] = Array.from(deckGroups.entries()).map(
      ([dId, data]) => ({
        deckId: dId,
        deckTitle: data.deckTitle,
        total: data.total,
        correct: data.correct,
        accuracy: Math.round((data.correct / Math.max(1, data.total)) * 100),
      })
    );

    const finalAdaptivePeak = Math.max(adaptivePeak * 15, Math.min(70, correct * 5));
    const updatedStats = await recordTestSession(correct, total);
    setStats(updatedStats);

    const initialAllocatedSeconds = Math.max(60, questions.length * 30);
    const timeSpent = isUntimed ? 0 : Math.max(0, initialAllocatedSeconds - timeLeft);

    const setLabel =
      setDivisionConfig.enabled && deckSets.length > 1
        ? ` — ${activeSet.setName} of ${deckSets.length}`
        : "";
    const computedDeckTitle =
      selectedDeckId === "all"
        ? `All Decks Combined${setLabel}`
        : `${activeDeck?.title || "Study Set"}${setLabel}`;

    const newRecord: TestRecord = {
      id: "test-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
      deckId: selectedDeckId,
      deckTitle: computedDeckTitle,
      totalQuestions: total,
      correctAnswers: correct,
      scorePercentage: Math.round((correct / Math.max(total, 1)) * 100),
      timeSpentSeconds: timeSpent,
      completedAt: Date.now(),
      adaptivePeak: finalAdaptivePeak,
      deckBreakdowns: deckBreakdowns.length > 0 ? deckBreakdowns : undefined,
      missedCardIds,
    };

    await saveTestRecord(newRecord);
    await clearActiveTestState(selectedDeckId);

    setCurrentTestRecord(newRecord);
    setHasResumedState(false);
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
              onClick={(e) => handleOpenHistoryModal(e)}
              className="inline-flex items-center gap-2 rounded-full border border-cyan-500/50 bg-cyan-500/15 px-6 py-3 text-sm font-bold text-cyan-300 hover:bg-cyan-500/25 transition cursor-pointer active:scale-95 shadow-sm"
            >
              <Trophy size={16} className="text-cyan-400" />
              <span>Score History 📊</span>
            </button>

            {currentTestRecord?.missedCardIds && currentTestRecord.missedCardIds.length > 0 && (
              <button
                type="button"
                onClick={handleRetakeMissedQuestions}
                className="inline-flex items-center gap-2 rounded-full border border-rose-500/50 bg-rose-500/15 px-6 py-3 text-sm font-bold text-rose-300 hover:bg-rose-500/25 transition cursor-pointer active:scale-95 shadow-sm"
              >
                <RotateCcw size={16} />
                <span>Retake Missed ({currentTestRecord.missedCardIds.length}) 🎯</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleStartFreshQuiz}
              className="inline-flex items-center gap-2 rounded-full bg-cyan-500 px-6 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-400 transition cursor-pointer active:scale-95 shadow-md shadow-cyan-500/20"
            >
              <RotateCcw size={16} />
              Retake Full Quiz
            </button>

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

            <Link
              href={selectedDeckId === "all" ? "/review" : `/review?deckId=${selectedDeckId}`}
              className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950 px-6 py-3 text-sm font-semibold text-slate-200 hover:border-slate-500 transition"
            >
              <BookOpen size={16} />
              Review Flashcards
            </Link>
          </div>
        </div>

        {/* Separated Deck Score Breakdown (if multiple decks were tested) */}
        {currentTestRecord?.deckBreakdowns && currentTestRecord.deckBreakdowns.length > 1 && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 sm:p-7 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Layers size={18} className="text-cyan-400" />
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Deck Score Breakdown ({currentTestRecord.deckBreakdowns.length} Decks Tested)
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                Scores separated by deck with individual retake options
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {currentTestRecord.deckBreakdowns.map((b) => {
                const isDeckPassed = b.accuracy >= 75;
                return (
                  <div
                    key={b.deckId}
                    className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-950/70 p-4 transition hover:border-slate-700"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Folder size={15} className="text-cyan-400 shrink-0" />
                          <h4 className="text-sm font-bold text-white line-clamp-1">{b.deckTitle}</h4>
                        </div>
                        <span
                          className={`rounded-xl px-2.5 py-0.5 font-mono text-xs font-bold ${
                            isDeckPassed
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          }`}
                        >
                          {b.accuracy}%
                        </span>
                      </div>

                      <p className="mt-1.5 text-xs text-slate-400">
                        <span className="font-semibold text-slate-200">{b.correct}</span> of {b.total} questions correct
                      </p>

                      {/* Progress bar */}
                      <div className="mt-2.5 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isDeckPassed ? "bg-emerald-400" : "bg-rose-400"
                          }`}
                          style={{ width: `${b.accuracy}%` }}
                        />
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="mt-4 flex items-center gap-2 pt-2 border-t border-slate-800/80">
                      <button
                        type="button"
                        onClick={() => handleSelectDeck(b.deckId)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-cyan-500/20 px-3 py-1.5 text-xs font-bold text-cyan-300 hover:bg-cyan-500 hover:text-slate-950 transition cursor-pointer active:scale-95"
                      >
                        <RotateCcw size={12} />
                        <span>Retake Deck</span>
                      </button>
                      <Link
                        href={`/review?deckId=${b.deckId}`}
                        className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition"
                      >
                        <BookOpen size={12} />
                        <span>Review</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-300 cursor-default">
            Quiz &amp; Adaptive Assessment
          </p>
          <h1 className="mt-1 text-2xl sm:text-4xl font-extrabold text-white tracking-tight cursor-default">
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

          {/* Deck Set Divider & Selector */}
          <DeckSetSelector
            cards={rawDeckCards}
            config={setDivisionConfig}
            activeSetIndex={activeSetIndex}
            onConfigChange={(newCfg) => {
              setSetDivisionConfig(newCfg);
              setActiveSetIndex(0);
              setQuestionIndex(0);
              setUserAnswers({});
              setFlaggedQuestions(new Set());
            }}
            onActiveSetChange={(idx) => {
              setActiveSetIndex(idx);
              setQuestionIndex(0);
              setUserAnswers({});
              setFlaggedQuestions(new Set());
            }}
            modeLabel="Test"
          />

          {/* Test History & Deck Scores Button */}
          <button
            type="button"
            onClick={(e) => handleOpenHistoryModal(e)}
            title="View past test records, deck score breakdowns, and retake previous tests"
            className="flex items-center gap-1.5 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3.5 py-1.5 text-xs font-bold text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-400 transition cursor-pointer active:scale-95 shadow-xs"
          >
            <History size={13} className="text-cyan-400" />
            <span>Scores &amp; History</span>
          </button>


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

      {/* Resume Active Session Banner */}
      {hasResumedState && !results.submitted && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyan-500/30 bg-cyan-950/40 px-4.5 py-3 text-xs text-cyan-200 shadow-md backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300">
              <CheckCircle2 size={16} />
            </div>
            <div>
              <p className="font-bold text-white">In-Progress Test Resumed 💾</p>
              <p className="text-[11px] text-cyan-300/80">
                Your previous answers and question position have been preserved and restored.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleStartFreshQuiz}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/90 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer active:scale-95"
          >
            <RotateCcw size={12} />
            <span>Start Fresh Quiz</span>
          </button>
        </div>
      )}

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

              {/* Button to open full Question Overview Modal */}
              <button
                type="button"
                onClick={(e) => handleOpenOverviewModal(e)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-bold text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-400 transition cursor-pointer shadow-sm active:scale-95"
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
                    onClick={() => {
                      setQuestionDirection(idx > questionIndex ? "next" : "prev");
                      setQuestionIndex(idx);
                    }}
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
              <div className="flex items-center gap-2">
                <span className="font-semibold">
                  Question {questionIndex + 1} of {questions.length}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold border transition-all ${
                    currentAdaptiveLevel === 3
                      ? "border-amber-500/40 bg-amber-500/15 text-amber-300 shadow-sm shadow-amber-500/10"
                      : currentAdaptiveLevel === 2
                      ? "border-cyan-500/40 bg-cyan-500/15 text-cyan-300 shadow-sm shadow-cyan-500/10"
                      : "border-slate-700 bg-slate-800/80 text-slate-300"
                  }`}
                >
                  <BrainCircuit size={12} className={currentAdaptiveLevel >= 2 ? "text-amber-400 animate-pulse" : "text-cyan-400"} />
                  <span>
                    {currentAdaptiveLevel === 3
                      ? "⚡ Level 3: Master (Near-Misses)"
                      : currentAdaptiveLevel === 2
                      ? "🔥 Level 2: Close Concepts"
                      : "Level 1: Standard"}
                  </span>
                </span>
              </div>

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
              <div
                key={`${currentQuestion.card.id || questionIndex}-${questionIndex}`}
                className={`w-full max-w-2xl ${
                  questionDirection === "prev"
                    ? "animate-deck-prev"
                    : questionDirection === "next"
                    ? "animate-deck-next"
                    : "animate-deck-pop"
                }`}
              >
                <QuizQuestion
                  question={currentQuestion.card}
                  options={currentQuestion.options}
                  selectedAnswer={userAnswers[questionIndex]}
                  onSelect={handleAnswerSelect}
                  questionNumber={questionIndex + 1}
                  totalQuestions={questions.length}
                  adaptiveBoost={currentAdaptiveBoost}
                  adaptiveLevel={currentAdaptiveLevel}
                  streakCount={adaptiveStreak}
                  isFlagged={flaggedQuestions.has(questionIndex)}
                  onToggleFlag={() => handleToggleFlag(questionIndex)}
                />
              </div>
            )}

            {/* 4. NAVIGATION & SUBMIT CONTROLS */}
            <div className="flex w-full max-w-2xl items-center justify-between gap-3 pt-2">
              <button
                type="button"
                disabled={questionIndex === 0}
                onClick={() => {
                  setQuestionDirection("prev");
                  setQuestionIndex((prev) => Math.max(0, prev - 1));
                }}
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
                    onClick={() => {
                      setQuestionDirection("next");
                      setQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1));
                    }}
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

      {/* 5. QUESTION OVERVIEW MODAL (SPRING GROW & SHADOW BLOSSOM) */}
      <QuestionOverviewModal
        isOpen={isOverviewDrawerOpen}
        onClose={() => setIsOverviewDrawerOpen(false)}
        origin={overviewOrigin}
        questions={questions}
        questionIndex={questionIndex}
        userAnswers={userAnswers}
        flaggedQuestions={flaggedQuestions}
        initialFilter={overviewFilter}
        onSelectQuestion={(idx) => {
          setQuestionDirection(idx > questionIndex ? "next" : "prev");
          setQuestionIndex(idx);
        }}
        onSubmitQuiz={() => {
          if (unansweredCount > 0) {
            setIsConfirmSubmitOpen(true);
          } else {
            void handleFinishQuiz();
          }
        }}
      />

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

      {/* 7. TEST HISTORY & DECK SCORES MODAL */}
      <TestHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        origin={historyOrigin}
        deckId={selectedDeckId}
        decks={decks}
        onRetakeDeck={(deckId) => {
          setIsHistoryModalOpen(false);
          handleSelectDeck(deckId);
        }}
      />
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

