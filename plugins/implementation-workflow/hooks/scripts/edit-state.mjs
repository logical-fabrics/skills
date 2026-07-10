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
const KNIP_BLOCK_MARKER = "knip-blocked";

export function recordEditedFiles(input, root, files) {
  const sessionDir = resolveSessionDir(input, root);
  if (!sessionDir || files.length === 0) return false;

  cleanupStaleState();
  let temporary = null;
  try {
    mkdirSync(sessionDir, { recursive: true, mode: 0o700 });

    const event = {
      version: STATE_VERSION,
      createdAt: Date.now(),
      files: [...new Set(files)].sort(),
    };
    const eventName = `${event.createdAt}-${process.pid}-${randomUUID()}.json`;
    const destination = path.join(sessionDir, eventName);
    temporary = `${destination}.tmp`;
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

export function consumeEditedFiles(input, root) {
  const sessionDir = resolveSessionDir(input, root);
  if (!sessionDir) return [];

  const files = [];
  try {
    for (const entry of readdirSync(sessionDir, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
      try {
        const event = JSON.parse(
          readFileSync(path.join(sessionDir, entry.name), "utf8"),
        );
        if (event.version !== STATE_VERSION || !Array.isArray(event.files))
          continue;
        files.push(...event.files.filter((file) => typeof file === "string"));
      } catch {
        // Ignore incomplete or corrupt temp state. Hook state is advisory.
      }
    }
  } catch {
    return [];
  } finally {
    removeSessionDir(sessionDir);
  }

  return [...new Set(files)].sort();
}

export function discardEditedFiles(input, root) {
  const sessionDir = resolveSessionDir(input, root);
  if (sessionDir) removeSessionDir(sessionDir);
}

export function markKnipBlocked(input, root) {
  const sessionDir = resolveSessionDir(input, root);
  if (!sessionDir) return false;

  try {
    mkdirSync(sessionDir, { recursive: true, mode: 0o700 });
    writeFileSync(path.join(sessionDir, KNIP_BLOCK_MARKER), "blocked\n", {
      encoding: "utf8",
      mode: 0o600,
    });
    return true;
  } catch {
    return false;
  }
}

export function wasKnipBlocked(input, root) {
  const sessionDir = resolveSessionDir(input, root);
  if (!sessionDir) return false;
  try {
    return statSync(path.join(sessionDir, KNIP_BLOCK_MARKER)).isFile();
  } catch {
    return false;
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
    return path.resolve(process.env.LF_IMPLEMENTATION_WORKFLOW_STATE_DIR);
  }
  const user = typeof process.getuid === "function" ? process.getuid() : "user";
  return path.join(os.tmpdir(), `lf-implementation-workflow-hooks-${user}`);
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
          removeSessionDir(sessionDir);
        }
      }
    }
  } catch {
    // State cleanup is opportunistic and must not block an edit hook.
  }
}

function removeSessionDir(sessionDir) {
  try {
    rmSync(sessionDir, { recursive: true, force: true });
  } catch {
    // Cleanup failure must not block the host from stopping.
  }
}

function removeFile(filePath) {
  try {
    rmSync(filePath, { force: true });
  } catch {
    // Temp-file cleanup is best-effort for the same reason as session cleanup.
  }
}
