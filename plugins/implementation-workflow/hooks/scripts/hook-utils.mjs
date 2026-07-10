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
    input.cwd,
    input.workdir,
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

export function collectDependencyGraphFiles(hookInput) {
  if (hookInput.tool_name !== "Bash" || !wasSuccessfulBash(hookInput)) {
    return [];
  }

  const command =
    hookInput.tool_input?.command ?? hookInput.tool_input?.cmd ?? null;
  if (typeof command !== "string" || !command.trim()) return [];
  if (command.includes("<<")) return [];

  const managers = new Set();
  for (const segment of splitShellSegments(command)) {
    const invocation = dependencyInvocation(segment);
    if (invocation) managers.add(invocation);
  }

  const files = new Set();
  for (const manager of managers) {
    files.add("package.json");
    for (const lockfile of DEPENDENCY_LOCKFILES[manager]) files.add(lockfile);
  }
  return [...files].sort();
}

const DEPENDENCY_ACTIONS = {
  pnpm: new Set([
    "add",
    "dedupe",
    "import",
    "install",
    "remove",
    "rm",
    "uninstall",
    "up",
    "update",
    "upgrade",
  ]),
  npm: new Set([
    "add",
    "dedupe",
    "dedup",
    "i",
    "install",
    "remove",
    "rm",
    "un",
    "uninstall",
    "up",
    "update",
    "upgrade",
  ]),
  yarn: new Set([
    "add",
    "dedupe",
    "import",
    "install",
    "remove",
    "uninstall",
    "up",
    "update",
    "upgrade",
  ]),
  bun: new Set([
    "add",
    "install",
    "remove",
    "rm",
    "uninstall",
    "up",
    "update",
    "upgrade",
  ]),
};

const DEPENDENCY_LOCKFILES = {
  pnpm: ["pnpm-lock.yaml"],
  npm: ["package-lock.json", "npm-shrinkwrap.json"],
  yarn: ["yarn.lock"],
  bun: ["bun.lock", "bun.lockb"],
};

const OPTIONS_WITH_VALUE = new Set([
  "--cache",
  "--config",
  "--cwd",
  "--dir",
  "--filter",
  "--global-dir",
  "--prefix",
  "--registry",
  "--use-yarnrc",
  "--workspace",
  "-C",
  "-F",
  "-w",
]);

function wasSuccessfulBash(input) {
  const response = input.tool_response;
  if (!response || typeof response !== "object") return true;
  if (response.success === false || response.interrupted === true) return false;

  for (const key of ["exit_code", "exitCode", "status_code", "statusCode"]) {
    if (typeof response[key] === "number" && response[key] !== 0) return false;
  }
  if (
    typeof response.status === "string" &&
    ["error", "failed", "failure"].includes(response.status.toLowerCase())
  ) {
    return false;
  }
  return true;
}

function splitShellSegments(command) {
  const segments = [];
  let current = "";
  let quote = null;
  let escaped = false;
  let comment = false;

  const push = () => {
    if (current.trim()) segments.push(current.trim());
    current = "";
  };

  for (let index = 0; index < command.length; index += 1) {
    const character = command[index];
    if (comment) {
      if (character === "\n") {
        comment = false;
        push();
      }
      continue;
    }
    if (escaped) {
      current += character;
      escaped = false;
      continue;
    }
    if (character === "\\" && quote !== "'") {
      current += character;
      escaped = true;
      continue;
    }
    if (quote) {
      current += character;
      if (character === quote) quote = null;
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      current += character;
      continue;
    }
    if (character === "#" && (!current || /\s$/.test(current))) {
      comment = true;
      continue;
    }
    if (
      character === ";" ||
      character === "\n" ||
      ((character === "&" || character === "|") &&
        command[index + 1] === character)
    ) {
      push();
      if (command[index + 1] === character) index += 1;
      continue;
    }
    current += character;
  }
  push();
  return segments;
}

function dependencyInvocation(segment) {
  const words = shellWords(segment);
  if (words.length === 0) return null;

  let index = unwrapCommandPrefix(words);
  while (/^[A-Za-z_][A-Za-z0-9_]*=/.test(words[index] ?? "")) index += 1;

  const executable = path.basename(words[index] ?? "");
  if (!Object.hasOwn(DEPENDENCY_ACTIONS, executable)) return null;
  index += 1;

  while (index < words.length) {
    const word = words[index];
    if (word === "--") {
      index += 1;
      break;
    }
    if (!word.startsWith("-")) break;
    const option = word.split("=", 1)[0];
    index += OPTIONS_WITH_VALUE.has(option) && !word.includes("=") ? 2 : 1;
  }

  if (
    executable === "yarn" &&
    words[index] === "workspace" &&
    words[index + 1]
  ) {
    index += 2;
  }

  return DEPENDENCY_ACTIONS[executable].has(words[index]) ? executable : null;
}

function unwrapCommandPrefix(words) {
  let index = 0;

  if (path.basename(words[index] ?? "") === "env") {
    index += 1;
    while (words[index]?.startsWith("-")) {
      const option = words[index];
      index += ["-u", "--unset"].includes(option) ? 2 : 1;
    }
  }
  while (/^[A-Za-z_][A-Za-z0-9_]*=/.test(words[index] ?? "")) index += 1;

  if (path.basename(words[index] ?? "") === "sudo") {
    index += 1;
    while (words[index]?.startsWith("-")) {
      const option = words[index];
      index += ["-C", "-D", "-g", "-h", "-p", "-R", "-T", "-u"].includes(option)
        ? 2
        : 1;
    }
  }

  for (;;) {
    const wrapper = path.basename(words[index] ?? "");
    if (["command", "corepack"].includes(wrapper)) {
      index += 1;
      continue;
    }
    if (wrapper === "rtk") {
      index += words[index + 1] === "proxy" ? 2 : 1;
      continue;
    }
    return index;
  }
}

function shellWords(segment) {
  const words = [];
  let current = "";
  let quote = null;
  let escaped = false;

  for (const character of segment) {
    if (escaped) {
      current += character;
      escaped = false;
      continue;
    }
    if (character === "\\" && quote !== "'") {
      escaped = true;
      continue;
    }
    if (quote) {
      if (character === quote) quote = null;
      else current += character;
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }
    if (/\s/.test(character)) {
      if (current) {
        words.push(current);
        current = "";
      }
      continue;
    }
    current += character;
  }
  if (escaped) current += "\\";
  if (current) words.push(current);
  return words;
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
