import { createHash, randomUUID } from "node:crypto";
import {
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";

const STATE_VERSION = 1;
const MAX_STATE_AGE_MS = 24 * 60 * 60 * 1_000;
const SIGNAL_FILE = "pending.json";

export function recordLearningSignal(input, root, signal) {
  const sessionDir = resolveSessionDir(input, root);
  if (!sessionDir) return false;

  cleanupStaleState();
  let temporary = null;
  try {
    mkdirSync(sessionDir, { recursive: true, mode: 0o700 });
    const destination = path.join(sessionDir, SIGNAL_FILE);
    temporary = `${destination}.${process.pid}-${randomUUID()}.tmp`;
    const event = {
      version: STATE_VERSION,
      createdAt: Date.now(),
      level: signal.level,
      categories: [...new Set(signal.categories)].sort(),
    };
    writeFileSync(temporary, `${JSON.stringify(event)}\n`, {
      encoding: "utf8",
      mode: 0o600,
      flag: "wx",
    });
    renameSync(temporary, destination);
    return true;
  } catch {
    if (temporary) removeFile(temporary);
    return false;
  }
}

export function readLearningSignal(input, root) {
  const sessionDir = resolveSessionDir(input, root);
  if (!sessionDir) return null;

  try {
    const signalPath = path.join(sessionDir, SIGNAL_FILE);
    const event = JSON.parse(readFileSync(signalPath, "utf8"));
    if (
      event.version !== STATE_VERSION ||
      typeof event.createdAt !== "number" ||
      Date.now() - event.createdAt > MAX_STATE_AGE_MS ||
      !["correction", "explicit-persistence"].includes(event.level) ||
      !Array.isArray(event.categories)
    ) {
      clearLearningSignal(input, root);
      return null;
    }
    return event;
  } catch {
    clearLearningSignal(input, root);
    return null;
  }
}

export function clearLearningSignal(input, root) {
  const sessionDir = resolveSessionDir(input, root);
  if (!sessionDir) return;
  try {
    rmSync(sessionDir, { recursive: true, force: true });
  } catch {
    // Learning state is advisory and must never prevent the host from stopping.
  }
}

export function isStopHookActive(input) {
  return input.stop_hook_active === true || input.stop_hook_active === "true";
}

function resolveSessionDir(input, root) {
  const sessionId = findSessionId(input);
  if (!sessionId) return null;
  return path.join(stateRoot(), digest(path.resolve(root)), digest(sessionId));
}

function findSessionId(input) {
  const candidates = [
    input.session_id,
    input.sessionId,
    input.thread_id,
    input.threadId,
    input.conversation_id,
    input.conversationId,
    input.codex_thread_id,
    input.transcript_path,
    process.env.CLAUDE_SESSION_ID,
    process.env.CODEX_THREAD_ID,
    process.env.CODEX_SESSION_ID,
  ];
  const sessionId = candidates.find(
    (candidate) => typeof candidate === "string" && candidate.trim(),
  );
  return sessionId?.trim() ?? null;
}

function stateRoot() {
  if (process.env.LF_IMPLEMENTATION_WORKFLOW_STATE_DIR) {
    return path.join(
      path.resolve(process.env.LF_IMPLEMENTATION_WORKFLOW_STATE_DIR),
      "learning-signals",
    );
  }
  const user = typeof process.getuid === "function" ? process.getuid() : "user";
  return path.join(os.tmpdir(), `lf-implementation-workflow-learning-${user}`);
}

function digest(value) {
  return createHash("sha256").update(String(value)).digest("hex");
}

function cleanupStaleState() {
  const root = stateRoot();
  try {
    for (const repository of readdirSync(root, { withFileTypes: true })) {
      if (!repository.isDirectory()) continue;
      const repositoryDir = path.join(root, repository.name);
      for (const session of readdirSync(repositoryDir, {
        withFileTypes: true,
      })) {
        if (!session.isDirectory()) continue;
        const sessionDir = path.join(repositoryDir, session.name);
        if (Date.now() - statSync(sessionDir).mtimeMs > MAX_STATE_AGE_MS) {
          rmSync(sessionDir, { recursive: true, force: true });
        }
      }
    }
  } catch {
    // Stale-state cleanup is opportunistic and must not block prompt handling.
  }
}

function removeFile(filePath) {
  try {
    if (statSync(filePath).isFile()) rmSync(filePath, { force: true });
  } catch {
    // Temp cleanup is best-effort.
  }
}
