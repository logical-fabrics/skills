#!/usr/bin/env node
import path from "node:path";
import {
  consumeEditedFiles,
  isStopHookActive,
  markKnipBlocked,
  wasKnipBlocked,
} from "./edit-state.mjs";
import {
  fail,
  findProjectRoot,
  hasKnip,
  loadPackageJson,
  readHookInput,
  runCommand,
} from "./hook-utils.mjs";

const input = readHookInput();
const root = findProjectRoot(input);

const continuationAfterBlock =
  isStopHookActive(input) && wasKnipBlocked(input, root);
const changedFiles = consumeEditedFiles(input, root);
if (isStopHookActive(input)) {
  if (!continuationAfterBlock || changedFiles.length === 0) process.exit(0);
} else if (!changedFiles.some(shouldRunKnipForChangedFile)) {
  process.exit(0);
}

const packageJson = loadPackageJson(root);
if (!packageJson || !hasKnip(root, packageJson)) {
  process.exit(0);
}

const result = runCommand(root, "knip", [], 110_000);
if (result.status !== 0) {
  if (isStopHookActive(input)) {
    reportNonBlocking(
      "Knip recheck still failed after dependency-graph edits. The turn will stop without another block.",
      [result.stdout, result.stderr].filter(Boolean).join("\n"),
    );
  }
  markKnipBlocked(input, root);
  fail(
    "Knip hook found dependency, export, file, or configuration issues before stopping.",
    [result.stdout, result.stderr].filter(Boolean).join("\n"),
  );
}

if (isStopHookActive(input)) {
  reportNonBlocking(
    "Knip recheck passed after dependency-graph edits made during the continuation.",
  );
}

process.exit(0);

function reportNonBlocking(message, details = "") {
  const body = details.trim() ? `${message}\n\n${details.trim()}` : message;
  process.stdout.write(`${JSON.stringify({ systemMessage: body })}\n`);
  process.exit(0);
}

function shouldRunKnipForChangedFile(file) {
  const base = path.basename(file);
  const normalized = file.replaceAll("\\", "/");

  if (
    [
      "package.json",
      "pnpm-lock.yaml",
      "package-lock.json",
      "yarn.lock",
      "bun.lock",
      "bun.lockb",
      "knip.json",
      "knip.jsonc",
      "knip.ts",
      "knip.js",
      "tsconfig.json",
      "tsconfig.base.json",
    ].includes(base)
  ) {
    return true;
  }

  if (
    /^(vite|next|nuxt|astro|svelte|webpack|rollup|tsup|vitest)\.config\./.test(
      base,
    )
  ) {
    return true;
  }

  if (/^tsconfig\..+\.json$/.test(base)) {
    return true;
  }

  if (normalized.includes("/index.") || normalized.startsWith("index.")) {
    return true;
  }

  return false;
}
