"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Flag, ListOrdered, X } from "lucide-react";
import { QuizQuestionItem } from "@/types/flashcard";

interface QuestionOverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  origin?: { x: number; y: number } | null;
  questions: QuizQuestionItem[];
  questionIndex: number;
  userAnswers: Record<number, string>;
  flaggedQuestions: Set<number>;
  initialFilter?: "all" | "unanswered" | "answered" | "flagged";
  onSelectQuestion: (index: number) => void;
  onSubmitQuiz: () => void;
}

export function QuestionOverviewModal({
  isOpen,
  onClose,
  origin,
  questions,
  questionIndex,
  userAnswers,
  flaggedQuestions,
  initialFilter = "all",
  onSelectQuestion,
  onSubmitQuiz,
}: QuestionOverviewModalProps) {
  const [isRendered, setIsRendered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [overviewFilter, setOverviewFilter] = useState<"all" | "unanswered" | "answered" | "flagged">(initialFilter);

  // Sync initial filter when opened
  useEffect(() => {
    if (isOpen) {
      setOverviewFilter(initialFilter);
    }
  }, [isOpen, initialFilter]);

  // Two-frame RAF spring animation hook
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
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Dynamic CSS origin and delta for GPU-accelerated spring bloom
  const modalStyle = useMemo(() => {
    if (typeof window === "undefined") return {};

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    const targetX = origin ? origin.x : centerX;
    const targetY = origin ? origin.y : centerY - 30;

    const deltaX = targetX - centerX;
    const deltaY = targetY - centerY;

    return {
      "--origin-dx": `${deltaX}px`,
      "--origin-dy": `${deltaY}px`,
      "--origin-pos": `${targetX}px ${targetY}px`,
    } as React.CSSProperties;
  }, [origin]);

  const answeredCount = useMemo(() => {
    return Object.keys(userAnswers).length;
  }, [userAnswers]);

  const unansweredCount = useMemo(() => {
    return Math.max(0, questions.length - answeredCount);
  }, [questions.length, answeredCount]);

  const filteredQuestions = useMemo(() => {
    return questions
      .map((q, idx) => ({ q, idx }))
      .filter(({ idx }) => {
        if (overviewFilter === "answered") return !!userAnswers[idx];
        if (overviewFilter === "unanswered") return !userAnswers[idx];
        if (overviewFilter === "flagged") return flaggedQuestions.has(idx);
        return true;
      });
  }, [questions, overviewFilter, userAnswers, flaggedQuestions]);

  if (!isRendered) return null;

  return (
    <div
      onClick={onClose}
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ease-out ${
        isVisible
          ? "bg-slate-950/80 backdrop-blur-md opacity-100 pointer-events-auto"
          : "bg-slate-950/0 backdrop-blur-none opacity-0 pointer-events-none"
      }`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={modalStyle}
        className={`relative flex flex-col w-full max-w-2xl h-[85dvh] max-h-[720px] rounded-3xl border border-cyan-500/40 bg-slate-900/95 shadow-2xl shadow-cyan-950/50 overflow-hidden ${
          isVisible
            ? "animate-jump-modal-in pointer-events-auto"
            : "animate-jump-modal-out pointer-events-none"
        }`}
      >
        {/* Top Glow Accent Bar */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-400 via-teal-400 to-indigo-500" />

        <div className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4 bg-slate-950/80 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/20">
                <ListOrdered size={20} />
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
              onClick={onClose}
              className="rounded-2xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer active:scale-95"
            >
              <X size={18} />
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 border-b border-slate-800/80 px-5 py-2.5 bg-slate-950/40 overflow-x-auto text-xs shrink-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setOverviewFilter("all")}
              className={`rounded-xl px-3 py-1 font-semibold transition cursor-pointer active:scale-95 ${
                overviewFilter === "all"
                  ? "bg-cyan-500 text-slate-950 font-bold shadow-xs shadow-cyan-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              All ({questions.length})
            </button>
            <button
              type="button"
              onClick={() => setOverviewFilter("unanswered")}
              className={`rounded-xl px-3 py-1 font-semibold transition cursor-pointer active:scale-95 ${
                overviewFilter === "unanswered"
                  ? "bg-amber-500 text-slate-950 font-bold shadow-xs shadow-amber-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              Unanswered ({unansweredCount})
            </button>
            <button
              type="button"
              onClick={() => setOverviewFilter("answered")}
              className={`rounded-xl px-3 py-1 font-semibold transition cursor-pointer active:scale-95 ${
                overviewFilter === "answered"
                  ? "bg-emerald-500 text-slate-950 font-bold shadow-xs shadow-emerald-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              Answered ({answeredCount})
            </button>
            <button
              type="button"
              onClick={() => setOverviewFilter("flagged")}
              className={`rounded-xl px-3 py-1 font-semibold transition cursor-pointer active:scale-95 ${
                overviewFilter === "flagged"
                  ? "bg-purple-500 text-white font-bold shadow-xs shadow-purple-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              Flagged ({flaggedQuestions.size})
            </button>
          </div>

          {/* Question Previews List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar min-h-0">
            {filteredQuestions.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                No questions match this filter.
              </div>
            ) : (
              filteredQuestions.map(({ q, idx }) => {
                const isCurrent = idx === questionIndex;
                const selectedAnswer = userAnswers[idx];
                const isFlagged = flaggedQuestions.has(idx);

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      onSelectQuestion(idx);
                      onClose();
                    }}
                    className={`group flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition-all duration-150 cursor-pointer active:scale-[0.99] ${
                      isCurrent
                        ? "border-cyan-400 bg-cyan-500/15 shadow-sm shadow-cyan-500/10"
                        : selectedAnswer
                        ? "border-emerald-500/30 bg-slate-950/60 hover:border-emerald-500/50 hover:bg-slate-900/60"
                        : "border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-900/60"
                    }`}
                  >
                    {/* Pill Badge */}
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl font-mono text-xs font-bold transition-transform group-hover:scale-105 ${
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
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-semibold bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded-lg">
                            <Flag size={10} />
                            <span>Flagged</span>
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
                            <span className="truncate font-medium">Selected: {selectedAnswer}</span>
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">⏳ Not answered yet</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Bottom Actions */}
          <div className="border-t border-slate-800 p-3.5 bg-slate-950/90 flex justify-between items-center text-xs shrink-0">
            <span className="text-slate-400">Click any question to jump immediately</span>
            <button
              type="button"
              onClick={() => {
                onClose();
                onSubmitQuiz();
              }}
              className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 font-bold text-slate-950 hover:brightness-110 transition cursor-pointer shadow-sm shadow-emerald-500/20 active:scale-95"
            >
              Submit Quiz
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
