export interface PressbookCypressConfigOptions {
  siteUrl?: string;
  storybookUrl?: string;
  specPattern?: string | string[];
  supportFile?: string | false;
  video?: boolean;
  screenshotOnRunFailure?: boolean;
  viewportWidth?: number;
  viewportHeight?: number;
  setupNodeEvents?: (on: any, config: any) => any;
  [key: string]: any;
}

/**
 * Helper to generate optimal Cypress configuration for Pressbook
 */
export function definePressbookCypressConfig(
  options: PressbookCypressConfigOptions = {},
) {
  const {
    siteUrl = "http://localhost:3000",
    storybookUrl = "http://localhost:6006",
    specPattern = ["cypress/e2e/**/*.cy.{js,jsx,ts,tsx}"],
    supportFile = "cypress/support/e2e.{js,jsx,ts,tsx}",
    video = false,
    screenshotOnRunFailure = true,
    viewportWidth = 1280,
    viewportHeight = 720,
    setupNodeEvents,
    ...rest
  } = options;

  return {
    e2e: {
      baseUrl: siteUrl,
      specPattern,
      supportFile,
      video,
      screenshotOnRunFailure,
      viewportWidth,
      viewportHeight,
      chromeWebSecurity: false, // Required for cross-origin iframes in Storybook testing
      env: {
        storybookUrl,
        siteUrl,
      },
      setupNodeEvents(on: any, config: any) {
        on("task", {
          log(message: string) {
            console.log(message);
            return null;
          },
        });

        if (setupNodeEvents) {
          return setupNodeEvents(on, config);
        }
        return config;
      },
      ...rest,
    },
  };
}
