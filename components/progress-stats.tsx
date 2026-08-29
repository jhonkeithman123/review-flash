import { UserStats } from "@/types/flashcard";

export function ProgressStats({ stats }: { stats: UserStats }) {
  const cards = [
    { label: "Reviewed", value: stats.reviewed },
    { label: "Correct", value: stats.correct },
    { label: "Accuracy", value: `${stats.accuracy}%` },
    { label: "Tests", value: stats.totalTests },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-slate-700 bg-slate-900 p-4 shadow-lg shadow-slate-950/20"
        >
          <p className="text-sm text-slate-400">{item.label}</p>
          <p className="mt-2 text-3xl font-semibold text-white">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
