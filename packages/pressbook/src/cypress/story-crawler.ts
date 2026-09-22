/// <reference types="cypress" />

import { StorybookTargetConfig } from "../config/types";
import { auditA11y } from "./a11y-auditor";

export interface StoryCrawlerOptions extends StorybookTargetConfig {
  a11yOptions?: any;
}

export function registerStoryChecker(options: StoryCrawlerOptions = {}) {
  const storybookUrl = (options.url || "http://localhost:6006").replace(
    /\/+$/,
    "",
  );
  const checkA11yEnabled = options.checkA11y !== false;
  const failOnErrors = options.failOnConsoleErrors !== false;
  const rootSelector = options.rootSelector || "#storybook-root, #root";
  const viewport = options.viewport || { width: 1280, height: 720 };
  const skipPatterns = options.skipStories || [];

  describe("Pressbook Storybook Automated Checker", () => {
    let storyEntries: Array<{
      id: string;
      title: string;
      name: string;
      type?: string;
    }> = [];

    before(() => {
      // Set default viewport
      cy.viewport(viewport.width, viewport.height);

      // Attempt to load index.json (Storybook 7+) or stories.json (Storybook 6/7)
      cy.request({
        url: `${storybookUrl}/index.json`,
        failOnStatusCode: false,
      }).then((resp: any) => {
        if (resp.status === 200 && resp.body) {
          const entries = resp.body.entries || resp.body.stories || {};
          storyEntries = Object.values(entries);
        } else {
          // Fallback to stories.json
          cy.request({
            url: `${storybookUrl}/stories.json`,
            failOnStatusCode: false,
          }).then((fallbackResp: any) => {
            if (fallbackResp.status === 200 && fallbackResp.body) {
              const entries =
                fallbackResp.body.stories || fallbackResp.body.entries || {};
              storyEntries = Object.values(entries);
            }
          });
        }
      });
    });

    it("verifies Storybook index is accessible and contains stories", () => {
      cy.wrap(null).then(() => {
        expect(
          storyEntries.length,
          "Discovered Storybook stories",
        ).to.be.greaterThan(0);
        cy.log(
          `Discovered ${storyEntries.length} stories to verify in Storybook`,
        );
      });
    });

    it("smoke tests all stories for successful render, console clean-state, and a11y", () => {
      cy.wrap(null).then(() => {
        const validStories = storyEntries.filter((s) => {
          if (s.type === "docs") return false;
          const isSkipped = skipPatterns.some((pattern) => {
            return (
              s.id.includes(pattern) ||
              s.title.includes(pattern) ||
              s.name.includes(pattern)
            );
          });
          return !isSkipped;
        });

        cy.log(
          `Running automated verification on ${validStories.length} component stories...`,
        );

        validStories.forEach((story) => {
          cy.log(
            `Checking Story: [${story.title}] -> ${story.name} (id: ${story.id})`,
          );

          let consoleErrors: string[] = [];

          // Visit isolated story iframe
          cy.visit(
            `${storybookUrl}/iframe.html?id=${encodeURIComponent(story.id)}&viewMode=story`,
            {
              timeout: options.timeout || 10000,
              onBeforeLoad(win: any) {
                if (failOnErrors) {
                  const originalError = win.console.error;
                  win.console.error = (...args: any[]) => {
                    consoleErrors.push(
                      args
                        .map((a) =>
                          typeof a === "object" ? JSON.stringify(a) : String(a),
                        )
                        .join(" "),
                    );
                    originalError.apply(win.console, args);
                  };
                }
              },
            },
          );

          // Verify story root container exists
          cy.get(rootSelector, { timeout: options.timeout || 10000 }).should(
            "exist",
          );

          // Run Accessibility Audit if enabled
          if (checkA11yEnabled) {
            auditA11y(rootSelector, options.a11yOptions);
          }

          // Check for uncaught console errors
          if (failOnErrors) {
            cy.wrap(null).then(() => {
              const criticalErrors = consoleErrors.filter(
                (err) => !err.includes("Download the React DevTools"),
              );
              expect(
                criticalErrors.length,
                `Console errors on story [${story.id}]: ${criticalErrors.join(" | ")}`,
              ).to.equal(0);
            });
          }
        });
      });
    });
  });
}
