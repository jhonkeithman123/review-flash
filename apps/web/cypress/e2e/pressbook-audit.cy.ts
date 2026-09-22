import {
  registerStoryChecker,
  registerSiteAuditor,
} from "@dit/pressbook/cypress";

// 1. Storybook Component Stories Checker (smoke test, zero runtime crashes, console error tracking, a11y)
registerStoryChecker({
  url: Cypress.env("storybookUrl") || "http://localhost:6006",
  checkA11y: true,
  failOnConsoleErrors: true,
  timeout: 10000,
});

// 2. Next.js Site Route Health & Journey Auditor
registerSiteAuditor({
  url: Cypress.env("siteUrl") || "http://localhost:3000",
  routes: [
    { path: "/", name: "Home" },
    { path: "/about", name: "About" },
    { path: "/help", name: "Help" },
    { path: "/privacy", name: "Privacy" },
    { path: "/terms", name: "Terms" },
  ],
  checkA11y: true,
  checkConsoleErrors: true,
  a11yOptions: {
    includedImpacts: ["critical", "serious"],
    skipFailures: true, // Logs full a11y audits and reports violations without blocking route verification
  },
});
