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
        className="flex items-center gap-2.5 rounded-full border border-slate-700 bg-slate-900/90 px-4 py-2 text-sm text-slate-100 shadow-sm transition hover:border-cyan-500/50 hover:bg-slate-900 cursor-pointer"
      >
        <Folder size={16} className="text-cyan-400" />
        <span className="font-medium text-slate-200">
          {selectedDeckId === "all"
            ? "All Flashcards"
            : activeDeck?.title || "Select Deck"}
        </span>
        <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-xs font-semibold text-cyan-300">
          {selectedDeckId === "all"
            ? totalCardsCount
            : activeDeck?.cards.length || 0}
        </span>
        <ChevronDown
          size={14}
          className={`text-slate-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 sm:left-0 z-30 mt-2 w-72 origin-top-left rounded-2xl border border-slate-700 bg-slate-900/95 p-2 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Select Study Set
          </div>

          <div className="max-h-64 space-y-1 overflow-y-auto">
            {/* All cards option */}
            <button
              type="button"
              onClick={() => {
                onSelectDeck("all");
                setIsOpen(false);
              }}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition cursor-pointer ${
                selectedDeckId === "all"
                  ? "bg-cyan-500/15 text-cyan-300 font-medium border border-cyan-500/30"
                  : "text-slate-200 hover:bg-slate-800"
              }`}
            >
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-cyan-400" />
                <span>All Decks Combined</span>
              </div>
              <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                {totalCardsCount}
              </span>
            </button>

            <div className="my-1 border-t border-slate-800" />

            {/* Individual decks */}
            {decks.map((deck) => {
              const isSelected = selectedDeckId === deck.id;
              return (
                <button
                  key={deck.id}
                  type="button"
                  onClick={() => {
                    onSelectDeck(deck.id);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition cursor-pointer ${
                    isSelected
                      ? "bg-cyan-500/15 text-cyan-300 font-medium border border-cyan-500/30"
                      : "text-slate-200 hover:bg-slate-800"
                  }`}
                >
                  <div className="truncate pr-2">
                    <p className="truncate font-medium">{deck.title}</p>
                    {deck.tags && deck.tags.length > 0 && (
                      <p className="truncate text-[10px] text-slate-400">
                        {deck.tags.join(" • ")}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 rounded-md bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
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
