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
  Headphones,
  HelpCircle,
  History,
  Layers,
  ListOrdered,
  PlusCircle,
  Rocket,
  Search,
  Shuffle,
  Sparkles,
  Table,
  Wand2,
  X,
  Zap,
} from "lucide-react";
import { APP_VERSION } from "@/lib/version";

export const CURRENT_APP_VERSION = APP_VERSION;
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
    icon: Sparkles,
    title: "Origin-Anchored Spring Growth Animations",
    badge: "Motion Design",
    badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
    desc: "Interactive Tour and What's New modals now sprout and blossom directly out of the exact activator button clicked, and smoothly reverse-shrink back into it on close.",
    href: "/decks",
    actionText: "Try It",
  },
  {
    icon: Zap,
    title: "Adaptive Height Growth & Directional Tab Swiping",
    badge: "Fluid UX",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    desc: "Study Music Lounge and Interactive Tour now fluidly adapt their height with smooth cubic-bezier transitions when navigating steps or tabs. Tab switching slides left or right based on navigation direction.",
    href: "/review",
    actionText: "Open Lounge",
  },
  {
    icon: Rocket,
    title: "Gliding Segmented Navbar Indicator",
    badge: "Navigation",
    badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
    desc: "Desktop navigation bar now features a sliding active indicator pill that glides across tabs (Decks, Review, Test, Create) with directional entering transitions and morphing mobile hamburger icons.",
    href: "/test",
    actionText: "Try Nav",
  },
  {
    icon: Headphones,
    title: "Study Music Lounge with YouTube Audio Engine",
    badge: "Music Update",
    badgeColor: "bg-teal-500/20 text-teal-300 border-teal-500/40",
    desc: "Listen to relaxing Casual Game Cozy BGM, Lo-Fi study beats, or paste full YouTube / YouTube Music playlist links with smart auto-failover, scrubbers, and persistent background playback.",
    href: "/review",
    actionText: "Listen Now",
  },
];

export function WhatsNewModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null);
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
          setOrigin(null);
          setIsOpen(true);
        }
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  // Global event listener to open What's New manually
  useEffect(() => {
    const handleOpen = (e: Event) => {
      const customEvent = e as CustomEvent<{ x?: number; y?: number }>;
      if (
        customEvent.detail &&
        typeof customEvent.detail.x === "number" &&
        typeof customEvent.detail.y === "number"
      ) {
        setOrigin({ x: customEvent.detail.x, y: customEvent.detail.y });
      } else {
        setOrigin(null);
      }
      setIsOpen(true);
    };
    window.addEventListener("open-whats-new", handleOpen);
    return () => window.removeEventListener("open-whats-new", handleOpen);
  }, []);

  // Synchronize enter & exit animation with double-rAF and timeout
  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
      return () => cancelAnimationFrame(raf);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => {
        setIsRendered(false);
      }, 340);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, dontShowAgain]);

  const handleClose = () => {
    if (dontShowAgain && typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, CURRENT_APP_VERSION);
    }
    setIsOpen(false);
  };

  const handleOpenTour = (e?: React.MouseEvent) => {
    handleClose();
    if (typeof window !== "undefined") {
      const detail = e ? { x: e.clientX, y: e.clientY } : undefined;
      window.dispatchEvent(new CustomEvent("open-reviewflash-tour", { detail }));
    }
  };

  if (!isRendered) return null;

  // Calculate dynamic transform to spring-grow out of the activating button
  const getTransformStyle = () => {
    if (typeof window === "undefined") return {};

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    const targetX = origin ? origin.x : centerX;
    const targetY = origin ? origin.y : centerY - 30;

    const deltaX = targetX - centerX;
    const deltaY = targetY - centerY;

    if (isVisible) {
      return {
        transform: "translate3d(0px, 0px, 0px) scale(1)",
        opacity: 1,
        transition: "transform 360ms cubic-bezier(0.34, 1.3, 0.64, 1), opacity 250ms ease-out",
      };
    } else {
      return {
        transform: `translate3d(${deltaX}px, ${deltaY}px, 0px) scale(0.04)`,
        opacity: 0,
        pointerEvents: "none" as const,
        transition: "transform 300ms cubic-bezier(0.4, 0, 0.2, 1), opacity 220ms ease-in",
      };
    }
  };

  return (
    <div
      onClick={handleClose}
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ease-out ${
        isVisible
          ? "bg-slate-950/80 backdrop-blur-md opacity-100"
          : "bg-slate-950/0 backdrop-blur-none opacity-0 pointer-events-none"
      }`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={getTransformStyle()}
        className="relative w-full max-w-2xl rounded-3xl border border-cyan-500/40 bg-slate-900/95 shadow-2xl shadow-cyan-500/10 overflow-hidden flex flex-col max-h-[90vh] origin-center"
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
              onClick={(e) => handleOpenTour(e)}
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
