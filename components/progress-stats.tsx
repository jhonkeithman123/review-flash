import { BookOpen, CheckCircle2, Target, Trophy } from "lucide-react";
import { UserStats } from "@/types/flashcard";

export function ProgressStats({ stats }: { stats: UserStats }) {
  const items = [
    {
      label: "Reviewed",
      value: stats.reviewed,
      icon: BookOpen,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/20",
    },
    {
      label: "Correct",
      value: stats.correct,
      icon: CheckCircle2,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      label: "Accuracy",
      value: `${stats.accuracy}%`,
      icon: Target,
      color: "text-indigo-400",
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/20",
    },
    {
      label: "Tests",
      value: stats.totalTests,
      icon: Trophy,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className="flex items-center justify-between rounded-xl sm:rounded-2xl border border-slate-800 bg-slate-900/80 px-3 py-2 sm:px-3.5 sm:py-2.5 shadow-sm transition hover:border-slate-700"
          >
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-400 truncate">
                {item.label}
              </p>
              <p className="mt-0.5 text-base sm:text-lg font-bold text-white tracking-tight leading-none">
                {item.value}
              </p>
            </div>
            <div
              className={`flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg sm:rounded-xl border ${item.border} ${item.bg} ${item.color} ml-2`}
            >
              <Icon size={14} className="sm:h-4 sm:w-4" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
