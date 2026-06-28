import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export const BIOME_EXTENSIONS = new Set([
  ".astro",
  ".css",
  ".graphql",
  ".gql",
  ".html",
  ".js",
  ".json",
  ".jsonc",
  ".jsx",
  ".mjs",
  ".cjs",
  ".ts",
  ".tsx",
  ".mts",
  ".cts",
  ".vue",
]);

export function readHookInput() {
  const raw = readFileSync(0, { encoding: "utf8" }).trim();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function findProjectRoot(input = {}) {
  const toolInput = input.tool_input ?? {};
  const candidates = [
    toolInput.cwd,
    toolInput.workdir,
    process.env.CLAUDE_PROJECT_DIR,
    process.env.CODEX_WORKSPACE_ROOT,
    process.env.PWD,
    process.cwd(),
  ].filter(Boolean);

  for (const candidate of candidates) {
    const absolute = path.resolve(String(candidate));
    const gitRoot = runGitRoot(absolute);
    if (gitRoot) return gitRoot;
    if (existsSync(path.join(absolute, "package.json"))) return absolute;
  }

  return process.cwd();
}

function runGitRoot(cwd) {
  try {
    return execFileSync("git", ["rev-parse", "--show-toplevel"], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}

export function loadPackageJson(root) {
  const filePath = path.join(root, "package.json");
  if (!existsSync(filePath)) return null;
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

export function hasBiome(root, packageJson = loadPackageJson(root)) {
  if (
    existsSync(path.join(root, "biome.json")) ||
    existsSync(path.join(root, "biome.jsonc"))
  ) {
    return true;
  }
  const deps = {
    ...(packageJson?.dependencies ?? {}),
    ...(packageJson?.devDependencies ?? {}),
  };
  return Boolean(deps["@biomejs/biome"] || deps.biome);
}

export function hasKnip(root, packageJson = loadPackageJson(root)) {
  if (
    existsSync(path.join(root, "knip.json")) ||
    existsSync(path.join(root, "knip.jsonc")) ||
    existsSync(path.join(root, "knip.ts")) ||
    existsSync(path.join(root, "knip.js"))
  ) {
    return true;
  }
  const deps = {
    ...(packageJson?.dependencies ?? {}),
    ...(packageJson?.devDependencies ?? {}),
  };
  return Boolean(deps.knip);
}

export function packageRunner(root, commandName) {
  if (existsSync(path.join(root, "pnpm-lock.yaml"))) {
    return ["pnpm", ["exec", commandName]];
  }
  if (
    existsSync(path.join(root, "bun.lock")) ||
    existsSync(path.join(root, "bun.lockb"))
  ) {
    return ["bunx", ["--bun", commandName]];
  }
  if (existsSync(path.join(root, "yarn.lock"))) {
    return ["yarn", ["exec", commandName]];
  }
  return ["npx", ["--no-install", commandName]];
}

export function runCommand(root, commandName, args, timeoutMs) {
  const [bin, baseArgs] = packageRunner(root, commandName);
  return spawnSync(bin, [...baseArgs, ...args], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: timeoutMs,
  });
}

export function gitChangedFiles(root) {
  const result = spawnSync("git", ["status", "--porcelain=v1", "-z"], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
  if (result.status !== 0 || !result.stdout) return [];

  const entries = result.stdout.split("\0").filter(Boolean);
  const files = [];
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    const status = entry.slice(0, 2);
    const file = entry.slice(3);
    if (status.includes("R") || status.includes("C")) {
      const next = entries[index + 1];
      if (next) {
        files.push(next);
        index += 1;
      }
      continue;
    }
    if (file) files.push(file);
  }
  return files;
}

export function isInsideRoot(root, filePath) {
  const absolute = path.resolve(root, filePath);
  const relative = path.relative(root, absolute);
  return relative && !relative.startsWith("..") && !path.isAbsolute(relative);
}

export function normalizeRelative(root, filePath) {
  const absolute = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(root, filePath);
  if (!isInsideRoot(root, absolute)) return null;
  return path.relative(root, absolute);
}

export function fail(message, details = "") {
  const body = details.trim() ? `${message}\n\n${details.trim()}` : message;
  console.error(body);
  process.exit(2);
}
