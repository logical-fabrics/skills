import { existsSync } from "node:fs";
import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const pluginsDir = path.join(root, "plugins");
const codexMarketplacePath = path.join(
  root,
  ".agents",
  "plugins",
  "marketplace.json",
);
const claudeMarketplacePath = path.join(
  root,
  ".claude-plugin",
  "marketplace.json",
);
const requiredSkillSections = [
  "## Capability Boundary",
  "## Core Rules",
  "## Workflow",
  "## Required References",
];
const unsupportedPluginAgentFields = ["hooks", "mcpServers", "permissionMode"];
const supportedAgentEfforts = new Set([
  "low",
  "medium",
  "high",
  "xhigh",
  "max",
]);
// Models that do not accept the effort parameter. Setting effort on these is a
// silent no-op, so the routing intent has to be expressed by narrowing the task.
const effortlessAgentModels = new Set([
  "haiku",
  "claude-haiku-4-5",
  "claude-haiku-4-5-20251001",
]);

const errors = [];

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function validateJson(filePath, text) {
  try {
    return JSON.parse(text);
  } catch (error) {
    errors.push(`${filePath}: invalid JSON: ${error.message}`);
    return null;
  }
}

function validateSkillFrontmatter(filePath, text) {
  if (!text.startsWith("---\n")) {
    errors.push(`${filePath}: missing YAML frontmatter`);
    return;
  }
  const end = text.indexOf("\n---\n", 4);
  if (end === -1) {
    errors.push(`${filePath}: unterminated YAML frontmatter`);
    return;
  }
  const frontmatter = text.slice(4, end);
  for (const key of ["name:", "description:"]) {
    if (!frontmatter.includes(key)) {
      errors.push(`${filePath}: missing ${key} in frontmatter`);
    }
  }
  for (const section of requiredSkillSections) {
    if (!text.includes(section)) {
      errors.push(`${filePath}: missing section ${section}`);
    }
  }
}

function validateMarkdownFrontmatter(filePath, text, requiredKeys) {
  if (!text.startsWith("---\n")) {
    errors.push(`${filePath}: missing YAML frontmatter`);
    return;
  }
  const end = text.indexOf("\n---\n", 4);
  if (end === -1) {
    errors.push(`${filePath}: unterminated YAML frontmatter`);
    return;
  }
  const frontmatter = text.slice(4, end);
  for (const key of requiredKeys) {
    if (!frontmatter.includes(`${key}:`)) {
      errors.push(`${filePath}: missing ${key}: in frontmatter`);
    }
  }
}

function parseAgentFrontmatter(filePath, text) {
  if (!text.startsWith("---\n")) {
    errors.push(`${filePath}: missing YAML frontmatter`);
    return null;
  }
  const end = text.indexOf("\n---\n", 4);
  if (end === -1) {
    errors.push(`${filePath}: unterminated YAML frontmatter`);
    return null;
  }

  const fields = new Map();
  let currentKey = null;
  for (const line of text.slice(4, end).split("\n")) {
    const field = line.match(/^([A-Za-z][A-Za-z0-9-]*):(?:\s*(.*))?$/);
    if (field) {
      const [, key, value = ""] = field;
      if (fields.has(key)) {
        errors.push(`${filePath}: duplicate ${key}: in frontmatter`);
      }
      fields.set(key, value.trim());
      currentKey = key;
      continue;
    }

    const listItem = line.match(/^\s+-\s+(.+)$/);
    if (listItem && currentKey) {
      const currentValue = fields.get(currentKey);
      const values = Array.isArray(currentValue) ? currentValue : [];
      values.push(listItem[1].trim());
      fields.set(currentKey, values);
    }
  }
  return fields;
}

