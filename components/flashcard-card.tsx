"use client";

import { Flashcard } from "@/types/flashcard";
import {
  ArrowLeftRight,
  BookOpen,
  CheckCircle2,
  HelpCircle,
  RotateCcw,
  Sparkles,
  Tag,
} from "lucide-react";
import { useEffect, useState } from "react";

interface FlashcardCardProps {
  card: Flashcard;
  showAnswer?: boolean;
  onToggle?: () => void;
}

export function FlashcardCard({
  card,
  showAnswer = false,
  onToggle,
}: FlashcardCardProps) {
  const [isFlipped, setIsFlipped] = useState(showAnswer);

  useEffect(() => {
    setIsFlipped(showAnswer);
  }, [card.id, showAnswer]);

  const difficultyColors: Record<number, { text: string; bg: string; border: string; label: string }> = {
    1: { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", label: "Easy" },
    2: { text: "text-teal-400", bg: "bg-teal-500/10", border: "border-teal-500/30", label: "Light" },
    3: { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", label: "Medium" },
    4: { text: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30", label: "Hard" },
    5: { text: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/30", label: "Very Hard" },
  };

  const diffConfig = difficultyColors[card.difficulty] || difficultyColors[3];

  return (
    <div className="perspective-1000 w-full max-w-2xl mx-auto">
      <button
        type="button"
        onClick={() => {
          setIsFlipped((prev) => !prev);
          onToggle?.();
        }}
        aria-label="Flip flashcard"
        className="group relative block h-[380px] w-full cursor-pointer select-none text-left sm:h-[430px] transition-transform duration-300 hover:scale-[1.01]"
      >
        {/* Outer Glow on Hover */}
        <div className="absolute -inset-1 rounded-[2.5rem] bg-gradient-to-r from-cyan-500/20 via-blue-500/10 to-emerald-500/20 opacity-40 blur-xl transition duration-500 group-hover:opacity-75" />

        <div
          className={`relative h-full w-full rounded-[2.25rem] border border-slate-700/80 bg-slate-900/90 shadow-[0_25px_60px_-15px_rgba(2,6,23,0.9)] transition-transform duration-500 transform-style-3d group-hover:border-cyan-500/40 ${
            isFlipped ? "rotate-y-180" : ""
          }`}
        >
          {/* ================= FRONT: QUESTION ================= */}
          <div className="backface-hidden absolute inset-0 flex h-full flex-col justify-between overflow-hidden rounded-[2.25rem] bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 p-6 sm:p-9">
            {/* Ambient Background Radial Glow */}
            <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
            <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-blue-600/10 blur-2xl" />

            {/* Header: Badge & Tag */}
            <div className="relative z-10 flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-cyan-300 shadow-sm shadow-cyan-500/10">
                <HelpCircle size={13} className="text-cyan-400" />
                <span>Question</span>
              </div>

              {card.tags && card.tags.length > 0 && (
                <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-700/80 bg-slate-950/80 px-3 py-1 text-xs text-slate-300 font-medium max-w-[160px] sm:max-w-[200px] truncate">
                  <Tag size={12} className="text-cyan-400 shrink-0" />
                  <span className="truncate">{card.tags.join(", ")}</span>
                </div>
              )}
            </div>

            {/* Centered Question Body */}
            <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-2 py-4 sm:px-6 text-center">
              <p className="text-xl sm:text-2xl md:text-3xl font-semibold leading-relaxed sm:leading-snug text-slate-100 tracking-tight select-text max-w-xl">
                {card.question}
              </p>
            </div>

            {/* Footer: Difficulty Meter & Flip Hint */}
            <div className="relative z-10 flex items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <span
                      key={level}
                      className={`h-1.5 w-3 rounded-full transition-colors ${
                        level <= card.difficulty
                          ? level <= 2
                            ? "bg-emerald-400 shadow-sm shadow-emerald-400/40"
                            : level <= 3
                            ? "bg-amber-400 shadow-sm shadow-amber-400/40"
                            : "bg-rose-400 shadow-sm shadow-rose-400/40"
                          : "bg-slate-800"
                      }`}
                    />
                  ))}
                </div>
                <span className={`text-[11px] font-semibold ${diffConfig.text}`}>
                  {diffConfig.label}
                </span>
              </div>

              <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-300 shadow-sm transition group-hover:border-cyan-400/50 group-hover:text-white group-hover:bg-cyan-950/40">
                <span>Click to reveal</span>
                <ArrowLeftRight size={13} className="text-cyan-400 transition-transform group-hover:rotate-180 duration-300" />
              </div>
            </div>
          </div>

          {/* ================= BACK: ANSWER ================= */}
          <div className="backface-hidden absolute inset-0 flex h-full rotate-y-180 flex-col justify-between overflow-hidden rounded-[2.25rem] bg-gradient-to-b from-slate-900 via-emerald-950/20 to-slate-950 p-6 sm:p-9 border border-emerald-500/30">
            {/* Ambient Emerald Glow */}
            <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-emerald-500/15 blur-3xl" />
            <div className="pointer-events-none absolute left-0 bottom-0 h-40 w-40 rounded-full bg-teal-500/10 blur-2xl" />

            {/* Header: Answer Badge & Sparkles */}
            <div className="relative z-10 flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-emerald-300 shadow-sm shadow-emerald-500/10">
                <CheckCircle2 size={13} className="text-emerald-400" />
                <span>Answer</span>
              </div>

              <div className="inline-flex items-center gap-1 text-xs text-emerald-400/80 font-medium">
                <Sparkles size={14} className="text-emerald-400 animate-pulse" />
                <span>Key Takeaway</span>
              </div>
            </div>

            {/* Centered Answer Body */}
            <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-2 py-4 sm:px-6 text-center">
              <p className="text-xl sm:text-2xl md:text-3xl font-bold leading-relaxed sm:leading-snug text-emerald-100 tracking-tight select-text max-w-xl">
                {card.answer}
              </p>
            </div>

            {/* Footer: Card Details & Flip Back Pill */}
            <div className="relative z-10 flex items-center justify-between gap-3 pt-2 border-t border-emerald-900/30">
              <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                <BookOpen size={13} className="text-emerald-400" />
                <span>Card ID: {card.id.slice(0, 10)}</span>
              </div>

              <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-200 transition group-hover:bg-emerald-500/20">
                <RotateCcw size={13} className="text-emerald-300" />
                <span>Tap to flip back</span>
              </div>
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}
