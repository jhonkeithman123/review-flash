<!-- BEGIN:nextjs-agent-rules -->

## Context Navigation (Graphify + Obsidian)

1. Before scanning the entire codebase with grep or file searches, inspect `graphify-out/graph.json` or the Obsidian markdown notes in `graphify-out/obsidian/`.
2. Identify caller/callee links and affected submodules from the graph nodes first.
3. Only read raw source code for the specific files that need editing.

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
