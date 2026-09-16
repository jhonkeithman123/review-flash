# ReviewFlash — Master Product Plan & Development Roadmap

---

## 🎯 Project Overview
**ReviewFlash** is a high-performance, AI-accelerated active recall flashcard and adaptive quiz platform built with **Next.js 16 (Turbopack)**, **TypeScript**, **Tailwind CSS**, and **Firebase (Auth & Cloud Firestore)**.

---

## ✅ Completed Milestones & Capabilities

### 1. 🗂️ Core Study & Review Engine
- [x] **SM-2 Spaced Retrieval Memory Algorithm**: Computes repetition intervals, easiness factor ($EF$), and repetition counts.
- [x] **Physical 3D Card Deal & Switch Physics**:
  - Tactile 3D perspective card dealing (`animate-deck-next` / `animate-deck-prev`).
  - Emerald burst elevation on "Mastered" and rose depth slide on "Review Again".
  - Center depth pop on card jumps and set changes.
  - Physical deck stack depth layers behind active cards.
- [x] **Adaptive Typography & Internal Smooth Scroll**:
  - Dynamic font sizing (`text-4xl` down to `text-sm`) based on prompt/answer character length.
  - Custom sleek scrollbars (`whitespace-pre-wrap break-words`) preventing text clipping or overflow.
- [x] **Jump to Card Modal with Origin Bloom**:
  - Instant card navigation with real-time keyword search and mastery filters.
  - Hardware-accelerated blossom animation expanding directly from the trigger button.

### 2. 📝 Adaptive Test & Assessment Mode
- [x] **3-Tier Dynamic Adaptive Difficulty**:
  - Level 1 (Standard Distractors), Level 2 (Close Concept Confusion), Level 3 (Near-Miss Logical Traps).
  - Real-time streak tracking and difficulty percentage boosts.
- [x] **DITroy AI Smart Distractor Engine**:
  - Background asynchronous AI enrichment generating logically relative distractors.
  - Fallback to smart heuristic analyzers (ports, HTTP codes, keywords, numeric ranges).
- [x] **Multiline Choice Option Wrapping & Cascades**:
  - Options wrap long text cleanly without truncating or displacing badge indicators.
  - Cascading option entrances with staggered delays.
- [x] **Animated Question Overview Modal**:
  - Modal blossoms from trigger button to viewport center and reverse-shrinks on close.
  - Filter tabs for All, Unanswered, Answered, and Flagged questions.
  - Direct question jumping and unanswered submission guards.
- [x] **Test History & Detailed Deck Breakdown**:
  - History modal tracking past scores, time spent, adaptive peaks, and missed card retakes.
  - Per-deck score breakdowns for combined library quizzes.
- [x] **Persistent Test Sessions**: In-progress quiz state preserved across tab reloads and saved to storage.

### 3. 🎨 Deck Studio & Set Divider
- [x] **Deck Shelf Grid $\leftrightarrow$ List Sideways Morph Animation**:
  - Horizontal length stretching (`@keyframes deckGrowToList`) and shrinking (`@keyframes deckShrinkToGrid`) when switching view modes.
  - Staggered wave transitions across deck cards.
- [x] **Study Deck Set Divider (Set A, B, C... / Set 1, 2, 3...)**:
  - Splits large decks into manageable sets (e.g. 20, 30, 40, 50 cards or custom counts).
  - Odd remainder cards automatically allocated into the final set.
  - Quick naming style toggle between letters and numbers.
- [x] **Deck CRUD & Tag Taxonomy**: Rich deck creation form with tag chips, search, and difficulty ratings.

### 4. 🤖 AI Study Assistant & Long-Term Memory
- [x] **DITroy Floating AI Study Drawer**:
  - Origin-anchored growth blossom from floating action button.
  - Mode-aware tutoring (Review clues, Test hints without giving answers, Deck suggestions).
- [x] **AI Vector Memory & User Learning Profile**:
  - Local/cloud memory service tracking user preferences, weak concepts, and study goals.
  - Contextual `@mention` system for targeted assistant prompts.

### 5. 🤝 Collaboration & Sovereignty Mesh
- [x] **True GitHub-Style Deck Forking**:
  - Decouples shared/read-only decks into independent clones with regenerated card IDs.
  - Grants the forker full owner editing rights.
- [x] **Share Deck Modal & Permission Mesh**:
  - Access controls: Public View, Fork Only, or Restricted.
  - 1-Click encrypted Share Payload generation and import codes.

