import {
  DeckCardSet,
  DeckSetDivisionConfig,
  Flashcard,
  SetDivisionMode,
  SetNamingStyle,
} from "@/types/flashcard";

export const PRESET_ITEMS_PER_SET = [20, 30, 40, 45, 50];
export const PRESET_SET_COUNTS = [2, 3, 4, 5];

export interface SetDivisionOption {
  key: string;
  mode: SetDivisionMode;
  value: number;
  label: string;
  sublabel: string;
}

/**
 * Returns formatted set name based on chosen naming style (Letters: Set A, Set B... vs Numbers: Set 1, Set 2...).
 */
export function getSetLabel(index: number, style: SetNamingStyle = "letters"): string {
  if (style === "letters") {
    // 0 -> 'A', 1 -> 'B', 25 -> 'Z', 26 -> 'AA', ...
    const letter = String.fromCharCode(65 + (index % 26));
    const prefix = index >= 26 ? String.fromCharCode(65 + Math.floor(index / 26) - 1) : "";
    return `Set ${prefix}${letter}`;
  }
  return `Set ${index + 1}`;
}

/**
 * Generates all available predefined set division options for a deck:
 * - All Cards
 * - Predefined Counts: 2 Sets (Set A/B), 3 Sets (Set A/B/C), 4 Sets, 5 Sets
 * - Predefined Sizes: 20 items/set, 30 items/set, 40 items/set, 45 items/set, 50 items/set
 */
export function getAvailableSetOptions(
  totalCards: number,
  namingStyle: SetNamingStyle = "letters"
): SetDivisionOption[] {
  const options: SetDivisionOption[] = [
    {
      key: "all",
      mode: "count",
      value: 1,
      label: "All Items",
      sublabel: `${totalCards} items`,
    },
  ];

  if (totalCards < 6) {
    return options;
  }

  // Predefined Set Count options (e.g. 2 Sets, 3 Sets, 4 Sets)
  PRESET_SET_COUNTS.forEach((count) => {
    if (totalCards >= count * 2) {
      const base = Math.floor(totalCards / count);
      const remainder = totalCards - base * (count - 1);
      const preview =
        count === 2
          ? namingStyle === "letters" ? "Set A & B" : "Set 1 & 2"
          : `${count} Sets (${getSetLabel(0, namingStyle)}–${getSetLabel(count - 1, namingStyle)})`;

      options.push({
        key: `count-${count}`,
        mode: "count",
        value: count,
        label: `${count} Sets`,
        sublabel: `${preview} • ~${base} items (last: ${remainder})`,
      });
    }
  });

  // Predefined Items Per Set options (e.g. 20, 30, 40, 45 items per set)
  PRESET_ITEMS_PER_SET.forEach((size) => {
    if (totalCards >= size + 4) {
      const setCount = Math.max(1, Math.floor(totalCards / size));
      if (setCount > 1) {
        const lastSize = totalCards - size * (setCount - 1);
        options.push({
          key: `size-${size}`,
          mode: "size",
          value: size,
          label: `${size} Items / Set`,
          sublabel: `${setCount} Sets (${size} each, last: ${lastSize})`,
        });
      }
    }
  });

  return options;
}

/**
 * Universal Set Divider adhering to user's specification:
 * - Supports division by Set Count (e.g. 2 sets) OR Items Per Set (e.g. 20, 30, 40, 45, custom).
 * - RULE: If the number of items in a deck is odd or not evenly divisible,
 *   all extra remainder items are allocated directly to the LAST set.
 * - Supports Letter naming (Set A, Set B, Set C...) and Number naming (Set 1, Set 2, Set 3...).
 */
export function divideCardsIntoSets(
  cards: Flashcard[],
  numSetsOrConfig: number | DeckSetDivisionConfig,
  namingStyle: SetNamingStyle = "letters"
): DeckCardSet[] {
  if (!cards || cards.length === 0) return [];

  let mode: SetDivisionMode = "count";
  let val = 1;
  let style: SetNamingStyle = namingStyle;

  if (typeof numSetsOrConfig === "number") {
    mode = "count";
    val = Math.max(1, numSetsOrConfig);
  } else if (numSetsOrConfig && typeof numSetsOrConfig === "object") {
    if (!numSetsOrConfig.enabled) {
      val = 1;
    } else {
      mode = numSetsOrConfig.mode || "count";
      val = Math.max(1, numSetsOrConfig.value || 1);
      style = numSetsOrConfig.namingStyle || namingStyle;
    }
  }

  // Case 1: Single Set (All Cards)
  if (val <= 1 || (mode === "size" && cards.length <= val)) {
    return [
      {
        setIndex: 0,
        setNumber: 1,
        setName: getSetLabel(0, style),
        label: `All Items (1–${cards.length})`,
        startIndex: 0,
        endIndex: cards.length,
        cardCount: cards.length,
        cards: cards,
      },
    ];
  }

  // Calculate number of sets and base size
  let calculatedNumSets = 1;
  let baseSize = cards.length;

  if (mode === "count") {
    calculatedNumSets = Math.min(val, cards.length);
    baseSize = Math.floor(cards.length / calculatedNumSets);
  } else {
    // mode === "size" (e.g. 20, 30, 40, 45, or custom size)
    const targetSize = val;
    calculatedNumSets = Math.max(1, Math.floor(cards.length / targetSize));
    baseSize = targetSize;
  }

  if (calculatedNumSets <= 1) {
    return [
      {
        setIndex: 0,
        setNumber: 1,
        setName: getSetLabel(0, style),
        label: `All Items (1–${cards.length})`,
        startIndex: 0,
        endIndex: cards.length,
        cardCount: cards.length,
        cards: cards,
      },
    ];
  }

  const sets: DeckCardSet[] = [];
  let currentStart = 0;

  for (let i = 0; i < calculatedNumSets; i++) {
    const isLast = i === calculatedNumSets - 1;
    // The last set takes all remaining cards (baseSize + remainder items)
    const currentEnd = isLast ? cards.length : currentStart + baseSize;
    const setCards = cards.slice(currentStart, currentEnd);
    const setName = getSetLabel(i, style);

    sets.push({
      setIndex: i,
      setNumber: i + 1,
      setName: setName,
      label: `${setName} (${currentStart + 1}–${currentEnd})`,
      startIndex: currentStart,
      endIndex: currentEnd,
      cardCount: setCards.length,
      cards: setCards,
    });

    currentStart = currentEnd;
  }

  return sets;
}
