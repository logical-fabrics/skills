#!/usr/bin/env node
import { existsSync } from "node:fs";
import path from "node:path";
import {
  BIOME_EXTENSIONS,
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

if (!packageJson || !hasBiome(root, packageJson)) {
  process.exit(0);
}

const files = collectEditedFiles(input, root);
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

function collectEditedFiles(hookInput, projectRoot) {
  const toolInput = hookInput.tool_input ?? {};
  const directPaths = [
    toolInput.file_path,
    toolInput.path,
    toolInput.filename,
    toolInput.target_file,
  ].filter(Boolean);

  const patchText = [
    typeof toolInput === "string" ? toolInput : "",
    typeof toolInput.patch === "string" ? toolInput.patch : "",
    typeof toolInput.cmd === "string" ? toolInput.cmd : "",
    typeof toolInput.command === "string" ? toolInput.command : "",
  ].join("\n");

  const patchPaths = extractPatchPaths(patchText);
  const collected = [...directPaths, ...patchPaths];

  if (collected.length > 0) {
    return [...new Set(collected.map(String))];
  }

  return gitChangedFiles(projectRoot);
}

function extractPatchPaths(text) {
  const paths = [];
  for (const line of text.split(/\r?\n/)) {
    const applyPatchMatch = line.match(
      /^\*\*\* (?:Add|Update|Delete) File: (.+)$/,
    );
    if (applyPatchMatch) {
      paths.push(applyPatchMatch[1].trim());
      continue;
    }

    const diffMatch = line.match(/^(?:\+\+\+|---) [ab]\/(.+)$/);
    if (diffMatch && diffMatch[1] !== "/dev/null") {
      paths.push(diffMatch[1].trim());
    }
  }
  return paths;
}
