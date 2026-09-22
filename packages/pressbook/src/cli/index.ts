import { Command } from "commander";
import pc from "picocolors";
import http from "http";
import fs from "fs";
import path from "path";
import { loadPressbookConfig } from "../config";
import { PressbookConfig } from "../config/types";

// Lightweight static file server using Node http / sirv
async function startStaticServerIfStaticDirExists(
  staticDir: string,
  port: number,
): Promise<http.Server | null> {
  const resolvedDir = path.resolve(process.cwd(), staticDir);
  if (!fs.existsSync(resolvedDir)) {
    return null;
  }

  try {
    const sirv = (await import("sirv")).default;
    const handler = sirv(resolvedDir, { dev: true, single: true });
    const server = http.createServer((req, res) => handler(req, res));

    await new Promise<void>((resolve, reject) => {
      server.listen(port, () => {
        console.log(
          pc.green(
            `✔ Serving static Storybook from ${resolvedDir} on http://localhost:${port}`,
          ),
        );
        resolve();
      });
      server.on("error", (err: any) => {
        if (err.code === "EADDRINUSE") {
          console.log(
            pc.yellow(
              `ℹ Port ${port} is already in use, assuming Storybook is already running.`,
            ),
          );
          resolve();
        } else {
          reject(err);
        }
      });
    });
    return server;
  } catch (e) {
    console.warn("Could not start static server:", e);
    return null;
  }
}

async function runCypressSuite(
  config: PressbookConfig,
  mode: "all" | "storybook" | "site",
  options: any,
) {
  let staticServer: http.Server | null = null;

  try {
    // Unset ELECTRON_RUN_AS_NODE to allow Cypress Electron app to start in any terminal
    delete process.env.ELECTRON_RUN_AS_NODE;

    const storybookConfig = config.storybook || {};
    const staticDir = storybookConfig.staticDir || "storybook-static";
    const staticPort = storybookConfig.staticPort || 6006;

    // Check if we should serve static storybook
    if (mode === "all" || mode === "storybook") {
      staticServer = await startStaticServerIfStaticDirExists(
        staticDir,
        staticPort,
      );
    }

    console.log(
      pc.cyan(
        `\n🚀 [DIT / Pressbook] Running frontend audit in mode: ${pc.bold(mode)}...`,
      ),
    );

    // Dynamic require or import of cypress
    let cypressModule: any;
    try {
      cypressModule = await import("cypress");
    } catch {
      throw new Error(
        "Cypress is not installed in the current workspace. Please install it with: pnpm add -D cypress",
      );
    }

    const cypress = cypressModule.default || cypressModule;

    const cypressOptions: any = {
      headless:
        options.headless !== undefined
          ? options.headless
          : (config.cypress?.headless ?? true),
      browser: options.browser || config.cypress?.browser || "electron",
      env: {
        PRESSBOOK_MODE: mode,
        PRESSBOOK_CONFIG: JSON.stringify(config),
      },
    };

    if (config.cypress?.specPattern) {
      cypressOptions.spec = Array.isArray(config.cypress.specPattern)
        ? config.cypress.specPattern.join(",")
        : config.cypress.specPattern;
    }

    const results = await cypress.run(cypressOptions);

    if (results.status === "failed" || results.totalFailed > 0) {
      console.error(
        pc.red(
          `\n✖ [Pressbook] Audit failed with ${results.totalFailed || 1} failure(s).`,
        ),
      );
      process.exit(1);
    } else {
      console.log(
        pc.green(
          `\n✔ [Pressbook] All Storybook components & site routes passed checks cleanly!`,
        ),
      );
    }
  } catch (err: any) {
    console.error(pc.red(`\n✖ [Pressbook Error]: ${err.message || err}`));
    process.exit(1);
  } finally {
    if (staticServer) {
      staticServer.close();
    }
  }
}

export function runCli() {
  const program = new Command();

  program
    .name("pressbook")
    .description("Universal frontend checker combining Cypress and Storybook")
    .version("0.1.0");

  program
    .command("run")
    .description("Run full frontend checker (Storybook stories + Site routes)")
    .option("-c, --config <path>", "Path to pressbook.config.ts")
    .option(
      "-b, --browser <browser>",
      "Cypress browser (electron, chrome, firefox)",
    )
    .option("--no-headless", "Run in headed browser mode")
    .action(async (opts) => {
      const config = await loadPressbookConfig(opts.config);
      await runCypressSuite(config, "all", opts);
    });

  program
    .command("storybook")
    .description(
      "Run automated Storybook story smoke test, console-check, and A11y audit",
    )
    .option("-c, --config <path>", "Path to pressbook.config.ts")
    .option("-u, --storybook-url <url>", "Storybook URL override")
    .option("-b, --browser <browser>", "Cypress browser")
    .option("--no-headless", "Run in headed browser mode")
    .action(async (opts) => {
      const config = await loadPressbookConfig(opts.config);
      if (opts.storybookUrl && config.storybook) {
        config.storybook.url = opts.storybookUrl;
      }
      await runCypressSuite(config, "storybook", opts);
    });

  program
    .command("site")
    .description(
      "Run automated site route health, responsiveness, and A11y audit",
    )
    .option("-c, --config <path>", "Path to pressbook.config.ts")
    .option("-u, --site-url <url>", "Site URL override")
    .option("-b, --browser <browser>", "Cypress browser")
    .option("--no-headless", "Run in headed browser mode")
    .action(async (opts) => {
      const config = await loadPressbookConfig(opts.config);
      if (opts.siteUrl && config.site) {
        config.site.url = opts.siteUrl;
      }
      await runCypressSuite(config, "site", opts);
    });

  program
    .command("init")
    .description(
      "Interactive setup wizard to configure Pressbook and Cypress for your project",
    )
    .option(
      "-p, --pkg-name <name>",
      "Package name to use in generated import statements (default: detected or @dit/pressbook)",
    )
    .option("-y, --yes", "Skip prompts and use auto-detected project defaults")
    .action(async (opts) => {
      const { runInitWizard } = await import("./init-wizard");
      await runInitWizard(opts);
    });

  program.parse(process.argv);
}

