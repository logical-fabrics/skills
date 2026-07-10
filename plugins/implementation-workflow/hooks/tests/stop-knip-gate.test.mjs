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
const stopScript = path.join(hooksRoot, "scripts", "stop-knip-gate.mjs");

test("unchanged and pre-existing dirty files do not trigger Knip", (t) => {
  const fixture = createFixture(t);

  writeFileSync(
    path.join(fixture.root, "package.json"),
    `${JSON.stringify({ devDependencies: { knip: "1.0.0", extra: "1.0.0" } })}\n`,
  );
  const result = runHook(
    fixture,
    stopScript,
    claudeStop("claude-a", fixture.root),
  );

  assert.equal(result.status, 0);
  assert.equal(readInvocations(fixture), "");
});

test("Claude PostToolUse records a dependency-graph edit for the matching Stop", (t) => {
  const fixture = createFixture(t);

  assert.equal(
    runHook(fixture, postEditScript, {
      session_id: "claude-a",
      cwd: fixture.root,
      hook_event_name: "PostToolUse",
      tool_name: "Edit",
      tool_input: { file_path: path.join(fixture.root, "package.json") },
    }).status,
    0,
  );
  const result = runHook(
    fixture,
    stopScript,
    claudeStop("claude-a", fixture.root),
  );

  assert.equal(result.status, 0);
  assert.match(readInvocations(fixture), /^exec knip$/m);
});

test("Codex-style thread and apply_patch input trigger Knip", (t) => {
  const fixture = createFixture(t);

  assert.equal(
    runHook(fixture, postEditScript, {
      thread_id: "codex-a",
      hook_event_name: "PostToolUse",
      tool_name: "apply_patch",
      tool_input: {
        workdir: fixture.root,
        patch: "*** Begin Patch\n*** Update File: package.json\n*** End Patch",
      },
    }).status,
    0,
  );
  const result = runHook(fixture, stopScript, {
    thread_id: "codex-a",
    workdir: fixture.root,
    hook_event_name: "Stop",
    stop_hook_active: false,
  });

  assert.equal(result.status, 0);
  assert.match(readInvocations(fixture), /^exec knip$/m);
});

test("successful dependency-manager Bash commands trigger Knip", (t) => {
  const fixture = createFixture(t);
  const commands = [
    "rtk pnpm --filter app add zod",
    "corepack npm --workspace app uninstall zod",
    "yarn workspace web add zod",
    "sudo -u developer bun --cwd app update",
  ];

  for (const [index, command] of commands.entries()) {
    const sessionId = `bash-${index}`;
    assert.equal(
      runHook(fixture, postEditScript, {
        session_id: sessionId,
        cwd: fixture.root,
        hook_event_name: "PostToolUse",
        tool_name: "Bash",
        tool_input: { command },
        tool_response: { success: true },
      }).status,
      0,
    );
    assert.equal(
      runHook(fixture, stopScript, claudeStop(sessionId, fixture.root)).status,
      0,
    );
  }

  assert.equal(
    readInvocations(fixture).trim().split("\n").length,
    commands.length,
  );
});

test("arbitrary or failed Bash does not track files or run Biome fallback", (t) => {
  const fixture = createFixture(t, { includeBiome: true });
  const inputs = [
    {
      session_id: "bash-arbitrary",
      cwd: fixture.root,
      hook_event_name: "PostToolUse",
      tool_name: "Bash",
      tool_input: { command: "echo 'noop; npm install'" },
      tool_response: { success: true },
    },
    {
      session_id: "bash-failed",
      cwd: fixture.root,
      hook_event_name: "PostToolUse",
      tool_name: "Bash",
      tool_input: { command: "rtk pnpm add zod" },
      tool_response: { success: false, exit_code: 1 },
    },
  ];

  for (const input of inputs) {
    assert.equal(runHook(fixture, postEditScript, input).status, 0);
    assert.equal(
      runHook(fixture, stopScript, claudeStop(input.session_id, fixture.root))
        .status,
      0,
    );
  }
  assert.equal(readInvocations(fixture), "");
});

test("session state is isolated by repository and session", (t) => {
  const fixture = createFixture(t);

  runHook(fixture, postEditScript, {
    session_id: "claude-a",
    cwd: fixture.root,
    tool_input: { file_path: "package.json" },
  });

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

  runHook(fixture, postEditScript, {
    session_id: "claude-a",
    cwd: fixture.root,
    tool_input: { file_path: "package.json" },
  });

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

  runHook(fixture, postEditScript, {
    session_id: "claude-a",
    cwd: fixture.root,
    tool_input: { file_path: "package.json" },
  });
  const failed = runHook(
    fixture,
    stopScript,
    claudeStop("claude-a", fixture.root),
  );

  assert.equal(failed.status, 2);
  assert.match(failed.stderr, /Knip hook found dependency/);
  assert.match(failed.stderr, /fixture knip failure/);
  assert.equal(readInvocations(fixture).trim().split("\n").length, 1);

  const continuation = runHook(fixture, stopScript, {
    ...claudeStop("claude-a", fixture.root),
    stop_hook_active: true,
  });
  assert.equal(continuation.status, 0);
  assert.equal(readInvocations(fixture).trim().split("\n").length, 1);
});

