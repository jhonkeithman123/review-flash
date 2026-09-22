import { definePressbookConfig } from "@dit/pressbook";

export default definePressbookConfig({
  storybook: {
    url: "http://localhost:6006",
    staticDir: "storybook-static",
    checkA11y: true,
    failOnConsoleErrors: true,
    timeout: 12000,
  },
  site: {
    url: "http://localhost:3000",
    routes: [
      { path: "/", name: "Home Page" },
      { path: "/about", name: "About Page" },
      { path: "/help", name: "Help Page" },
      { path: "/privacy", name: "Privacy Page" },
      { path: "/terms", name: "Terms Page" },
    ],
    checkA11y: true,
    checkConsoleErrors: true,
    checkBrokenLinks: false,
    viewports: [
      { name: "Desktop", width: 1280, height: 800 },
      { name: "Mobile", width: 375, height: 667 },
    ],
  },
  cypress: {
    headless: true,
    browser: "electron",
  },
});
