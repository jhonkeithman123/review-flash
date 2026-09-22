import { defineConfig } from "cypress";
import { definePressbookCypressConfig } from "@dit/pressbook/cypress";

export default defineConfig(
  definePressbookCypressConfig({
    siteUrl: "http://localhost:3000",
    storybookUrl: "http://localhost:6006",
    specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    supportFile: "cypress/support/e2e.ts",
  })
);