test("a dependency re-edit during continuation gets a non-blocking passing recheck", (t) => {
  const fixture = createFixture(t, { knipExitCode: 1 });

  recordPackageEdit(fixture, "claude-a");
  assert.equal(
    runHook(fixture, stopScript, claudeStop("claude-a", fixture.root)).status,
    2,
  );

  fixture.knipExitCode = 0;
  recordPackageEdit(fixture, "claude-a");
  const recheck = runHook(fixture, stopScript, {
    ...claudeStop("claude-a", fixture.root),
    stop_hook_active: true,
  });

  assert.equal(recheck.status, 0);
  assert.match(JSON.parse(recheck.stdout).systemMessage, /recheck passed/);
  assert.equal(readInvocations(fixture).trim().split("\n").length, 2);
});

test("a source edit during continuation also rechecks the prior Knip block", (t) => {
  const fixture = createFixture(t, { knipExitCode: 1 });

  recordPackageEdit(fixture, "claude-a");
  assert.equal(
    runHook(fixture, stopScript, claudeStop("claude-a", fixture.root)).status,
    2,
  );

  fixture.knipExitCode = 0;
  assert.equal(
    runHook(fixture, postEditScript, {
      session_id: "claude-a",
      cwd: fixture.root,
      tool_input: { file_path: "src/fixed-import.ts" },
    }).status,
    0,
  );
  const recheck = runHook(fixture, stopScript, {
    ...claudeStop("claude-a", fixture.root),
    stop_hook_active: true,
  });

  assert.equal(recheck.status, 0);
  assert.match(JSON.parse(recheck.stdout).systemMessage, /recheck passed/);
  assert.equal(readInvocations(fixture).trim().split("\n").length, 2);
});

test("a failing continuation recheck reports JSON once without blocking again", (t) => {
  const fixture = createFixture(t, { knipExitCode: 1 });

  recordPackageEdit(fixture, "claude-a");
  assert.equal(
    runHook(fixture, stopScript, claudeStop("claude-a", fixture.root)).status,
    2,
  );

  recordPackageEdit(fixture, "claude-a");
  const recheck = runHook(fixture, stopScript, {
    ...claudeStop("claude-a", fixture.root),
    stop_hook_active: true,
  });
  assert.equal(recheck.status, 0);
  assert.match(JSON.parse(recheck.stdout).systemMessage, /still failed/);
  assert.equal(readInvocations(fixture).trim().split("\n").length, 2);

  const noEdit = runHook(fixture, stopScript, {
    ...claudeStop("claude-a", fixture.root),
    stop_hook_active: true,
  });
  assert.equal(noEdit.status, 0);
  assert.equal(noEdit.stdout, "");
  assert.equal(readInvocations(fixture).trim().split("\n").length, 2);
});

test("missing session identity fails open instead of sharing state", (t) => {
  const fixture = createFixture(t);

  const edited = runHook(fixture, postEditScript, {
    cwd: fixture.root,
    tool_input: { file_path: "package.json" },
  });
  const stopped = runHook(fixture, stopScript, {
    cwd: fixture.root,
    stop_hook_active: false,
  });

  assert.equal(edited.status, 0);
  assert.equal(stopped.status, 0);
  assert.equal(readInvocations(fixture), "");
});

function claudeStop(sessionId, root) {
  return {
    session_id: sessionId,
    cwd: root,
    hook_event_name: "Stop",
    stop_hook_active: false,
  };
}

function recordPackageEdit(fixture, sessionId) {
  assert.equal(
    runHook(fixture, postEditScript, {
      session_id: sessionId,
      cwd: fixture.root,
      tool_input: { file_path: "package.json" },
    }).status,
    0,
  );
}

function createFixture(t, { includeBiome = false, knipExitCode = 0 } = {}) {
  const root = mkdtempSync(path.join(os.tmpdir(), "lf-hook-fixture-"));
  const bin = path.join(root, "bin");
  const state = path.join(root, "hook-state");
  const invocationLog = path.join(root, "knip-invocations.log");
  mkdirSync(bin);
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
      CLAUDE_SESSION_ID: "",
      CODEX_THREAD_ID: "",
      CODEX_SESSION_ID: "",
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
