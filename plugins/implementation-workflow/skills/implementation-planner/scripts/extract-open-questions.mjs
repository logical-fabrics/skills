import { readFile } from "node:fs/promises";

const file = process.argv[2];
if (!file) {
  console.error("Usage: extract-open-questions.mjs <plan.md>");
  process.exit(1);
}

const text = await readFile(file, "utf8");
const lines = text.split(/\r?\n/);
const patterns = [
  /TODO/i,
  /TBD/i,
  /未確定/,
  /要確認/,
  /AskUser/,
  /Blocked/i,
  /Open Question/i,
];

for (const [index, line] of lines.entries()) {
  if (patterns.some((pattern) => pattern.test(line))) {
    console.log(`${index + 1}: ${line}`);
  }
}
