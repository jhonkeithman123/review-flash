"use client";

import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  BookOpen,
  BrainCircuit,
  Check,
  CheckCircle2,
  Copy,
  Crown,
  FileText,
  FolderKanban,
  GraduationCap,
  HelpCircle,
  Layers,
  Lightbulb,
  Lock,
  PlusCircle,
  RotateCcw,
  Share2,
  ShieldCheck,
  Sparkles,
  User,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";

interface TourStep {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  tag: string;
  tagColor: string;
  description: string;
  interactiveType?: "card-preview" | "parser-demo" | "share-demo" | "final";
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to ReviewFlash",
    subtitle: "Your High-Performance Study & Flashcard System",
    icon: BrainCircuit,
    tag: "Get Started",
    tagColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
    description:
      "ReviewFlash transforms your notes, reviewers, and exam questionnaires into interactive 3D flashcards and smart multiple-choice practice exams with cloud sync.",
  },
  {
    id: "navigation",
    title: "App Navigation & Study Hub",
    subtitle: "Everything You Need in One Place",
    icon: FolderKanban,
    tag: "Core Features",
    tagColor: "bg-blue-500/20 text-blue-300 border-blue-500/40",
    description:
      "Easily jump between your study spaces using the top navigation bar:",
  },
  {
    id: "create-studio",
    title: "Universal Create & Parser Studio",
    subtitle: "Turn Raw Notes & Exam Reviewers Into Cards in 1-Click",
    icon: PlusCircle,
    tag: "Smart Parser",
    tagColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    description:
      "No manual copy-pasting required! Paste entire numbered exams, notes with bold answers, or tab-delimited text. The parser automatically detects questions, answers, and tags.",
    interactiveType: "parser-demo",
  },
  {
    id: "review-mode",
    title: "Interactive 3D Flashcard Review",
    subtitle: "Active Recall & Spaced Repetition",
    icon: BookOpen,
    tag: "Review Mode",
    tagColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    description:
      "Click anywhere on the card to flip and reveal the answer. Rate your recall as 'Got it' or 'Still Learning' to automatically adjust difficulty levels.",
    interactiveType: "card-preview",
  },
  {
    id: "test-mode",
    title: "Timed Quiz & Exam Practice",
    subtitle: "Multiple-Choice Knowledge Testing",
    icon: Sparkles,
    tag: "Test Mode",
    tagColor: "bg-purple-500/20 text-purple-300 border-purple-500/40",
    description:
      "Test yourself under real exam conditions! ReviewFlash automatically generates 4-choice questions with answer shuffling, a live timer, and instant accuracy analytics.",
  },
  {
    id: "sharing",
    title: "Cloud Sharing & Permission Roles",
    subtitle: "Collaborate with Classmates & Study Groups",
    icon: Share2,
    tag: "Collaboration",
    tagColor: "bg-teal-500/20 text-teal-300 border-teal-500/40",
    description:
      "Generate 6-character Share Codes (e.g. RF-AB12CD) or direct links. Protect your decks with Viewer (Read-Only) or Editor access controls.",
    interactiveType: "share-demo",
  },
  {
    id: "accounts",
    title: "Guest Mode vs. Cloud Accounts",
    subtitle: "Study Offline or Sync Across All Devices",
    icon: Crown,
    tag: "Cloud Sync",
    tagColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
    description:
      "Start studying immediately with your local Guest ID, or create an account with Email & Password to back up your study sets and sync progress across devices.",
  },
  {
    id: "ready",
    title: "You're Ready to Ace Your Exams!",
    subtitle: "Start Exploring ReviewFlash Now",
    icon: GraduationCap,
    tag: "All Set",
    tagColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    description:
      "You're all set! Create a new deck, import an existing reviewer, or practice with the starter flashcard collections.",
    interactiveType: "final",
  },
];

