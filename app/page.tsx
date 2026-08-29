import Link from "next/link";
import { ArrowRight, BookOpen, BrainCircuit, PlusCircle } from "lucide-react";

const modes = [
  {
    href: "/review",
    title: "Review Mode",
    description:
      "Flip through cards, rate your confidence, and build stronger recall with spaced repetition.",
    icon: BookOpen,
    accent: "from-cyan-400 to-blue-500",
  },
  {
    href: "/test",
    title: "Test Mode",
    description:
      "Take randomized multiple-choice quizzes and track your score across attempts.",
    icon: BrainCircuit,
    accent: "from-violet-400 to-fuchsia-500",
  },
  {
    href: "/create",
    title: "Create Deck",
    description:
      "Add your own cards with tags, difficulty levels, and polished review-ready content.",
    icon: PlusCircle,
    accent: "from-emerald-400 to-teal-500",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-12 py-8">
      <section className="rounded-4xl border border-slate-800 bg-linear-to-br from-slate-900 via-slate-950 to-slate-900 p-8 shadow-2xl shadow-slate-950/40">
        <p className="mb-4 text-sm uppercase tracking-[0.28em] text-cyan-300">
          Study smarter
        </p>
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-white md:text-6xl">
          Flashcards built for fast recall and sharper learning.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-slate-300">
          Review key ideas, test your understanding, and keep your study deck
          organized in one clean workspace.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/review"
            className="inline-flex items-center gap-2 rounded-full bg-cyan-500 px-5 py-3 font-medium text-slate-950 transition hover:bg-cyan-400"
          >
            Start reviewing <ArrowRight size={18} />
          </Link>
          <Link
            href="/create"
            className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-5 py-3 font-medium text-slate-100 transition hover:border-slate-500 hover:bg-slate-900"
          >
            Create flashcards
          </Link>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        {modes.map(({ href, title, description, icon: Icon, accent }) => (
          <Link
            key={title}
            href={href}
            className="group block rounded-3xl border border-slate-800 bg-slate-900 p-5 transition hover:-translate-y-1 hover:border-cyan-500/60 hover:shadow-xl hover:shadow-cyan-500/10"
          >
            <div
              className={`mb-5 inline-flex rounded-2xl bg-linear-to-br ${accent} p-3 text-slate-950`}
            >
              <Icon size={24} />
            </div>
            <h2 className="mb-2 text-2xl font-semibold text-white">{title}</h2>
            <p className="text-slate-300">{description}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
