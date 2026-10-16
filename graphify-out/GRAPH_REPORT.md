# Graph Report - review-flash  (2026-10-16)

## Corpus Check
- 99 files · ~380,271 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: (none) 4, .ico 3, .cache 1)

## Summary
- 749 nodes · 1437 edges · 55 communities (40 shown, 15 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `dc432da9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- AGENTS.md
- flashcard.ts
- flashcardService.ts
- ditroy.ts
- create/page.tsx
- study-music-player.tsx
- tasks
- scripts
- web/package.json
- version.ts
- ✅ Completed Milestones & Capabilities
- compilerOptions
- pressbook/package.json
- devDependencies
- cli/index.ts
- compilerOptions
- app/layout.tsx
- navbar.tsx
- ReviewFlash — Official Changelog
- next
- lucide-react
- cypress/commands.ts
- exports
- types.ts
- scripts
- @dit/pressbook 📖⚡
- About ReviewFlash & The Creator
- dependencies
- practical-quest.tsx
- cypress.config.ts
- dependencies
- ReviewFlash ⚡
- 🧠 2. Computer Science Concepts & Algorithms
- ReviewFlash: Software Architecture & Computer Science Concepts
- 🧠 Core Pillars & Design Philosophy
- Chainable
- compose.ts
- component.ts
- peerDependenciesMeta
- devDependencies
- eslint.config.mjs
- main.ts
- pressbook.js
- scripts
- Minor Bug Fix & Improvement Update
- peerDependencies
- config-preset.ts
- postcss.config.mjs
- vercel.json

## God Nodes (most connected - your core abstractions)
1. `lucide-react` - 35 edges
2. `react` - 31 edges
3. `getCurrentUserId()` - 28 edges
4. `next` - 26 edges
5. `fetchDecks()` - 24 edges
6. `TestContent()` - 22 edges
7. `updateDeck()` - 19 edges
8. `canUseFirestore` - 19 edges
9. `CreateContent()` - 18 edges
10. `Flashcard` - 16 edges

## Surprising Connections (you probably didn't know these)
- `⚡ Improvements & New Features` --references--> `DeckSelector()`  [INFERRED]
  apps/web/docs/CHANGELOG.md → apps/web/components/deck-selector.tsx
- `⚡ Improvements & New Features` --references--> `DeckSetSelector()`  [INFERRED]
  apps/web/docs/CHANGELOG.md → apps/web/components/deck-set-selector.tsx
- `deleteAiConversation()` --calls--> `getCurrentUserId()`  [EXTRACTED]
  apps/web/lib/aiMemoryService.ts → apps/web/lib/flashcardService.ts
- `DeckSelectorProps` --references--> `Deck`  [EXTRACTED]
  apps/web/components/deck-selector.tsx → apps/web/types/flashcard.ts
- `FlashcardCardProps` --references--> `Flashcard`  [EXTRACTED]
  apps/web/components/flashcard-card.tsx → apps/web/types/flashcard.ts

## Import Cycles
- None detected.

## Communities (55 total, 15 thin omitted)

### Community 1 - "flashcard.ts"
Cohesion: 0.05
Nodes (55): initialStats, ReviewContent(), ReviewHistoryItem, ReviewPage(), ShareContent(), SharePage(), DeckSelector(), DeckSelectorProps (+47 more)

### Community 2 - "flashcardService.ts"
Cohesion: 0.09
Nodes (49): buildStableQuizQuestions(), initialStats, TestContent(), initQuizQuestions(), loadData(), TestPage(), QuestionOverviewModal(), QuestionOverviewModalProps (+41 more)

### Community 3 - "ditroy.ts"
Cohesion: 0.06
Nodes (39): AiChatDrawer(), ChatMessage, isMessageTruncated(), AiMarkdownRenderer(), AiMarkdownRendererProps, renderInlineMarkdown(), deleteAiConversation(), deleteAiConversationFromFirebase (+31 more)

### Community 4 - "create/page.tsx"
Cohesion: 0.15
Nodes (44): convertHtmlToMarkdownBold(), CreateContent(), load(), CreatePage(), parseTextToCards(), StagedCard, DecksPage(), HelpPage() (+36 more)

### Community 5 - "study-music-player.tsx"
Cohesion: 0.11
Nodes (24): useConfirm(), formatTime(), StudyMusicPlayer(), Window, CURATED_PLAYLISTS, fetchCloudPlaylists(), fetchCloudUserCustomPlaylists, loadLocalPlaylists() (+16 more)

### Community 6 - "tasks"
Cohesion: 0.07
Nodes (27): dependsOn, inputs, outputs, dependsOn, outputs, cache, persistent, cache (+19 more)

### Community 7 - "scripts"
Cohesion: 0.09
Nodes (21): devDependencies, turbo, name, packageManager, private, scripts, build, build:pressbook (+13 more)

### Community 8 - "web/package.json"
Cohesion: 0.10
Nodes (20): cypress, @storybook/react, @types/node, typescript, name, private, version, clsx (+12 more)

### Community 9 - "version.ts"
Cohesion: 0.16
Nodes (11): ChangeItem, UPCOMING_ROADMAP, UPDATE_LOGS, VersionLog, APP_CODENAME, APP_RELEASE_DATE, APP_VERSION, LATEST_VERSION (+3 more)

### Community 10 - "✅ Completed Milestones & Capabilities"
Cohesion: 0.11
Nodes (18): 1. 🗂️ Core Study & Review Engine, 1. 👤 Dedicated Profile Management Page (`/profile`), 2. 📝 Adaptive Test & Assessment Mode, 2. 🖼️ Profile Picture & Avatar Customization, 3. 🎨 Deck Studio & Set Divider, 3. 🔑 Password Management & Security, 4. 🤖 AI Study Assistant & Long-Term Memory, 4. 📧 Email & Identity Management (+10 more)

### Community 11 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 12 - "pressbook/package.json"
Cohesion: 0.11
Nodes (17): author, bin, pressbook, description, files, cypress, @storybook/react, @types/node (+9 more)

### Community 13 - "devDependencies"
Cohesion: 0.11
Nodes (18): devDependencies, cypress, @dit/pressbook, eslint, eslint-config-next, storybook, @storybook/react, @storybook/react-vite (+10 more)

### Community 14 - "cli/index.ts"
Cohesion: 0.16
Nodes (11): runCli(), runCypressSuite(), startStaticServerIfStaticDirExists(), InitWizardOptions, resolvePackageName(), runInitWizard(), loadPressbookConfig(), @clack/prompts (+3 more)

### Community 15 - "compilerOptions"
Cohesion: 0.11
Nodes (17): compilerOptions, declaration, declarationMap, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution (+9 more)

### Community 16 - "app/layout.tsx"
Cohesion: 0.18
Nodes (13): metadata, RootLayout(), viewport, AdblockDetector(), ConfirmContext, ConfirmContextType, ConfirmOptions, ConfirmPromptProvider() (+5 more)

### Community 17 - "navbar.tsx"
Cohesion: 0.25
Nodes (13): AuthModal(), AuthModalProps, Navbar(), primaryNavItems, usePracticalQuest(), facebookProvider, firebaseConfig, googleProvider (+5 more)

### Community 18 - "ReviewFlash — Official Changelog"
Cohesion: 0.12
Nodes (17): Cognitive Dual-Engine & Knowledge Hub, Collaborative Study & Permission Mesh, Deck Studio & Rich Text Engine, DITroy AI Tutor & Spaced Retrieval, Genesis: Modern Active Recall Flashcards, ReviewFlash — Official Changelog, The Fluid Motion & Ambient Lounge Update, The Music & Social Horizon (+9 more)

### Community 19 - "next"
Cohesion: 0.14
Nodes (6): generateConfirmationCode(), GET(), POST(), featureCards, nextConfig, next

### Community 20 - "lucide-react"
Cohesion: 0.17
Nodes (7): DataDeletionContent(), DataDeletionPage(), CURRENT_APP_VERSION, FeatureHighlight, HIGHLIGHTS, lucide-react, react

### Community 21 - "cypress/commands.ts"
Cohesion: 0.30
Nodes (8): StorybookTargetConfig, auditA11y(), formatA11yViolations(), Cypress, registerPressbookCommands(), registerSiteAuditor(), registerStoryChecker(), StoryCrawlerOptions

### Community 22 - "exports"
Cohesion: 0.15
Nodes (13): import, require, types, import, require, types, exports, ./config (+5 more)

### Community 23 - "types.ts"
Cohesion: 0.20
Nodes (9): DEFAULT_CONFIG, A11yAuditConfig, CypressRunnerConfig, PressbookConfig, PressbookConfigSchema, RouteTarget, ViewportSize, cosmiconfig (+1 more)

### Community 24 - "scripts"
Cohesion: 0.18
Nodes (11): scripts, build, build-storybook, cypress:open, cypress:run, dev, lint, seed:firebase (+3 more)

### Community 25 - "@dit/pressbook 📖⚡"
Cohesion: 0.18
Nodes (10): 1. Initialize Configuration, 2. Configure Cypress, 3. Add an Audit Spec, ⚡ CLI Usage, @dit/pressbook 📖⚡, 🚀 Features, 📦 Installation, 📄 License (+2 more)

### Community 26 - "About ReviewFlash & The Creator"
Cohesion: 0.20
Nodes (7): About ReviewFlash & The Creator, **Keith Virgenes (131fgh)**, 👨‍💻 Meet the Creator, 🌐 Quick Links & Resources, 🛠️ Technology Stack & Architecture, 💡 The Vision Behind ReviewFlash, ⚡ What is ReviewFlash?

### Community 27 - "dependencies"
Cohesion: 0.20
Nodes (10): dependencies, @131fgh/ditroy-client, canvas-confetti, clsx, firebase, lucide-react, next, react (+2 more)

### Community 28 - "practical-quest.tsx"
Cohesion: 0.25
Nodes (7): TOUR_STEPS, TourStep, PracticalQuestContext, PracticalQuestContextType, QUEST_STEPS, QuestStep, canvas-confetti

### Community 30 - "dependencies"
Cohesion: 0.22
Nodes (9): dependencies, axe-core, @clack/prompts, commander, cosmiconfig, cypress-axe, picocolors, sirv (+1 more)

### Community 31 - "ReviewFlash ⚡"
Cohesion: 0.22
Nodes (8): 1. Prerequisites, 2. Installation & Setup, 👨‍💻 Creator & Maintainer, 🚀 Getting Started, 🌟 Key Features, 📄 License, 📚 Project Documentation (`docs/`), ReviewFlash ⚡

### Community 32 - "🧠 2. Computer Science Concepts & Algorithms"
Cohesion: 0.25
Nodes (8): 2.1 Unbiased Permutation: Fisher-Yates Shuffle Algorithm ($O(N)$), 2.2 Greedy Partitioning & Remainder Allocation Algorithm, 2.3 Semantic Scoring & Multi-Factor Ranking, 2.4 Finite State Machines (FSM), 2.5 Debouncing & Write Stream Throttling, 2.6 Serialization & Stateless Base64 Encoding, 2.7 Role-Based Access Control (RBAC) & Sovereignty Forking, 🧠 2. Computer Science Concepts & Algorithms

### Community 33 - "ReviewFlash: Software Architecture & Computer Science Concepts"
Cohesion: 0.29
Nodes (7): 1.1 Offline-First Progressive Single-Page Application (SPA), 1.2 Event-Driven Architecture (EDA) via Decoupled CustomEvent Bus, 1.3 Adaptive Heuristic + AI Multi-Tier Fallback Pattern, 🏛️ 1. Architectural Styles & Design Patterns, 🔬 3. Cognitive Psychology & Learning Science Principles, 📊 4. Summary of Key Services, ReviewFlash: Software Architecture & Computer Science Concepts

### Community 34 - "🧠 Core Pillars & Design Philosophy"
Cohesion: 0.33
Nodes (6): 1. **Evidence-Based Active Recall (SM-2 Spaced Retrieval)**, 2. **DITroy AI Ecosystem & Adaptive Intelligence**, 3. **Tactile 3D Motion & Fluid Micro-Interactions**, 4. **Study Music Lounge (Ambient Deep Focus)**, 5. **Data Sovereignty & Deck Forking**, 🧠 Core Pillars & Design Philosophy

### Community 35 - "Chainable"
Cohesion: 0.33
Nodes (3): SiteTargetConfig, Chainable, SiteAuditorOptions

### Community 38 - "peerDependenciesMeta"
Cohesion: 0.40
Nodes (5): optional, peerDependenciesMeta, cypress, @storybook/react, optional

### Community 39 - "devDependencies"
Cohesion: 0.40
Nodes (5): devDependencies, cypress, tsup, @types/node, typescript

### Community 40 - "eslint.config.mjs"
Cohesion: 0.50
Nodes (3): eslintConfig, eslint, eslint-config-next

### Community 43 - "scripts"
Cohesion: 0.50
Nodes (4): scripts, build, dev, typecheck

### Community 44 - "Minor Bug Fix & Improvement Update"
Cohesion: 0.67
Nodes (3): 🐛 Bug Fixes, Minor Bug Fix & Improvement Update, [v2.2.1] — September 15, 2026

### Community 46 - "peerDependencies"
Cohesion: 0.67
Nodes (3): peerDependencies, cypress, @storybook/react

## Knowledge Gaps
- **23 isolated node(s):** `cypress`, `@storybook/react`, `@types/node`, `typescript`, `axe-core` (+18 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 370 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `⚡ Improvements & New Features` connect `flashcard.ts` to `Minor Bug Fix & Improvement Update`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **What connects `cypress`, `@storybook/react`, `@types/node` to the rest of the system?**
  _23 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `flashcard.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05441400304414003 - nodes in this community are weakly interconnected._
- **Why does `Minor Bug Fix & Improvement Update` connect `Minor Bug Fix & Improvement Update` to `flashcard.ts`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Should `flashcardService.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09143686502177069 - nodes in this community are weakly interconnected._
- **Why does `ReviewFlash — Official Changelog` connect `ReviewFlash — Official Changelog` to `About ReviewFlash & The Creator`, `Minor Bug Fix & Improvement Update`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **Should `ditroy.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06352941176470588 - nodes in this community are weakly interconnected._