import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
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
const postEditScript = path.join(hooksRoot, "scripts", "post-edit-biome.mjs");
const snapshotScript = path.join(
  hooksRoot,
  "scripts",
  "snapshot-dependency-graph.mjs",
);
const stopScript = path.join(hooksRoot, "scripts", "stop-knip-gate.mjs");
const hooksJson = path.join(hooksRoot, "hooks.json");

test("pre-existing dirty files and unchanged dependency files do not trigger Knip", (t) => {
  const fixture = createFixture(t);

  // Dirty before the baseline: not a change made during the turn.
  writeFileSync(
    path.join(fixture.root, "package.json"),
    `${JSON.stringify({ devDependencies: { knip: "1.0.0", extra: "1.0.0" } })}\n`,
  );
  takeSnapshot(fixture, "claude-a");
  const result = runHook(
    fixture,
    stopScript,
    claudeStop("claude-a", fixture.root),
  );

  assert.equal(result.status, 0);
  assert.equal(readInvocations(fixture), "");
});

test("a dependency-graph edit after the baseline triggers Knip", (t) => {
  const fixture = createFixture(t);

  takeSnapshot(fixture, "claude-a");
  addDependency(fixture, "zod");
  const result = runHook(
    fixture,
    stopScript,
    claudeStop("claude-a", fixture.root),
  );

  assert.equal(result.status, 0);
  assert.match(readInvocations(fixture), /^exec knip$/m);
});

test("a change made by Bash (package manager or lockfile) triggers Knip without PostToolUse", (t) => {
  const fixture = createFixture(t);
  const changes = [
    () => writeFileSync(path.join(fixture.root, "pnpm-lock.yaml"), "changed\n"),
    () => writeFileSync(path.join(fixture.root, "knip.json"), "{}\n"),
    () => {
      mkdirSync(path.join(fixture.root, "src"));
      writeFileSync(path.join(fixture.root, "src", "index.ts"), "export {};\n");
    },
  ];

  for (const [index, change] of changes.entries()) {
    const sessionId = `bash-${index}`;
    takeSnapshot(fixture, sessionId);
    change();
    assert.equal(
      runHook(fixture, stopScript, claudeStop(sessionId, fixture.root)).status,
      0,
    );
  }

  assert.equal(
    readInvocations(fixture).trim().split("\n").length,
    changes.length,
  );
});

test("unrelated source changes do not trigger Knip", (t) => {
  const fixture = createFixture(t);

  takeSnapshot(fixture, "claude-a");
  writeFileSync(path.join(fixture.root, "util.ts"), "export const a = 1;\n");
  assert.equal(
    runHook(fixture, stopScript, claudeStop("claude-a", fixture.root)).status,
    0,
  );
  assert.equal(readInvocations(fixture), "");
});

test("Stop without a baseline fails open", (t) => {
  const fixture = createFixture(t);

  addDependency(fixture, "zod");
  assert.equal(
    runHook(fixture, stopScript, claudeStop("claude-a", fixture.root)).status,
    0,
  );
  assert.equal(readInvocations(fixture), "");
});

test("the baseline is kept across prompts and consumed by Stop", (t) => {
  const fixture = createFixture(t);

  takeSnapshot(fixture, "claude-a");
  addDependency(fixture, "zod");
  takeSnapshot(fixture, "claude-a");
  runHook(fixture, stopScript, claudeStop("claude-a", fixture.root));
  assert.equal(readInvocations(fixture).trim().split("\n").length, 1);

  // The next turn starts from the already-changed files.
  takeSnapshot(fixture, "claude-a");
  runHook(fixture, stopScript, claudeStop("claude-a", fixture.root));
  assert.equal(readInvocations(fixture).trim().split("\n").length, 1);
});