export function InteractiveTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  // Interactive card demo state
  const [isDemoCardFlipped, setIsDemoCardFlipped] = useState(false);
  const [demoDifficulty, setDemoDifficulty] = useState(3);
  const [demoMastered, setDemoMastered] = useState(false);

  // Check first time visit on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasCompleted = localStorage.getItem("review_flash_tour_completed_v1");
      if (!hasCompleted) {
        // Automatically open for first-time visitors after short entrance delay
        const timer = setTimeout(() => {
          setOrigin(null);
          setIsOpen(true);
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  // Global event listener to trigger tour anytime from navbar or buttons
  useEffect(() => {
    const handleOpenTour = (e: Event) => {
      const customEvent = e as CustomEvent<{ x?: number; y?: number }>;
      if (
        customEvent.detail &&
        typeof customEvent.detail.x === "number" &&
        typeof customEvent.detail.y === "number"
      ) {
        setOrigin({ x: customEvent.detail.x, y: customEvent.detail.y });
      } else {
        setOrigin(null);
      }
      setCurrentStep(0);
      setIsDemoCardFlipped(false);
      setIsOpen(true);
    };

    window.addEventListener("open-reviewflash-tour", handleOpenTour);
    return () => window.removeEventListener("open-reviewflash-tour", handleOpenTour);
  }, []);

  // Synchronize enter & exit animation with double-rAF and timeout
  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
      return () => cancelAnimationFrame(raf);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => {
        setIsRendered(false);
      }, 340);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCloseTour();
      } else if (e.key === "ArrowRight" && currentStep < TOUR_STEPS.length - 1) {
        handleNextStep();
      } else if (e.key === "ArrowLeft" && currentStep > 0) {
        handlePrevStep();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentStep]);

  // Confetti on final step
  useEffect(() => {
    if (isOpen && currentStep === TOUR_STEPS.length - 1) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }
    }
  }, [isOpen, currentStep]);

  const handleNextStep = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleCompleteTour();
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleCloseTour = () => {
    setIsOpen(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("review_flash_tour_completed_v1", "true");
    }
  };

  const handleCompleteTour = () => {
    setIsOpen(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("review_flash_tour_completed_v1", "true");
    }
  };

  const innerRef = useRef<HTMLDivElement>(null);
  const [cardHeight, setCardHeight] = useState<number | undefined>(undefined);

  // Observe and smoothly adapt the floating menu height whenever content or steps change
  useEffect(() => {
    if (!isRendered) return;

    const measureAndSetHeight = () => {
      if (innerRef.current) {
        const measured = innerRef.current.offsetHeight;
        if (measured > 0) {
          const maxHeight = typeof window !== "undefined" ? window.innerHeight * 0.9 : 800;
          setCardHeight(Math.min(measured, maxHeight));
        }
      }
    };

    measureAndSetHeight();

    const raf = requestAnimationFrame(() => {
      measureAndSetHeight();
    });

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && innerRef.current) {
      ro = new ResizeObserver(() => {
        measureAndSetHeight();
      });
      ro.observe(innerRef.current);
    }

    const handleResize = () => measureAndSetHeight();
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", handleResize);
      if (ro) ro.disconnect();
    };
  }, [currentStep, isRendered, isDemoCardFlipped]);

  if (!isRendered) return null;

  // Calculate dynamic transform & animated height to spring-grow out of the activating button and smoothly resize between steps
  const getCardStyle = () => {
    if (typeof window === "undefined") return {};

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    const targetX = origin ? origin.x : centerX;
    const targetY = origin ? origin.y : centerY - 30;

    const deltaX = targetX - centerX;
    const deltaY = targetY - centerY;

    if (isVisible) {
      return {
        transform: "translate3d(0px, 0px, 0px) scale(1)",
        opacity: 1,
        height: cardHeight ? `${cardHeight}px` : "auto",
        transition:
          "height 380ms cubic-bezier(0.16, 1, 0.3, 1), transform 360ms cubic-bezier(0.34, 1.3, 0.64, 1), opacity 250ms ease-out",
      };
    } else {
      return {
        transform: `translate3d(${deltaX}px, ${deltaY}px, 0px) scale(0.04)`,
        opacity: 0,
        height: cardHeight ? `${cardHeight}px` : "auto",
        pointerEvents: "none" as const,
        transition: "transform 300ms cubic-bezier(0.4, 0, 0.2, 1), opacity 220ms ease-in",
      };
    }
  };

  const step = TOUR_STEPS[currentStep];
  const StepIcon = step.icon;
  const progressPercent = ((currentStep + 1) / TOUR_STEPS.length) * 100;

  return (
    <div
      onClick={handleCloseTour}
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 transition-all duration-300 ease-out ${
        isVisible
          ? "bg-slate-950/85 backdrop-blur-md opacity-100"
          : "bg-slate-950/0 backdrop-blur-none opacity-0 pointer-events-none"
      }`}
    >
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute h-[400px] w-[500px] rounded-full bg-cyan-500/10 blur-[100px]" />
      <div className="pointer-events-none absolute h-[300px] w-[400px] rounded-full bg-emerald-500/10 blur-[100px]" />

      <div
        onClick={(e) => e.stopPropagation()}
        style={getCardStyle()}
        data-tour-modal="true"
        className="relative w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-900/95 shadow-2xl shadow-slate-950 backdrop-blur-2xl overflow-hidden origin-center max-h-[90vh]"
      >
        <div
          ref={innerRef}
          className="w-full flex flex-col justify-between p-6 sm:p-8"
        >
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-400/40">
              <StepIcon size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${step.tagColor}`}
                >
                  {step.tag}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  Step {currentStep + 1} of {TOUR_STEPS.length}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCloseTour}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
            title="Close Tutorial (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1 w-full bg-slate-800 rounded-full mt-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Step Content Container */}
        <div
          key={currentStep}
          className="my-5 overflow-y-auto pr-1 space-y-4 max-h-[55vh] animate-in fade-in duration-300"
        >
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {step.title}
            </h2>
            <p className="text-xs sm:text-sm text-cyan-300 font-medium mt-0.5">
              {step.subtitle}
            </p>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {step.description}
          </p>

          {/* ================= STEP 2: NAVIGATION BREAKDOWN ================= */}
          {step.id === "navigation" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 flex items-start gap-3">
                <div className="rounded-xl bg-blue-500/20 p-2 text-blue-400 shrink-0">
                  <FolderKanban size={16} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-100">Decks Library</div>
                  <div className="text-[11px] text-slate-400">View, organize & study your collections.</div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 flex items-start gap-3">
                <div className="rounded-xl bg-emerald-500/20 p-2 text-emerald-400 shrink-0">
                  <BookOpen size={16} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-100">Review Mode</div>
                  <div className="text-[11px] text-slate-400">Interactive 3D flashcards with shuffle.</div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 flex items-start gap-3">
                <div className="rounded-xl bg-purple-500/20 p-2 text-purple-400 shrink-0">
                  <Sparkles size={16} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-100">Test & Quiz</div>
                  <div className="text-[11px] text-slate-400">Timed 4-choice practice exams.</div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 flex items-start gap-3">
                <div className="rounded-xl bg-amber-500/20 p-2 text-amber-400 shrink-0">
                  <PlusCircle size={16} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-100">Create Studio</div>
                  <div className="text-[11px] text-slate-400">Universal text, note & exam parser.</div>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 3: PARSER DEMO ================= */}
          {step.interactiveType === "parser-demo" && (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-slate-200">Example Input (Paste Anything):</span>
                <span className="text-[10px] text-amber-400 font-mono bg-amber-500/10 px-2 py-0.5 rounded">Auto-Detected</span>
              </div>
              <div className="rounded-xl bg-slate-900 p-3 font-mono text-[11px] text-slate-300 space-y-1 border border-slate-800">
                <div className="text-cyan-300">1. What voltages does ATX12V connector provide?</div>
                <div className="text-emerald-300">3.3V, 5V, 12V</div>
                <div className="text-slate-500 pt-1">---</div>
                <div className="text-cyan-300">2. Most current wireless networking standard?</div>
                <div className="text-emerald-300">802.11n</div>
              </div>
              <div className="flex items-center gap-2 text-xs text-emerald-300">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                <span>Zero manual typing needed — automatically converted into study cards!</span>
              </div>
            </div>
          )}

          {/* ================= STEP 4: INTERACTIVE CARD DEMO ================= */}
          {step.interactiveType === "card-preview" && (
            <div className="space-y-3">
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>👇 <strong>Interactive Test Card</strong> (Click below to flip!):</span>
                <span className="text-cyan-400 font-semibold">{isDemoCardFlipped ? "Answer Side" : "Question Side"}</span>
              </div>

              <div
                onClick={() => setIsDemoCardFlipped(!isDemoCardFlipped)}
                className="group relative cursor-pointer select-none rounded-2xl border border-slate-700 bg-slate-950 p-6 transition-all hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10"
              >
                {!isDemoCardFlipped ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-0.5 text-[10px] font-bold text-cyan-300 uppercase">
                        Question
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <span>Click to flip</span>
                        <ArrowLeftRight size={12} className="text-cyan-400" />
                      </span>
                    </div>
                    <div className="text-center py-3">
                      <p className="text-base sm:text-lg font-semibold text-slate-100">
                        What term is used when a computer system is unavailable?
                      </p>
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-400 pt-1 border-t border-slate-800">
                      <span>Tag: Systems Architecture</span>
                      <span className="text-amber-400 font-medium">Difficulty 3/5</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 uppercase">
                        Answer
                      </span>
                      <span className="text-xs text-emerald-400 flex items-center gap-1">
                        <RotateCcw size={12} />
                        <span>Tap to flip back</span>
                      </span>
                    </div>
                    <div className="text-center py-3">
                      <p className="text-xl sm:text-2xl font-bold text-emerald-300">
                        Downtime
                      </p>
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-400 pt-1 border-t border-emerald-950">
                      <span className="text-emerald-400/90 font-medium">✨ Key Concept</span>
                      <span className="text-emerald-300">Mastered!</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= STEP 6: SHARING DEMO ================= */}
          {step.interactiveType === "share-demo" && (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200">Deck Share Code:</span>
                <span className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 font-mono text-sm font-bold text-cyan-300">
                  RF-COMP101
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl border border-slate-800 bg-slate-900 p-2.5">
                  <div className="font-bold text-slate-200 flex items-center gap-1.5 mb-1">
                    <ShieldCheck size={13} className="text-emerald-400" />
                    Viewer Role
                  </div>
                  <div className="text-[11px] text-slate-400">Can study & test without modifying original cards.</div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900 p-2.5">
                  <div className="font-bold text-slate-200 flex items-center gap-1.5 mb-1">
                    <Wrench size={13} className="text-cyan-400" />
                    Editor Role
                  </div>
                  <div className="text-[11px] text-slate-400">Co-create & edit cards in real-time.</div>
                </div>
              </div>
            </div>
          )}

          {/* ================= FINAL STEP ================= */}
          {step.interactiveType === "final" && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center space-y-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/40">
                <GraduationCap size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-emerald-200">Ready to boost your memory?</h3>
                <p className="text-xs text-emerald-300/80 mt-1 max-w-md mx-auto">
                  You can re-launch this tour anytime by clicking the <strong>Tour 🎓</strong> button in the navigation bar.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Controls */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-800/80 pt-4 mt-2">
          {/* Step dots */}
          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentStep(idx)}
                aria-label={`Go to step ${idx + 1}`}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentStep
                    ? "w-6 bg-cyan-400"
                    : idx < currentStep
                    ? "w-2 bg-emerald-400"
                    : "w-2 bg-slate-700 hover:bg-slate-600"
                }`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handlePrevStep}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition cursor-pointer"
              >
                <ArrowLeft size={13} />
                <span>Back</span>
              </button>
            )}

            {currentStep < TOUR_STEPS.length - 1 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-md shadow-cyan-500/20 hover:bg-cyan-400 transition cursor-pointer"
              >
                <span>Next</span>
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCompleteTour}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-5 py-2 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/20 hover:bg-emerald-400 transition cursor-pointer"
              >
                <Check size={14} />
                <span>Finish & Start Learning</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}
