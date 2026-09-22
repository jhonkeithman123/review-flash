# ReviewFlash: Software Architecture & Computer Science Concepts

This document provides a comprehensive technical overview of the architecture, algorithms, data structures, and computer science concepts implemented throughout the **ReviewFlash** web application.

---

## 🏛️ 1. Architectural Styles & Design Patterns

### 1.1 Offline-First Progressive Single-Page Application (SPA)
* **Framework**: Built with **Next.js 16 (Turbopack)** and **TypeScript** leveraging the React 19 Client Component model.
* **0ms Latency Optimistic UI Updates**: All user actions (rating flashcard recall, creating cards, answering quiz questions, reordering sets) update React in-memory state and `localStorage` synchronously. Network persistence to Firebase Firestore runs asynchronously in the background.
* **Tiered Cache-Aside Storage Pattern**:
  $$\text{Memory (React State)} \longrightarrow \text{L1: Browser LocalStorage} \longrightarrow \text{L2: Cloud Firestore}$$
  If Firebase is unreachable or unconfigured, ReviewFlash automatically operates in 100% offline standalone mode without runtime crashes.

### 1.2 Event-Driven Architecture (EDA) via Decoupled CustomEvent Bus
To avoid deep prop drilling and tightly coupled state across distant components, ReviewFlash utilizes a browser-native Event Bus (`window.dispatchEvent` / `addEventListener`):
* `"open-ai-tutor"`: Triggers DITroy AI Study Tutor with rich situational context (active card, deck title, current question prompt).
* `"practical-tut-action"`: Notifies the Hands-On Practical Quest of user actions (`flip-card`, `rate-recall`, `create-card`, `quiz-option`, `share-deck`).
* `"update-ai-context"`: Live contextual broadcasts informing the AI assistant of user navigation.
* `"open-whats-new"` & `"open-reviewflash-tour"`: Origin-anchored modal triggers capturing click coordinates for GPU-accelerated spring animations.

### 1.3 Adaptive Heuristic + AI Multi-Tier Fallback Pattern
When generating logically challenging distractor options for quizzes or parsing messy flashcard text:
1. **L1 Local Cache**: Checks for cached AI responses (`localStorage`).
2. **L2 Cloud AI Inference**: Requests semantic distractors / flashcard synthesis from the **DITroy AI Engine** (`@131fgh/ditroy-client`).
3. **L3 Deterministic Heuristics**: If the AI is offline or rate-limited, domain heuristics automatically generate realistic alternatives based on answer types (BIOS keys, ports, HTTP codes, dates, booleans, or deck tag clusters).

---

## 🧠 2. Computer Science Concepts & Algorithms

