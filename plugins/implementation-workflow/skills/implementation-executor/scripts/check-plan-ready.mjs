import { readFile } from "node:fs/promises";

const file = process.argv[2];
if (!file) {
  console.error("Usage: check-plan-ready.mjs <implementation-plan.md>");
  process.exit(1);
}

const raw = await readFile(file, "utf8");

// `Decision Log:` lines record decisions the planner already made (see the
// planner's ask-user.md); drop them so their wording cannot read as an
// unresolved marker or an open finding.
const text = raw
  .split(/\r?\n/)
  .filter((line) => !/^\s*[-*]?\s*Decision Log:/i.test(line))
  .join("\n");

// Return the body of a `## Heading` section (up to the next `##` heading).
// Used so P0/P1 detection only looks at recorded findings, not a rubric or
// prose that merely mentions the severity labels.
function section(name) {
  const re = new RegExp(
    `(^|\\n)##\\s+${name}[^\\n]*\\n([\\s\\S]*?)(?=\\n##\\s|$)`,
    "i",
  );
  const match = text.match(re);
  return match ? match[2] : "";
}

const handoffMissing = !/\n##\s+Implementation Handoff/i.test(text);

// Status must exist and be a state that is safe to implement from.
const statusMatch = text.match(
  /(^|\n)##\s+Status[^\n]*\n+\s*[-*]?\s*([A-Za-z-]+)/i,
);
const status = statusMatch ? statusMatch[2].toLowerCase() : null;
const statusNotReady =
  status === null || ["draft", "blocked", "superseded"].includes(status);

// Unresolved decisions anywhere in the plan are an unambiguous "not ready"
// signal. These markers are intentional, not incidental mentions.
const openQuestions =
  /(\bTODO\b|\bTBD\b|未確定|要確認|AskUser|\bBlocked\b|\bOpen Question)/i.test(
    text,
  );

// P0/P1 only count when they appear as recorded findings that are not yet
// closed. Look inside the findings section for an open severity line or an
// unchecked task box; ignore the severity labels elsewhere.
const findings = section("Review Findings") + section("Risks and Rollback");
const openFinding =
  /^\s*[-*]?\s*\[ \]/m.test(findings) ||
  /\b(P0|P1)\b(?![^\n]*(resolved|closed|fixed|解消|対応済|なし|完了))/i.test(
    findings,
  );

const blockers = [];
if (statusNotReady) blockers.push(`Status (${status ?? "missing"})`);
if (openQuestions) blockers.push("open questions (TODO/TBD/AskUser/Blocked)");
if (openFinding) blockers.push("unresolved P0/P1 finding");
if (handoffMissing) blockers.push("Implementation Handoff");

if (blockers.length > 0) {
  console.error(`Plan is not ready. Check: ${blockers.join(", ")}`);
  process.exit(1);
}

console.log("Plan appears ready for implementation.");
