import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  FolderKanban,
  PlusCircle,
  Share2,
  Sparkles,
  Zap,
} from "lucide-react";

const featureCards = [
  {
    href: "/decks",
    title: "Deck Library",
    description:
      "Browse study sets, organize topics, duplicate sets, and manage your full flashcard collection.",
    icon: FolderKanban,
    accent: "from-blue-400 to-indigo-500",
  },
  {
    href: "/create",
    title: "Fast Creation Studio",
    description:
      "Rapidly paste questions and answers, keep tags sticky across cards, and batch-set difficulty when finished.",
    icon: Zap,
    accent: "from-amber-400 to-orange-500",
  },
  {
    href: "/review",
    title: "Review Mode",
    description:
      "Flip through cards, rate your confidence, and build stronger recall with spaced repetition intervals.",
    icon: BookOpen,
    accent: "from-cyan-400 to-teal-500",
  },
  {
    href: "/test",
    title: "Test Mode",
    description:
      "Take timed multiple-choice quizzes generated from your chosen decks and track your performance.",
    icon: BrainCircuit,
    accent: "from-violet-400 to-fuchsia-500",
  },
  {
    href: "/share",
    title: "Deck Sharing Hub",
    description:
      "Share study sets with friends using 6-character codes or direct links, and 1-click import shared sets.",
    icon: Share2,
    accent: "from-emerald-400 to-teal-600",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-12 py-6">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-4xl border border-slate-800 bg-linear-to-br from-slate-900 via-slate-950 to-slate-900 p-8 sm:p-12 shadow-2xl shadow-slate-950/40">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.28em] text-cyan-300">
          <Sparkles size={14} className="text-cyan-400" />
          Next-Gen Study System
        </div>

        <h1 className="mt-4 max-w-2xl text-4xl font-extrabold tracking-tight text-white sm:text-6xl leading-[1.1]">
          Learn faster. <br className="hidden sm:inline" />
          <span className="bg-linear-to-r from-cyan-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
            Share study decks.
          </span>
        </h1>

        <p className="mt-6 max-w-xl text-base sm:text-lg text-slate-300 leading-relaxed">
          Create flashcard sets in seconds with rapid paste &amp; sticky tags, share with peers via share codes, and practice with active recall and quiz testing.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/review"
            className="inline-flex items-center gap-2 rounded-full bg-cyan-500 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/25 transition hover:bg-cyan-400"
          >
            Start Reviewing <ArrowRight size={18} />
          </Link>
          <Link
            href="/create"
            className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-6 py-3.5 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-900"
          >
            <PlusCircle size={18} className="text-cyan-400" />
            Fast Create Deck
          </Link>
          <Link
            href="/decks"
            className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-6 py-3.5 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-900"
          >
            <FolderKanban size={18} className="text-indigo-400" />
            Browse Decks
          </Link>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {featureCards.map(({ href, title, description, icon: Icon, accent }) => (
          <Link
            key={title}
            href={href}
            className="group block rounded-3xl border border-slate-800 bg-slate-900/80 p-6 transition hover:-translate-y-1 hover:border-cyan-500/60 hover:shadow-xl hover:shadow-cyan-500/10 backdrop-blur-sm"
          >
            <div
              className={`mb-5 inline-flex rounded-2xl bg-linear-to-br ${accent} p-3 text-slate-950`}
            >
              <Icon size={24} />
            </div>
            <h2 className="mb-2 text-xl font-bold text-white group-hover:text-cyan-300 transition">
              {title}
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}

