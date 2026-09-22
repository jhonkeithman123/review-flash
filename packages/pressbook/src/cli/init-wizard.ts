import * as p from "@clack/prompts";
import pc from "picocolors";
import fs from "fs";
import path from "path";

export interface InitWizardOptions {
  pkgName?: string;
  yes?: boolean;
}

/**
 * Dynamically resolves the package import name to keep it flexible
 * (e.g. "@dit/pressbook", "pressbook", or whatever name is published to npm).
 */
export function resolvePackageName(overridePkgName?: string): string {
  if (overridePkgName) return overridePkgName;
  if (process.env.PRESSBOOK_PKG_NAME) return process.env.PRESSBOOK_PKG_NAME;

  // 1. Check target workspace package.json for an installed variant
  try {
    const targetPkgPath = path.resolve(process.cwd(), "package.json");
    if (fs.existsSync(targetPkgPath)) {
      const targetPkg = JSON.parse(fs.readFileSync(targetPkgPath, "utf-8"));
      const allDeps = {
        ...targetPkg.dependencies,
        ...targetPkg.devDependencies,
      };
      for (const dep of Object.keys(allDeps)) {
        if (dep.endsWith("/pressbook") || dep === "pressbook") {
          return dep;
        }
      }
    }
  } catch {}

  // 2. Check current package.json of the CLI itself
  try {
    const ownPkgPath = path.resolve(__dirname, "../../package.json");
    if (fs.existsSync(ownPkgPath)) {
      const ownPkg = JSON.parse(fs.readFileSync(ownPkgPath, "utf-8"));
      if (ownPkg.name) return ownPkg.name;
    }
  } catch {}

  return "@dit/pressbook";
}

