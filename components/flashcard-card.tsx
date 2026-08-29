"use client";

import { Flashcard } from "@/types/flashcard";
import { ArrowLeftRight, Sparkles } from "lucide-react";
import { useState } from "react";

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

  return (
    <div className="perspective-1000 w-full max-w-xl">
      <button
        type="button"
        onClick={() => {
          setIsFlipped((prev) => !prev);
          onToggle?.();
        }}
        aria-label="Flip flashcard"
        className="group block h-[360px] w-full cursor-pointer select-none text-left sm:h-[420px]"
      >
        <div
          className={`relative h-full w-full rounded-[2rem] border border-slate-700 bg-slate-900 shadow-[0_30px_80px_rgba(15,23,42,0.8)] transition-transform duration-500 transform-style-3d ${
            isFlipped ? "rotate-y-180" : ""
          }`}
        >
          <div className="backface-hidden absolute inset-0 flex h-full flex-col justify-between overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 p-6 sm:p-7">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.25em] text-cyan-300">
              <span>Question</span>
              <Sparkles size={16} />
            </div>

            <div className="flex flex-1 flex-col justify-center gap-4">
              <p className="text-xl leading-relaxed font-medium text-slate-100 sm:text-2xl">
                {card.question}
              </p>
            </div>

            <div className="flex items-center justify-between gap-3 text-sm text-slate-400">
              <span className="line-clamp-1">
                {card.tags.join(" • ") || "General"}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/80 px-2.5 py-1.5 text-xs text-slate-200">
                Flip <ArrowLeftRight size={12} />
              </span>
            </div>
          </div>

          <div className="backface-hidden absolute inset-0 flex h-full rotate-y-180 flex-col justify-between overflow-hidden rounded-[2rem] bg-gradient-to-br from-cyan-700/20 via-slate-900 to-emerald-700/20 p-6 sm:p-7">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.25em] text-emerald-300">
              <span>Answer</span>
              <Sparkles size={16} />
            </div>

            <div className="flex flex-1 flex-col justify-center gap-4">
              <p className="text-xl leading-relaxed font-medium text-slate-100 sm:text-2xl">
                {card.answer}
              </p>
            </div>

            <div className="flex items-center justify-between gap-3 text-sm text-slate-200">
              <span>Difficulty {card.difficulty}/5</span>
              <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2.5 py-1.5 text-[11px] text-emerald-200">
                Tap to flip back
              </span>
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}
