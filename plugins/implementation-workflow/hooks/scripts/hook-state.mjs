import { createHash, randomUUID } from "node:crypto";
import {
  existsSync,
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

const MAX_STATE_AGE_MS = 24 * 60 * 60 * 1_000;

// State lives under <root>/<namespace>/<repo digest>/<session digest>/ so the
// Knip gate and the learning gate can clear their own session state independently.
// Hook state is advisory: every function fails open instead of blocking the host.

export function writeState(
  input,
  root,
  namespace,
  name,
  value,
  { onlyIfMissing = false } = {},
) {
  const sessionDir = resolveSessionDir(input, root, namespace);
  if (!sessionDir) return false;

  cleanupStaleState();
  const destination = path.join(sessionDir, name);
  if (onlyIfMissing && existsSync(destination)) return false;

  let temporary = null;
  try {
    mkdirSync(sessionDir, { recursive: true, mode: 0o700 });
    temporary = `${destination}.${process.pid}-${randomUUID()}.tmp`;
    writeFileSync(temporary, `${JSON.stringify(value)}\n`, {
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

export function readState(input, root, namespace, name) {
  const sessionDir = resolveSessionDir(input, root, namespace);
  if (!sessionDir) return null;
  try {
    return JSON.parse(readFileSync(path.join(sessionDir, name), "utf8"));
  } catch {
    return null;
  }
}

export function clearState(input, root, namespace) {
  const sessionDir = resolveSessionDir(input, root, namespace);
  if (sessionDir) removeDirectory(sessionDir);
}

export function isStopHookActive(input) {
  return input.stop_hook_active === true;
}

function resolveSessionDir(input, root, namespace) {
  const sessionId =
    typeof input.session_id === "string" ? input.session_id.trim() : "";
  if (!sessionId) return null;

  return path.join(
    stateRoot(),
    namespace,
    digest(path.resolve(root)),
    digest(sessionId),
  );
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
  try {
    for (const namespace of readdirSync(stateRoot(), {
      withFileTypes: true,
    })) {
      if (!namespace.isDirectory()) continue;
      const namespaceDir = path.join(stateRoot(), namespace.name);
      for (const repository of readdirSync(namespaceDir, {
        withFileTypes: true,
      })) {
        if (!repository.isDirectory()) continue;
        const repositoryDir = path.join(namespaceDir, repository.name);
        for (const session of readdirSync(repositoryDir, {
          withFileTypes: true,
        })) {
          if (!session.isDirectory()) continue;
          const sessionDir = path.join(repositoryDir, session.name);
          if (Date.now() - statSync(sessionDir).mtimeMs > MAX_STATE_AGE_MS) {
            removeDirectory(sessionDir);
          }
        }
      }
    }
  } catch {
    // State cleanup is opportunistic and must not block a hook.
  }
}

function removeDirectory(directory) {
  try {
    rmSync(directory, { recursive: true, force: true });
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
