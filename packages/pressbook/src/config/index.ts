import { cosmiconfig } from "cosmiconfig";
import { PressbookConfig, PressbookConfigSchema } from "./types";

export * from "./types";

export const DEFAULT_CONFIG: PressbookConfig = {
  storybook: {
    url: "http://localhost:6006",
    staticDir: "storybook-static",
    staticPort: 6006,
    checkA11y: true,
    failOnConsoleErrors: true,
    timeout: 10000,
    viewport: { width: 1280, height: 720 },
  },
  site: {
    url: "http://localhost:3000",
    routes: ["/"],
    checkA11y: true,
    checkConsoleErrors: true,
    checkBrokenLinks: false,
    timeout: 15000,
    viewports: [
      { name: "desktop", width: 1280, height: 800 },
      { name: "mobile", width: 375, height: 667 },
    ],
  },
  cypress: {
    headless: true,
    browser: "electron",
    video: false,
  },
  a11yOptions: {
    tags: ["wcag2a", "wcag2aa"],
    includedImpacts: ["critical", "serious"],
    skipFailures: false,
  },
};

export async function loadPressbookConfig(
  customPath?: string,
): Promise<PressbookConfig> {
  const explorer = cosmiconfig("pressbook", {
    searchPlaces: [
      "pressbook.config.ts",
      "pressbook.config.js",
      "pressbook.config.mjs",
      "pressbook.config.cjs",
      "pressbook.config.json",
      "package.json",
    ],
  });

  try {
    const result = customPath
      ? await explorer.load(customPath)
      : await explorer.search();
    if (!result || !result.config) {
      return DEFAULT_CONFIG;
    }

    const parsed = PressbookConfigSchema.safeParse(result.config);
    if (!parsed.success) {
      console.warn(
        "⚠️ Pressbook config validation warning:",
        parsed.error.format(),
      );
    }

    const userConfig = result.config as PressbookConfig;

    return {
      ...DEFAULT_CONFIG,
      ...userConfig,
      storybook:
        userConfig.storybook === false
          ? false
          : {
              ...(DEFAULT_CONFIG.storybook as any),
              ...(userConfig.storybook || {}),
            },
      site:
        userConfig.site === false
          ? false
          : { ...(DEFAULT_CONFIG.site as any), ...(userConfig.site || {}) },
      cypress: {
        ...DEFAULT_CONFIG.cypress,
        ...(userConfig.cypress || {}),
      },
      a11yOptions: {
        ...DEFAULT_CONFIG.a11yOptions,
        ...(userConfig.a11yOptions || {}),
      },
    };
  } catch (err) {
    console.warn(
      "Could not load pressbook configuration file, using defaults.",
      err,
    );
    return DEFAULT_CONFIG;
  }
}