test("session state is isolated by repository and session", (t) => {
  const fixture = createFixture(t);

  takeSnapshot(fixture, "claude-a");
  addDependency(fixture, "zod");

  assert.equal(
    runHook(fixture, stopScript, claudeStop("claude-b", fixture.root)).status,
    0,
  );
  assert.equal(readInvocations(fixture), "");

  assert.equal(
    runHook(fixture, stopScript, claudeStop("claude-a", fixture.root)).status,
    0,
  );
  assert.match(readInvocations(fixture), /^exec knip$/m);
});

test("stop_hook_active without a prior Knip block clears state without running", (t) => {
  const fixture = createFixture(t);

  takeSnapshot(fixture, "claude-a");
  addDependency(fixture, "zod");

  assert.equal(
    runHook(fixture, stopScript, {
      ...claudeStop("claude-a", fixture.root),
      stop_hook_active: true,
    }).status,
    0,
  );
  assert.equal(readInvocations(fixture), "");

  assert.equal(
    runHook(fixture, stopScript, claudeStop("claude-a", fixture.root)).status,
    0,
  );
  assert.equal(readInvocations(fixture), "");
});

test("Knip failure blocks once and reports output", (t) => {
  const fixture = createFixture(t, { knipExitCode: 1 });

  takeSnapshot(fixture, "claude-a");
  addDependency(fixture, "zod");
  const failed = runHook(
    fixture,
    stopScript,
    claudeStop("claude-a", fixture.root),
  );

  assert.equal(failed.status, 2);
  assert.match(failed.stderr, /Knip hook found dependency/);
  assert.match(failed.stderr, /fixture knip failure/);
  assert.equal(readInvocations(fixture).trim().split("\n").length, 1);
});

test("the continuation after a block rechecks once, even for a source-only fix", (t) => {
  const fixture = createFixture(t, { knipExitCode: 1 });

  takeSnapshot(fixture, "claude-a");
  addDependency(fixture, "zod");
  assert.equal(
    runHook(fixture, stopScript, claudeStop("claude-a", fixture.root)).status,
    2,
  );

  fixture.knipExitCode = 0;
  writeFileSync(path.join(fixture.root, "fixed.ts"), "export {};\n");
  const recheck = runHook(fixture, stopScript, {
    ...claudeStop("claude-a", fixture.root),
    stop_hook_active: true,
  });

  assert.equal(recheck.status, 0);
  assert.match(JSON.parse(recheck.stdout).systemMessage, /recheck passed/);
  assert.equal(readInvocations(fixture).trim().split("\n").length, 2);

  const again = runHook(fixture, stopScript, {
    ...claudeStop("claude-a", fixture.root),
    stop_hook_active: true,
  });
  assert.equal(again.status, 0);
  assert.equal(again.stdout, "");
  assert.equal(readInvocations(fixture).trim().split("\n").length, 2);
});

test("a failing continuation recheck reports JSON once without blocking again", (t) => {
  const fixture = createFixture(t, { knipExitCode: 1 });

  takeSnapshot(fixture, "claude-a");
  addDependency(fixture, "zod");
  assert.equal(
    runHook(fixture, stopScript, claudeStop("claude-a", fixture.root)).status,
    2,
  );

  const recheck = runHook(fixture, stopScript, {
    ...claudeStop("claude-a", fixture.root),
    stop_hook_active: true,
  });
  assert.equal(recheck.status, 0);
  assert.match(JSON.parse(recheck.stdout).systemMessage, /still failed/);
  assert.equal(readInvocations(fixture).trim().split("\n").length, 2);

  const noBlock = runHook(fixture, stopScript, {
    ...claudeStop("claude-a", fixture.root),
    stop_hook_active: true,
  });
  assert.equal(noBlock.status, 0);
  assert.equal(noBlock.stdout, "");
  assert.equal(readInvocations(fixture).trim().split("\n").length, 2);
});

test("missing session identity fails open instead of sharing state", (t) => {
  const fixture = createFixture(t);

  const snapshotted = runHook(fixture, snapshotScript, { cwd: fixture.root });
  addDependency(fixture, "zod");
  const stopped = runHook(fixture, stopScript, {
    cwd: fixture.root,
    stop_hook_active: false,
  });

  assert.equal(snapshotted.status, 0);
  assert.equal(stopped.status, 0);
  assert.equal(readInvocations(fixture), "");
});

