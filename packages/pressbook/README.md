# @dit/pressbook 📖⚡

**Universal Frontend Checker combining Cypress and Storybook.**

Pressbook combines the isolated component power of **Storybook** with the automated browser verification of **Cypress**. It gives you automated story smoke testing, console error tracking, WCAG 2.1 AA accessibility audits via `axe-core`, and full-site route health verification with zero boilerplate.

Compatible with **monolithic applications**, **monorepos** (Turborepo, Nx, pnpm, Bun, Yarn, npm), and **polyrepos**.

---

## 🚀 Features

- 🔍 **Storybook Auto-Crawler**: Automatically queries Storybook's `index.json`, visits every story iframe, and verifies it renders cleanly with zero React crashes.
- ♿ **Automated Accessibility (A11y)**: Injects `axe-core` and audits all stories and site routes against WCAG 2.1 AA rules.
- 🛑 **Console Error Detection**: Intercepts `console.error` and window errors during component mount to catch hidden runtime bugs.
- 🌐 **Site Journey & Route Health**: Crawls site routes across multiple viewports (mobile, tablet, desktop) and detects broken links (404/500).
- 📦 **Monorepo & Monolith Ready**: Works via zero-config CLI or extensible Cypress custom commands.

---

## 📦 Installation

```bash
# In pnpm monorepo or project
pnpm add -D @dit/pressbook cypress @storybook/react

# In npm
npm install --save-dev @dit/pressbook cypress @storybook/react

# In bun
bun add -D @dit/pressbook cypress @storybook/react
```

---

## 🛠️ Quick Start

### 1. Initialize Configuration

Generate `pressbook.config.ts` in your project root:

```typescript
// pressbook.config.ts
import { definePressbookConfig } from "@dit/pressbook";

export default definePressbookConfig({
  storybook: {
    url: "http://localhost:6006",
    staticDir: "storybook-static",
    checkA11y: true,
    failOnConsoleErrors: true,
  },
  site: {
    url: "http://localhost:3000",
    routes: ["/", "/review", "/decks"],
    checkA11y: true,
    checkConsoleErrors: true,
    checkBrokenLinks: true,
  },
});
```

### 2. Configure Cypress

Add Pressbook preset to your `cypress.config.ts`:

```typescript
// cypress.config.ts
import { defineConfig } from "cypress";
import { definePressbookCypressConfig } from "@dit/pressbook/cypress";

export default defineConfig(
  definePressbookCypressConfig({
    siteUrl: "http://localhost:3000",
    storybookUrl: "http://localhost:6006",
  }),
);
```

Register commands in `cypress/support/e2e.ts`:

```typescript
// cypress/support/e2e.ts
import { registerPressbookCommands } from "@dit/pressbook/cypress";

registerPressbookCommands();
```

### 3. Add an Audit Spec

Create `cypress/e2e/pressbook-audit.cy.ts`:

```typescript
// cypress/e2e/pressbook-audit.cy.ts
import {
  registerStoryChecker,
  registerSiteAuditor,
} from "@dit/pressbook/cypress";

// 1. Audit all Storybook components
registerStoryChecker({
  url: "http://localhost:6006",
  checkA11y: true,
  failOnConsoleErrors: true,
});

// 2. Audit Site pages
registerSiteAuditor({
  url: "http://localhost:3000",
  routes: ["/"],
  checkA11y: true,
  checkConsoleErrors: true,
});
```

---

## ⚡ CLI Usage

Pressbook includes a powerful CLI:

```bash
# Run full suite (Storybook crawler + site audit)
pressbook run

# Run only Storybook story crawler & a11y
pressbook storybook

# Run only Site route audits
pressbook site

# Override options via CLI
pressbook storybook --storybook-url http://localhost:6006 --no-headless
```

---

## 🏢 Monorepo Setup (e.g. Turborepo / pnpm)

In a monorepo, reference `@dit/pressbook` across workspace packages:

```json
// apps/web/package.json
{
  "devDependencies": {
    "@dit/pressbook": "workspace:*"
  },
  "scripts": {
    "test:pressbook": "cypress run"
  }
}
```

---

## 📄 License

MIT © DIT Team
