"use client";

import { Deck } from "@/types/flashcard";
import { ChevronDown, Folder, Sparkles } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface DeckSelectorProps {
  decks: Deck[];
  selectedDeckId: string; // 'all' or deck.id
  onSelectDeck: (deckId: string) => void;
  totalCardsCount: number;
}

export function DeckSelector({
  decks,
  selectedDeckId,
  onSelectDeck,
  totalCardsCount,
}: DeckSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeDeck = decks.find((d) => d.id === selectedDeckId);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="group flex items-center gap-2.5 rounded-full border border-slate-700 bg-slate-900/90 px-4 py-2 text-sm text-slate-100 shadow-sm transition-all duration-200 hover:border-cyan-500/60 hover:bg-slate-900 hover:shadow-md hover:shadow-cyan-500/10 active:scale-95 cursor-pointer"
      >
        <Folder size={16} className="text-cyan-400 group-hover:scale-110 transition-transform duration-200" />
        <span className="font-medium text-slate-200">
          {selectedDeckId === "all"
            ? "All Flashcards"
            : activeDeck?.title || "Select Deck"}
        </span>
        <span className="rounded-full bg-cyan-500/20 px-2.5 py-0.5 text-xs font-semibold text-cyan-300 border border-cyan-500/30">
          {selectedDeckId === "all"
            ? totalCardsCount
            : activeDeck?.cards.length || 0}
        </span>
        <ChevronDown
          size={14}
          className={`text-slate-400 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isOpen ? "rotate-180 text-cyan-400" : "group-hover:text-slate-200"
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 sm:left-0 z-30 mt-2 w-72 sm:w-80 origin-top-left rounded-3xl border border-cyan-500/30 bg-slate-950/95 p-2.5 shadow-2xl shadow-cyan-950/50 backdrop-blur-2xl animate-dropdown-spring">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800/80 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Select Study Set
            </span>
            <span className="text-[10px] text-cyan-400 font-mono font-medium">
              {decks.length + 1} options
            </span>
          </div>

          <div className="max-h-72 space-y-1 overflow-y-auto custom-scrollbar pr-0.5">
            {/* All cards option */}
            <button
              type="button"
              style={{ animationDelay: "0ms" }}
              onClick={() => {
                onSelectDeck("all");
                setIsOpen(false);
              }}
              className={`group flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left text-sm transition-all duration-150 active:scale-[0.98] cursor-pointer animate-dropdown-item ${
                selectedDeckId === "all"
                  ? "bg-cyan-500/20 text-cyan-200 font-bold border border-cyan-400/40 shadow-sm shadow-cyan-500/10"
                  : "text-slate-200 hover:bg-slate-800/90 hover:translate-x-0.5"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300">
                  <Sparkles size={14} className={selectedDeckId === "all" ? "text-cyan-300 animate-pulse" : "text-cyan-400"} />
                </div>
                <div className="truncate">
                  <span className="font-semibold text-white block truncate">All Decks Combined</span>
                  <span className="text-[10px] text-slate-400 block truncate">Study all flashcards in one library</span>
                </div>
              </div>
              <span className="ml-2 shrink-0 rounded-lg bg-slate-900 border border-slate-700/80 px-2 py-0.5 text-xs font-mono font-bold text-cyan-300">
                {totalCardsCount}
              </span>
            </button>

            <div className="my-1.5 border-t border-slate-800/80" />

            {/* Individual decks */}
            {decks.map((deck, idx) => {
              const isSelected = selectedDeckId === deck.id;
              return (
                <button
                  key={deck.id}
                  type="button"
                  style={{ animationDelay: `${(idx + 1) * 35}ms` }}
                  onClick={() => {
                    onSelectDeck(deck.id);
                    setIsOpen(false);
                  }}
                  className={`group flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left text-sm transition-all duration-150 active:scale-[0.98] cursor-pointer animate-dropdown-item ${
                    isSelected
                      ? "bg-cyan-500/20 text-cyan-200 font-bold border border-cyan-400/40 shadow-sm shadow-cyan-500/10"
                      : "text-slate-200 hover:bg-slate-800/90 hover:translate-x-0.5"
                  }`}
                >
                  <div className="truncate pr-2 min-w-0">
                    <p className={`truncate text-xs sm:text-sm ${isSelected ? "font-bold text-cyan-200" : "font-semibold text-white group-hover:text-cyan-300 transition-colors"}`}>
                      {deck.title}
                    </p>
                    {deck.tags && deck.tags.length > 0 ? (
                      <p className="truncate text-[10px] text-slate-400">
                        {deck.tags.join(" • ")}
                      </p>
                    ) : (
                      <p className="truncate text-[10px] text-slate-500 italic">
                        No tags
                      </p>
                    )}
                  </div>
                  <span className={`shrink-0 rounded-lg px-2 py-0.5 text-xs font-mono font-bold border transition-colors ${
                    isSelected
                      ? "bg-cyan-500/30 text-cyan-200 border-cyan-400/50"
                      : "bg-slate-900 text-slate-300 border-slate-800 group-hover:border-slate-700"
                  }`}>
                    {deck.cards.length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
