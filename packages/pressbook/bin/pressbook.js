#!/usr/bin/env node

const path = require("path");
const fs = require("fs");

async function main() {
  try {
    const cliPath = path.resolve(__dirname, "../dist/cli/index.js");
    const cliMjsPath = path.resolve(__dirname, "../dist/cli/index.mjs");

    if (fs.existsSync(cliMjsPath)) {
      const cli = await import("file://" + cliMjsPath.replace(/\\/g, "/"));
      if (cli && cli.runCli) {
        cli.runCli();
        return;
      }
    }

    if (fs.existsSync(cliPath)) {
      const cli = require(cliPath);
      if (cli && cli.runCli) {
        cli.runCli();
        return;
      }
    }

    console.error(
      "Pressbook CLI entry not built yet. Please run: pnpm run build",
    );
    process.exit(1);
  } catch (err) {
    console.error("Failed to execute Pressbook CLI:", err);
    process.exit(1);
  }
}

main();
