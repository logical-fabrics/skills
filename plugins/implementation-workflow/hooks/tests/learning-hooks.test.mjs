import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const hooksRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const promptScript = path.join(
  hooksRoot,
  "scripts",
  "user-prompt-learning.mjs",
);
const stopScript = path.join(hooksRoot, "scripts", "stop-learning-gate.mjs");

test("ordinary fixes and discussion examples do not trigger learning", (t) => {
  const fixture = createFixture(t);
  const prompts = [
    "ログインのバグを修正して。",
    "やっぱりボタンは青にする。",
    "DB は変更しないで。",
    "AI はどうやって訂正を記録すべき？",
    "今後の計画を確認して。",
    "AGENTS.md に追記してもいい？",
    "Can AI remember this across sessions?",
    '例: "Don\'t do this again"',
    "A ではなく B という方式を解説して。",
  ];

  for (const [index, prompt] of prompts.entries()) {
    const result = runHook(
      fixture,
      promptScript,
      promptInput(`plain-${index}`, prompt),
    );
    assert.equal(result.status, 0);
    assert.equal(result.stdout, "");
  }
});

test("a direct correction injects curator context without a Stop block", (t) => {
  const fixture = createFixture(t);
  const submitted = runHook(
    fixture,
    promptScript,
    promptInput("correction-a", "それは違う。対象は plugin 側です。"),
  );

  assert.equal(submitted.status, 0);
  const output = JSON.parse(submitted.stdout);
  assert.equal(output.hookSpecificOutput.hookEventName, "UserPromptSubmit");
  assert.match(output.hookSpecificOutput.additionalContext, /learning-curator/);

  const stopped = runHook(
    fixture,
    stopScript,
    stopInput("correction-a", "修正しました。"),
  );
  assert.equal(stopped.status, 0);
  assert.equal(stopped.stdout, "");
});

test("Claude user_prompt and Codex prompt fields are both supported", (t) => {
  const fixture = createFixture(t);
  const claude = runHook(fixture, promptScript, {
    session_id: "claude-a",
    cwd: fixture.root,
    hook_event_name: "UserPromptSubmit",
    user_prompt: "そうじゃない。私が修正した。",
  });
  const codex = runHook(
    fixture,
    promptScript,
    promptInput("codex-a", "それは間違いです。"),
  );

  assert.equal(claude.status, 0);
  assert.equal(codex.status, 0);
  assert.match(claude.stdout, /learning-curator/);
  assert.match(codex.stdout, /learning-curator/);
});

test("explicit destinations and English persistence requests are recognized", (t) => {
  const fixture = createFixture(t);
  const prompts = [
    "今の訂正、再発防止して。",
    "この訂正を AGENTS.md に追記して。",
    "That's not what I asked. Remember this next time.",
  ];

  for (const [index, prompt] of prompts.entries()) {
    const result = runHook(
      fixture,
      promptScript,
      promptInput(`explicit-language-${index}`, prompt),
    );
    assert.equal(result.status, 0);
    assert.match(
      JSON.parse(result.stdout).hookSpecificOutput.additionalContext,
      /durable-learning intent/,
    );
  }
});

test("explicit persistence blocks once when the response omits an outcome", (t) => {
  const fixture = createFixture(t);
  const secretLikePrompt =
    "次からは必ず target repo を確認して。token=do-not-persist";
  const submitted = runHook(
    fixture,
    promptScript,
    promptInput("explicit-a", secretLikePrompt),
  );
  assert.equal(submitted.status, 0);
  assert.doesNotMatch(readStateFiles(fixture.state), /do-not-persist/);

  const firstStop = runHook(
    fixture,
    stopScript,
    stopInput("explicit-a", "現在の修正は完了しました。"),
  );
  assert.equal(firstStop.status, 0);
  assert.equal(JSON.parse(firstStop.stdout).decision, "block");
  assert.match(JSON.parse(firstStop.stdout).reason, /Learning outcome/);

  const continuation = runHook(fixture, stopScript, {
    ...stopInput("explicit-a", "Learning outcome: updated AGENTS.md"),
    stop_hook_active: true,
  });
  assert.equal(continuation.status, 0);
  assert.equal(continuation.stdout, "");

  const repeatedStop = runHook(
    fixture,
    stopScript,
    stopInput("explicit-a", "No new work."),
  );
  assert.equal(repeatedStop.status, 0);
  assert.equal(repeatedStop.stdout, "");
});

test("reported learning outcome satisfies explicit persistence gate", (t) => {
  const fixture = createFixture(t);
  const submitted = runHook(
    fixture,
    promptScript,
    promptInput("explicit-b", "このことを覚えておいて。"),
  );
  assert.equal(submitted.status, 0);

  const stopped = runHook(
    fixture,
    stopScript,
    stopInput(
      "explicit-b",
      "修正しました。\n\nLearning outcome: no durable update — existing rule already covers it.",
    ),
  );
  assert.equal(stopped.status, 0);
  assert.equal(stopped.stdout, "");
});

test("missing session identity fails open and stores no shared signal", (t) => {
  const fixture = createFixture(t);
  const submitted = runHook(fixture, promptScript, {
    cwd: fixture.root,
    hook_event_name: "UserPromptSubmit",
    prompt: "次からは必ず確認して。",
  });
  const stopped = runHook(fixture, stopScript, {
    cwd: fixture.root,
    hook_event_name: "Stop",
    stop_hook_active: false,
    last_assistant_message: "done",
  });

  assert.equal(submitted.status, 0);
  assert.equal(stopped.status, 0);
  assert.equal(stopped.stdout, "");
  assert.equal(readStateFiles(fixture.state), "");
});

function promptInput(sessionId, prompt) {
  return {
    thread_id: sessionId,
    cwd: undefined,
    hook_event_name: "UserPromptSubmit",
    prompt,
  };
}

function stopInput(sessionId, lastMessage) {
  return {
    thread_id: sessionId,
    hook_event_name: "Stop",
    stop_hook_active: false,
    last_assistant_message: lastMessage,
  };
}

function createFixture(t) {
  const root = mkdtempSync(path.join(os.tmpdir(), "lf-learning-hook-fixture-"));
  const state = path.join(root, "hook-state");
  mkdirSync(state);
  writeFileSync(path.join(root, "package.json"), '{"private":true}\n');
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return { root, state };
}

function runHook(fixture, script, input) {
  return spawnSync(process.execPath, [script], {
    cwd: fixture.root,
    encoding: "utf8",
    input: JSON.stringify({ ...input, cwd: input.cwd ?? fixture.root }),
    env: {
      ...process.env,
      LF_IMPLEMENTATION_WORKFLOW_STATE_DIR: fixture.state,
      CLAUDE_SESSION_ID: "",
      CODEX_THREAD_ID: "",
      CODEX_SESSION_ID: "",
    },
  });
}

function readStateFiles(root) {
  const contents = [];
  walk(root, contents);
  return contents.join("\n");
}

function walk(directory, contents) {
  let entries = [];
  try {
    entries = readdirSync(directory, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(target, contents);
    else if (entry.isFile()) contents.push(readFileSync(target, "utf8"));
  }
}
