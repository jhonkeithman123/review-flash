"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  Code2,
  Cpu,
  ExternalLink,
  Flame,
  FolderKanban,
  Globe,
  GraduationCap,
  Headphones,
  Heart,
  HelpCircle,
  History,
  Layers,
  LayoutGrid,
  ListOrdered,
  Lock,
  Mail,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  Terminal,
  User,
  Zap,
} from "lucide-react";
import { APP_VERSION, APP_CODENAME, APP_RELEASE_DATE } from "@/lib/version";

export default function AboutPage() {
  const creatorEmail = "keithvirgenes17@gmail.com";
  const githubUrl = "https://github.com/jhonkeithman123";

  return (
    <div className="space-y-12 pb-16">
      {/* 1. HERO SECTION */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-linear-to-br from-slate-900 via-slate-950 to-slate-900 p-8 sm:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3.5 py-1 text-xs font-bold text-cyan-300 shadow-sm shadow-cyan-500/10">
            <Sparkles size={13} className="text-cyan-400 animate-pulse" />
            <span>About ReviewFlash &amp; The Creator</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Built for <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">Flow</span>, Engineered for <span className="bg-gradient-to-r from-emerald-400 to-cyan-300 bg-clip-text text-transparent">Mastery</span>.
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            ReviewFlash is a high-performance active recall flashcard, spaced repetition, and adaptive assessment ecosystem created to eliminate learning friction with evidence-based cognitive science, tactile 3D physical interactions, and ambient focus soundscapes.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/review"
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-400 px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-950 hover:brightness-110 transition shadow-lg shadow-cyan-500/20 active:scale-95 cursor-pointer"
            >
              <BookOpen size={16} />
              <span>Start Reviewing</span>
            </Link>
            <Link
              href="/test"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/90 px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-200 hover:border-slate-500 hover:text-white transition active:scale-95 cursor-pointer"
            >
              <Zap size={16} className="text-amber-400" />
              <span>Take Adaptive Quiz</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. CREATOR SPOTLIGHT */}
      <div className="rounded-3xl border border-cyan-500/30 bg-slate-900/80 p-6 sm:p-8 backdrop-blur-xl shadow-xl shadow-cyan-950/30 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-600 text-slate-950 font-black text-2xl shadow-lg shadow-cyan-500/25 border-2 border-cyan-300/40">
              <span>KV</span>
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-slate-900" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-white">Keith Virgenes</h2>
                <span className="rounded-md bg-cyan-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-cyan-300 border border-cyan-500/40">
                  @131fgh
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Lead Architect &amp; Full-Stack Creator • ReviewFlash &amp; DITroy AI
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:border-cyan-400 hover:text-white transition cursor-pointer active:scale-95"
            >
              <svg className="h-3.5 w-3.5 fill-current text-white" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>GitHub</span>
              <ExternalLink size={11} className="opacity-60" />
            </a>
            <a
              href={`mailto:${creatorEmail}`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-3.5 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition cursor-pointer active:scale-95"
            >
              <Mail size={14} className="text-cyan-400" />
              <span>Contact</span>
            </a>
          </div>
        </div>

        {/* Creator's Vision Quote */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-5 sm:p-6 text-sm text-slate-300 space-y-3">
          <p className="italic text-slate-200 leading-relaxed">
            &ldquo;Learning should feel like flow, not friction. ReviewFlash was born from the desire to create a study platform where every interaction feels tactile and rewarding—where spaced repetition is effortless, multiple-choice distractors are genuinely intelligent, and ambient music keeps you locked into deep focus.&rdquo;
          </p>
          <div className="flex items-center justify-between pt-2 text-xs text-slate-500 border-t border-slate-800/60">
            <span>— Keith Virgenes, Creator of ReviewFlash</span>
            <span className="font-mono text-cyan-400">{APP_VERSION} ({APP_CODENAME})</span>
          </div>
        </div>
      </div>

      {/* 3. CORE DESIGN PILLARS */}
      <div className="space-y-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-400">
            Design Philosophy &amp; Cognitive Science
          </p>
          <h2 className="mt-1 text-2xl sm:text-3xl font-bold text-white tracking-tight">
            The 5 Pillars of ReviewFlash
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Pillar 1 */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 space-y-3 hover:border-cyan-500/40 transition group">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 group-hover:scale-110 transition-transform">
              <BrainCircuit size={20} />
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
              1. SM-2 Spaced Retrieval
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Calculates optimal review intervals based on easiness factor ($EF$), repetition streaks, and recall latency. Cards you struggle with resurface frequently, locking concepts into long-term memory.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 space-y-3 hover:border-teal-500/40 transition group">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-500/20 text-teal-300 border border-teal-500/40 group-hover:scale-110 transition-transform">
              <Sparkles size={20} />
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-teal-300 transition-colors">
              2. DITroy AI Adaptive Engine
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dynamically generates logically relative, intelligent distractors for multiple-choice quizzes, analyzes weak concept clusters, and provides study clues without spoiling answers.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 space-y-3 hover:border-emerald-500/40 transition group">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 group-hover:scale-110 transition-transform">
              <Layers size={20} />
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
              3. Tactile 3D Motion Physics
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every action provides physical feedback: 3D perspective card flips, physical dealing animations, emerald mastery bursts, and sideways length morphing between Grid and List modes.
            </p>
          </div>

          {/* Pillar 4 */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 space-y-3 hover:border-purple-500/40 transition group">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/40 group-hover:scale-110 transition-transform">
              <Headphones size={20} />
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors">
              4. Ambient Study Music Lounge
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Built-in background YouTube Audio Engine streaming curated Lo-Fi, Synthwave, Classical, and Nature audio with seamless background playback and batch URL importing.
            </p>
          </div>

          {/* Pillar 5 */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 space-y-3 hover:border-amber-500/40 transition group">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/40 group-hover:scale-110 transition-transform">
              <ShieldCheck size={20} />
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
              5. Sovereignty &amp; Deck Forking
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Inspired by open-source collaboration, users can share decks with granular permission controls or fork public libraries into sovereign clones with full owner editing privileges.
            </p>
          </div>

          {/* Practical Quest Card */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 space-y-3 hover:border-cyan-500/40 transition group">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 group-hover:scale-110 transition-transform">
              <Target size={20} />
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
              Interactive Practical Quest
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Hate reading instructions? The interactive quest guides learners through hands-on actions with dynamic spotlights, live feedback, and rewarding celebration confetti.
            </p>
          </div>
        </div>
      </div>

      {/* 4. TECH STACK SHOWCASE */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
          <Terminal size={14} className="text-cyan-400" />
          <span>Technology Stack &amp; Architecture</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3.5 text-center space-y-1">
            <div className="text-xs font-bold text-white">Next.js 16</div>
            <div className="text-[10px] text-slate-400">Turbopack App Router</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3.5 text-center space-y-1">
            <div className="text-xs font-bold text-white">React 19</div>
            <div className="text-[10px] text-slate-400">Concurrent Rendering</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3.5 text-center space-y-1">
            <div className="text-xs font-bold text-white">TypeScript</div>
            <div className="text-[10px] text-slate-400">Strict Type Safety</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3.5 text-center space-y-1">
            <div className="text-xs font-bold text-white">Tailwind CSS 4</div>
            <div className="text-[10px] text-slate-400">Modern Design System</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3.5 text-center space-y-1">
            <div className="text-xs font-bold text-white">Cloud Firestore</div>
            <div className="text-[10px] text-slate-400">Real-time NoSQL DB</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3.5 text-center space-y-1">
            <div className="text-xs font-bold text-white">DITroy AI</div>
            <div className="text-[10px] text-slate-400">Adaptive Intelligence</div>
          </div>
        </div>
      </div>

      {/* 5. EXPLORE & DOCUMENTATION LINKS */}
      <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-lg font-bold text-white">Explore More of ReviewFlash</h3>
          <p className="text-xs text-slate-400">
            Discover release logs, FAQs, support channels, and computer science architecture concepts.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <Link
            href="/updates"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:border-cyan-400 hover:text-white transition cursor-pointer"
          >
            <Rocket size={14} className="text-cyan-400" />
            <span>Changelog &amp; Updates</span>
          </Link>
          <Link
            href="/help"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:border-indigo-400 hover:text-white transition cursor-pointer"
          >
            <HelpCircle size={14} className="text-indigo-400" />
            <span>Help &amp; FAQs</span>
          </Link>
          <Link
            href="/support"
            className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-3.5 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-500/20 transition cursor-pointer"
          >
            <Mail size={14} className="text-cyan-400" />
            <span>Support &amp; Feedback</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
