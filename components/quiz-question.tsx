import { Flashcard } from "@/types/flashcard";
import { Bookmark, Sparkles, Tag, Zap } from "lucide-react";

interface QuizQuestionProps {
  question: Flashcard;
  options: string[];
  onSelect: (answer: string) => void;
  selectedAnswer?: string;
  questionNumber?: number;
  totalQuestions?: number;
  adaptiveBoost?: number;
  isFlagged?: boolean;
  onToggleFlag?: () => void;
}

const OPTION_LABELS = ["A", "B", "C", "D", "E", "F"];

export function QuizQuestion({
  question,
  options,
  onSelect,
  selectedAnswer,
  questionNumber,
  totalQuestions,
  adaptiveBoost = 0,
  isFlagged = false,
  onToggleFlag,
}: QuizQuestionProps) {
  return (
    <div className="w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-900/90 p-5 sm:p-7 shadow-2xl shadow-slate-950/40 backdrop-blur-sm transition-all">
      {/* Question Header & Meta */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3.5 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          {questionNumber !== undefined && totalQuestions !== undefined ? (
            <span className="rounded-md bg-cyan-500/15 px-2.5 py-1 font-mono font-bold text-cyan-300 border border-cyan-500/30">
              Q{questionNumber} of {totalQuestions}
            </span>
          ) : (
            <span className="font-semibold text-slate-300">Question</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full border border-slate-700 bg-slate-950 px-2.5 py-1 text-[11px] font-medium text-slate-300">
            Difficulty {question.difficulty}/5
          </span>

          {onToggleFlag && (
            <button
              type="button"
              onClick={onToggleFlag}
              title={isFlagged ? "Flagged for review - Click to unflag" : "Flag question for later review"}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer ${
                isFlagged
                  ? "border border-amber-500/60 bg-amber-500/20 text-amber-300 shadow-sm shadow-amber-500/20"
                  : "border border-slate-800 bg-slate-950/80 text-slate-400 hover:border-slate-700 hover:text-slate-200"
              }`}
            >
              <Bookmark size={11} className={isFlagged ? "fill-amber-400 text-amber-400" : ""} />
              <span>{isFlagged ? "Flagged 🚩" : "Flag"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Question Prompt */}
      <h2 className="mb-6 text-xl sm:text-2xl font-bold leading-relaxed text-white tracking-tight">
        {question.question}
      </h2>

      {/* Tags if present */}
      {question.tags && question.tags.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-1.5">
          <Tag size={12} className="text-slate-500" />
          {question.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-slate-950/80 border border-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-400"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Multiple Choice Options */}
      <div className="grid gap-3">
        {options.map((option, idx) => {
          const isSelected = selectedAnswer === option;
          const label = OPTION_LABELS[idx] || `${idx + 1}`;

          return (
            <button
              key={`${idx}-${option}`}
              type="button"
              onClick={() => onSelect(option)}
              className={`group flex items-center gap-3.5 rounded-2xl border p-3.5 sm:p-4 text-left text-sm sm:text-base font-medium transition-all duration-150 active:scale-[0.985] cursor-pointer min-h-[52px] ${
                isSelected
                  ? "border-cyan-400 bg-cyan-500/15 text-cyan-100 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400/50"
                  : "border-slate-800 bg-slate-950/70 text-slate-200 hover:border-slate-600 hover:bg-slate-800/80"
              }`}
            >
              {/* Option Letter Indicator */}
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-mono text-xs font-bold transition-colors ${
                  isSelected
                    ? "bg-cyan-400 text-slate-950 shadow-md shadow-cyan-400/30"
                    : "border border-slate-700 bg-slate-900 text-slate-400 group-hover:border-slate-500 group-hover:text-slate-200"
                }`}
              >
                {label}
              </div>

              {/* Option Text */}
              <span className="flex-1 leading-snug break-words">
                {option}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

