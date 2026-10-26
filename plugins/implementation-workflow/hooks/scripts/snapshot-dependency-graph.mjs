#!/usr/bin/env node
import { writeState } from "./hook-state.mjs";
import {
  findProjectRoot,
  readHookInput,
  snapshotDependencyGraph,
} from "./hook-utils.mjs";

// Baseline taken before the turn's first tool call; the Stop gate compares
// against it. Later prompts in the same turn keep the first baseline.
const input = readHookInput();
const root = findProjectRoot(input);
writeState(
  input,
  root,
  "knip",
  "snapshot.json",
  snapshotDependencyGraph(root),
  {
    onlyIfMissing: true,
  },
);
