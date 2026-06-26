import { readFile } from "node:fs/promises";

const file = process.argv[2];
if (!file) {
  console.error("Usage: check-plan-ready.mjs <implementation-plan.md>");
  process.exit(1);
}

const text = await readFile(file, "utf8");
const blockers = [
  ["P0", /P0(?!.*(resolved|解消|なし))/i],
  ["P1", /P1(?!.*(resolved|解消|なし))/i],
  ["AskUser", /AskUser|要確認|未確定|Blocked/i],
  ["Handoff", !text.includes("Implementation Handoff")],
];

const failed = blockers
  .filter(([, rule]) => (rule instanceof RegExp ? rule.test(text) : rule))
  .map(([name]) => name);

if (failed.length > 0) {
  console.error(`Plan is not ready. Check: ${failed.join(", ")}`);
  process.exit(1);
}

console.log("Plan appears ready for implementation.");
