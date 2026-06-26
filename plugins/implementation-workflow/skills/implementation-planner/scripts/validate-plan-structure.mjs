import { readFile } from "node:fs/promises";

const file = process.argv[2];
if (!file) {
  console.error("Usage: validate-plan-structure.mjs <implementation-plan.md>");
  process.exit(1);
}

const text = await readFile(file, "utf8");
const required = [
  "## Status",
  "## Last updated",
  "## Goal",
  "## Source of Truth",
  "## Scope",
  "## Current State",
  "## Target Architecture",
  "## Step-by-step Implementation",
  "## Files to Change",
  "## Verification",
  "## Review Findings",
  "## Risks and Rollback",
  "## Implementation Handoff",
];

const missing = required.filter((section) => !text.includes(section));
if (missing.length > 0) {
  console.error(`Missing sections:\n${missing.join("\n")}`);
  process.exit(1);
}

console.log("Plan structure looks usable.");