test("PostToolUse runs Biome on edited files and no longer matches Bash", (t) => {
  const fixture = createFixture(t, { includeBiome: true });
  writeFileSync(path.join(fixture.root, "a.ts"), "export {};\n");

  assert.equal(
    runHook(fixture, postEditScript, {
      session_id: "claude-a",
      cwd: fixture.root,
      tool_name: "Edit",
      tool_input: { file_path: path.join(fixture.root, "a.ts") },
    }).status,
    0,
  );
  assert.match(
    readInvocations(fixture),
    /^exec biome check --write --no-errors-on-unmatched a\.ts$/m,
  );

  const hooks = JSON.parse(readFileSync(hooksJson, "utf8")).hooks;
  assert.equal(
    hooks.PostToolUse[0].matcher,
    "Edit|MultiEdit|Write|apply_patch",
  );
});

function claudeStop(sessionId, root) {
  return {
    session_id: sessionId,
    cwd: root,
    hook_event_name: "Stop",
    stop_hook_active: false,
  };
}

function takeSnapshot(fixture, sessionId) {
  assert.equal(
    runHook(fixture, snapshotScript, {
      session_id: sessionId,
      cwd: fixture.root,
      hook_event_name: "UserPromptSubmit",
    }).status,
    0,
  );
}

function addDependency(fixture, name) {
  const file = path.join(fixture.root, "package.json");
  const manifest = JSON.parse(readFileSync(file, "utf8"));
  manifest.devDependencies[name] = "1.0.0";
  writeFileSync(file, `${JSON.stringify(manifest)}\n`);
}

function createFixture(t, { includeBiome = false, knipExitCode = 0 } = {}) {
  const root = mkdtempSync(path.join(os.tmpdir(), "lf-hook-fixture-"));
  const bin = path.join(root, "bin");
  const state = path.join(root, "hook-state");
  const invocationLog = path.join(root, "knip-invocations.log");
  mkdirSync(bin);
  spawnSync("git", ["init", "-q"], { cwd: root });
  writeFileSync(
    path.join(root, "package.json"),
    `${JSON.stringify({
      devDependencies: {
        knip: "1.0.0",
        ...(includeBiome ? { "@biomejs/biome": "1.0.0" } : {}),
      },
    })}\n`,
  );
  writeFileSync(path.join(root, "pnpm-lock.yaml"), "lockfileVersion: '9.0'\n");

  const fakePnpm = path.join(bin, "pnpm");
  writeFileSync(
    fakePnpm,
    `#!/usr/bin/env node
import { appendFileSync } from "node:fs";
appendFileSync(process.env.FAKE_KNIP_LOG, process.argv.slice(2).join(" ") + "\\n");
if (process.env.FAKE_KNIP_EXIT !== "0") {
  process.stderr.write("fixture knip failure\\n");
}
process.exit(Number(process.env.FAKE_KNIP_EXIT));
`,
  );
  chmodSync(fakePnpm, 0o755);

  t.after(() => rmSync(root, { recursive: true, force: true }));
  return { bin, invocationLog, knipExitCode, root, state };
}

function runHook(fixture, script, input) {
  return spawnSync(process.execPath, [script], {
    cwd: fixture.root,
    encoding: "utf8",
    input: JSON.stringify(input),
    env: {
      ...process.env,
      PATH: `${fixture.bin}${path.delimiter}${process.env.PATH ?? ""}`,
      LF_IMPLEMENTATION_WORKFLOW_STATE_DIR: fixture.state,
      FAKE_KNIP_LOG: fixture.invocationLog,
      FAKE_KNIP_EXIT: String(fixture.knipExitCode),
    },
  });
}

function readInvocations(fixture) {
  try {
    return readFileSync(fixture.invocationLog, "utf8");
  } catch {
    return "";
  }
}
