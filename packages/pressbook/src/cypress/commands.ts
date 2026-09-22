/// <reference types="cypress" />

import { StoryCrawlerOptions } from "./story-crawler";
import { SiteAuditorOptions } from "./site-auditor";
import { auditA11y } from "./a11y-auditor";

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Automatically verifies that all Storybook stories render without uncaught errors and pass A11y checks.
       */
      checkPressbookStories(options?: StoryCrawlerOptions): Chainable<void>;

      /**
       * Runs an automated accessibility audit using axe-core on the specified element or full page.
       */
      auditPressbookA11y(selector?: string, options?: any): Chainable<void>;

      /**
       * Audits a site route for successful status, render, and no console errors.
       */
      auditPressbookRoute(
        route: string,
        options?: SiteAuditorOptions,
      ): Chainable<void>;

      /**
       * Checks all <a> links on the current page for broken (404/500) status.
       */
      checkPressbookBrokenLinks(baseUrl?: string): Chainable<void>;
    }
  }
}

export function registerPressbookCommands() {
  if (typeof Cypress === "undefined") return;

  try {
    // Dynamically load cypress-axe inside Cypress browser runtime
    require("cypress-axe");
  } catch (e) {
    // If running in ESM browser context
  }

  Cypress.Commands.add(
    "auditPressbookA11y",
    (selector?: string, options?: any) => {
      auditA11y(selector, options);
    },
  );

  Cypress.Commands.add(
    "checkPressbookStories",
    (options: StoryCrawlerOptions = {}) => {
      const storybookUrl = (options.url || "http://localhost:6006").replace(
        /\/+$/,
        "",
      );
      const checkA11yEnabled = options.checkA11y !== false;
      const failOnErrors = options.failOnConsoleErrors !== false;
      const rootSelector = options.rootSelector || "#storybook-root, #root";
      const skipPatterns = options.skipStories || [];

      cy.request({
        url: `${storybookUrl}/index.json`,
        failOnStatusCode: false,
      }).then((resp: any) => {
        let storyEntries: Array<{
          id: string;
          title: string;
          name: string;
          type?: string;
        }> = [];
        if (resp.status === 200 && resp.body) {
          storyEntries = Object.values(
            resp.body.entries || resp.body.stories || {},
          );
        }

        const validStories = storyEntries.filter((s) => {
          if (s.type === "docs") return false;
          return !skipPatterns.some(
            (pattern) => s.id.includes(pattern) || s.title.includes(pattern),
          );
        });

        validStories.forEach((story) => {
          let consoleErrors: string[] = [];
          cy.visit(
            `${storybookUrl}/iframe.html?id=${encodeURIComponent(story.id)}&viewMode=story`,
            {
              timeout: options.timeout || 10000,
              onBeforeLoad(win: any) {
                if (failOnErrors) {
                  const origErr = win.console.error;
                  win.console.error = (...args: any[]) => {
                    consoleErrors.push(
                      args
                        .map((a) =>
                          typeof a === "object" ? JSON.stringify(a) : String(a),
                        )
                        .join(" "),
                    );
                    origErr.apply(win.console, args);
                  };
                }
              },
            },
          );

          cy.get(rootSelector, { timeout: options.timeout || 10000 }).should(
            "exist",
          );

          if (checkA11yEnabled) {
            auditA11y(rootSelector, options.a11yOptions);
          }

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
    },
  );

  Cypress.Commands.add("checkPressbookBrokenLinks", (baseUrl?: string) => {
    const rootUrl = baseUrl || "";
    cy.get("a[href]").each(($el) => {
      const href = $el.attr("href");
      if (
        href &&
        !href.startsWith("mailto:") &&
        !href.startsWith("tel:") &&
        !href.startsWith("#") &&
        !href.startsWith("javascript:")
      ) {
        const checkUrl = href.startsWith("http")
          ? href
          : `${rootUrl}${href.startsWith("/") ? href : `/${href}`}`;
        cy.request({
          url: checkUrl,
          failOnStatusCode: false,
        }).then((resp: any) => {
          expect(resp.status, `Link "${href}" is broken`).to.be.lessThan(400);
        });
      }
    });
  });
}