export async function runInitWizard(options: InitWizardOptions = {}) {
  const cwd = process.cwd();
  const pkgName = resolvePackageName(options.pkgName);

  p.intro(pc.bgCyan(pc.black(" DIT / Pressbook Setup Wizard ")));

  // Auto-detect project characteristics
  const hasNext =
    fs.existsSync(path.resolve(cwd, "next.config.js")) ||
    fs.existsSync(path.resolve(cwd, "next.config.ts")) ||
    fs.existsSync(path.resolve(cwd, "next.config.mjs"));

  const hasVite =
    fs.existsSync(path.resolve(cwd, "vite.config.js")) ||
    fs.existsSync(path.resolve(cwd, "vite.config.ts")) ||
    fs.existsSync(path.resolve(cwd, "vite.config.mjs"));

  const hasStorybook = fs.existsSync(path.resolve(cwd, ".storybook"));

  let detectedFramework = "other";
  if (hasNext) detectedFramework = "next";
  else if (hasVite) detectedFramework = "vite";

  let framework = detectedFramework;
  let testTypes: string[] = ["e2e"];
  let componentBundler = "vite";
  let includeStorybook = hasStorybook;
  let storybookUrl = "http://localhost:6006";
  let siteUrl = hasNext ? "http://localhost:3000" : "http://localhost:5173";
  let checkA11y = true;
  let failOnConsoleErrors = true;
  let addScripts = true;

  if (!options.yes) {
    // 1. Choose Framework
    const frameworkChoice = await p.select({
      message: "Select your project framework:",
      options: [
        {
          value: "next",
          label: "Next.js (App Router / Pages)",
          hint: hasNext ? "detected" : undefined,
        },
        {
          value: "vite",
          label: "Vite / React SPA",
          hint: hasVite ? "detected" : undefined,
        },
        { value: "other", label: "Other / Custom" },
      ],
      initialValue: detectedFramework,
    });

    if (p.isCancel(frameworkChoice)) {
      p.cancel("Setup cancelled.");
      process.exit(0);
    }
    framework = frameworkChoice as string;

    // 2. Select Cypress Testing Modes
    const typesChoice = await p.multiselect({
      message: "Select Cypress testing modes to configure in cypress.config.ts:",
      options: [
        {
          value: "e2e",
          label: "E2E Testing (Site route crawling & story auditing)",
          hint: "Recommended",
        },
        {
          value: "component",
          label: "Component Testing (Mount React components in isolation)",
          hint: "Requires bundler config",
        },
      ],
      initialValues: ["e2e"],
      required: true,
    });

    if (p.isCancel(typesChoice)) {
      p.cancel("Setup cancelled.");
      process.exit(0);
    }
    testTypes = typesChoice as string[];

    // 2b. If Component Testing is selected, ask for bundler
    if (testTypes.includes("component")) {
      const bundlerChoice = await p.select({
        message: "Which bundler should Cypress use for Component Testing?",
        options: [
          {
            value: "vite",
            label: "Vite (reads vite.config.ts)",
            hint: framework === "vite" ? "matches project" : undefined,
          },
          {
            value: "webpack",
            label: "Webpack / Next.js",
            hint: framework === "next" ? "matches project" : undefined,
          },
        ],
        initialValue: framework === "vite" ? "vite" : "webpack",
      });

      if (p.isCancel(bundlerChoice)) {
        p.cancel("Setup cancelled.");
        process.exit(0);
      }
      componentBundler = bundlerChoice as string;
    }

    // 3. Storybook Integration
    const sbChoice = await p.confirm({
      message: "Do you have Storybook in this project to audit?",
      initialValue: hasStorybook,
    });

    if (p.isCancel(sbChoice)) {
      p.cancel("Setup cancelled.");
      process.exit(0);
    }
    includeStorybook = sbChoice;

    if (includeStorybook) {
      const sbUrlPrompt = await p.text({
        message: "Storybook local development URL:",
        initialValue: "http://localhost:6006",
        validate(value) {
          if (!value || !value.startsWith("http")) return "Please enter a valid URL";
        },
      });

      if (p.isCancel(sbUrlPrompt)) {
        p.cancel("Setup cancelled.");
        process.exit(0);
      }
      storybookUrl = sbUrlPrompt as string;
    }

    // 4. Site Target URL
    const siteUrlPrompt = await p.text({
      message: "Target application dev URL:",
      initialValue: framework === "next" ? "http://localhost:3000" : "http://localhost:5173",
      validate(value) {
        if (!value || !value.startsWith("http")) return "Please enter a valid URL";
      },
    });

    if (p.isCancel(siteUrlPrompt)) {
      p.cancel("Setup cancelled.");
      process.exit(0);
    }
    siteUrl = siteUrlPrompt as string;

    // 5. Automated Auditing Options
    const a11yChoice = await p.confirm({
      message: "Enable automated WCAG accessibility audits (axe-core)?",
      initialValue: true,
    });
    if (p.isCancel(a11yChoice)) {
      p.cancel("Setup cancelled.");
      process.exit(0);
    }
    checkA11y = a11yChoice;

    const consoleChoice = await p.confirm({
      message: "Fail audits on unhandled console.error traps?",
      initialValue: true,
    });
    if (p.isCancel(consoleChoice)) {
      p.cancel("Setup cancelled.");
      process.exit(0);
    }
    failOnConsoleErrors = consoleChoice;

    // 6. Scripts in package.json
    const scriptsChoice = await p.confirm({
      message: "Add Cypress and Pressbook scripts to package.json?",
      initialValue: true,
    });
    if (p.isCancel(scriptsChoice)) {
      p.cancel("Setup cancelled.");
      process.exit(0);
    }
    addScripts = scriptsChoice;
  }

  const s = p.spinner();
  s.start("Scaffolding Pressbook & Cypress configuration...");

  // Generate pressbook.config.ts
  const pressbookConfigPath = path.resolve(cwd, "pressbook.config.ts");
  const pressbookConfigContent = `import { definePressbookConfig } from "${pkgName}";

export default definePressbookConfig({${
    includeStorybook
      ? `
  storybook: {
    url: "${storybookUrl}",
    staticDir: "storybook-static",
    checkA11y: ${checkA11y},
    failOnConsoleErrors: ${failOnConsoleErrors},
    timeout: 12000,
  },`
      : ""
  }
  site: {
    url: "${siteUrl}",
    routes: [
      { path: "/", name: "Home Page" },
    ],
    checkA11y: ${checkA11y},
    checkConsoleErrors: ${failOnConsoleErrors},
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
`;
  fs.writeFileSync(pressbookConfigPath, pressbookConfigContent, "utf-8");

  // Generate cypress.config.ts
  const cypressConfigPath = path.resolve(cwd, "cypress.config.ts");
  let cypressConfigContent = "";

  if (testTypes.includes("component")) {
    cypressConfigContent = `import { defineConfig } from "cypress";
import { definePressbookCypressConfig } from "${pkgName}/cypress";

export default defineConfig({
  ...definePressbookCypressConfig({
    siteUrl: "${siteUrl}",${includeStorybook ? `\n    storybookUrl: "${storybookUrl}",` : ""}
    specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    supportFile: "cypress/support/e2e.ts",
  }),

  component: {
    devServer: {
      framework: "${framework === "next" ? "next" : "react"}",
      bundler: "${componentBundler}",
    },
  },
});
`;
  } else {
    // E2E only (clean, zero bundler errors)
    cypressConfigContent = `import { defineConfig } from "cypress";
import { definePressbookCypressConfig } from "${pkgName}/cypress";

export default defineConfig(
  definePressbookCypressConfig({
    siteUrl: "${siteUrl}",${includeStorybook ? `\n    storybookUrl: "${storybookUrl}",` : ""}
    specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    supportFile: "cypress/support/e2e.ts",
  })
);
`;
  }
  fs.writeFileSync(cypressConfigPath, cypressConfigContent, "utf-8");

  // Ensure cypress/support/e2e.ts exists with pressbook commands imported
  const cypressSupportDir = path.resolve(cwd, "cypress/support");
  if (!fs.existsSync(cypressSupportDir)) {
    fs.mkdirSync(cypressSupportDir, { recursive: true });
  }

  const e2eSupportFile = path.resolve(cypressSupportDir, "e2e.ts");
  const commandImport = `import "${pkgName}/cypress/commands";\n`;
  if (!fs.existsSync(e2eSupportFile)) {
    fs.writeFileSync(e2eSupportFile, commandImport, "utf-8");
  } else {
    const existingContent = fs.readFileSync(e2eSupportFile, "utf-8");
    if (!existingContent.includes("/cypress/commands")) {
      fs.writeFileSync(e2eSupportFile, commandImport + existingContent, "utf-8");
    }
  }

  // Ensure sample e2e test exists
  const cypressE2eDir = path.resolve(cwd, "cypress/e2e");
  if (!fs.existsSync(cypressE2eDir)) {
    fs.mkdirSync(cypressE2eDir, { recursive: true });
  }

  const sampleSpecPath = path.resolve(cypressE2eDir, "pressbook-audit.cy.ts");
  if (!fs.existsSync(sampleSpecPath)) {
    const sampleSpecContent = `import { registerSiteAuditor${includeStorybook ? ", registerStoryChecker" : ""} } from "${pkgName}/cypress";
${
  includeStorybook
    ? `
// 1. Storybook stories audit (crash detection, console errors, A11y)
registerStoryChecker({
  url: Cypress.env("storybookUrl") || "${storybookUrl}",
  checkA11y: ${checkA11y},
  failOnConsoleErrors: ${failOnConsoleErrors},
});
`
    : ""
}
// 2. Application route health & accessibility audit
registerSiteAuditor({
  url: Cypress.env("siteUrl") || "${siteUrl}",
  routes: [
    { path: "/", name: "Home" },
  ],
  checkA11y: ${checkA11y},
  checkConsoleErrors: ${failOnConsoleErrors},
});
`;
    fs.writeFileSync(sampleSpecPath, sampleSpecContent, "utf-8");
  }

  // Add scripts to package.json if requested
  if (addScripts) {
    const pkgJsonPath = path.resolve(cwd, "package.json");
    if (fs.existsSync(pkgJsonPath)) {
      try {
        const pkgData = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
        pkgData.scripts = pkgData.scripts || {};
        let modified = false;

        if (!pkgData.scripts["check:pressbook"] && !pkgData.scripts["test:pressbook"]) {
          pkgData.scripts["test:pressbook"] = "cypress run";
          modified = true;
        }
        if (!pkgData.scripts["cypress:open"]) {
          pkgData.scripts["cypress:open"] = "cypress open";
          modified = true;
        }
        if (!pkgData.scripts["cypress:run"]) {
          pkgData.scripts["cypress:run"] = "cypress run";
          modified = true;
        }

        if (modified) {
          fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgData, null, 2) + "\n", "utf-8");
        }
      } catch {}
    }
  }

  s.stop(pc.green("✔ Scaffolding complete!"));

  p.note(
    `${pc.cyan("1.")} Run ${pc.bold("pnpm dev")} (or start your local app)
${pc.cyan("2.")} Run ${pc.bold("pnpm cypress:open")} for interactive test runner
${pc.cyan("3.")} Run ${pc.bold("pnpm cypress:run")} for headless terminal verification`,
    "Next Steps",
  );

  p.outro(pc.green(`✔ ${pkgName} configured cleanly without unnecessary bundler dependencies!`));
}
