import { readFile } from "node:fs/promises";

const file = process.argv[2];
if (!file) {
  console.error("Usage: check-audit-report.mjs <audit-report.md>");
  process.exit(1);
}

const text = await readFile(file, "utf8");
const required = ["## Summary", "## Findings", "## Improvement Backlog"];
const missing = required.filter((section) => !text.includes(section));

if (missing.length > 0) {
  console.error(`Missing sections:\n${missing.join("\n")}`);
  process.exit(1);
}

console.log("Audit report structure looks usable.");