function frontmatterList(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string" || value.trim() === "") return [];
  const normalized = value.replace(/^\[/, "").replace(/\]$/, "");
  return normalized
    .split(",")
    .map((item) => item.trim().replace(/^['"]|['"]$/g, ""))
    .filter(Boolean);
}

function validateAgentFrontmatter(
  pluginName,
  filePath,
  text,
  skillNames,
  agentNames,
) {
  const fields = parseAgentFrontmatter(filePath, text);
  if (!fields) return;

  // effort and skills stay optional: a leaf agent should be able to run without
  // loading a whole skill, and some models do not accept effort at all.
  for (const key of ["name", "description", "model", "maxTurns"]) {
    if (!fields.get(key) || fields.get(key).length === 0) {
      errors.push(`${filePath}: missing ${key}: in frontmatter`);
    }
  }
  if (!fields.has("tools") && !fields.has("disallowedTools")) {
    errors.push(
      `${filePath}: frontmatter must define tools: or disallowedTools:`,
    );
  }
  for (const key of unsupportedPluginAgentFields) {
    if (fields.has(key)) {
      errors.push(
        `${filePath}: ${key}: is not supported for plugin-shipped agents`,
      );
    }
  }

  const name = fields.get("name");
  if (typeof name === "string" && name !== "") {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) {
      errors.push(`${filePath}: agent name must use kebab-case`);
    }
    if (agentNames.has(name)) {
      errors.push(`${filePath}: duplicate agent name ${name}`);
    }
    agentNames.add(name);
    if (path.basename(filePath, ".md") !== name) {
      errors.push(`${filePath}: filename must match agent name ${name}`);
    }
  }

  const effort = fields.get("effort");
  if (typeof effort === "string" && !supportedAgentEfforts.has(effort)) {
    errors.push(
      `${filePath}: effort must be one of ${[...supportedAgentEfforts].join(", ")}`,
    );
  }
  if (fields.has("effort") && effortlessAgentModels.has(fields.get("model"))) {
    errors.push(
      `${filePath}: model ${fields.get("model")} does not accept effort:; narrow the task instead`,
    );
  }

  const maxTurns = Number(fields.get("maxTurns"));
  if (!Number.isInteger(maxTurns) || maxTurns <= 0) {
    errors.push(`${filePath}: maxTurns must be a positive integer`);
  }

  for (const field of ["tools", "disallowedTools"]) {
    if (fields.has(field) && frontmatterList(fields.get(field)).length === 0) {
      errors.push(`${filePath}: ${field}: must not be empty`);
    }
  }

  for (const skillReference of frontmatterList(fields.get("skills"))) {
    const [namespace, skillName] = skillReference.includes(":")
      ? skillReference.split(":", 2)
      : [null, skillReference];
    if (namespace && namespace !== pluginName) {
      errors.push(
        `${filePath}: referenced skill ${skillReference} belongs to another plugin`,
      );
      continue;
    }
    if (!skillNames.includes(skillName)) {
      errors.push(`${filePath}: missing referenced skill ${skillReference}`);
    }
  }
}

async function validateReferences(skillDir, skillText) {
  const refs = [...skillText.matchAll(/`(references\/[^`]+\.md)`/g)].map(
    (match) => match[1],
  );
  for (const ref of refs) {
    const refPath = path.join(skillDir, ref);
    if (!(await exists(refPath))) {
      errors.push(
        `${path.join(skillDir, "SKILL.md")}: missing referenced file ${ref}`,
      );
    }
  }
}

const executorDelegationContractPath =
  "skills/implementation-executor/references/review-and-parallelism.md";
const executorDelegationContract = {
  version: 3,
  primary_objective: "accepted-outcome-with-total-cost-awareness",
  delegate_when: "expected-context-savings-exceed-overhead",
  main_direct_when: "overhead-meets-or-exceeds-context-savings",
  risk_controls: "independent-review-and-verification",
  parallelize_when: "independent-workstreams",
  worker_unavailable: "reassess-context-benefit-and-scope",
};
const executorDelegationContractPattern =
  /<!-- executor-delegation-contract:start -->\s*```json\s*\n([\s\S]*?)\n```\s*<!-- executor-delegation-contract:end -->/;
async function validateExecutorDelegationPolicy(pluginRoot) {
  const contractFile = path.join(pluginRoot, executorDelegationContractPath);
  const match = (await readFile(contractFile, "utf8")).match(
    executorDelegationContractPattern,
  );
  if (!match) {
    errors.push(
      `${contractFile}: missing executor delegation contract markers`,
    );
  } else {
    try {
      const actual = JSON.stringify(
        Object.entries(JSON.parse(match[1])).sort(),
      );
      const expected = JSON.stringify(
        Object.entries(executorDelegationContract).sort(),
      );
      if (actual !== expected) {
        errors.push(
          `${contractFile}: executor delegation contract must contain exactly the stable keys and values`,
        );
      }
    } catch (error) {
      errors.push(
        `${contractFile}: invalid executor delegation contract JSON: ${error.message}`,
      );
    }
  }
}

async function validatePlugin(pluginName) {
  const pluginRoot = path.join(pluginsDir, pluginName);
  const codexManifestPath = path.join(
    pluginRoot,
    ".codex-plugin",
    "plugin.json",
  );
  const claudeManifestPath = path.join(
    pluginRoot,
    ".claude-plugin",
    "plugin.json",
  );
  const skillsDir = path.join(pluginRoot, "skills");
  const commandsDir = path.join(pluginRoot, "commands");
  const agentsDir = path.join(pluginRoot, "agents");
  const hooksDir = path.join(pluginRoot, "hooks");
  const hooksPath = path.join(hooksDir, "hooks.json");

  for (const filePath of [codexManifestPath, claudeManifestPath]) {
    if (!(await exists(filePath))) {
      errors.push(
        `${pluginName}: missing ${path.relative(pluginRoot, filePath)}`,
      );
      continue;
    }
    const manifest = validateJson(filePath, await readFile(filePath, "utf8"));
    if (!manifest) continue;
    for (const key of ["name", "version", "description", "skills"]) {
      if (!manifest[key]) errors.push(`${filePath}: missing ${key}`);
    }
  }

  const skillNames = (await readdir(skillsDir, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
  for (const skillName of skillNames) {
    const skillDir = path.join(skillsDir, skillName);
    const skillPath = path.join(skillDir, "SKILL.md");
    if (!(await exists(skillPath))) {
      errors.push(`${skillDir}: missing SKILL.md`);
      continue;
    }
    const skillText = await readFile(skillPath, "utf8");
    validateSkillFrontmatter(skillPath, skillText);
    await validateReferences(skillDir, skillText);
  }

  if (await exists(agentsDir)) {
    const agentNames = new Set();
    const agentFiles = (await readdir(agentsDir)).filter((name) =>
      name.endsWith(".md"),
    );
    for (const agentFile of agentFiles) {
      const agentPath = path.join(agentsDir, agentFile);
      validateAgentFrontmatter(
        pluginName,
        agentPath,
        await readFile(agentPath, "utf8"),
        skillNames,
        agentNames,
      );
    }
  }

  if (await exists(commandsDir)) {
    const commandFiles = (await readdir(commandsDir)).filter((name) =>
      name.endsWith(".md"),
    );
    for (const commandFile of commandFiles) {
      const commandPath = path.join(commandsDir, commandFile);
      const text = await readFile(commandPath, "utf8");
      validateMarkdownFrontmatter(commandPath, text, [
        "description",
        "argument-hint",
      ]);
      if (!text.includes("implementation-workflow")) {
        errors.push(
          `${commandFile}: command should mention implementation-workflow plugin namespace`,
        );
      }
    }
  }

  if (await exists(hooksPath)) {
    const hooksConfig = validateJson(
      hooksPath,
      await readFile(hooksPath, "utf8"),
    );
    if (!hooksConfig?.hooks || typeof hooksConfig.hooks !== "object") {
      errors.push(`${hooksPath}: missing hooks object`);
    } else {
      validateHookCommands(pluginRoot, hooksPath, hooksConfig.hooks);
    }
  }

  if (pluginName === "implementation-workflow") {
    await validateExecutorDelegationPolicy(pluginRoot);
  }
}

function validateHookCommands(pluginRoot, hooksPath, hooks) {
  for (const [eventName, entries] of Object.entries(hooks)) {
    if (!Array.isArray(entries)) {
      errors.push(`${hooksPath}: hooks.${eventName} must be an array`);
      continue;
    }
    for (const [entryIndex, entry] of entries.entries()) {
      if (!Array.isArray(entry?.hooks)) {
        errors.push(
          `${hooksPath}: hooks.${eventName}[${entryIndex}].hooks must be an array`,
        );
        continue;
      }
      for (const [hookIndex, hook] of entry.hooks.entries()) {
        if (hook?.type !== "command") continue;
        if (typeof hook.command !== "string" || hook.command.trim() === "") {
          errors.push(
            `${hooksPath}: hooks.${eventName}[${entryIndex}].hooks[${hookIndex}] missing command`,
          );
          continue;
        }
        for (const referencedPath of pluginRootCommandPaths(hook.command)) {
          const absolute = path.join(pluginRoot, referencedPath);
          if (!absolute.startsWith(`${pluginRoot}${path.sep}`)) {
            errors.push(
              `${hooksPath}: hook command path escapes plugin root: ${referencedPath}`,
            );
            continue;
          }
          if (!existsSyncSafe(absolute)) {
            errors.push(
              `${hooksPath}: hook command references missing file ${referencedPath}`,
            );
          }
        }
      }
    }
  }
}

function existsSyncSafe(filePath) {
  return existsSync(filePath);
}

function pluginRootCommandPaths(command) {
  const paths = [];
  const patterns = [
    /\$\{CLAUDE_PLUGIN_ROOT:-\$PLUGIN_ROOT\}\/([^"'\s]+)/g,
    /\$\{CLAUDE_PLUGIN_ROOT\}\/([^"'\s]+)/g,
    /\$\{PLUGIN_ROOT\}\/([^"'\s]+)/g,
  ];
  for (const pattern of patterns) {
    for (const match of command.matchAll(pattern)) {
      paths.push(match[1]);
    }
  }
  return paths;
}

async function validateMarketplace(filePath, pluginNames, label) {
  if (!(await exists(filePath))) {
    errors.push(`${filePath}: missing ${label} marketplace`);
    return;
  }

  const marketplace = validateJson(filePath, await readFile(filePath, "utf8"));
  if (!marketplace) return;
  if (typeof marketplace.name !== "string" || marketplace.name.trim() === "") {
    errors.push(`${filePath}: missing name`);
  }
  if (
    label === "Claude Code" &&
    (typeof marketplace.description !== "string" ||
      marketplace.description.trim() === "")
  ) {
    errors.push(`${filePath}: missing description`);
  }
  if (
    label === "Claude Code" &&
    (!marketplace.owner ||
      typeof marketplace.owner !== "object" ||
      typeof marketplace.owner.name !== "string" ||
      marketplace.owner.name.trim() === "")
  ) {
    errors.push(`${filePath}: missing owner.name`);
  }
  if (!Array.isArray(marketplace.plugins)) {
    errors.push(`${filePath}: plugins must be an array`);
    return;
  }

  const registered = new Set();
  for (const plugin of marketplace.plugins) {
    if (!plugin || typeof plugin !== "object") {
      errors.push(`${filePath}: plugin entries must be objects`);
      continue;
    }
    if (typeof plugin.name !== "string" || plugin.name.trim() === "") {
      errors.push(`${filePath}: plugin entry missing name`);
      continue;
    }
    if (typeof plugin.source !== "string" || plugin.source.trim() === "") {
      errors.push(`${filePath}: ${plugin.name} missing source`);
      continue;
    }
    registered.add(plugin.name);
    const pluginRoot = path.resolve(root, plugin.source);
    const codexManifest = path.join(pluginRoot, ".codex-plugin", "plugin.json");
    if (!(await exists(codexManifest))) {
      errors.push(
        `${filePath}: ${plugin.name} path does not resolve to a Codex plugin`,
      );
    }
  }

  for (const pluginName of pluginNames) {
    if (!registered.has(pluginName)) {
      errors.push(`${filePath}: missing plugin ${pluginName}`);
    }
  }
}

const pluginNames = (await readdir(pluginsDir, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);
await validateMarketplace(codexMarketplacePath, pluginNames, "Codex");
await validateMarketplace(claudeMarketplacePath, pluginNames, "Claude Code");
for (const pluginName of pluginNames) {
  await validatePlugin(pluginName);
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Validated ${pluginNames.length} plugin(s).`);
