"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import {
  ArrowRight,
  Award,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Flame,
  HelpCircle,
  MousePointerClick,
  Play,
  RotateCcw,
  Sparkles,
  Target,
  Trophy,
  X,
  Zap,
} from "lucide-react";

export interface QuestStep {
  id: string;
  missionNumber: number;
  totalMissions: number;
  title: string;
  badge: string;
  instruction: string;
  route: string;
  targetSelector: string;
  expectedAction: string;
  hint: string;
  placement?: "top" | "bottom" | "auto";
}

const QUEST_STEPS: QuestStep[] = [
  // MISSION 1: ACTIVE RECALL REVIEW
  {
    id: "step-flip",
    missionNumber: 1,
    totalMissions: 4,
    title: "Active Recall: 3D Card Flip",
    badge: "Mission 1 of 4 • Flashcard Review",
    instruction: "Tap or click the flashcard to flip it in 3D and reveal the answer!",
    route: "/review",
    targetSelector: '[data-tut="flip-card"]',
    expectedAction: "flip-card",
    hint: "Clicking the card reveals the back face using 3D perspective flip.",
    placement: "bottom",
  },
  {
    id: "step-rate",
    missionNumber: 1,
    totalMissions: 4,
    title: "Active Recall: Rate Memory",
    badge: "Mission 1 of 4 • Spaced Repetition",
    instruction: "Great job! Now rate your recall: click 'Got it' to advance spaced repetition!",
    route: "/review",
    targetSelector: '[data-tut="rate-got-it"]',
    expectedAction: "rate-recall",
    hint: "Rating cards as 'Got it' or 'Still Learning' automatically tunes difficulty intervals.",
    placement: "top",
  },

  // MISSION 2: UNIVERSAL CREATE STUDIO
  // 2A: Universal Raw Text Parser
  {
    id: "step-tab-bulk",
    missionNumber: 2,
    totalMissions: 4,
    title: "Studio 1/3: Universal Raw Text Parser",
    badge: "Mission 2 of 4 • Raw Text Parser",
    instruction: "Click 'Universal Raw Text Parser' to turn exam reviewers or pasted notes into cards!",
    route: "/create",
    targetSelector: '[data-tut="tab-bulk"]',
    expectedAction: "select-tab-bulk",
    hint: "Supports numbered items (1. Q... Ans), bold text, tabs, dashes, and colons.",
    placement: "bottom",
  },
  {
    id: "step-sample-template",
    missionNumber: 2,
    totalMissions: 4,
    title: "Studio 1/3: Instant Regex Detection",
    badge: "Mission 2 of 4 • Template Auto-Detect",
    instruction: "Click any sample template chip (e.g. 'Numbered Reviewer') to test instant regex parsing!",
    route: "/create",
    targetSelector: '[data-tut="sample-template-btn"]',
    expectedAction: "insert-sample-template",
    hint: "Loads formatted reviewer Q&A and extracts questions and answers in real-time.",
    placement: "bottom",
  },
  {
    id: "step-stage-bulk",
    missionNumber: 2,
    totalMissions: 4,
    title: "Studio 1/3: Stage Parsed Cards",
    badge: "Mission 2 of 4 • Batch Staging",
    instruction: "Review the live extracted cards below, then click 'Stage Flashcards' to queue them!",
    route: "/create",
    targetSelector: '[data-tut="stage-bulk-btn"]',
    expectedAction: "stage-bulk-cards",
    hint: "All extracted cards will be staged into your deck queue.",
    placement: "top",
  },

  // 2B: DITroy AI Generator
  {
    id: "step-tab-ai",
    missionNumber: 2,
    totalMissions: 4,
    title: "Studio 2/3: DITroy AI Generator",
    badge: "Mission 2 of 4 • AI Flashcard Creation",
    instruction: "Now let's try AI! Click '✨ DITroy AI Generator' to synthesize flashcards from any topic!",
    route: "/create",
    targetSelector: '[data-tut="tab-ai"]',
    expectedAction: "select-tab-ai",
    hint: "DITroy AI automatically drafts high-yield questions, definitions, and difficulty ratings.",
    placement: "bottom",
  },
  {
    id: "step-ai-generate",
    missionNumber: 2,
    totalMissions: 4,
    title: "Studio 2/3: Generate with DITroy AI",
    badge: "Mission 2 of 4 • AI Synthesizer",
    instruction: "Click 'Generate Flashcards with DITroy AI' (or 'Use Example') to synthesize cards!",
    route: "/create",
    targetSelector: '[data-tut="ai-generate-btn"]',
    expectedAction: "generate-ai-cards",
    hint: "DITroy analyzes your prompt to formulate testable concepts and answers.",
    placement: "top",
  },
  {
    id: "step-ai-stage",
    missionNumber: 2,
    totalMissions: 4,
    title: "Studio 2/3: Add AI Cards to Deck",
    badge: "Mission 2 of 4 • AI Staging",
    instruction: "Awesome! Click 'Add All to Deck Queue' to add the generated AI cards to your deck!",
    route: "/create",
    targetSelector: '[data-tut="add-ai-cards-btn"]',
    expectedAction: "add-ai-cards",
    hint: "All AI-generated questions are immediately staged with attached tags.",
    placement: "top",
  },

  // 2C: Manual Single Q&A
  {
    id: "step-tab-rapid",
    missionNumber: 2,
    totalMissions: 4,
    title: "Studio 3/3: Manual Single Q&A",
    badge: "Mission 2 of 4 • Single Card Creator",
    instruction: "For individual cards, click 'Manual Single Q&A' to type questions and answers directly!",
    route: "/create",
    targetSelector: '[data-tut="tab-rapid"]',
    expectedAction: "select-tab-rapid",
    hint: "Create precision flashcards with custom formatting and hotkey staging.",
    placement: "bottom",
  },
  {
    id: "step-stage-rapid",
    missionNumber: 2,
    totalMissions: 4,
    title: "Studio 3/3: Stage Single Card",
    badge: "Mission 2 of 4 • Precision Staging",
    instruction: "Click 'Stage Card' (or 'Insert Sample Q&A') to add your custom question & answer!",
    route: "/create",
    targetSelector: '[data-tut="stage-single-card-btn"]',
    expectedAction: "stage-single-card",
    hint: "Hit Ctrl+Enter or click the button to stage cards into your queue.",
    placement: "top",
  },

  // 2D: Save Deck
  {
    id: "step-save-deck",
    missionNumber: 2,
    totalMissions: 4,
    title: "Finalize: Save Your New Deck",
    badge: "Mission 2 of 4 • Save & Store",
    instruction: "Your cards are staged! Click 'Save Deck' to store your new deck in your library!",
    route: "/create",
    targetSelector: '[data-tut="save-deck-btn"]',
    expectedAction: "save-deck",
    hint: "Saves your deck locally or syncs with the cloud for studying anywhere.",
    placement: "top",
  },

  // MISSION 3: TIMED QUIZ & ASSESSMENT
  {
    id: "step-test",
    missionNumber: 3,
    totalMissions: 4,
    title: "Timed Quiz & Assessment",
    badge: "Mission 3 of 4 • Knowledge Test",
    instruction: "Test yourself under real exam conditions! Click any choice below to answer.",
    route: "/test",
    targetSelector: '[data-tut="quiz-option"]',
    expectedAction: "quiz-option",
    hint: "Test mode provides instant accuracy scores and dynamic adaptive difficulty peaks.",
    placement: "top",
  },

  // MISSION 4: CLOUD SHARING & CODES
  {
    id: "step-share",
    missionNumber: 4,
    totalMissions: 4,
    title: "Cloud Sharing & Codes",
    badge: "Mission 4 of 4 • Collaboration",
    instruction: "Click the Share button on any deck to view your Share Code or universal link!",
    route: "/decks",
    targetSelector: '[data-tut="share-deck-btn"]',
    expectedAction: "open-share",
    hint: "Share codes allow classmates to study your decks in 1-click on any device.",
    placement: "bottom",
  },
];

