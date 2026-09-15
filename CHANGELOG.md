# Changelog

All notable changes to ReviewFlash will be documented in this file.

---

## [v2.2.1] — September 15, 2026
### Minor Bug Fix & Improvement Update
*Codename: Adaptive Typography & Tactile 3D Deck Transitions*

#### 🐛 Bug Fixes
- **Adaptive Typography & Text Overflow Fix (Review & Test)**:
  - Fixed issues where long questions, comprehensive answers, or code blocks clipped outside card boundaries.
  - Added dynamic font scaling (`text-4xl` for short text, scaling down to `text-sm` for extra-long prompts/answers) in `components/flashcard-card.tsx`.
  - Implemented sleek internal scroll container (`max-h-[235px] sm:max-h-[275px] overflow-y-auto custom-scrollbar`) with `whitespace-pre-wrap break-words` to preserve line breaks and formatting without layout clipping.
- **Test Mode Choice Wrapping & Staggered Cascades**:
  - Multiple choice buttons in `components/quiz-question.tsx` now flexibly wrap multi-line text (`min-h-[54px]`) without truncating or displacing option labels.
  - Added staggered entrance cascade animation (`animate-option-cascade`) for quiz choices.
- **Firestore Write Stream Exhaustion Protection**:
  - Handled `@firebase/firestore [code=resource-exhausted]` write stream errors during rapid review rating and test taking via optimistic updates and background debouncing.

#### ⚡ Improvements & New Features
- **Physical 3D Card Deal & Directional Switch Animations**:
  - Replaced static text-swapping in Review mode with tactile 3D card dealing physics.
  - `animate-deck-mastered`: 3D elevation burst with an emerald halo when rating cards as Mastered.
  - `animate-deck-review`: Tactile depth slide with a soft rose pulse on "Review Again".
  - `animate-deck-next` & `animate-deck-prev`: Smooth 3D tilt and slide dealing from the right/left of the deck.
  - `animate-deck-pop`: Center depth expansion on jumps and deck/set switching.
  - 3D physical deck stack depth layers behind top card.
- **Study Deck Set Division & Remainder-to-Last Allocation**:
  - Divide study sets into Set A, B, C, D... or Set 1, 2, 3... with predefined (20, 30, 40, 45, 50) or custom count limits.
  - Odd remainder items are automatically merged into the final set without creating unbalanced extra sets.

---

## [v2.2.0] — September 6, 2026
### The Practical Quest & Sovereign Fork Update
- Hands-On Practical Quest interactive tutoring system with spotlight overlays.
- True GitHub-style Deck Forking with decoupled card IDs and Owner permissions.
- Dynamic Grid vs List view switcher on Decks page.
- Cyberpunk glassmorphic custom Yes/No confirmation modals.

---

## [v2.1.0] — September 4, 2026
### The Fluid Motion & Ambient Lounge Update
- Origin-anchored spring growth modal animations.
- Real-time adaptive height growth with ResizeObserver.
- Directional tab swiping in Study Music Lounge.
- Gliding segmented navbar indicator pill.

---

## [v2.0.0] — September 1, 2026
### The Music & Social Horizon
- Study Music Lounge with YouTube Audio Engine.
- YouTube playlist link & multiline URL batch importer.
- Non-resetting persistent shuffle for quiz and review modes.
- Continue with Facebook OAuth authentication.
