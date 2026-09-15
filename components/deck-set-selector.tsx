"use client";

import { useMemo, useState } from "react";
import { Layers, Settings2, SlidersHorizontal, Sparkles } from "lucide-react";
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
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [customValue, setCustomValue] = useState<string>(
    String(config.value > 1 ? config.value : 30)
  );

  const namingStyle = config.namingStyle || "letters";

  const options = useMemo(() => {
    return getAvailableSetOptions(totalCards, namingStyle);
  }, [totalCards, namingStyle]);

  const sets: DeckCardSet[] = useMemo(() => {
    return divideCardsIntoSets(cards, config, namingStyle);
  }, [cards, config, namingStyle]);

  // Only show set divider controls if there are at least 6 cards
  if (totalCards < 6) return null;

  const currentOptionKey = !config.enabled || config.value <= 1
    ? "all"
    : `${config.mode}-${config.value}`;

  const handleSelectOption = (key: string) => {
    if (key === "all") {
      onConfigChange({
        enabled: false,
        mode: "count",
        value: 1,
        namingStyle,
      });
      onActiveSetChange(0);
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
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {/* 1. Set Division Dropdown */}
      <div className="flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-slate-300 shadow-xs">
        <Layers size={13} className="text-cyan-400" />
        <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline">Sets:</span>
        <select
          value={options.some((o) => o.key === currentOptionKey) ? currentOptionKey : "custom"}
          onChange={(e) => handleSelectOption(e.target.value)}
          className="bg-transparent text-xs font-bold text-cyan-300 focus:outline-none cursor-pointer max-w-[150px] sm:max-w-none truncate"
          title="Divide deck into even sets (odd remainder cards allocate to the last set)"
        >
          {options.map((opt) => (
            <option key={opt.key} value={opt.key} className="bg-slate-900 text-slate-100">
              {opt.label} ({opt.sublabel})
            </option>
          ))}
          <option value="custom" className="bg-slate-900 text-cyan-300 font-bold">
            Custom Split...
          </option>
        </select>

        {/* Naming Style Toggle (A/B vs 1/2) */}
        {config.enabled && sets.length > 1 && (
          <button
            type="button"
            onClick={toggleNamingStyle}
            title={namingStyle === "letters" ? "Switch to Set 1, 2, 3..." : "Switch to Set A, B, C..."}
            className="ml-1 rounded-md px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer border border-slate-700"
          >
            {namingStyle === "letters" ? "A/B" : "1/2"}
          </button>
        )}
      </div>

      {/* 2. Custom Size/Count Modal / Input Popover */}
      {isCustomOpen && (
        <form onSubmit={handleApplyCustom} className="flex items-center gap-1.5 rounded-2xl border border-cyan-500/40 bg-slate-900 p-1.5 shadow-lg animate-in fade-in zoom-in-95">
          <select
            value={config.mode}
            onChange={(e) => onConfigChange({ ...config, mode: e.target.value as SetDivisionMode })}
            className="rounded-lg bg-slate-950 px-2 py-1 text-[11px] text-cyan-300 border border-slate-800 focus:outline-none"
          >
            <option value="count">Number of Sets</option>
            <option value="size">Max Items / Set</option>
          </select>
          <input
            type="number"
            min={2}
            max={totalCards}
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            className="w-14 rounded-lg bg-slate-950 px-2 py-1 text-center font-mono text-xs font-bold text-white border border-slate-800 focus:outline-none focus:border-cyan-400"
          />
          <button
            type="submit"
            className="rounded-lg bg-cyan-500 px-2.5 py-1 text-[11px] font-bold text-slate-950 hover:bg-cyan-400 transition cursor-pointer"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={() => setIsCustomOpen(false)}
            className="px-1 text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </form>
      )}

      {/* 3. Set Selector Pills (when divided into 2 or more sets) */}
      {config.enabled && sets.length > 1 && (
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
          {sets.map((s) => {
            const isActive = activeSetIndex === s.setIndex;
            return (
              <button
                key={s.setIndex}
                type="button"
                onClick={() => onActiveSetChange(s.setIndex)}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer active:scale-95 shrink-0 ${
                  isActive
                    ? "bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-bold shadow-md shadow-cyan-500/20 scale-105"
                    : "border border-slate-800 bg-slate-900/80 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                }`}
                title={`Study ${s.label}`}
              >
                <span>{s.setName}</span>
                <span
                  className={`text-[10px] font-mono px-1 rounded ${
                    isActive ? "bg-black/20 text-slate-950" : "bg-slate-800 text-slate-400"
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
