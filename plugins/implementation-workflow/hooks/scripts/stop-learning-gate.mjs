#!/usr/bin/env node
import { findProjectRoot, readHookInput } from "./hook-utils.mjs";
import {
  clearLearningSignal,
  isStopHookActive,
  readLearningSignal,
} from "./learning-state.mjs";

const input = readHookInput();
if (input.hook_event_name && input.hook_event_name !== "Stop") {
  process.exit(0);
}

const root = findProjectRoot(input);
const signal = readLearningSignal(input, root);
if (signal?.level !== "explicit-persistence") process.exit(0);

if (isStopHookActive(input)) {
  clearLearningSignal(input, root);
  process.exit(0);
}

const lastMessage =
  typeof input.last_assistant_message === "string"
    ? input.last_assistant_message
    : "";
if (/Learning outcome:\s*\S/i.test(lastMessage)) {
  clearLearningSignal(input, root);
  process.exit(0);
}

process.stdout.write(
  `${JSON.stringify({
    decision: "block",
    reason: [
      "The user explicitly asked for durable learning, but the response did not report a learning outcome.",
      "Apply the implementation-workflow:learning-curator workflow now. Correct the task first; then verify generalizability, deduplicate existing guidance, route a minimal delta to the target repository's canonical instruction / skill / deterministic guardrail, or choose NOOP with a reason.",
      "Do not store raw transcript text or edit generated Codex memory state. End with `Learning outcome: ...`.",
    ].join("\n"),
  })}\n`,
);
