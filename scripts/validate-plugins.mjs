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
