import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const scriptsDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../.claude/skills/repo-patrol/scripts",
);

function tempDir(t) {
  const dir = mkdtempSync(path.join(os.tmpdir(), "repo-patrol-scripts-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

function runScript(name, args, options = {}) {
  return spawnSync("bash", [path.join(scriptsDir, name), ...args], {
    encoding: "utf8",
    ...options,
    env: { PATH: process.env.PATH, ...options.env },
  });
}

test("shell scripts brace variables that are followed by non-ASCII text", () => {
  // macOS の bash 3.2 は UTF-8 ロケールで「$name。」の全角文字まで変数名として読む
  for (const name of readdirSync(scriptsDir).filter((file) =>
    file.endsWith(".sh"),
  )) {
    const source = readFileSync(path.join(scriptsDir, name), "utf8");
    assert.doesNotMatch(source, /\$[A-Za-z_]\w*\P{ASCII}/u, name);
  }
});

// 設定ファイルを置いた git リポジトリを作る。slack-post.sh は宛先をここから読む。
function slackRepo(t, config) {
  const dir = tempDir(t);
  execFileSync("git", ["init", "-q"], { cwd: dir });
  mkdirSync(path.join(dir, ".claude"));
  writeFileSync(path.join(dir, ".claude", "repo-patrol.md"), config);
  const body = path.join(dir, "body.txt");
  return {
    body,
    post: (text, env = {}) => {
      writeFileSync(body, text);
      return runScript("slack-post.sh", [body], {
        cwd: dir,
        env: { LANG: "ja_JP.UTF-8", ...env },
      });
    },
  };
}

const SLACK_CONFIG =
  "# repo-patrol の設定\n\n## リポジトリ\n\no/r\n\n## Slack チャンネル\n\n`C0123ABCD`\n\n## 検証\n\nなし\n";

test("slack-post escapes Slack markup and mentions the channel only at the start", (t) => {
  const repo = slackRepo(t, SLACK_CONFIG);
  const preview = repo.post(
    "{{mention}} 巡回: <!channel> <https://evil.example|click> & <@U999999> {{mention}}\n",
  );
  assert.equal(preview.status, 0, preview.stderr);
  assert.match(preview.stdout, /宛先: C0123ABCD/);
  assert.match(preview.stdout, /^<!channel> 巡回:/m);
  assert.match(preview.stdout, /&lt;!channel&gt;/);
  assert.match(preview.stdout, /&lt;https:\/\/evil\.example\|click&gt;/);
  assert.match(preview.stdout, /&amp; &lt;@U999999&gt; \{\{mention\}\}/);

  const notLeading = repo.post("app の巡回: タイトル {{mention}}\n");
  assert.doesNotMatch(notLeading.stdout, /<!channel>/);
});

test("slack-post accepts a channel name as the destination", (t) => {
  const repo = slackRepo(t, "## Slack チャンネル\n\n`#engineer`\n");
  const preview = repo.post("{{mention}} x\n");
  assert.equal(preview.status, 0, preview.stderr);
  assert.match(preview.stdout, /宛先: #engineer/);
});

test("slack-post refuses to post without a channel in the config", (t) => {
  for (const config of [
    "## リポジトリ\n\no/r\n",
    "## Slack チャンネル\n\ngeneral\n",
    "## Slack チャンネル\n\n#General Room\n",
    "## Slack チャンネル\n\n\n## 検証\n\nC0123ABCD\n",
  ]) {
    const repo = slackRepo(t, config);
    const result = repo.post("{{mention}} x\n", { REPO_PATROL: "1" });
    assert.equal(result.status, 1, config);
    assert.match(result.stderr, /Slack チャンネル/);
  }
});

const BASE_PACKAGE = {
  name: "app",
  scripts: { check: "biome check ." },
  dependencies: { a: "^1.2.0", "@org/internal": "workspace:*" },
  devDependencies: { b: "1.0.0", c: "npm:realc@1.0.0" },
  pnpm: { overrides: { "x>y": "^2.0.0" } },
};
const BASE_LOCK = [
  "lockfileVersion: '9.0'",
  "",
  "importers:",
  "",
  "  .:",
  "    dependencies:",
  "      a:",
  "        specifier: ^1.2.0",
  "        version: 1.2.0",
  "    devDependencies:",
  "      c:",
  "        specifier: npm:realc@1.0.0",
  "        version: realc@1.0.0",
  "",
  "packages:",
  "",
  "  a@1.2.0:",
  "    resolution: {integrity: sha512-a-old}",
  "",
  "  realc@1.0.0:",
  "    resolution: {integrity: sha512-c-old}",
  "",
  "  d@1.0.0:",
  "    resolution: {integrity: sha512-d}",
  "",
  "snapshots:",
  "",
  "  a@1.2.0: {}",
  "",
  "  d@1.0.0: {}",
  "",
].join("\n");

// a を 1.3.0 に上げ、新しい推移依存（url という名前のパッケージ）と peer の範囲が増えた lockfile。
const BUMPED_LOCK = [
  "lockfileVersion: '9.0'",
  "",
  "importers:",
  "",
  "  .:",
  "    dependencies:",
  "      a:",
  "        specifier: ^1.3.0",
  "        version: 1.3.0(react@19.2.8)",
  "    devDependencies:",
  "      c:",
  "        specifier: npm:realc@1.1.0",
  "        version: realc@1.1.0",
  "",
  "packages:",
  "",
  "  realc@1.1.0:",
  "    resolution: {integrity: sha512-c-new}",
  "",
  "  a@1.3.0:",
  "    resolution: {integrity: sha512-a-new}",
  "    engines: {node: '>=18'}",
  "    peerDependencies:",
  "      react: '>=16.8.0 || ^19'",
  "    deprecated: Use b instead. See https://example.com/a",
  "",
  "  '@scope/url@0.11.4':",
  "    resolution: {integrity: sha512-u}",
  "    cpu: [x64]",
  "",
  "  d@1.0.0:",
  "    resolution: {integrity: sha512-d}",
  "",
  "snapshots:",
  "",
  "  a@1.3.0(react@19.2.8):",
  "    dependencies:",
  "      url: 0.11.4",
  "    transitivePeerDependencies:",
  "      - supports-color",
  "",
  "  '@scope/url@0.11.4': {}",
  "",
  "  d@1.0.0: {}",
  "",
].join("\n");

function createRepo(t) {
  const dir = tempDir(t);
  const git = (...args) =>
    execFileSync("git", args, { cwd: dir, encoding: "utf8" });
  git("init", "-q", "-b", "main");
  git("config", "user.email", "test@example.com");
  git("config", "user.name", "test");
  writeFileSync(
    path.join(dir, "package.json"),
    JSON.stringify(BASE_PACKAGE, null, 2),
  );
  writeFileSync(path.join(dir, "pnpm-lock.yaml"), BASE_LOCK);
  mkdirSync(path.join(dir, "src"));
  writeFileSync(path.join(dir, "src", "a.ts"), "export {};\n");
  git("add", "-A");
  git("commit", "-q", "-m", "base");
  git("checkout", "-q", "-b", "claude/patrol-deps");
  return {
    dir,
    writePackage: (changes) =>
      writeFileSync(
        path.join(dir, "package.json"),
        JSON.stringify({ ...BASE_PACKAGE, ...changes }, null, 2),
      ),
    writeLock: (text) => writeFileSync(path.join(dir, "pnpm-lock.yaml"), text),
    check: (...patterns) =>
      spawnSync(
        process.execPath,
        [path.join(scriptsDir, "check-diff.mjs"), "main", ...patterns],
        { cwd: dir, encoding: "utf8" },
      ),
  };
}

test("check-diff accepts version bumps of existing dependencies", (t) => {
  const repo = createRepo(t);
  assert.equal(repo.check().status, 3);

  repo.writePackage({
    dependencies: { a: "^1.3.0", "@org/internal": "workspace:*" },
    devDependencies: { b: "1.0.1", c: "npm:realc@1.1.0" },
    pnpm: { overrides: { "x>y": "^2.0.1" } },
  });
  repo.writeLock(BUMPED_LOCK);
  const result = repo.check();
  assert.equal(result.status, 0, result.stdout);
});

// packages: の末尾（snapshots: の前）にパッケージの行を差し込む。
const withPackage = (lines) =>
  BASE_LOCK.replace("snapshots:", `${lines}\n\nsnapshots:`);

test("check-diff --head checks the commit that will be pushed", (t) => {
  const repo = createRepo(t);
  const git = (...args) =>
    execFileSync("git", args, { cwd: repo.dir, encoding: "utf8" });
  repo.writePackage({
    scripts: { ...BASE_PACKAGE.scripts, postinstall: "node x.js" },
    dependencies: { ...BASE_PACKAGE.dependencies, a: "^1.3.0" },
  });
  git("commit", "-q", "-am", "scripts");
  repo.writePackage({
    dependencies: { ...BASE_PACKAGE.dependencies, a: "^1.3.0" },
  });
  assert.equal(repo.check().status, 0);
  const head = repo.check("--head");
  assert.equal(head.status, 1, head.stdout);
  assert.match(head.stdout, /版の値以外/);
});

test("check-diff allows dropping the range symbol only in the working tree", (t) => {
  const repo = createRepo(t);
  const git = (...args) =>
    execFileSync("git", args, { cwd: repo.dir, encoding: "utf8" });
  repo.writePackage({
    dependencies: { ...BASE_PACKAGE.dependencies, a: "1.3.0" },
  });
  const worktree = repo.check();
  assert.equal(worktree.status, 0, worktree.stdout);

  git("commit", "-q", "-am", "exact");
  const head = repo.check("--head");
  assert.equal(head.status, 1, head.stdout);
  assert.match(head.stdout, /範囲の記号が変わる/);

  repo.writePackage({
    dependencies: { ...BASE_PACKAGE.dependencies, a: "~1.3.0" },
  });
  const swapped = repo.check();
  assert.equal(swapped.status, 1, swapped.stdout);
  assert.match(swapped.stdout, /範囲の記号が変わる/);
});

test("check-diff rejects changes beyond dependency versions", (t) => {
  const deps = BASE_PACKAGE.dependencies;
  const devDeps = BASE_PACKAGE.devDependencies;
  const cases = [
    [
      "a new script",
      (repo) =>
        repo.writePackage({
          scripts: { ...BASE_PACKAGE.scripts, postinstall: "node x.js" },
        }),
    ],
    [
      "a downgrade",
      (repo) =>
        repo.writePackage({ devDependencies: { ...devDeps, b: "0.9.0" } }),
    ],
    [
      "a new dependency",
      (repo) => repo.writePackage({ dependencies: { ...deps, e: "^1.0.0" } }),
    ],
    [
      "a git dependency",
      (repo) =>
        repo.writePackage({ dependencies: { ...deps, a: "github:evil/a" } }),
    ],
    [
      "a package swapped by alias",
      (repo) =>
        repo.writePackage({ dependencies: { ...deps, a: "npm:evil-a@9.9.9" } }),
    ],
    [
      "an alias target swap",
      (repo) =>
        repo.writePackage({
          devDependencies: { ...devDeps, c: "npm:evilc@2.0.0" },
        }),
    ],
    [
      "a workspace package replaced by a registry version",
      (repo) =>
        repo.writePackage({
          dependencies: { ...deps, "@org/internal": "^1.0.0" },
        }),
    ],
    [
      "a wider range",
      (repo) => repo.writePackage({ dependencies: { ...deps, a: ">=1.2.0" } }),
    ],
    [
      "a new override",
      (repo) =>
        repo.writePackage({
          pnpm: { overrides: { "x>y": "^2.0.0", lodash: "npm:evil@1.0.0" } },
        }),
    ],
    [
      "a removed override",
      (repo) => repo.writePackage({ pnpm: { overrides: {} } }),
    ],
    [
      "a prerelease",
      (repo) =>
        repo.writePackage({ dependencies: { ...deps, a: "^1.2.0-rc.1" } }),
    ],
    [
      "a tarball resolution",
      (repo) =>
        repo.writeLock(
          withPackage(
            "  e@1.0.0:\n    resolution: {tarball: https://evil.example/e.tgz}",
          ),
        ),
    ],
    [
      "a git resolution",
      (repo) =>
        repo.writeLock(
          withPackage(
            "  e@1.0.0:\n    resolution: {commit: abc, repo: https://git.evil.example/x.git, type: git}",
          ),
        ),
    ],
    [
      "a directory resolution",
      (repo) =>
        repo.writeLock(
          withPackage(
            "  e@1.0.0:\n    resolution: {directory: ../evil, type: directory}",
          ),
        ),
    ],
    [
      "a deeper indented tarball resolution",
      (repo) =>
        repo.writeLock(
          withPackage(
            "  e@1.0.0:\n      resolution: {tarball: https://evil.example/e.tgz}",
          ),
        ),
    ],
    [
      "a block style resolution",
      (repo) =>
        repo.writeLock(
          withPackage(
            "  e@1.0.0:\n    resolution:\n      tarball: https://evil.example/e.tgz",
          ),
        ),
    ],
    [
      "a package without resolution",
      (repo) =>
        repo.writeLock(withPackage("  e@1.0.0:\n    engines: {node: '>=18'}")),
    ],
    [
      "a flow style packages section",
      (repo) =>
        repo.writeLock(
          BASE_LOCK.replace(
            /packages:[\s\S]*?snapshots:/,
            "packages: {a@1.2.0: {resolution: {integrity: sha512-a-old}}, e@1.0.0: {resolution: {tarball: 'https://evil.example/e.tgz'}}}\n\nsnapshots:",
          ),
        ),
    ],
    [
      "a YAML anchor",
      (repo) =>
        repo.writeLock(
          withPackage(
            "  e@1.0.0:\n    resolution: {integrity: sha512-e}\n    dependencies: &x\n      a: 1.2.0",
          ),
        ),
    ],
    [
      "an importer version swapped to another package",
      (repo) =>
        repo.writeLock(
          withPackage(
            "  evil-a@9.9.9:\n    resolution: {integrity: sha512-evil}",
          ).replace("        version: 1.2.0", "        version: evil-a@9.9.9"),
        ),
    ],
    [
      "a new alias in snapshots",
      (repo) =>
        repo.writeLock(
          BASE_LOCK.replace(
            "  d@1.0.0: {}",
            "  d@1.0.0:\n    dependencies:\n      url: evil@1.0.0",
          ),
        ),
    ],
    [
      "an uppercase link",
      (repo) =>
        repo.writeLock(
          BASE_LOCK.replace("version: 1.2.0", "version: Link:../evil"),
        ),
    ],
    [
      "a workspace link to an outside directory",
      (repo) =>
        repo.writeLock(
          BASE_LOCK.replace(
            "version: 1.2.0",
            "version: link:/tmp/repo-patrol/evil",
          ),
        ),
    ],
    [
      "a changed integrity for the same version",
      (repo) => repo.writeLock(BASE_LOCK.replace("sha512-d}", "sha512-evil}")),
    ],
    [
      "source code",
      (repo) =>
        writeFileSync(
          path.join(repo.dir, "src", "a.ts"),
          "export const a = 1;\n",
        ),
    ],
    [
      "another file",
      (repo) =>
        writeFileSync(
          path.join(repo.dir, "pnpm-workspace.yaml"),
          "packages: []\n",
        ),
    ],
    [
      "a yarn lockfile",
      (repo) => writeFileSync(path.join(repo.dir, "yarn.lock"), "# yarn\n"),
    ],
  ];
  for (const [label, change] of cases) {
    const repo = createRepo(t);
    change(repo);
    const result = repo.check();
    assert.equal(result.status, 1, `${label}\n${result.stdout}`);
  }
});

test("check-diff accepts extra paths only when configured", (t) => {
  const repo = createRepo(t);
  writeFileSync(path.join(repo.dir, "biome.json"), "{}\n");
  assert.equal(repo.check().status, 1);
  assert.equal(repo.check("biome.json").status, 0);
  assert.equal(repo.check("apps/*/biome.json").status, 1);
});

// 呼び出しを記録し、決めた応答を返す偽の gh。
function fakeGh(t, { issues, failIssues = false }) {
  const dir = tempDir(t);
  const log = path.join(dir, "calls.log");
  const issuesFile = path.join(dir, "issues.json");
  writeFileSync(issuesFile, JSON.stringify(issues));
  writeFileSync(
    path.join(dir, "gh"),
    `#!/usr/bin/env bash
echo "$*" >> "${log}"
case "$*" in
  *"issues?state=open"*)
    ${failIssues ? 'echo "HTTP 502" >&2; exit 1' : `cat "${issuesFile}"`} ;;
  *"labels/patrol-closed"*) echo '{}' ;;
  *"-X "*) echo '{}' ;;
  *) echo '[]' ;;
esac
`,
  );
  chmodSync(path.join(dir, "gh"), 0o755);
  return {
    env: { PATH: `${dir}:${process.env.PATH}` },
    calls: () =>
      readFileSync(log, "utf8")
        .trim()
        .split("\n")
        .filter((line) => line.startsWith("api -X")),
  };
}

const oldIssue = (number) => ({
  number,
  title: `古い Issue ${number}`,
  user: { login: "someone" },
  labels: [],
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
  body: "",
});

test("stale.sh close fails when the issues cannot be fetched", (t) => {
  const gh = fakeGh(t, { issues: [], failIssues: true });
  const close = runScript("stale.sh", ["o/r", "close"], { env: gh.env });
  assert.equal(close.status, 1, close.stdout);
  const list = runScript("stale.sh", ["o/r", "list"], { env: gh.env });
  assert.notEqual(list.status, 0);
});

test("stale.sh close closes first, caps at 10 a day and keeps the order", (t) => {
  const issues = Array.from({ length: 12 }, (_, i) => oldIssue(i + 1));
  issues.push({ ...oldIssue(99), labels: [{ name: "keep" }] });
  const gh = fakeGh(t, { issues });
  const result = runScript("stale.sh", ["o/r", "close", "--max", "20"], {
    env: gh.env,
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(
    result.stdout,
    /summary\tclosed=10\tclosed_partial=0\tfailed=0\tremaining=2/,
  );
  assert.doesNotMatch(result.stdout, /\t99\t/);

  const calls = gh.calls();
  assert.equal(calls.length, 30);
  assert.match(
    calls[0],
    /^api -X PATCH repos\/o\/r\/issues\/1 -f state=closed -f state_reason=not_planned$/,
  );
  assert.match(calls[1], /^api -X POST repos\/o\/r\/issues\/1\/labels/);
  assert.match(calls[2], /^api -X POST repos\/o\/r\/issues\/1\/comments/);
});
