/// <reference types="cypress" />

import { SiteTargetConfig, RouteTarget } from "../config/types";
import { auditA11y } from "./a11y-auditor";

export interface SiteAuditorOptions extends SiteTargetConfig {
  a11yOptions?: any;
}

export function registerSiteAuditor(options: SiteAuditorOptions = {}) {
  const baseUrl = (options.url || "http://localhost:3000").replace(/\/+$/, "");
  const routes = options.routes || ["/"];
  const viewports = options.viewports || [
    { name: "desktop", width: 1280, height: 800 },
    { name: "mobile", width: 375, height: 667 },
  ];
  const checkA11yEnabled = options.checkA11y !== false;
  const checkConsole = options.checkConsoleErrors !== false;
  const checkLinks = options.checkBrokenLinks === true;

  describe("Pressbook Site Health & Journey Auditor", () => {
    routes.forEach((routeEntry) => {
      const routePath =
        typeof routeEntry === "string" ? routeEntry : routeEntry.path;
      const routeName =
        typeof routeEntry === "string"
          ? routeEntry
          : routeEntry.name || routeEntry.path;
      const waitForSelector =
        typeof routeEntry === "object" ? routeEntry.waitForSelector : undefined;
      const skipRouteA11y =
        typeof routeEntry === "object" ? routeEntry.skipA11y : false;

      const targetUrl = `${baseUrl}${routePath.startsWith("/") ? routePath : `/${routePath}`}`;

      describe(`Route: ${routeName} (${routePath})`, () => {
        viewports.forEach((vp) => {
          it(`loads successfully on ${vp.name || `${vp.width}x${vp.height}`} without crash`, () => {
            cy.viewport(vp.width, vp.height);

            let consoleErrors: string[] = [];

            cy.visit(targetUrl, {
              timeout: options.timeout || 15000,
              failOnStatusCode: true,
              onBeforeLoad(win: any) {
                if (checkConsole) {
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
            });

            if (waitForSelector) {
              cy.get(waitForSelector, {
                timeout: options.timeout || 15000,
              }).should("be.visible");
            } else {
              cy.get("body").should("exist");
            }

            // A11y Audit on Desktop
            if (
              checkA11yEnabled &&
              !skipRouteA11y &&
              (vp.name === "desktop" || vp.width >= 768)
            ) {
              auditA11y(undefined, options.a11yOptions);
            }

            // Console errors assertion
            if (checkConsole) {
              cy.wrap(null).then(() => {
                const criticalErrors = consoleErrors.filter(
                  (err) =>
                    !err.includes("Download the React DevTools") &&
                    !err.includes("hydration") &&
                    !err.includes("favicon.ico"),
                );
                expect(
                  criticalErrors.length,
                  `Console errors on ${routePath} (${vp.name}): ${criticalErrors.join(" | ")}`,
                ).to.equal(0);
              });
            }

            // Broken links check
            if (checkLinks) {
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
                    : `${baseUrl}${href.startsWith("/") ? href : `/${href}`}`;
                  cy.request({
                    url: checkUrl,
                    failOnStatusCode: false,
                  }).then((resp: any) => {
                    expect(
                      resp.status,
                      `Link "${href}" on page "${routePath}" returned status ${resp.status}`,
                    ).to.be.lessThan(400);
                  });
                }
              });
            }
          });
        });
      });
    });
  });
}
