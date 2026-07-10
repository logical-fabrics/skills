#!/usr/bin/env node
import { existsSync } from "node:fs";
import path from "node:path";
import { recordEditedFiles } from "./edit-state.mjs";
import {
  BIOME_EXTENSIONS,
  collectDependencyGraphFiles,
  collectEditedFiles,
  fail,
  findProjectRoot,
  gitChangedFiles,
  hasBiome,
  loadPackageJson,
  normalizeRelative,
  readHookInput,
  runCommand,
} from "./hook-utils.mjs";

const input = readHookInput();
const root = findProjectRoot(input);
const packageJson = loadPackageJson(root);
const observedFiles = collectEditedFiles(input);
const dependencyGraphFiles = collectDependencyGraphFiles(input);
const trackedFiles = [...observedFiles, ...dependencyGraphFiles]
  .map((file) => normalizeRelative(root, file))
  .filter(Boolean)
  .filter((file) => !file.split(path.sep).includes("node_modules"));

recordEditedFiles(input, root, trackedFiles);

if (!packageJson || !hasBiome(root, packageJson)) {
  process.exit(0);
}

const files =
  observedFiles.length > 0
    ? observedFiles
    : input.tool_name === "Bash"
      ? []
      : gitChangedFiles(root);
const biomeFiles = files
  .map((file) => normalizeRelative(root, file))
  .filter(Boolean)
  .filter((file) => existsSync(path.join(root, file)))
  .filter((file) => !file.split(path.sep).includes("node_modules"))
  .filter((file) => BIOME_EXTENSIONS.has(path.extname(file)))
  .sort();

if (biomeFiles.length === 0) {
  process.exit(0);
}

const result = runCommand(
  root,
  "biome",
  ["check", "--write", "--no-errors-on-unmatched", ...biomeFiles],
  25_000,
);

if (result.status !== 0) {
  fail(
    "Biome hook failed after an edit. Fix the reported format/lint issues before continuing.",
    [result.stdout, result.stderr].filter(Boolean).join("\n"),
  );
}

process.exit(0);
