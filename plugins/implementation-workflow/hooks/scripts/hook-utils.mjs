import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
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
  const cwd = path.resolve(
    typeof input.cwd === "string" && input.cwd ? input.cwd : process.cwd(),
  );
  return runGitRoot(cwd) ?? cwd;
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

// Files whose change can alter what Knip reports: manifests, lockfiles, Knip and
// tool configs, and entry-point index files.
export function isDependencyGraphFile(file) {
  const base = path.basename(file);
  const normalized = file.replaceAll("\\", "/");

  return (
    DEPENDENCY_GRAPH_FILES.has(base) ||
    /^(vite|next|nuxt|astro|svelte|webpack|rollup|tsup|vitest)\.config\./.test(
      base,
    ) ||
    /^tsconfig\..+\.json$/.test(base) ||
    normalized.includes("/index.") ||
    normalized.startsWith("index.")
  );
}

const DEPENDENCY_GRAPH_FILES = new Set([
  "package.json",
  "pnpm-lock.yaml",
  "package-lock.json",
  "npm-shrinkwrap.json",
  "yarn.lock",
  "bun.lock",
  "bun.lockb",
  "knip.json",
  "knip.jsonc",
  "knip.ts",
  "knip.js",
  "tsconfig.json",
  "tsconfig.base.json",
]);

// Maps each dependency-graph file to a content hash. Comparing two snapshots
// detects changes from any source (editor tools, package managers, shell
// commands) and ignores files that were already dirty before the baseline.
export function snapshotDependencyGraph(root) {
  const snapshot = {};
  for (const file of listCandidateFiles(root)) {
    if (!isDependencyGraphFile(file)) continue;
    if (file.split(/[\\/]/).includes("node_modules")) continue;
    try {
      snapshot[file] = createHash("sha256")
        .update(readFileSync(path.join(root, file)))
        .digest("hex");
    } catch {
      // Listed but unreadable (for example deleted since listing): absent.
    }
  }
  return snapshot;
}

export function dependencyGraphChanged(before, after) {
  const files = new Set([...Object.keys(before), ...Object.keys(after)]);
  return [...files].some((file) => before[file] !== after[file]);
}

function listCandidateFiles(root) {
  const result = spawnSync(
    "git",
    ["ls-files", "-z", "--cached", "--others", "--exclude-standard"],
    { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
  );
  if (result.status === 0) return result.stdout.split("\0").filter(Boolean);

  // Outside git, only root-level files are considered.
  try {
    return readdirSync(root, { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name);
  } catch {
    return [];
  }
}

export function collectEditedFiles(hookInput) {
  const toolInput = hookInput.tool_input ?? {};
  const directPaths = collectDirectPaths(toolInput);

  const patchText = [
    typeof toolInput === "string" ? toolInput : "",
    typeof toolInput.patch === "string" ? toolInput.patch : "",
    typeof toolInput.cmd === "string" ? toolInput.cmd : "",
    typeof toolInput.command === "string" ? toolInput.command : "",
  ].join("\n");

  return [
    ...new Set([...directPaths, ...extractPatchPaths(patchText)].map(String)),
  ];
}

function collectDirectPaths(toolInput) {
  if (!toolInput || typeof toolInput !== "object") return [];

  const paths = [];
  const candidates = [
    toolInput,
    ...(Array.isArray(toolInput.edits) ? toolInput.edits : []),
    ...(Array.isArray(toolInput.files) ? toolInput.files : []),
  ];
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object") continue;
    for (const key of ["file_path", "path", "filename", "target_file"]) {
      if (typeof candidate[key] === "string" && candidate[key].trim()) {
        paths.push(candidate[key]);
      }
    }
  }
  return paths;
}

function extractPatchPaths(text) {
  const paths = [];
  for (const line of text.split(/\r?\n/)) {
    const applyPatchMatch = line.match(
      /^\*\*\* (?:Add|Update|Delete) File: (.+)$/,
    );
    if (applyPatchMatch) {
      paths.push(applyPatchMatch[1].trim());
      continue;
    }

    const diffMatch = line.match(/^(?:\+\+\+|---) [ab]\/([^\t]+)(?:\t.*)?$/);
    if (diffMatch && diffMatch[1] !== "/dev/null") {
      paths.push(diffMatch[1].trim());
    }
  }
  return paths;
}

export function fail(message, details = "") {
  const body = details.trim() ? `${message}\n\n${details.trim()}` : message;
  console.error(body);
  process.exit(2);
}
