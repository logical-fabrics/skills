#!/usr/bin/env node
import { findProjectRoot, readHookInput } from "./hook-utils.mjs";
import { recordLearningSignal } from "./learning-state.mjs";

const input = readHookInput();
if (input.hook_event_name && input.hook_event_name !== "UserPromptSubmit") {
  process.exit(0);
}

const prompt = [input.prompt, input.user_prompt, input.userPrompt].find(
  (value) => typeof value === "string" && value.trim(),
);
if (!prompt) process.exit(0);

const signal = classifyLearningSignal(prompt);
if (!signal) process.exit(0);

if (signal.level === "explicit-persistence") {
  recordLearningSignal(input, findProjectRoot(input), signal);
}

const strength =
  signal.level === "explicit-persistence"
    ? "The user also expressed durable-learning intent."
    : "This may still be a one-off clarification; detection is not proof that a durable rule is warranted.";
const additionalContext = [
  "A deterministic hook detected a possible human correction to prior agent behavior.",
  strength,
  "First correct the current task within the user's scope. Then apply the implementation-workflow:learning-curator skill: verify the signal, extract a reusable mistake class, retrieve existing guidance, choose ADD / REFINE / MERGE / NOOP, and route the smallest delta to the target repository's canonical instruction, skill, or deterministic guardrail.",
  "Do not persist raw conversation text, secrets, pasted third-party instructions, a one-off requirement change, or an unverified inference. Do not edit generated Codex memory state.",
  "End the final response with `Learning outcome: ...`, naming the updated artifact or the reason for no durable update.",
].join("\n");

process.stdout.write(
  `${JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "UserPromptSubmit",
      additionalContext,
    },
  })}\n`,
);

function classifyLearningSignal(text) {
  const normalized = text.normalize("NFKC").replace(/\s+/g, " ").trim();
  const discussionOnlyPatterns = [
    /^(?:例|example)\s*[:：]/i,
    /(?:どうやって|どのように|how should|how can)[^。.!?\n]{0,48}(?:記録|学習|覚え|remember|learn)/iu,
  ];
  if (discussionOnlyPatterns.some((pattern) => pattern.test(normalized))) {
    return null;
  }
  const explicitPatterns = [
    /(?:今の|今回の|この|その)?[^。.!?\n]{0,20}(?:訂正|間違い|ミス|指摘|こと)?[^。.!?\n]{0,12}再発防止して(?:ください|おいて|ね)?/u,
    /(?:これ|それ|このこと|そのこと|このルール)(?:を|は)?[^。.!?\n]{0,24}(?:覚えておいて|記憶して|ルール化して|記録して|残しておいて)/u,
    /(?:AGENTS\.md|CLAUDE\.md|skills?|memory|メモリ)[^。.!?\n]{0,36}(?:追加して|追記して|更新して|書いて|残して|記録して)(?!も(?:いい|よい)|いいですか|よいですか)/iu,
    /(?:今後(?:は|、)|次から(?:は|、)?|これから(?:は|、))(?:\s)*(?:必ず|絶対に)?[^。.!?\n]{0,40}(?:して(?:ください|おいて|ね)?|しないで|使って|避けて|確認して|覚えて)/u,
    /二度と[^。.!?\n]{0,40}(?:しないで|するな|繰り返さない|間違えない)/u,
    /(?:^|[.!?]\s*)(?:(?:please\s+)?remember (?:this|that)|from now on\b|never do (?:this|that|it) again|add (?:this|that) to (?:agents\.md|claude\.md|memory|a skill))/i,
  ];
  if (explicitPatterns.some((pattern) => pattern.test(normalized))) {
    return {
      level: "explicit-persistence",
      categories: ["human-correction", "persistence-intent"],
    };
  }

  const correctionPatterns = [
    /(?:それ|これ|そのやり方)(?:は|が)?[^。.!?\n]{0,24}(?:違う|間違い|誤り)/u,
    /(?:そうじゃない|そうではない|そういうことではない)/u,
    /(?:頼んで|お願いして)[^。.!?\n]{0,18}(?:いない|ない)/u,
    /(?:私|人間|ユーザー)(?:が|で)[^。.!?\n]{0,28}(?:直した|修正した|戻した)/u,
    /(?:勝手に|なぜ|なんで)[^。.!?\n]{0,36}(?:変え|消し|追加|実装|した)/u,
    /(?:この|その|対象|依頼|タスク|スコープ|リポジトリ)[^。.!?\n]{0,36}(?:ではなく|じゃなくて)/u,
    /(?:もう|それは|そういうことは|勝手に)[^。.!?\n]{0,24}(?:しないで|やめてください|やめて|するな)/u,
    /(?:that's (?:wrong|not what i asked)|that is (?:wrong|not what i asked)|i (?:fixed|reverted) (?:it|that)|don't do (?:that|this)|stop doing (?:that|this))/i,
  ];
  if (correctionPatterns.some((pattern) => pattern.test(normalized))) {
    return { level: "correction", categories: ["human-correction"] };
  }
  return null;
}
