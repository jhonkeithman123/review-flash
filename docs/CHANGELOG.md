# ReviewFlash — Official Changelog

All notable changes, bug fixes, feature milestones, and architecture upgrades for **ReviewFlash** are documented in this file.

---

## [v2.2.1] — September 15, 2026
### Minor Bug Fix & Improvement Update
*Codename: Adaptive Typography, Tactile 3D Deck Transitions & Spring Popovers*

#### 🐛 Bug Fixes
- **Adaptive Typography & Text Overflow Fix (Review & Test)**:
  - Fixed issues where long questions, comprehensive answers, or code blocks clipped outside card boundaries.
  - Added dynamic font scaling (`text-4xl` for short text, scaling down to `text-sm` for extra-long prompts/answers) in `components/flashcard-card.tsx`.
  - Implemented sleek internal scroll container (`max-h-[235px] sm:max-h-[275px] overflow-y-auto custom-scrollbar`) with `whitespace-pre-wrap break-words` to preserve line breaks and formatting without layout clipping.
- **Test Mode Choice Wrapping & Staggered Cascades**:
  - Multiple choice buttons in `components/quiz-question.tsx` now flexibly wrap multi-line text (`min-h-[54px]`) without truncating or displacing option labels.
  - Added staggered entrance cascade animation (`animate-option-cascade`) for quiz choices.
- **Question Overview Modal Passive Shrinking Fix**:
  - Eliminated `ResizeObserver` layout feedback loop that caused the modal to continuously shrink on every render frame.
  - Standardized stable viewport dimensions (`h-[85dvh] max-h-[720px]`) and GPU compositor transforms.
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
- **Deck Grid to List Sideways Morph Animation**:
  - Added horizontal length expansion/shrinking keyframe physics (`@keyframes deckGrowToList` & `@keyframes deckShrinkToGrid`) when toggling between Grid and List view modes on the Decks page.
  - Cards dynamically grow sideways into full list rows and shrink horizontally into grid tiles with cascading staggered delays.
- **Review & Test Dropdown Spring Popovers**:
  - Upgraded `DeckSelector` and `DeckSetSelector` dropdowns with glassmorphic spring blossoming, rotating chevrons, and cascading option entries.
- **Account & Profile Dropdown Spring Animations**:
  - Added `.animate-dropdown-spring` and cascading staggered items to the user profile menu in `components/navbar.tsx`.
- **Question Overview Modal Spring Bloom**:
  - Replaced static drawer with origin-tracking spring bloom modal in Test mode that smoothly expands from the trigger button and reverse-shrinks on close.
- **Study Deck Set Division & Remainder-to-Last Allocation**:
  - Divide study sets into Set A, B, C, D... or Set 1, 2, 3... with predefined (20, 30, 40, 45, 50) or custom count limits.
  - Odd remainder items are automatically merged into the final set without creating unbalanced extra sets.
- **Codebase Cleanups, Concise Naming & Architecture Docs**:
  - Refactored ambiguous function names into direct, self-documenting signatures with backward-compatible aliases.
  - Linked centralized `{APP_VERSION}` across all profile and account dropdowns.
  - Authored comprehensive `docs/ARCHITECTURE_AND_CS_CONCEPTS.md` covering system architecture, design patterns, and computer science algorithms.

---

## [v2.2.0] — September 6, 2026
### The Practical Quest & Sovereign Fork Update
- **Hands-On Practical Quest**: Interactive forced-guidance tutoring system with dynamic high-contrast spotlight overlays, action click-blockers, and confetti rewards.
- **True GitHub-Style Deck Forking**: Decoupled shared/read-only decks into sovereign clones with unique card IDs and assigned Owner permissions.
- **Dynamic Grid vs List Deck View Modes**: Dense list rows vs 3D grid tiles with persistence in localStorage.
- **Cyberpunk Custom Yes/No Prompt Modals**: Replaced native browser `window.confirm()` with custom promise-based glassmorphic modals.
- **Share Deck Growth & Starter Deck Polish**: Fluid height expansion on permission changes and spring feedback.

---

## [v2.1.0] — September 4, 2026
### The Fluid Motion & Ambient Lounge Update
- **Origin-Anchored Spring Growth Modals**: Capture click coordinates for dynamic popover and modal bloom transitions.
- **Real-Time Adaptive Height Transitions**: Smooth spring container sizing.
- **Study Music Lounge Tab Swiping**: Directional swipe and tab switching animations.
- **Sliding Pill Segmented Navbar**: Fluid gliding indicator tracking active route.

---

## [v2.0.0] — September 1, 2026
### The Music & Social Horizon
- **Study Music Lounge**: Background YouTube Audio Engine with Lo-Fi, Synthwave, Classical, and Nature presets.
- **YouTube Playlist Batch Importer**: Multiline URL and playlist link parser.
- **Non-Resetting Persistent Shuffle**: In-place array scrambling preserving answer selections.
- **Facebook OAuth Authentication**: Social login integration with data deletion callback endpoint.

---

## [v1.4.0] — August 31, 2026
### Cognitive Dual-Engine & Knowledge Hub
- SM-2 Spaced Repetition engine calculations.
- Comprehensive user learning analytics & streak mechanics.

---

## [v1.3.0] — August 30, 2026
### DITroy AI Tutor & Spaced Retrieval
- Asynchronous AI smart distractor generation.
- Real-time study hints and contextual clues.

---

## [v1.2.0] — August 28, 2026
### Collaborative Study & Permission Mesh
- Encrypted share codes and multi-user deck imports.
- Read-only vs editable deck permissions.

---

## [v1.1.0] — August 25, 2026
### Deck Studio & Rich Text Engine
- Multi-tag deck categorization and tag filtering.
- Fast deck search and difficulty rating sliders.

---

## [v1.0.0] — August 20, 2026
### Genesis: Modern Active Recall Flashcards
- Core active recall review mode and multiple-choice quiz engine.
- Firebase Auth and Cloud Firestore synchronization.
