"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Cpu,
  GraduationCap,
  HelpCircle,
  History,
  Layers,
  PlusCircle,
  Rocket,
  Search,
  Sparkles,
  Table,
  Wand2,
  X,
  Zap,
} from "lucide-react";

export const CURRENT_APP_VERSION = "v1.4.0";
const STORAGE_KEY = "reviewflash_last_seen_version";

interface FeatureHighlight {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  badge: string;
  badgeColor: string;
  desc: string;
  href?: string;
  actionText?: string;
}

const HIGHLIGHTS: FeatureHighlight[] = [
  {
    icon: Wand2,
    title: "Dual-Engine Smart Auto-Detect",
    badge: "AI & Fast Regex",
    badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
    desc: "Toggle between instant Native Regex Detection (numbered exam lists, bold answers, delimiters) and DITroy Cloud AI (synthesize new flashcards from raw paragraphs/articles or extract messy Q&A).",
    href: "/create",
    actionText: "Try in Studio",
  },
  {
    icon: HelpCircle,
    title: "Help & FAQ Center with Live Playground",
    badge: "New Center",
    badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
    desc: "Explore interactive insertion format cheat sheets, copyable study templates, searchable FAQs, and an in-browser live parsing simulator.",
    href: "/help",
    actionText: "Open Help Center",
  },
  {
    icon: Table,
    title: "Rich Markdown & Tables in AI Tutor",
    badge: "Visual AI",
    badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/40",
    desc: "DITroy AI Study Tutor now formats analogies into styled glassmorphism data tables, highlighted mnemonic callouts, and step-by-step numbered badges.",
    href: "/review",
    actionText: "Try in Review",
  },
  {
    icon: Rocket,
    title: "Dropdown-Powered Modern Navbar",
    badge: "UI / UX",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    desc: "Refactored top bar with zero overlapping buttons, compact profile dropdown menu, quick resources menu, and custom brand logos.",
  },
];

export function WhatsNewModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(true);

  // Check version on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const lastSeen = localStorage.getItem(STORAGE_KEY);
    // If user hasn't seen current version yet, show announcement after slight delay
    if (lastSeen !== CURRENT_APP_VERSION) {
      const timer = setTimeout(() => {
        // Only open if the first-time tour is not actively open
        const isTourActive = document.querySelector("[data-tour-modal='true']");
        if (!isTourActive) {
          setIsOpen(true);
        }
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  // Global event listener to open What's New manually
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("open-whats-new", handleOpen);
    return () => window.removeEventListener("open-whats-new", handleOpen);
  }, []);

  const handleClose = () => {
    if (dontShowAgain && typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, CURRENT_APP_VERSION);
    }
    setIsOpen(false);
  };

  const handleOpenTour = () => {
    handleClose();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-reviewflash-tour"));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl rounded-3xl border border-cyan-500/40 bg-slate-900/95 shadow-2xl shadow-cyan-500/10 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        data-whatsnew-modal="true"
      >
        {/* Background Glowing Ambient Accents */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 h-48 w-48 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 -mt-16 -ml-16 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="relative p-6 pb-4 border-b border-slate-800 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative h-12 w-12 rounded-2xl bg-slate-900 border border-cyan-500/40 p-1 shadow-lg shadow-cyan-500/20 overflow-hidden flex items-center justify-center shrink-0">
              <img
                src="/favicon.png"
                alt="ReviewFlash Logo"
                className="h-full w-full object-contain rounded-xl"
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-500 px-2.5 py-0.5 text-xs font-black text-slate-950 font-mono shadow-sm">
                  {CURRENT_APP_VERSION}
                </span>
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Latest Update
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
                What&apos;s New in ReviewFlash
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="rounded-xl border border-slate-800 bg-slate-950/80 p-2 text-slate-400 hover:text-white hover:border-slate-700 transition cursor-pointer"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body: Feature Highlights */}
        <div className="p-6 space-y-3.5 overflow-y-auto flex-1">
          <p className="text-xs text-slate-300 leading-relaxed">
            Welcome to the <strong>{CURRENT_APP_VERSION} release</strong>! Here are the key upgrades built to supercharge your active recall learning:
          </p>

          <div className="grid grid-cols-1 gap-3 pt-1">
            {HIGHLIGHTS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3.5 space-y-2 hover:border-slate-700 transition"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 shrink-0">
                        <Icon size={16} />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-100">
                          {item.title}
                        </h3>
                        <span
                          className={`inline-block rounded px-1.5 py-0.2 text-[9px] font-bold border mt-0.5 ${item.badgeColor}`}
                        >
                          {item.badge}
                        </span>
                      </div>
                    </div>

                    {item.href && item.actionText && (
                      <Link
                        href={item.href}
                        onClick={handleClose}
                        className="hidden sm:inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-cyan-300 hover:border-cyan-500/50 hover:bg-cyan-500/10 transition shrink-0"
                      >
                        <span>{item.actionText}</span>
                        <ChevronRight size={12} />
                      </Link>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed pl-10">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-slate-800/80 bg-slate-950/90 flex flex-col sm:flex-row items-center justify-between gap-4">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400 hover:text-slate-200 select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="rounded border-slate-700 accent-cyan-500"
            />
            <span>Don&apos;t show again for {CURRENT_APP_VERSION}</span>
          </label>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleOpenTour}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-3.5 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-500/20 transition cursor-pointer"
            >
              <GraduationCap size={14} />
              <span>Tour 🎓</span>
            </button>

            <Link
              href="/updates"
              onClick={handleClose}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition cursor-pointer"
            >
              <History size={14} />
              <span>Changelog</span>
            </Link>

            <button
              type="button"
              onClick={handleClose}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition cursor-pointer shadow-lg shadow-cyan-500/20"
            >
              <span>Explore Now</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
