"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { ChevronDown, Layers, Settings2, SlidersHorizontal, Sparkles, Check } from "lucide-react";
import {
  DeckCardSet,
  DeckSetDivisionConfig,
  Flashcard,
  SetDivisionMode,
  SetNamingStyle,
} from "@/types/flashcard";
import {
  divideCardsIntoSets,
  getAvailableSetOptions,
  getSetLabel,
} from "@/lib/setDivider";

interface DeckSetSelectorProps {
  cards: Flashcard[];
  config?: DeckSetDivisionConfig;
  activeSetIndex: number;
  onConfigChange: (newConfig: DeckSetDivisionConfig) => void;
  onActiveSetChange: (newSetIndex: number) => void;
  modeLabel?: string; // e.g. "Review" or "Test"
}

export function DeckSetSelector({
  cards,
  config = {
    enabled: false,
    mode: "count",
    value: 1,
    namingStyle: "letters",
  },
  activeSetIndex,
  onConfigChange,
  onActiveSetChange,
  modeLabel = "Study",
}: DeckSetSelectorProps) {
  const totalCards = cards.length;
  const [isOpen, setIsOpen] = useState(false);
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [customValue, setCustomValue] = useState<string>(
    String(config.value > 1 ? config.value : 30)
  );

  const dropdownRef = useRef<HTMLDivElement>(null);
  const namingStyle = config.namingStyle || "letters";

  const options = useMemo(() => {
    return getAvailableSetOptions(totalCards, namingStyle);
  }, [totalCards, namingStyle]);

  const sets: DeckCardSet[] = useMemo(() => {
    return divideCardsIntoSets(cards, config, namingStyle);
  }, [cards, config, namingStyle]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsCustomOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Only show set divider controls if there are at least 6 cards
  if (totalCards < 6) return null;

  const currentOptionKey = !config.enabled || config.value <= 1
    ? "all"
    : `${config.mode}-${config.value}`;

  const currentActiveOption = options.find((o) => o.key === currentOptionKey);

  const handleSelectOption = (key: string) => {
    if (key === "all") {
      onConfigChange({
        enabled: false,
        mode: "count",
        value: 1,
        namingStyle,
      });
      onActiveSetChange(0);
      setIsOpen(false);
      setIsCustomOpen(false);
      return;
    }

    if (key === "custom") {
      setIsCustomOpen(true);
      return;
    }

    const found = options.find((o) => o.key === key);
    if (found) {
      onConfigChange({
        enabled: true,
        mode: found.mode,
        value: found.value,
        namingStyle,
      });
      onActiveSetChange(0);
      setIsOpen(false);
      setIsCustomOpen(false);
    }
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(customValue.trim(), 10);
    if (!isNaN(parsed) && parsed >= 2) {
      onConfigChange({
        enabled: true,
        mode: config.mode,
        value: parsed,
        namingStyle,
      });
      onActiveSetChange(0);
      setIsCustomOpen(false);
      setIsOpen(false);
    }
  };

  const toggleNamingStyle = () => {
    const nextStyle: SetNamingStyle = namingStyle === "letters" ? "numbers" : "letters";
    onConfigChange({
      ...config,
      namingStyle: nextStyle,
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs" ref={dropdownRef}>
      {/* 1. Custom Animated Dropdown Trigger */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="group flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/90 px-3.5 py-2 text-xs text-slate-200 shadow-sm transition-all duration-200 hover:border-cyan-500/60 hover:bg-slate-900 hover:shadow-md hover:shadow-cyan-500/10 active:scale-95 cursor-pointer"
        >
          <Layers size={14} className="text-cyan-400 group-hover:scale-110 transition-transform duration-200" />
          <span className="font-semibold text-slate-400 hidden sm:inline">Sets:</span>
          <span className="font-bold text-cyan-300 max-w-[140px] truncate">
            {currentActiveOption ? currentActiveOption.label : config.enabled ? `Custom (${config.value})` : "All Items (1 Set)"}
          </span>
          {config.enabled && sets.length > 1 && (
            <span className="rounded-full bg-cyan-500/20 px-2 py-0.2 text-[11px] font-bold text-cyan-300 border border-cyan-500/30">
              {sets.length}
            </span>
          )}
          <ChevronDown
            size={13}
            className={`text-slate-400 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isOpen ? "rotate-180 text-cyan-400" : "group-hover:text-slate-200"
            }`}
          />
        </button>

        {/* 2. Glassmorphic Dropdown Popover */}
        {isOpen && (
          <div className="absolute left-0 z-40 mt-2 w-72 sm:w-80 origin-top-left rounded-3xl border border-cyan-500/30 bg-slate-950/95 p-2.5 shadow-2xl shadow-cyan-950/50 backdrop-blur-2xl animate-dropdown-spring">
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800/80 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Divide Study Sets
              </span>
              {config.enabled && sets.length > 1 && (
                <button
                  type="button"
                  onClick={toggleNamingStyle}
                  title={namingStyle === "letters" ? "Switch to Set 1, 2, 3..." : "Switch to Set A, B, C..."}
                  className="rounded-lg px-2 py-0.5 text-[10px] font-mono font-bold text-cyan-300 hover:bg-cyan-500/20 transition cursor-pointer border border-cyan-500/30"
                >
                  Style: {namingStyle === "letters" ? "Set A, B..." : "Set 1, 2..."}
                </button>
              )}
            </div>

            <div className="max-h-64 space-y-1 overflow-y-auto custom-scrollbar pr-0.5">
              {/* All cards option */}
              <button
                type="button"
                style={{ animationDelay: "0ms" }}
                onClick={() => handleSelectOption("all")}
                className={`group flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left text-xs sm:text-sm transition-all duration-150 active:scale-[0.98] cursor-pointer animate-dropdown-item ${
                  !config.enabled || config.value <= 1
                    ? "bg-cyan-500/20 text-cyan-200 font-bold border border-cyan-400/40 shadow-sm shadow-cyan-500/10"
                    : "text-slate-200 hover:bg-slate-800/90 hover:translate-x-0.5"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-300">
                    <Sparkles size={13} className={!config.enabled ? "text-cyan-300 animate-pulse" : "text-cyan-400"} />
                  </div>
                  <div className="truncate">
                    <span className="font-semibold text-white block truncate">All Cards (1 Single Set)</span>
                    <span className="text-[10px] text-slate-400 block truncate">Study all {totalCards} cards together</span>
                  </div>
                </div>
                <span className="ml-2 shrink-0 rounded-md bg-slate-900 border border-slate-700/80 px-2 py-0.5 text-[11px] font-mono font-bold text-cyan-300">
                  {totalCards}
                </span>
              </button>

              <div className="my-1.5 border-t border-slate-800/80" />

              {/* Predefined division options */}
              {options.filter((o) => o.key !== "all").map((opt, idx) => {
                const isSelected = currentOptionKey === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    style={{ animationDelay: `${(idx + 1) * 35}ms` }}
                    onClick={() => handleSelectOption(opt.key)}
                    className={`group flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left text-xs sm:text-sm transition-all duration-150 active:scale-[0.98] cursor-pointer animate-dropdown-item ${
                      isSelected
                        ? "bg-cyan-500/20 text-cyan-200 font-bold border border-cyan-400/40 shadow-sm shadow-cyan-500/10"
                        : "text-slate-200 hover:bg-slate-800/90 hover:translate-x-0.5"
                    }`}
                  >
                    <div className="truncate pr-2 min-w-0">
                      <p className={`truncate text-xs ${isSelected ? "font-bold text-cyan-200" : "font-semibold text-white group-hover:text-cyan-300 transition-colors"}`}>
                        {opt.label}
                      </p>
                      <p className="truncate text-[10px] text-slate-400">
                        {opt.sublabel}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-mono font-bold border transition-colors ${
                      isSelected
                        ? "bg-cyan-500/30 text-cyan-200 border-cyan-400/50"
                        : "bg-slate-900 text-slate-300 border-slate-800 group-hover:border-slate-700"
                    }`}>
                      {opt.value} {opt.mode === "count" ? "Sets" : "Cards/Set"}
                    </span>
                  </button>
                );
              })}

              <div className="my-1.5 border-t border-slate-800/80" />

              {/* Custom Split Trigger */}
              {!isCustomOpen ? (
                <button
                  type="button"
                  onClick={() => setIsCustomOpen(true)}
                  className="flex w-full items-center justify-between rounded-2xl border border-dashed border-slate-700/80 px-3 py-2 text-xs font-semibold text-cyan-300 hover:border-cyan-400 hover:bg-cyan-500/10 transition cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal size={13} />
                    <span>Custom Split...</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Set exact number</span>
                </button>
              ) : (
                <form onSubmit={handleApplyCustom} className="space-y-2 rounded-2xl border border-cyan-500/40 bg-slate-900/95 p-2.5 animate-dropdown-spring">
                  <div className="flex items-center justify-between text-[11px] font-bold text-cyan-300">
                    <span>Custom Split Configuration</span>
                    <button
                      type="button"
                      onClick={() => setIsCustomOpen(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={config.mode}
                      onChange={(e) => onConfigChange({ ...config, mode: e.target.value as SetDivisionMode })}
                      className="rounded-xl bg-slate-950 px-2.5 py-1.5 text-[11px] text-cyan-300 border border-slate-800 focus:outline-none focus:border-cyan-400"
                    >
                      <option value="count">Total Sets</option>
                      <option value="size">Max Cards / Set</option>
                    </select>
                    <input
                      type="number"
                      min={2}
                      max={totalCards}
                      value={customValue}
                      onChange={(e) => setCustomValue(e.target.value)}
                      className="w-16 rounded-xl bg-slate-950 px-2 py-1 text-center font-mono text-xs font-bold text-white border border-slate-800 focus:outline-none focus:border-cyan-400"
                    />
                    <button
                      type="submit"
                      className="rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 px-3 py-1.5 text-xs font-bold text-slate-950 hover:brightness-110 transition cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. Interactive Set Selector Pills (when divided into 2 or more sets) */}
      {config.enabled && sets.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
          {sets.map((s, idx) => {
            const isActive = activeSetIndex === s.setIndex;
            return (
              <button
                key={s.setIndex}
                type="button"
                style={{ animationDelay: `${idx * 40}ms` }}
                onClick={() => onActiveSetChange(s.setIndex)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all duration-200 cursor-pointer active:scale-95 shrink-0 ${
                  isActive
                    ? "bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-bold shadow-md shadow-cyan-500/25 scale-105"
                    : "border border-slate-800 bg-slate-900/80 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                }`}
                title={`Study ${s.label}`}
              >
                <span>{s.setName}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isActive ? "bg-black/20 text-slate-950 font-extrabold" : "bg-slate-800 text-slate-400 font-medium"
                  }`}
                >
                  {s.cardCount}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