interface PracticalQuestContextType {
  isActive: boolean;
  currentStepIndex: number;
  currentStep: QuestStep | null;
  startQuest: () => void;
  stopQuest: () => void;
  reportAction: (actionName: string) => void;
  hasCompletedQuest: boolean;
}

const PracticalQuestContext = createContext<PracticalQuestContextType | undefined>(
  undefined
);

export function usePracticalQuest() {
  const context = useContext(PracticalQuestContext);
  if (!context) {
    throw new Error("usePracticalQuest must be used within PracticalQuestProvider");
  }
  return context;
}

export function PracticalQuestProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [scrollDirection, setScrollDirection] = useState<"up" | "down" | null>(null);
  const [hasCompletedQuest, setHasCompletedQuest] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [shakeTooltip, setShakeTooltip] = useState(false);

  const step = isActive ? QUEST_STEPS[currentStepIndex] || null : null;

  // Smoothly scroll the targeted element into the center of the viewport
  const scrollToTarget = useCallback(() => {
    if (!step) return;
    const el = document.querySelector(step.targetSelector);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [step]);

  // Check completion on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const done = localStorage.getItem("rf_practical_quest_done_v1");
      if (done) setHasCompletedQuest(true);
    }
  }, []);

  const startQuest = useCallback(() => {
    setCurrentStepIndex(0);
    setIsActive(true);
    setShowCompletionModal(false);
    const firstStep = QUEST_STEPS[0];
    if (firstStep && pathname !== firstStep.route) {
      router.push(firstStep.route);
    }
  }, [pathname, router]);

  const stopQuest = useCallback(() => {
    setIsActive(false);
    setTargetRect(null);
    setScrollDirection(null);
  }, []);

  const advanceStep = useCallback(() => {
    // Mini celebration confetti burst on completing a step
    try {
      confetti({
        particleCount: 25,
        spread: 45,
        origin: { y: 0.75 },
      });
    } catch {}

    if (currentStepIndex + 1 >= QUEST_STEPS.length) {
      // Completed all missions!
      setIsActive(false);
      setTargetRect(null);
      setScrollDirection(null);
      setHasCompletedQuest(true);
      setShowCompletionModal(true);
      if (typeof window !== "undefined") {
        localStorage.setItem("rf_practical_quest_done_v1", "true");
      }
      try {
        confetti({
          particleCount: 120,
          spread: 90,
          origin: { y: 0.6 },
        });
      } catch {}
    } else {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      const nextStep = QUEST_STEPS[nextIdx];
      if (nextStep && pathname !== nextStep.route) {
        router.push(nextStep.route);
      }
    }
  }, [currentStepIndex, pathname, router]);

  const reportAction = useCallback(
    (actionName: string) => {
      if (!isActive || !step) return;
      if (step.expectedAction === actionName) {
        advanceStep();
      }
    },
    [isActive, step, advanceStep]
  );

  // Listen for global custom events from interactive components
  useEffect(() => {
    if (!isActive) return;

    const handleCustomAction = (e: Event) => {
      const customEvent = e as CustomEvent<{ action: string }>;
      if (customEvent.detail?.action) {
        reportAction(customEvent.detail.action);
      }
    };

    window.addEventListener("practical-tut-action", handleCustomAction);
    return () => {
      window.removeEventListener("practical-tut-action", handleCustomAction);
    };
  }, [isActive, reportAction]);

  // If current route does not match step route, navigate automatically
  useEffect(() => {
    if (!isActive || !step) return;
    if (pathname !== step.route) {
      router.push(step.route);
    }
  }, [isActive, step, pathname, router]);

  // Proactively scroll target into view whenever active step changes
  useEffect(() => {
    if (!isActive || !step) return;
    const t1 = setTimeout(scrollToTarget, 100);
    const t2 = setTimeout(scrollToTarget, 380);
    const t3 = setTimeout(scrollToTarget, 750);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isActive, step, scrollToTarget]);

  // Continuously track target element position and bounds
  useEffect(() => {
    if (!isActive || !step) {
      setTargetRect(null);
      setScrollDirection(null);
      return;
    }

    let animationFrameId: number;
    let observer: ResizeObserver | null = null;

    const updateRect = () => {
      const el = document.querySelector(step.targetSelector);
      if (el) {
        const rect = el.getBoundingClientRect();
        // Check if visible
        if (rect.width > 0 && rect.height > 0) {
          setTargetRect(rect);
          const vh = window.innerHeight;
          if (rect.bottom < 110) {
            setScrollDirection("up");
          } else if (rect.top > vh - 110) {
            setScrollDirection("down");
          } else {
            setScrollDirection(null);
          }
          return;
        }
      }
      setTargetRect(null);
      setScrollDirection(null);
    };

    // Initial check with delay to allow page render
    const timer = setTimeout(() => {
      const el = document.querySelector(step.targetSelector);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top < 100 || rect.bottom > window.innerHeight - 100) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
      updateRect();
      if (el && typeof ResizeObserver !== "undefined") {
        observer = new ResizeObserver(() => {
          updateRect();
        });
        observer.observe(el);
      }
    }, 150);

    const onScrollOrResize = () => {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(updateRect);
    };

    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(animationFrameId);
      if (observer) observer.disconnect();
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [isActive, step, pathname]);

  // Handle clicking outside the spotlight target (gentle nudge)
  const handleOutsideClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (scrollDirection) {
      scrollToTarget();
    }
    setShakeTooltip(true);
    setTimeout(() => setShakeTooltip(false), 500);
  };

  return (
    <PracticalQuestContext.Provider
      value={{
        isActive,
        currentStepIndex,
        currentStep: step,
        startQuest,
        stopQuest,
        reportAction,
        hasCompletedQuest,
      }}
    >
      {children}

      {/* ACTIVE SPOTLIGHT QUEST OVERLAY */}
      {isActive && step && (
        <div className="fixed inset-0 z-[9990] pointer-events-none select-none">
          {/* Top Bar Banner with Progress & Exit */}
          <div className="pointer-events-auto absolute top-3 left-1/2 -translate-x-1/2 z-[9999] w-[95%] max-w-xl rounded-2xl border border-cyan-500/40 bg-slate-900/95 p-3 sm:px-5 sm:py-3.5 shadow-2xl shadow-cyan-950/60 backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
                  <Target size={16} className="animate-spin" style={{ animationDuration: "6s" }} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-cyan-400">
                      {step.badge}
                    </span>
                    <span className="text-[10px] rounded-full bg-cyan-500/20 px-2 py-0.5 font-bold text-cyan-300">
                      Step {currentStepIndex + 1}/{QUEST_STEPS.length}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white leading-snug">
                    {step.title}
                  </h4>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={advanceStep}
                  title="Skip this step"
                  className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:text-white hover:border-slate-500 transition"
                >
                  Skip
                </button>
                <button
                  type="button"
                  onClick={stopQuest}
                  title="Exit tutorial"
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-2.5 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 transition-all duration-300 rounded-full"
                style={{
                  width: `${((currentStepIndex + 1) / QUEST_STEPS.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* 4-QUADRANT BLOCKERS (Forces user to interact with the spotlight element) */}
          {targetRect ? (
            <>
              {/* Top blocker */}
              <div
                onClick={handleOutsideClick}
                className="pointer-events-auto absolute left-0 top-0 right-0 bg-slate-950/70 backdrop-blur-[2px] transition-all duration-200"
                style={{ height: Math.max(0, targetRect.top - 6) }}
              />
              {/* Bottom blocker */}
              <div
                onClick={handleOutsideClick}
                className="pointer-events-auto absolute left-0 right-0 bottom-0 bg-slate-950/70 backdrop-blur-[2px] transition-all duration-200"
                style={{ top: targetRect.bottom + 6 }}
              />
              {/* Left blocker */}
              <div
                onClick={handleOutsideClick}
                className="pointer-events-auto absolute left-0 bg-slate-950/70 backdrop-blur-[2px] transition-all duration-200"
                style={{
                  top: targetRect.top - 6,
                  height: targetRect.height + 12,
                  width: Math.max(0, targetRect.left - 6),
                }}
              />
              {/* Right blocker */}
              <div
                onClick={handleOutsideClick}
                className="pointer-events-auto absolute right-0 bg-slate-950/70 backdrop-blur-[2px] transition-all duration-200"
                style={{
                  top: targetRect.top - 6,
                  height: targetRect.height + 12,
                  left: targetRect.right + 6,
                }}
              />

              {/* Glowing Pulse Ring over Target Element */}
              <div
                className="pointer-events-none absolute rounded-2xl border-2 border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.6)] animate-pulse transition-all duration-200"
                style={{
                  top: targetRect.top - 6,
                  left: targetRect.left - 6,
                  width: targetRect.width + 12,
                  height: targetRect.height + 12,
                }}
              />

              {/* Floating Pointer Callout Tooltip */}
              <div
                className={`pointer-events-auto absolute z-[9999] max-w-sm rounded-2xl border border-cyan-500/50 bg-slate-900/95 p-4 shadow-2xl shadow-cyan-950/80 backdrop-blur-xl transition-all duration-200 ${
                  shakeTooltip ? "animate-bounce ring-2 ring-rose-500" : ""
                }`}
                style={{
                  left: Math.max(
                    12,
                    Math.min(
                      window.innerWidth - 340,
                      targetRect.left + targetRect.width / 2 - 160
                    )
                  ),
                  top: Math.max(
                    85,
                    Math.min(
                      window.innerHeight - 240,
                      targetRect.bottom + 20 > window.innerHeight - 180
                        ? Math.max(85, targetRect.top - 180)
                        : targetRect.bottom + 16
                    )
                  ),
                }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl animate-bounce">
                    {scrollDirection === "down" ? "👇" : scrollDirection === "up" ? "👆" : "👉"}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white leading-snug">
                      {step.instruction}
                    </p>
                    <p className="mt-1 text-xs text-cyan-200/80 font-normal">
                      {step.hint}
                    </p>
                    {scrollDirection && (
                      <button
                        type="button"
                        onClick={scrollToTarget}
                        className="mt-2.5 flex w-full items-center justify-between gap-2 rounded-xl bg-cyan-500/20 border border-cyan-400/50 px-3 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-500/30 transition cursor-pointer shadow-sm"
                      >
                        <span className="flex items-center gap-1.5">
                          <span className="text-base animate-bounce">
                            {scrollDirection === "down" ? "👇" : "👆"}
                          </span>
                          <span>
                            {scrollDirection === "down"
                              ? "Target is below • Scroll down"
                              : "Target is above • Scroll up"}
                          </span>
                        </span>
                        <span className="text-[11px] underline text-cyan-200 font-semibold">
                          Jump There ➔
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                  <span className="text-cyan-400 font-semibold animate-pulse">
                    Action required to advance
                  </span>
                  <button
                    type="button"
                    onClick={advanceStep}
                    className="hover:text-white underline cursor-pointer"
                  >
                    I did this →
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Fallback scrim when target element is still mounting */
            <div className="pointer-events-auto absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] flex items-center justify-center p-4">
              <div className="rounded-2xl border border-cyan-500/30 bg-slate-900 p-5 max-w-md text-center shadow-xl">
                <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 animate-spin">
                  <RotateCcw size={20} />
                </div>
                <h4 className="text-base font-bold text-white">Loading Mission Element...</h4>
                <p className="mt-1 text-xs text-slate-400">
                  Navigating to {step.route} for {step.title}.
                </p>
                <div className="mt-4 flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={advanceStep}
                    className="px-3 py-1.5 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold"
                  >
                    Next Step
                  </button>
                  <button
                    type="button"
                    onClick={stopQuest}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                  >
                    Exit Quest
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* FLOATING GESTURE SCROLL BANNERS (Points users above or below the fold) */}
          {scrollDirection === "down" && (
            <div
              onClick={scrollToTarget}
              role="button"
              title="Click to scroll down to target action"
              className="pointer-events-auto fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 rounded-2xl border-2 border-cyan-400 bg-slate-900/95 px-5 py-3.5 shadow-[0_0_40px_rgba(6,182,212,0.6)] backdrop-blur-xl animate-bounce hover:scale-105 active:scale-95 transition-all cursor-pointer select-none"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-500/25 text-cyan-300 border border-cyan-400/50 shrink-0">
                <ChevronDown size={24} className="animate-pulse" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-cyan-400">
                  <span className="text-base animate-pulse">👇</span>
                  <span>Scroll Down To Next Step</span>
                </div>
                <p className="text-xs text-slate-200 font-medium">
                  Target action is below the fold • <span className="text-cyan-300 underline font-bold">Tap here to auto-scroll</span>
                </p>
              </div>
              <MousePointerClick size={20} className="text-cyan-400 ml-1 shrink-0" />
            </div>
          )}

          {scrollDirection === "up" && (
            <div
              onClick={scrollToTarget}
              role="button"
              title="Click to scroll up to target action"
              className="pointer-events-auto fixed top-24 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 rounded-2xl border-2 border-cyan-400 bg-slate-900/95 px-5 py-3.5 shadow-[0_0_40px_rgba(6,182,212,0.6)] backdrop-blur-xl animate-bounce hover:scale-105 active:scale-95 transition-all cursor-pointer select-none"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-500/25 text-cyan-300 border border-cyan-400/50 shrink-0">
                <ChevronUp size={24} className="animate-pulse" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-cyan-400">
                  <span className="text-base animate-pulse">👆</span>
                  <span>Scroll Up To Target</span>
                </div>
                <p className="text-xs text-slate-200 font-medium">
                  Target action is above • <span className="text-cyan-300 underline font-bold">Tap here to auto-scroll</span>
                </p>
              </div>
              <MousePointerClick size={20} className="text-cyan-400 ml-1 shrink-0" />
            </div>
          )}
        </div>
      )}

      {/* GRAND FINALE CELEBRATION MODAL */}
      {showCompletionModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-md rounded-3xl border border-cyan-500/40 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-6 sm:p-8 text-center shadow-2xl shadow-cyan-950/80">
            {/* Top glowing orb */}
            <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-amber-400 via-cyan-400 to-indigo-500 p-0.5 shadow-xl shadow-cyan-500/30">
              <div className="w-full h-full rounded-[22px] bg-slate-950 flex items-center justify-center text-amber-400">
                <Trophy size={38} className="animate-bounce" />
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-xs font-bold text-amber-300 mb-2">
              <Sparkles size={13} />
              <span>Interactive Training Completed!</span>
            </div>

            <h3 className="text-2xl font-extrabold text-white tracking-tight">
              You Are A Flashcard Master!
            </h3>

            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              You learned everything by doing: <strong>3D Active Recall</strong>, <strong>Spaced Repetition Rating</strong>, <strong>Universal Creation</strong>, <strong>Exam Quizzing</strong>, and <strong>Cloud Sharing</strong>.
            </p>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center justify-center">
              <button
                type="button"
                onClick={() => {
                  setShowCompletionModal(false);
                  router.push("/decks");
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/25 transition active:scale-95 cursor-pointer"
              >
                Start Studying Now 🚀
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowCompletionModal(false);
                  startQuest();
                }}
                className="w-full sm:w-auto px-4 py-3 rounded-2xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition cursor-pointer"
              >
                Replay Quest 🔄
              </button>
            </div>
          </div>
        </div>
      )}
    </PracticalQuestContext.Provider>
  );
}
