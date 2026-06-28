#!/usr/bin/env node
import path from "node:path";
import {
  fail,
  findProjectRoot,
  gitChangedFiles,
  hasKnip,
  loadPackageJson,
  readHookInput,
  runCommand,
} from "./hook-utils.mjs";

const input = readHookInput();
const root = findProjectRoot(input);
const packageJson = loadPackageJson(root);

if (!packageJson || !hasKnip(root, packageJson)) {
  process.exit(0);
}

const changedFiles = gitChangedFiles(root);
if (!changedFiles.some(shouldRunKnipForChangedFile)) {
  process.exit(0);
}

const result = runCommand(root, "knip", [], 110_000);
if (result.status !== 0) {
  fail(
    "Knip hook found dependency, export, file, or configuration issues before stopping.",
    [result.stdout, result.stderr].filter(Boolean).join("\n"),
  );
}

process.exit(0);

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
