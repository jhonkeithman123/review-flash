"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  HelpCircle,
  ListOrdered,
  RotateCcw,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { Flashcard } from "@/types/flashcard";

interface JumpCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  cards: Flashcard[];
  currentIndex: number;
  deckTitle?: string;
  onJump: (cardNumber: number) => void;
  origin?: { x: number; y: number } | null;
  reviewedCardIds?: Map<string, { remembered: boolean }>;
}

export function JumpCardModal({
  isOpen,
  onClose,
  cards,
  currentIndex,
  deckTitle,
  onJump,
  origin,
  reviewedCardIds,
}: JumpCardModalProps) {
  const [isRendered, setIsRendered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [jumpInput, setJumpInput] = useState<string>(String(currentIndex + 1));
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "mastered" | "learning">("all");

  const innerRef = useRef<HTMLDivElement>(null);
  const [modalHeight, setModalHeight] = useState<number | undefined>(undefined);

  // Sync jump input when currentIndex changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setJumpInput(String(currentIndex + 1));
      setSearchQuery("");
    }
  }, [isOpen, currentIndex]);

  // Two-frame RAF spring animation hooks
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
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Real-time smooth content height measurement with ResizeObserver
  useEffect(() => {
    if (!isRendered) return;

    const measureAndSetHeight = () => {
      if (innerRef.current) {
        const measured = innerRef.current.offsetHeight;
        if (measured > 0) {
          const maxHeight = typeof window !== "undefined" ? window.innerHeight * 0.88 : 750;
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
  }, [isRendered, searchQuery, filterMode, cards.length]);

  // Dynamic CSS origin and delta for GPU-accelerated spring bloom
  const modalStyle = useMemo(() => {
    if (typeof window === "undefined") return {};

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    const targetX = origin ? origin.x : centerX;
    const targetY = origin ? origin.y : centerY - 30;

    const deltaX = targetX - centerX;
    const deltaY = targetY - centerY;

    return {
      "--origin-dx": `${deltaX}px`,
      "--origin-dy": `${deltaY}px`,
      "--origin-pos": `${targetX}px ${targetY}px`,
      height: modalHeight ? `${modalHeight}px` : "auto",
      transition: "height 380ms cubic-bezier(0.16, 1, 0.3, 1)",
    } as React.CSSProperties;
  }, [origin, modalHeight]);

  const handleFormSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const parsed = parseInt(jumpInput.trim(), 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= cards.length) {
      onJump(parsed);
      onClose();
    }
  };

  if (!isRendered) return null;

  const filteredCards = cards
    .map((card, idx) => ({ card, idx }))
    .filter(({ card, idx }) => {
      // Filter by mode
      if (filterMode !== "all" && reviewedCardIds) {
        const reviewStatus = reviewedCardIds.get(card.id);
        if (filterMode === "mastered" && (!reviewStatus || !reviewStatus.remembered)) {
          return false;
        }
        if (filterMode === "learning" && (!reviewStatus || reviewStatus.remembered)) {
          return false;
        }
      }

      // Filter by keyword
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        String(idx + 1).includes(q) ||
        card.question.toLowerCase().includes(q) ||
        card.answer.toLowerCase().includes(q)
      );
    });

  return (
    <div
      onClick={onClose}
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-350 ease-out ${
        isVisible
          ? "bg-slate-950/80 backdrop-blur-md opacity-100 pointer-events-auto"
          : "bg-slate-950/0 backdrop-blur-none opacity-0 pointer-events-none"
      }`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={modalStyle}
        className={`relative flex flex-col w-full max-w-2xl max-h-[88dvh] overflow-hidden rounded-3xl border border-cyan-500/40 bg-slate-900/95 shadow-2xl shadow-cyan-950/50 ${
          isVisible
            ? "animate-jump-modal-in pointer-events-auto"
            : "animate-jump-modal-out pointer-events-none"
        }`}
      >
        {/* Top Glow Accent Bar */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-400 via-teal-400 to-indigo-500" />

        <div ref={innerRef} className="flex flex-col p-5 sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/20">
                <ListOrdered size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Jump to Card</h2>
                <p className="text-xs text-slate-400">
                  {deckTitle || "Study Session"} • {cards.length} Flashcards total
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

          {/* Direct Numeric Jump & Scrubber Row */}
          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/80 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-300">
                Enter Card Number (1 - {cards.length}):
              </span>
              <span className="text-xs font-mono text-cyan-400">
                Currently on: #{currentIndex + 1}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="range"
                min={1}
                max={cards.length || 1}
                value={parseInt(jumpInput, 10) || currentIndex + 1}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setJumpInput(String(val));
                }}
                className="h-2 flex-1 accent-cyan-400 cursor-pointer rounded-lg bg-slate-800"
              />
              <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={jumpInput}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, "");
                    setJumpInput(val);
                  }}
                  className="w-16 rounded-xl border border-slate-700 bg-slate-900 px-2 py-1.5 text-center font-mono text-sm font-bold text-cyan-300 focus:border-cyan-400 focus:outline-none"
                  placeholder={String(currentIndex + 1)}
                />
                <button
                  type="submit"
                  className="rounded-xl bg-cyan-500 px-4 py-1.5 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition cursor-pointer shadow-md shadow-cyan-500/20 active:scale-95"
                >
                  Jump ➔
                </button>
              </form>
            </div>
          </div>

          {/* Filter and Search Bar */}
          <div className="mt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by question or answer keyword..."
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2 pl-9 pr-8 text-xs text-white placeholder-slate-500 focus:border-cyan-500/60 focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {reviewedCardIds && reviewedCardIds.size > 0 && (
              <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setFilterMode("all")}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition cursor-pointer ${
                    filterMode === "all"
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  All ({cards.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode("mastered")}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition cursor-pointer ${
                    filterMode === "mastered"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Got It
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode("learning")}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition cursor-pointer ${
                    filterMode === "learning"
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Review Again
                </button>
              </div>
            )}
          </div>

          {/* Scrollable Card List Grid */}
          <div className="mt-3 flex-1 overflow-y-auto pr-1 space-y-2 max-h-[38vh] scrollbar-thin scrollbar-thumb-slate-700">
            {filteredCards.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center text-slate-400 text-xs">
                No cards match your current filter or search query.
              </div>
            ) : (
              filteredCards.map(({ card, idx }) => {
                const isCurrent = idx === currentIndex;
                const status = reviewedCardIds?.get(card.id);

                return (
                  <button
                    key={card.id || idx}
                    type="button"
                    onClick={() => {
                      onJump(idx + 1);
                      onClose();
                    }}
                    className={`w-full text-left flex items-start justify-between gap-3 rounded-2xl p-3 border transition cursor-pointer ${
                      isCurrent
                        ? "border-cyan-400/80 bg-cyan-950/40 shadow-lg shadow-cyan-950/50 ring-1 ring-cyan-400/50"
                        : "border-slate-800/80 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-800/60"
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <span
                        className={`flex h-7 min-w-7 items-center justify-center rounded-lg font-mono text-xs font-bold ${
                          isCurrent
                            ? "bg-cyan-400 text-slate-950"
                            : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        #{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-200 line-clamp-1">
                          {card.question}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-400 line-clamp-1">
                          {card.answer}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {status && (
                        <span
                          className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                            status.remembered
                              ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                              : "bg-rose-500/10 text-rose-300 border border-rose-500/30"
                          }`}
                        >
                          {status.remembered ? (
                            <CheckCircle2 size={11} />
                          ) : (
                            <RotateCcw size={11} />
                          )}
                          <span>{status.remembered ? "Got it" : "Learning"}</span>
                        </span>
                      )}

                      <span className="rounded-md border border-slate-700/80 bg-slate-900 px-2 py-0.5 text-[10px] text-slate-400">
                        Diff {card.difficulty}/5
                      </span>

                      {isCurrent ? (
                        <span className="text-[11px] font-bold text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/30">
                          Active
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-slate-400 hover:text-cyan-300">
                          Jump ➔
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
