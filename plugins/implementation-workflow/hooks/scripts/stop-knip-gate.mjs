#!/usr/bin/env node
import {
  clearState,
  isStopHookActive,
  readState,
  writeState,
} from "./hook-state.mjs";
import {
  dependencyGraphChanged,
  fail,
  findProjectRoot,
  hasKnip,
  loadPackageJson,
  readHookInput,
  runCommand,
  snapshotDependencyGraph,
} from "./hook-utils.mjs";

const input = readHookInput();
const root = findProjectRoot(input);

const baseline = readState(input, root, "knip", "snapshot.json");
const continuationAfterBlock =
  isStopHookActive(input) && readState(input, root, "knip", "blocked") === true;
clearState(input, root, "knip");

// A fix made after a block may touch any source file, so the recheck does not
// depend on dependency-graph changes. Without a baseline (hook added mid-session
// or no session identity) there is nothing to compare, so fail open.
if (isStopHookActive(input)) {
  if (!continuationAfterBlock) process.exit(0);
} else if (
  !baseline ||
  !dependencyGraphChanged(baseline, snapshotDependencyGraph(root))
) {
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
      "Knip recheck still failed after the block. The turn will stop without another block.",
      [result.stdout, result.stderr].filter(Boolean).join("\n"),
    );
  }
  writeState(input, root, "knip", "blocked", true);
  fail(
    "Knip hook found dependency, export, file, or configuration issues before stopping.",
    [result.stdout, result.stderr].filter(Boolean).join("\n"),
  );
}

if (isStopHookActive(input)) {
  reportNonBlocking("Knip recheck passed after the continuation.");
}

process.exit(0);

function reportNonBlocking(message, details = "") {
  const body = details.trim() ? `${message}\n\n${details.trim()}` : message;
  process.stdout.write(`${JSON.stringify({ systemMessage: body })}\n`);
  process.exit(0);
}
