"use client";

import { useEffect, useRef, useState } from "react";
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Flame,
  Folder,
  History,
  Layers,
  RotateCcw,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";
import { Deck, TestRecord } from "@/types/flashcard";
import { fetchTestHistory } from "@/lib/flashcardService";

interface TestHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  origin?: { x: number; y: number } | null;
  deckId?: string;
  decks: Deck[];
  onRetakeDeck: (deckId: string) => void;
}

export function TestHistoryModal({
  isOpen,
  onClose,
  origin,
  deckId,
  decks,
  onRetakeDeck,
}: TestHistoryModalProps) {
  const [isRendered, setIsRendered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [records, setRecords] = useState<TestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDeckId, setFilterDeckId] = useState<string>(deckId || "all");

  const innerRef = useRef<HTMLDivElement>(null);
  const [modalHeight, setModalHeight] = useState<number | undefined>(undefined);

  // Two-frame RAF spring animation hook
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

  // Load history data when opened
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchTestHistory()
        .then((data) => {
          setRecords(data);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Dynamic height measurement with ResizeObserver
  useEffect(() => {
    if (!isRendered) return;

    const measureAndSetHeight = () => {
      if (innerRef.current) {
        const measured = innerRef.current.offsetHeight;
        if (measured > 0) {
          const maxHeight = typeof window !== "undefined" ? window.innerHeight * 0.9 : 800;
          setModalHeight(Math.min(measured, maxHeight));
        }
      }
    };

    measureAndSetHeight();
    const raf = requestAnimationFrame(measureAndSetHeight);

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && innerRef.current) {
      ro = new ResizeObserver(() => {
        measureAndSetHeight();
      });
      ro.observe(innerRef.current);
    }

    return () => {
      cancelAnimationFrame(raf);
      if (ro) ro.disconnect();
    };
  }, [isRendered, filterDeckId, records.length, loading]);

  // Spring physics from button origin to center
  const getModalSpringStyle = () => {
    if (typeof window === "undefined") return {};

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    const targetX = origin ? origin.x : centerX;
    const targetY = origin ? origin.y : centerY - 20;

    const deltaX = targetX - centerX;
    const deltaY = targetY - centerY;

    if (isVisible) {
      return {
        transform: "translate3d(0px, 0px, 0px) scale(1)",
        opacity: 1,
        height: modalHeight ? `${modalHeight}px` : "auto",
        transition:
          "height 380ms cubic-bezier(0.16, 1, 0.3, 1), transform 380ms cubic-bezier(0.34, 1.3, 0.64, 1), opacity 250ms ease-out",
      };
    } else {
      return {
        transform: `translate3d(${deltaX}px, ${deltaY}px, 0px) scale(0.04)`,
        opacity: 0,
        height: modalHeight ? `${modalHeight}px` : "auto",
        pointerEvents: "none" as const,
        transition:
          "transform 300ms cubic-bezier(0.4, 0, 0.2, 1), opacity 220ms ease-in",
      };
    }
  };

  if (!isRendered) return null;

  const filteredRecords = records.filter((r) => {
    if (filterDeckId === "all") return true;
    return (
      r.deckId === filterDeckId ||
      (r.deckBreakdowns && r.deckBreakdowns.some((b) => b.deckId === filterDeckId))
    );
  });

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      onClick={onClose}
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ease-out ${
        isVisible
          ? "bg-slate-950/80 backdrop-blur-md opacity-100 pointer-events-auto"
          : "bg-slate-950/0 backdrop-blur-none opacity-0 pointer-events-none"
      }`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={getModalSpringStyle()}
        className="relative flex flex-col w-full max-w-2xl overflow-hidden rounded-3xl border border-cyan-500/40 bg-slate-900/95 shadow-2xl shadow-cyan-950/50 origin-center"
      >
        {/* Top Glow Accent Bar */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-400 via-teal-400 to-indigo-500" />

        <div ref={innerRef} className="flex flex-col p-5 sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/20">
                <Trophy size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Test Scores &amp; History</h2>
                <p className="text-xs text-slate-400">
                  {records.length} Recorded Assessment{records.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
              title="Close (ESC)"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Deck Filter Row */}
          <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button
              type="button"
              onClick={() => setFilterDeckId("all")}
              className={`rounded-xl px-3 py-1.5 font-semibold transition shrink-0 cursor-pointer ${
                filterDeckId === "all"
                  ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-bold"
                  : "bg-slate-950/80 text-slate-400 border border-slate-800 hover:text-slate-200"
              }`}
            >
              All Decks
            </button>
            {decks.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setFilterDeckId(d.id)}
                className={`rounded-xl px-3 py-1.5 font-semibold transition shrink-0 cursor-pointer ${
                  filterDeckId === d.id
                    ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-bold"
                    : "bg-slate-950/80 text-slate-400 border border-slate-800 hover:text-slate-200"
                }`}
              >
                {d.title}
              </button>
            ))}
          </div>

          {/* Records List */}
          <div className="mt-3 flex-1 overflow-y-auto pr-1 space-y-3 max-h-[48vh] scrollbar-thin scrollbar-thumb-slate-700">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
                Loading your test history…
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center text-slate-400 text-xs">
                No recorded tests found for this filter. Complete a quiz to see your scores here!
              </div>
            ) : (
              filteredRecords.map((rec) => {
                const isPassed = rec.scorePercentage >= 75;
                return (
                  <div
                    key={rec.id}
                    className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 space-y-3 transition hover:border-slate-700"
                  >
                    {/* Top row: Title, Score Badge, Date */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Folder size={14} className="text-cyan-400" />
                        <span className="text-xs font-bold text-white">{rec.deckTitle}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Calendar size={11} />
                          {formatDate(rec.completedAt)}
                        </span>
                        <div
                          className={`rounded-xl px-2.5 py-1 text-xs font-mono font-bold ${
                            isPassed
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                              : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                          }`}
                        >
                          {rec.scorePercentage}%
                        </div>
                      </div>
                    </div>

                    {/* Meta stats bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80">
                      <div className="flex items-center gap-3">
                        <span>
                          Score:{" "}
                          <strong className="text-slate-200">
                            {rec.correctAnswers}/{rec.totalQuestions}
                          </strong>
                        </span>
                        {rec.timeSpentSeconds > 0 && (
                          <span className="flex items-center gap-1">
                            <Clock size={11} />
                            {formatDuration(rec.timeSpentSeconds)}
                          </span>
                        )}
                        {rec.adaptivePeak > 0 && (
                          <span className="flex items-center gap-1 text-amber-300">
                            <Flame size={11} />
                            +{rec.adaptivePeak}% Difficulty
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onRetakeDeck(rec.deckId);
                          onClose();
                        }}
                        className="inline-flex items-center gap-1 rounded-lg bg-cyan-500/20 px-2.5 py-1 text-[11px] font-bold text-cyan-300 hover:bg-cyan-500 hover:text-slate-950 transition cursor-pointer"
                      >
                        <RotateCcw size={11} />
                        <span>Retake</span>
                      </button>
                    </div>

                    {/* Multi-Deck Breakdown if present */}
                    {rec.deckBreakdowns && rec.deckBreakdowns.length > 1 && (
                      <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 block">
                          Separated Deck Scores:
                        </span>
                        <div className="grid gap-1.5 sm:grid-cols-2">
                          {rec.deckBreakdowns.map((b) => (
                            <div
                              key={b.deckId}
                              className="flex items-center justify-between rounded-xl bg-slate-900/90 px-2.5 py-1.5 text-xs border border-slate-800"
                            >
                              <div className="min-w-0 pr-2">
                                <p className="text-[11px] font-medium text-slate-300 truncate">
                                  {b.deckTitle}
                                </p>
                                <p className="text-[10px] text-slate-500">
                                  {b.correct}/{b.total} correct
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span
                                  className={`text-[11px] font-mono font-bold ${
                                    b.accuracy >= 75 ? "text-emerald-400" : "text-rose-400"
                                  }`}
                                >
                                  {b.accuracy}%
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onRetakeDeck(b.deckId);
                                    onClose();
                                  }}
                                  title={`Retake ${b.deckTitle}`}
                                  className="rounded p-1 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition cursor-pointer"
                                >
                                  <RotateCcw size={11} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
