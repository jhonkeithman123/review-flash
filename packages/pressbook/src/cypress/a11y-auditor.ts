/// <reference types="cypress" />
/// <reference types="cypress-axe" />

import { A11yAuditConfig } from '../config/types';

/**
 * A11y violation logger and checker for Pressbook
 */
export function formatA11yViolations(violations: any[]): string {
  if (!violations || violations.length === 0)
    return "No accessibility violations found.";

  const violationDetails = violations.map((v) => {
    const nodes = v.nodes
      .map(
        (n: any) =>
          `    - Target: ${n.target.join(", ")}\n      HTML: ${n.html}`,
      )
      .join("\n");
    return `[${v.impact?.toUpperCase() || "INFO"}] ${v.id}: ${v.help}\n  Help URL: ${v.helpUrl}\n  Nodes affected (${v.nodes.length}):\n${nodes}`;
  });

  return (
    `\n⚠️ Accessibility Violations (${violations.length}):\n` +
    violationDetails.join("\n\n")
  );
}

export function auditA11y(
  contextSelector?: string,
  options?: A11yAuditConfig,
  violationCallback?: (violations: any[]) => void,
) {
  // @ts-ignore
  if (typeof cy === 'undefined' || typeof cy.injectAxe !== 'function') return;

  const a11yConfig = options || {};
  const tags = a11yConfig.tags || ['wcag2a', 'wcag2aa'];
  const impacts = a11yConfig.includedImpacts || ['critical', 'serious'];
  const skipFailures = a11yConfig.skipFailures === true;

  cy.injectAxe();
  cy.checkA11y(
    contextSelector || undefined,
    {
      runOnly: {
        type: 'tag',
        values: tags,
      },
      rules: a11yConfig.rules || {},
      includedImpacts: a11yConfig.includedImpacts,
    },
    (violations: any[]) => {
      // Filter violations based on configured impact levels if set
      const relevantViolations = violations.filter((v) =>
        impacts.includes(v.impact as any)
      );

      if (relevantViolations.length > 0) {
        const report = formatA11yViolations(relevantViolations);
        cy.task('log', report, { log: false });
        Cypress.log({
          name: 'a11y-violation',
          message: `${relevantViolations.length} critical accessibility violation(s) detected`,
          consoleProps: () => ({ violations: relevantViolations }),
        });

        if (!skipFailures) {
          expect(
            relevantViolations.length,
            `${relevantViolations.length} A11y violations found: ${relevantViolations.map((v) => v.id).join(', ')}`
          ).to.equal(0);
        }
      }

      if (violationCallback) {
        violationCallback(violations);
      }
    },
    skipFailures
  );
}