### 2.1 Unbiased Permutation: Fisher-Yates Shuffle Algorithm ($O(N)$)
Located in [`lib/flashcardService.ts`](file:///c:/Users/131fgh/Documents/review-flash/lib/flashcardService.ts#L392):
```typescript
export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
```
* **Time Complexity**: $\mathcal{O}(N)$
* **Space Complexity**: $\mathcal{O}(N)$
* **Purpose**: Generates truly uniform, unbiased random card and question sequences for review sessions and multiple-choice options without position bias.

---

### 2.2 Greedy Partitioning & Remainder Allocation Algorithm
Located in [`lib/setDivider.ts`](file:///c:/Users/131fgh/Documents/review-flash/lib/setDivider.ts):
* **Problem**: When splitting a deck of $N$ items into $K$ sets or chunks of size $S$, odd numbers often produce an awkward dangling remainder set (e.g. 51 items into 2 sets yielding sets of 25, 25, and 1).
* **Algorithm**: Computes base chunk size $\lfloor N / K \rfloor$, greedily allocates items to sets $0 \dots K-2$, and assigns the entire remainder $R$ to the final set:
  $$\text{Final Set Size} = \lfloor N / K \rfloor + (N \bmod K)$$
* **Guarantees**: Exactly $K$ sets are generated; no singleton or orphan sets are created.

---

### 2.3 Semantic Scoring & Multi-Factor Ranking
Located in [`lib/ditroy.ts`](file:///c:/Users/131fgh/Documents/review-flash/lib/ditroy.ts):
To generate challenging, plausible multiple-choice distractors without AI overhead, candidate terms from the deck pool are scored using a weighted multi-factor heuristic:
$$\text{Score} = w_{\text{tag}} \cdot S_{\text{tags}} + w_{\text{diff}} \cdot (5 - |\Delta_{\text{diff}}|) + w_{\text{len}} \cdot S_{\text{length}} + \text{random}()$$
* **Shared Tag Overlap ($S_{\text{tags}}$)**: Prioritizes cards sharing topic tags.
* **Difficulty Proximity ($|\Delta_{\text{diff}}|$ )**: Prioritizes cards of similar difficulty rating.
* **Visual Length Parity ($S_{\text{length}}$)**: Ensures distractors match the visual length of the correct answer so choices look balanced and non-obvious.

---

### 2.4 Finite State Machines (FSM)
Multiple features in ReviewFlash are modeled as state machines:
1. **Practical Quest Engine** ([`components/practical-quest.tsx`](file:///c:/Users/131fgh/Documents/review-flash/components/practical-quest.tsx)):
   * **States**: $\text{Inactive} \leftrightarrow \text{Step 0 (Flip)} \rightarrow \text{Step 1 (Rate)} \rightarrow \text{Step 2 (Create)} \rightarrow \text{Step 3 (Quiz)} \rightarrow \text{Step 4 (Share)} \rightarrow \text{Completed}$.
   * **Transitions**: Triggered only upon specific user actions validated via `CustomEvent` predicates.
2. **Study Music Player** ([`components/study-music-player.tsx`](file:///c:/Users/131fgh/Documents/review-flash/components/study-music-player.tsx)):
   * **States**: `idle` $\rightarrow$ `loading` $\rightarrow$ `playing` $\leftrightarrow$ `paused` $\rightarrow$ `error` $\rightarrow$ `recovering / failover`.
   * **Failover Recovery**: When YouTube Error 150/101 occurs, the machine transitions to auto-recovery, selecting the next verified track.

---

### 2.5 Debouncing & Write Stream Throttling
Located in [`lib/flashcardService.ts`](file:///c:/Users/131fgh/Documents/review-flash/lib/flashcardService.ts):
* **Problem**: Rapid study interactions (e.g., flipping and rating 20 cards in 10 seconds) can exhaust Firestore connection write streams (`[code=resource-exhausted]: Write stream exhausted maximum allowed queued writes`).
* **Solution**: Implements a trailing-edge debounce timer with in-memory state aggregation. Rapid ratings mutate local authoritative state instantly while collapsing cloud network sync into a single debounced payload.

---

### 2.6 Serialization & Stateless Base64 Encoding
Located in [`lib/flashcardService.ts`](file:///c:/Users/131fgh/Documents/review-flash/lib/flashcardService.ts):
* **Deck Tokens**: `encodeDeckToken(deck)` serializes a study deck into a compressed, URL-safe Base64 payload (`RF1...`).
* **Purpose**: Allows peer-to-peer flashcard sharing across devices via URL query strings without requiring an active database account or backend storage.

---

### 2.7 Role-Based Access Control (RBAC) & Sovereignty Forking
* **Roles**: `owner`, `editor`, `viewer`.
* **Deck Sovereignty**: Forking any shared deck creates an isolated copy with fresh UUIDs and reassigns ownership to the active user, decoupling future edits from the original author's repository.

---

## 🔬 3. Cognitive Psychology & Learning Science Principles

1. **Active Recall Effect**: Forcing the brain to retrieve information from memory before revealing the answer (flashcard flip) reinforces neural pathways far more effectively than passive reading.
2. **Spaced Repetition & Leitner Rating**: Dynamic difficulty ratings (1–5) adjust based on user recall feedback, resurfacing challenging cards more frequently.
3. **Adaptive Testing & Distractor Nuance**: Adaptive streak tiers progressively increase question difficulty, providing closer distractor concepts as the user demonstrates mastery.

---

## 📊 4. Summary of Key Services

| Service / Module | Primary Responsibility | Key Patterns / Concepts |
| :--- | :--- | :--- |
| [`lib/flashcardService.ts`](file:///c:/Users/131fgh/Documents/review-flash/lib/flashcardService.ts) | Core deck CRUD, scoring, persistence, and deck sharing. | Cache-Aside, Fisher-Yates Shuffle, Debounced Sync. |
| [`lib/ditroy.ts`](file:///c:/Users/131fgh/Documents/review-flash/lib/ditroy.ts) | DITroy AI integration, Q&A synthesis, distractor generation. | Prompt Engineering, Multi-Tier Fallback, Semantic Scoring. |
| [`lib/aiMemoryService.ts`](file:///c:/Users/131fgh/Documents/review-flash/lib/aiMemoryService.ts) | Long-term student memory, conversation persistence. | Ephemeral to Persistent Sync, Document Mapping. |
| [`lib/setDivider.ts`](file:///c:/Users/131fgh/Documents/review-flash/lib/setDivider.ts) | Deck item partitioning and remainder distribution. | Greedy Partitioning, Remainder Allocation. |
| [`lib/musicPlaylists.ts`](file:///c:/Users/131fgh/Documents/review-flash/lib/musicPlaylists.ts) | YouTube ambient study audio playback and playlist parsing. | Failover FSM, URL Regex Parsing, Local Storage. |
| [`lib/firebase.ts`](file:///c:/Users/131fgh/Documents/review-flash/lib/firebase.ts) | Firebase App, Auth, and Firestore initialization. | Environment Variable Isolation, Lazy Initialization. |