### 6. 🎧 Study Music Lounge & Gamification
- [x] **YouTube Audio Streaming Engine**:
  - Embedded audio lounge with Lo-Fi, Synthwave, Classical, and Nature audio presets.
  - Batch multiline URL and playlist import capability.
  - Floating background minimized player.
- [x] **Hands-On Practical Quest ("Learn by Doing")**:
  - Interactive spotlight guidance leading users through real application workflows.
  - Confetti celebration and achievement unlock on completion.

### 7. 🛡️ Security, Architecture & Performance
- [x] **Security Hardening**: Complete isolation of sensitive keys; zero exposed secrets in client code.
- [x] **Firestore Write Throttling**: Optimistic local updates and write debouncing to protect Firestore write streams.
- [x] **Architecture & CS Documentation**: Comprehensive `ARCHITECTURE_AND_CS_CONCEPTS.md` covering clean architecture, design patterns, and algorithms.
- [x] **Centralized Versioning System**: Unified `lib/version.ts` linked across all navbars, footers, modals, and account menus.

---

## 🚀 Next Milestone: Account, Profile & Security Suite (Upcoming Update)

### 1. 👤 Dedicated Profile Management Page (`/profile`)
- [ ] Dedicated route for full account overview and statistics summary.
- [ ] Display account creation date, total study time, streak records, decks created, cards mastered, and quiz accuracy.
- [ ] Direct quick links to personal decks, test history, and study preferences.

### 2. 🖼️ Profile Picture & Avatar Customization
- [ ] **Custom Avatar Upload**: Upload custom profile picture with image preview, crop, and compression.
- [ ] **Preset Cyberpunk & Minimalist Avatars**: Curated collection of high-res SVG avatars (Neon Scholar, Cyber Brain, Pixel Master, Zen Student).
- [ ] **Global Avatar Sync**: Immediate dynamic update across navbar pill, account dropdown, AI chat tutor, and shared deck creator tags.

### 3. 🔑 Password Management & Security
- [ ] **Forgot / Reset Password via Email**: Send password reset emails via Firebase Auth with clear feedback modals.
- [ ] **In-App Password Change**: Secure form with old password verification, password strength meter, and re-authentication.

### 4. 📧 Email & Identity Management
- [ ] **Update Email Address**: Secure email change flow with Firebase re-authentication and confirmation prompts.
- [ ] **Email Verification Status**: Display verified email badge with 1-click resend verification link.
- [ ] **Display Name & Bio Customization**: Editable learner name, nickname, and personal study bio.

### 5. 🔗 Linked Authentication Providers
- [ ] View connected authentication methods (Email/Password, Google OAuth, Facebook OAuth).
- [ ] Link / Unlink secondary sign-in providers seamlessly.

### 6. ⚠️ Account Danger Zone & Data Sovereignty
- [ ] **Export My Data (JSON)**: 1-click download of all user flashcards, decks, review logs, and test history in standard JSON format.
- [ ] **Self-Service Account Deletion**: Multi-step confirmation dialog with permanent deletion of Firestore user records, personal decks, and Auth credentials (complying with GDPR/CCPA & Facebook Data Deletion standards).

---

## 📊 Feature Comparison & Progress

| Feature Domain | Status | Notes |
| :--- | :---: | :--- |
| **Spaced Retrieval Engine** | ✅ Completed | SM-2 Algorithm, 3D Physical Transitions, Dynamic Typography |
| **Adaptive Quiz & Distractors** | ✅ Completed | 3-Tier Adaptive Level, DITroy AI Enrichment, Overview Modal |
| **Deck Studio & Set Divider** | ✅ Completed | Set A/B/C Allocation, Grid $\leftrightarrow$ List Sideways Morph |
| **Study Music Lounge** | ✅ Completed | YouTube Audio Engine, Playlist Importer, Floating Player |
| **Interactive Practical Quest** | ✅ Completed | Guided Spotlight, Action Click-Blocking, Confetti |
| **Deck Forking & Sharing** | ✅ Completed | Ownership Sovereignty, Decoupled Cloning, Access Roles |
| **Account & Profile Management** | 🔄 Next Up | Dedicated `/profile`, Avatar Upload/Presets, Password Reset, Email Change |
| **Account Security & Data Export** | 🔄 Next Up | Re-auth guard, JSON Data Export, Full Account Self-Deletion |

---

*Last Updated: September 16, 2026 — ReviewFlash Team*
