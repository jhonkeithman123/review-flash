import { z } from "zod";

export interface ViewportSize {
  name?: string;
  width: number;
  height: number;
}

export interface RouteTarget {
  path: string;
  name?: string;
  waitForSelector?: string;
  skipA11y?: boolean;
}

export interface A11yAuditConfig {
  /** Axe-core rules tags (e.g. ['wcag2a', 'wcag2aa']). */
  tags?: string[];
  /** Only fail on specific impact levels. Default: ['serious', 'critical'] */
  includedImpacts?: ("minor" | "moderate" | "serious" | "critical")[];
  /** If true, logs violations as warnings without failing test assertions. Default: false */
  skipFailures?: boolean;
  /** Custom rules configuration for axe-core */
  rules?: Record<string, { enabled: boolean }>;
}

export interface StorybookTargetConfig {
  /** Storybook server URL. Default: http://localhost:6006 */
  url?: string;
  /** Directory of static storybook build if running offline. Default: 'storybook-static' */
  staticDir?: string;
  /** Port to serve static storybook on. Default: 6006 */
  staticPort?: number;
  /** Whether to run axe-core accessibility checks on every story. Default: true */
  checkA11y?: boolean;
  /** Whether to fail the test when window errors or console.error occur. Default: true */
  failOnConsoleErrors?: boolean;
  /** Glob patterns or story IDs to skip. */
  skipStories?: string[];
  /** Default viewport for story checking. */
  viewport?: { width: number; height: number };
  /** Timeout in ms to wait for story root to mount. Default: 10000 */
  timeout?: number;
  /** Optional custom CSS selector for story root. Default: '#storybook-root, #root' */
  rootSelector?: string;
  /** Custom A11y options for storybook */
  a11y?: A11yAuditConfig;
}

export interface SiteTargetConfig {
  /** Base URL of the live or dev web application. Default: http://localhost:3000 */
  url?: string;
  /** Routes to check. Default: ['/'] */
  routes?: (string | RouteTarget)[];
  /** Whether to run accessibility checks on site pages. Default: true */
  checkA11y?: boolean;
  /** Whether to fail when console.error is invoked on page load. Default: true */
  checkConsoleErrors?: boolean;
  /** Whether to test all <a> links for 404/broken status. Default: false */
  checkBrokenLinks?: boolean;
  /** Viewports to test routes against. */
  viewports?: ViewportSize[];
  /** Request timeout in ms. Default: 15000 */
  timeout?: number;
  /** Custom A11y options for site pages */
  a11y?: A11yAuditConfig;
}

export interface CypressRunnerConfig {
  /** Run headless or open interactive UI. Default: true in CLI */
  headless?: boolean;
  /** Browser to run tests with (chrome, electron, firefox, edge). Default: 'electron' */
  browser?: string;
  /** Custom spec pattern override. */
  specPattern?: string | string[];
  /** Custom reporter. */
  reporter?: string;
  /** Video recording enabled. Default: false */
  video?: boolean;
}

export interface PressbookConfig {
  /** Storybook verification config */
  storybook?: StorybookTargetConfig | false;
  /** Full site verification config */
  site?: SiteTargetConfig | false;
  /** Cypress runner settings */
  cypress?: CypressRunnerConfig;
  /** Custom a11y axe-core rules options */
  a11yOptions?: A11yAuditConfig;
}

export const PressbookConfigSchema = z.object({
  storybook: z
    .union([
      z.boolean(),
      z.object({
        url: z.string().optional(),
        staticDir: z.string().optional(),
        staticPort: z.number().optional(),
        checkA11y: z.boolean().optional(),
        failOnConsoleErrors: z.boolean().optional(),
        skipStories: z.array(z.string()).optional(),
        viewport: z
          .object({ width: z.number(), height: z.number() })
          .optional(),
        timeout: z.number().optional(),
        rootSelector: z.string().optional(),
        a11y: z.any().optional(),
      }),
    ])
    .optional(),
  site: z
    .union([
      z.boolean(),
      z.object({
        url: z.string().optional(),
        routes: z
          .array(
            z.union([
              z.string(),
              z.object({
                path: z.string(),
                name: z.string().optional(),
                waitForSelector: z.string().optional(),
                skipA11y: z.boolean().optional(),
              }),
            ]),
          )
          .optional(),
        checkA11y: z.boolean().optional(),
        checkConsoleErrors: z.boolean().optional(),
        checkBrokenLinks: z.boolean().optional(),
        viewports: z
          .array(
            z.object({
              name: z.string().optional(),
              width: z.number(),
              height: z.number(),
            }),
          )
          .optional(),
        timeout: z.number().optional(),
        a11y: z.any().optional(),
      }),
    ])
    .optional(),
  cypress: z
    .object({
      headless: z.boolean().optional(),
      browser: z.string().optional(),
      specPattern: z.union([z.string(), z.array(z.string())]).optional(),
      reporter: z.string().optional(),
      video: z.boolean().optional(),
    })
    .optional(),
  a11yOptions: z.any().optional(),
});

/**
 * Type-safe configuration helper function for pressbook.config.ts
 */
export function definePressbookConfig(
  config: PressbookConfig,
): PressbookConfig {
  return config;
}
