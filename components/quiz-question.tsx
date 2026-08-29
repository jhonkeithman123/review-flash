import { Flashcard } from "@/types/flashcard";

interface QuizQuestionProps {
  question: Flashcard;
  options: string[];
  onSelect: (answer: string) => void;
  selectedAnswer?: string;
}

export function QuizQuestion({
  question,
  options,
  onSelect,
  selectedAnswer,
}: QuizQuestionProps) {
  return (
    <div className="w-full max-w-2xl rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-xl shadow-slate-950/30">
      <div className="mb-4 flex items-center justify-between text-sm text-slate-400">
        <span>Question</span>
        <span className="rounded-full border border-slate-700 px-2 py-1 text-xs">
          Difficulty {question.difficulty}/5
        </span>
      </div>

      <h2 className="mb-6 text-2xl font-semibold leading-relaxed text-white">
        {question.question}
      </h2>

      <div className="grid gap-3">
        {options.map((option) => {
          const isSelected = selectedAnswer === option;

          return (
            <button
              key={option}
              type="button"
              onClick={() => onSelect(option)}
              className={`rounded-2xl border px-4 py-3 text-left text-base transition ${
                isSelected
                  ? "border-cyan-500 bg-cyan-500/10 text-cyan-100"
                  : "border-slate-700 bg-slate-950/60 text-slate-200 hover:border-slate-500 hover:bg-slate-800/80"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
