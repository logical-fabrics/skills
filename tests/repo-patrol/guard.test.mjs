import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  evaluate,
  hasMention,
  parseShell,
  readConfig,
} from "../../.claude/skills/repo-patrol/guard.mjs";

const guardScript = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../.claude/skills/repo-patrol/guard.mjs",
);

const CONFIG = `# repo-patrol の設定

## リポジトリ

o/r

## CI で待つワークフロー

testing

## 差分に含めてよい追加のパス

- \`biome.json\`
`;

const OWN_SCRIPTS = [
  "repo-patrol/scripts/stale.sh",
  "repo-patrol/scripts/wait-checks.sh",
  "repo-patrol/scripts/check-diff.mjs",
  "repo-patrol/scripts/slack-post.sh",
  "repo-patrol/scripts/session-url.sh",
  "repo-patrol/scripts/audit-summary.mjs",
  "dependabot-weekly/scripts/pkgdiff.mjs",
];

const patrolPull = () => ({
  headRef: "claude/patrol-deps",
  headRepo: "o/r",
  baseRepo: "o/r",
});

// 一時ディレクトリにリポジトリの形（スキルのスクリプト・設定・依存ファイル）を作る。
function createFixture(t) {
  const root = mkdtempSync(path.join(os.tmpdir(), "repo-patrol-guard-"));
  mkdirSync("/tmp/repo-patrol", { recursive: true });
  const tmp = mkdtempSync("/tmp/repo-patrol/test-");
  t.after(() => {
    rmSync(root, { recursive: true, force: true });
    rmSync(tmp, { recursive: true, force: true });
  });
  for (const script of OWN_SCRIPTS) {
    const file = path.join(root, ".claude", "skills", script);
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, "");
  }
  for (const dir of [
    "functions",
    "apps/web",
    "docs",
    "node_modules/x",
    ".github",
  ]) {
    mkdirSync(path.join(root, dir), { recursive: true });
  }
  symlinkSync(path.join(root, ".claude"), path.join(root, "link"));
  writeFileSync(path.join(root, ".claude", "repo-patrol.md"), CONFIG);

  const base = {
    cwd: root,
    root,
    fetchPull: patrolPull,
    checkDiff: () => null,
    defaultBranch: () => "origin/develop",
    isTracked: (relative) =>
      !relative.startsWith("node_modules/") && relative !== "docs/package.json",
  };
  const run = (command, overrides = {}) =>
    evaluate(
      { tool_name: "Bash", tool_input: { command } },
      { ...base, ...overrides },
    );
  return {
    root,
    tmp,
    run,
    tool: (tool_name, tool_input) => evaluate({ tool_name, tool_input }, base),
    writeJson(name, data) {
      const file = path.join(tmp, name);
      writeFileSync(file, JSON.stringify(data));
      return file;
    },
    assertBlocked(commands, overrides) {
      for (const command of commands) {
        assert.equal(run(command, overrides).allow, false, command);
      }
    },
    assertAllowed(commands, overrides) {
      for (const command of commands) {
        const result = run(command, overrides);
        assert.equal(result.allow, true, `${command} → ${result.reason}`);
      }
    },
  };
}

test("parseShell reads words, quotes, operators and redirects", () => {
  assert.deepEqual(
    parseShell(`a 'b $c' "d e" && f | g; h 2>&1 > /tmp/x # note`).commands,
    [
      { words: ["a", "b $c", "d e"], redirects: [], next: "&&" },
      { words: ["f"], redirects: [], next: "|" },
      { words: ["g"], redirects: [], next: ";" },
      {
        words: ["h"],
        redirects: [
          { op: "2>&", target: "1" },
          { op: ">", target: "/tmp/x" },
        ],
        next: null,
      },
    ],
  );
  for (const command of [
    "echo $HOME",
    "echo `id`",
    'echo "$(id)"',
    "echo a\\\nb",
    "ls *.json",
    "echo {a,b}",
    "(cd x)",
    "cat < x",
    "sleep 1 &",
    "echo ~/x",
    "echo 'unclosed",
  ]) {
    assert.ok(parseShell(command).error, command);
  }
});

test("readConfig reads the repository and extra paths", (t) => {
  const { root } = createFixture(t);
  assert.deepEqual(readConfig(root), { repo: "o/r", extras: ["biome.json"] });
  assert.equal(readConfig(path.join(root, "missing")), null);
});

test("shell features and unlisted commands are blocked", (t) => {
  createFixture(t).assertBlocked([
    "env -u FOO bash -c 'id'",
    "timeout -s KILL 10 bash -c id",
    "timeout --signal=KILL 10 node -e 1",
    "nice -n 5 bash -c id",
    "command -p bash -c id",
    "time -p bash -c id",
    "builtin eval id",
    "if true; then bash -c id; fi",
    "{ bash -c id; }",
    "! bash -c id",
    "while true; do node -e 1; done",
    "/usr/bin/env bash -c id",
    "/usr/bin/../../tmp/evil.sh",
    "python3.12 -c 1",
    "fish -c id",
    "busybox sh -c id",
    "awk 'BEGIN{system(\"id\")}'",
    "make",
    "ssh host",
    "nc host 1",
    "tar --to-command=id -xf x.tar",
    "vim -c ':!id'",
    "curl https://example.com",
    "eval id",
    "xargs -n1 echo",
    "find . -delete",
    "sed -n 1p package.json",
    "sort -uo .claude/settings.json /tmp/repo-patrol/x",
    "sort -S 1k --compress-program=sh /tmp/repo-patrol/x",
    "HOME=/tmp/h git fetch origin",
    "PATH=/tmp/bin gh api repos/o/r",
    "git pu\\\nsh origin HEAD:main",
    // biome-ignore lint/suspicious/noTemplateCurlyInString: シェルの変数展開をそのまま guard に渡す
    "p=pu; git ${p}sh origin HEAD:main",
    "g=git; $g push origin HEAD:main",
    "git $'pu\\x73h' origin HEAD:main",
    "g=gh; $g api -X PUT repos/o/r/pulls/1/merge",
    "d=.claude; echo x > $d/settings.json",
    "echo x > .cl*/settings.json",
    "ln -s .claude /tmp/c",
    "cd .claude",
    "sed --in-place 's/a/b/' .claude/settings.json",
    "sleep 1 &",
    "cat < /etc/passwd",
  ]);
});

test("reads stay inside the repository and the work directory", (t) => {
  const fixture = createFixture(t);
  fixture.assertBlocked([
    "cat /etc/hosts",
    "jq . /etc/hosts",
    "grep -r token /",
    "head -1 ../../../../../../etc/hosts",
    "cat /tmp/repo-patrol/../../etc/hosts",
    "bash .claude/skills/repo-patrol/scripts/slack-post.sh /etc/hosts",
    "bash .claude/skills/repo-patrol/scripts/slack-post.sh .claude/repo-patrol.md",
    "jq -n env",
    "jq -n '$ENV'",
    "git diff --no-index /etc/hosts /dev/null",
    "git diff /etc/hosts",
    "date -f/etc/hosts",
    "date --file=/etc/hosts",
    "grep --file=/etc/hosts package.json",
    "diff --from-file=/etc/hosts package.json",
    "cd functions | cat ../../../../../../../etc/hosts",
  ]);
  fixture.assertAllowed([
    "cat .claude/repo-patrol.md",
    "jq . /tmp/repo-patrol/x.json",
    "grep -r react package.json",
    "bash .claude/skills/repo-patrol/scripts/slack-post.sh /tmp/repo-patrol/slack.txt",
  ]);
});

test("only committed skill scripts run, without interpreter options", (t) => {
  const fixture = createFixture(t);
  fixture.assertBlocked([
    "bash /tmp/x.sh",
    "node /tmp/x.mjs",
    "bash -c 'echo hi'",
    "sh -s",
    "node --require=/tmp/x.js .claude/skills/repo-patrol/scripts/check-diff.mjs o",
    "node --import=data:text/javascript,1 .claude/skills/repo-patrol/scripts/check-diff.mjs",
    "node --eval=1 .claude/skills/repo-patrol/scripts/check-diff.mjs",
    "echo id | bash -s -- .claude/skills/repo-patrol/scripts/stale.sh",
    "bash /tmp/x/.claude/skills/y/scripts/z.sh",
    "bash .claude/skills/../scripts/z.sh",
    "./x.sh",
    "bash .claude/skills/repo-patrol/scripts/stale.sh other/repo list",
    ".claude/skills/repo-patrol/scripts/wait-checks.sh other/repo 1 -",
    "node .claude/skills/repo-patrol/scripts/audit-summary.mjs /etc/passwd",
  ]);
  const audit = fixture.writeJson("audit.json", { advisories: {} });
  fixture.assertAllowed([
    `node .claude/skills/repo-patrol/scripts/audit-summary.mjs ${audit}`,
    "bash .claude/skills/repo-patrol/scripts/stale.sh o/r list",
    "bash .claude/skills/repo-patrol/scripts/stale.sh O/R close",
    ".claude/skills/repo-patrol/scripts/wait-checks.sh o/r 12 testing",
    "node .claude/skills/repo-patrol/scripts/check-diff.mjs origin/develop biome.json",
    "node .claude/skills/dependabot-weekly/scripts/pkgdiff.mjs origin/develop:pnpm-lock.yaml pnpm-lock.yaml",
    `bash ${fixture.root}/.claude/skills/repo-patrol/scripts/session-url.sh`,
    "cd functions && bash ../.claude/skills/repo-patrol/scripts/session-url.sh",
  ]);
});

test("git allows only the patrol workflow", (t) => {
  const fixture = createFixture(t);
  fixture.assertBlocked([
    "git push origin HEAD:develop",
    "git -C . push origin HEAD:develop",
    "git 'push' origin develop",
    'bash -c "git push origin HEAD:main"',
    "git push origin +HEAD:develop",
    "git push origin claude/patrol-x:develop",
    "git push origin HEAD:refs/heads/claude/patrol-deps HEAD:main",
    "git push",
    "git push --dry-run origin HEAD:refs/heads/develop",
    "/usr/bin/git push origin HEAD:main",
    "git -c core.sshCommand='sh /tmp/x.sh' fetch origin",
    "git -c alias.x='!id' x",
    "git -c core.pager='sh -c id' log",
    "git -c core.hooksPath=/tmp/h commit -m x",
    "git --exec-path=/tmp/x status",
    "git fetch --upload-pack=id origin",
    "git fetch https://evil.example/x.git",
    "git apply /tmp/p.patch",
    "git checkout origin/other",
    "git checkout -B claude/patrol-deps origin/evil-branch",
    "git checkout HEAD~1 -- .claude/settings.json",
    "git merge origin/x",
    "git reset --hard origin/x",
    "git am /tmp/x.patch",
    "git cherry-pick abc",
    "git clone https://example.com/x.git",
    "git worktree add /tmp/w",
    "git remote add evil https://example.com/x.git",
    "git remote set-url origin https://example.com/x.git",
    "git log --output=/tmp/x",
    "git config core.hooksPath /tmp/hooks",
    "git config alias.p push",
    "git commit -m x",
    "git commit -F /tmp/msg.txt",
    "git add .github/workflows/ci.yml",
    "git add --force x",
  ]);
  fixture.assertAllowed([
    "git push origin HEAD:refs/heads/claude/patrol-deps",
    "git push -u origin HEAD:refs/heads/claude/patrol-deps",
    "git push --force-with-lease origin HEAD:refs/heads/claude/patrol-deps",
    "git fetch origin",
    "git fetch -q origin develop",
    "git remote set-head origin -a",
    "git rev-parse --abbrev-ref origin/HEAD",
    "git checkout -B claude/patrol-deps origin/develop",
    "git add -A",
    "git add package.json pnpm-lock.yaml",
    "git commit -F /tmp/repo-patrol/commit.txt",
    "git status --porcelain",
    "git diff --name-only origin/develop -- .github/",
    "git log --oneline -5 | head -3",
    "git show origin/develop:package.json",
    "git config user.email bot@example.com",
    "git config --get remote.origin.url",
  ]);
  fixture.assertBlocked(["git checkout -B claude/patrol-deps origin/develop"], {
    defaultBranch: () => null,
  });
  // push は HEAD を、install と run は作業ツリーを check-diff で確かめる
  const headOnly = (mode) =>
    mode === "head" ? "src/a.ts: 依存ファイルではない" : null;
  fixture.assertBlocked(
    ["git push origin HEAD:refs/heads/claude/patrol-deps"],
    {
      checkDiff: headOnly,
    },
  );
  fixture.assertAllowed(["pnpm install --frozen-lockfile"], {
    checkDiff: headOnly,
  });
});

test("gh api allows reads of the configured repository and listed writes", (t) => {
  const fixture = createFixture(t);
  const prCreate = fixture.writeJson("pr.json", {
    title: "chore(deps): 依存更新",
    body: '`@sentry/react-native` を 7.11.1 に。react@19.2.8 と bot@example.com は対象外\n<!-- repo-patrol: {"deps": ["@sentry/react-native@7.11.1"]} -->',
    head: "claude/patrol-deps",
    base: "develop",
  });
  const prWrongHead = fixture.writeJson("pr-wrong.json", {
    title: "x",
    head: "develop",
    base: "main",
  });
  const prEdit = fixture.writeJson("pr-edit.json", { title: "x", body: "y" });
  const prClose = fixture.writeJson("pr-close.json", { state: "closed" });
  const comment = fixture.writeJson("comment.json", { body: "見送ります" });
  const dependabot = fixture.writeJson("ignore.json", {
    body: "@dependabot ignore this major version",
  });
  const dependabotInCode = fixture.writeJson("ignore-code.json", {
    body: "`@dependabot ignore this major version`",
  });
  const team = fixture.writeJson("team.json", {
    body: "@org/team 確認お願いします",
  });
  const outside = path.join(os.tmpdir(), "repo-patrol-outside.json");
  writeFileSync(outside, JSON.stringify({ body: "x" }));
  t.after(() => rmSync(outside, { force: true }));

  fixture.assertAllowed([
    "gh api user --jq .login",
    "gh api 'repos/o/r/pulls?state=open&per_page=100' --paginate --jq '.[] | .number'",
    "gh api repos/O/R/pulls",
    "gh api repos/o/r/pulls/1 -H 'Accept: application/vnd.github.diff'",
    "gh api -X GET repos/o/r/dependabot/alerts",
    "gh api repos/o/r/pulls 2>&1 | head -5",
    `gh api -X POST repos/o/r/pulls --input ${prCreate}`,
    `gh api -X POST repos/o/r/pulls --input ${prCreate} --jq .html_url`,
    `gh api -X PATCH repos/o/r/pulls/12 --input ${prEdit}`,
    `gh api -X POST repos/o/r/issues/12/comments --input ${comment}`,
  ]);
  fixture.assertBlocked([
    "gh api repos/other/repo/pulls",
    "gh api orgs/o/members",
    "gh api repos/o/r/../../../orgs/x",
    "gh api repos/o/r/%2e%2e/x",
    'gh api -X PUT "repos/o/r/pulls/1/merge"',
    "gh api -XPUT repos/o/r/pulls/1/merge",
    "gh api -iX PUT repos/o/r/pulls/1/merge",
    "gh api --method=PUT repos/o/r/pulls/1/merge",
    "gh api --method PUT repos/o/r/contents/a -f branch=develop",
    "gh api -X PATCH repos/o/r/git/refs/heads/develop -F force=true",
    "gh api repos/o/r/git/refs -f ref=refs/heads/x -f sha=abc",
    "gh api -X PATCH repos/o/r/issues/1 -f state=closed",
    "gh api repos/o/r/issues/1/labels -f labels[]=keep",
    "gh api -X POST repos/o/r/actions/workflows/deploy.yaml/dispatches -f ref=main",
    "gh api -X PATCH repos/o/r/dependabot/alerts/3 -f state=dismissed",
    "gh api graphql -f query=x",
    "gh pr merge 1",
    "gh pr list",
    "gh workflow run deploy.yaml",
    "gh run rerun 123",
    "gh auth status",
    `gh api -X POST repos/o/r/pulls --input ${prWrongHead}`,
    `gh api -X PATCH repos/o/r/pulls/12 --input ${prClose}`,
    `gh api -X POST repos/o/r/issues/12/comments --input ${dependabot}`,
    `gh api -X POST repos/o/r/issues/12/comments --input ${dependabotInCode}`,
    `gh api -X POST repos/o/r/issues/12/comments --input ${team}`,
    `gh api -X POST repos/o/r/issues/12/comments --input ${outside}`,
    `gh api -X POST repos/other/repo/issues/12/comments --input ${comment}`,
    `gh api -X PUT repos/o/r/pulls/12/merge --input ${comment}`,
    `gh api -X POST repos/o/r/issues/12/comments --input ${comment}; gh api -X PUT repos/o/r/pulls/1/merge`,
  ]);
  const humanPull = () => ({
    headRef: "feature/x",
    headRepo: "o/r",
    baseRepo: "o/r",
  });
  const forkPull = () => ({
    headRef: "claude/patrol-deps",
    headRepo: "someone/r",
    baseRepo: "o/r",
  });
  const edit = `gh api -X PATCH repos/o/r/pulls/12 --input ${prEdit}`;
  fixture.assertBlocked([edit], { fetchPull: humanPull });
  fixture.assertBlocked([edit], { fetchPull: forkPull });
  fixture.assertBlocked([edit], { fetchPull: () => null });
});

test("package managers allow only the patrol forms", (t) => {
  const fixture = createFixture(t);
  const gated = [
    "pnpm install --lockfile-only --ignore-scripts",
    "pnpm install --frozen-lockfile",
    "pnpm install --frozen-lockfile --ignore-scripts",
    "pnpm run check",
    "pnpm --filter mobile run typecheck",
    "pnpm update undici --no-save --lockfile-only --ignore-scripts",
    "pnpm --dir app update @scope/pkg brace-expansion --no-save --lockfile-only --ignore-scripts",
    "npm --prefix functions install --package-lock-only --ignore-scripts",
    "npm ci",
  ];
  fixture.assertAllowed([
    ...gated,
    "pnpm audit --json",
    "pnpm why react",
    "pnpm -v",
    "npm view react time --json",
    "npm audit --json",
    "corepack enable",
    "cd functions && pnpm install --frozen-lockfile",
  ]);
  fixture.assertBlocked(gated, {
    checkDiff: () => "package.json: scripts が変わっている",
  });
  fixture.assertBlocked([
    "pnpm run --dir /tmp/repo-patrol x",
    "pnpm run check --config=/tmp/repo-patrol/x.js",
    "pnpm run check -- --watch",
    "pnpm --dir . exec id",
    "pnpm -C . dlx evil",
    "pnpm --filter web exec id",
    "npm --prefix . exec id",
    "corepack pnpm exec id",
    "pnpm add evil@1.0.0",
    "npm install evil",
    "pnpm config set script-shell /tmp/x",
    "npm explore x -- id",
    "pnpm install",
    "pnpm update",
    "pnpm update --no-save --lockfile-only --ignore-scripts",
    "pnpm update undici --lockfile-only --ignore-scripts",
    "pnpm update undici@7.30.1 --no-save --lockfile-only --ignore-scripts",
    "pnpm update undici --latest --no-save --lockfile-only --ignore-scripts",
    "pnpm update undici --no-save --lockfile-only --ignore-scripts --depth 0",
    "pnpm dlx some-package",
    "npx some-package",
    "pnpm lint",
    "pnpm --dir /tmp install --frozen-lockfile",
  ]);
});

test("redirects and utilities stay inside the work directory", (t) => {
  const fixture = createFixture(t);
  fixture.assertAllowed([
    "mkdir -p /tmp/repo-patrol",
    "date +%F",
    "test -f package.json && echo ok",
    "bash .claude/skills/repo-patrol/scripts/stale.sh o/r list > /tmp/repo-patrol/stale.tsv 2>&1",
    "git status > /dev/null",
    "# 確認する\ngit status",
  ]);
  fixture.assertBlocked([
    "echo '{}' > .claude/settings.json",
    "echo x > package.json",
    "cat x > /tmp/other.txt",
    "echo x >> /tmp/repo-patrol/../x",
    "mkdir -p /tmp/other",
    "sort -u /tmp/repo-patrol/a.txt",
    "cp /tmp/x .github/workflows/ci.yml",
    "tee /tmp/repo-patrol/x",
    "cd /tmp",
  ]);
});

test("file tools write only to the work directory and tracked dependency files", (t) => {
  const fixture = createFixture(t);
  const cases = [
    ["Write", { file_path: "/tmp/repo-patrol/pr.json" }, true],
    ["Edit", { file_path: "package.json" }, true],
    ["Edit", { file_path: "apps/web/package.json" }, true],
    ["Edit", { file_path: "pnpm-lock.yaml" }, true],
    ["Edit", { file_path: "biome.json" }, true],
    ["Write", { file_path: "docs/package.json" }, false],
    ["Edit", { file_path: "node_modules/x/package.json" }, false],
    ["Write", { file_path: "link/package.json" }, false],
    ["Write", { file_path: ".claude/settings.json" }, false],
    ["Edit", { file_path: ".github/workflows/ci.yml" }, false],
    ["Edit", { file_path: ".github/package.json" }, false],
    ["Write", { file_path: "src/index.ts" }, false],
    ["Write", { file_path: "/tmp/x.sh" }, false],
    ["MultiEdit", { file_path: "/home/user/.claude/settings.json" }, false],
    ["NotebookEdit", { notebook_path: ".git/config" }, false],
    ["Write", {}, false],
  ];
  for (const [tool, input, expected] of cases) {
    assert.equal(
      fixture.tool(tool, input).allow,
      expected,
      `${tool} ${JSON.stringify(input)}`,
    );
  }
});

test("tools routed to the guard without a rule are blocked", (t) => {
  const fixture = createFixture(t);
  assert.equal(
    fixture.tool("mcp__github__merge_pull_request", {}).allow,
    false,
  );
  assert.equal(fixture.tool("Monitor", { command: "git push" }).allow, false);
});

test("hasMention ignores code, comments, versions and email addresses", () => {
  assert.equal(hasMention("`@sentry/react-native` を更新"), false);
  assert.equal(hasMention("react@19.2.8 と bot@example.com"), false);
  assert.equal(hasMention('<!-- {"deps": ["@a/b@1.0.0"]} -->'), false);
  assert.equal(hasMention("@dependabot rebase"), true);
  assert.equal(hasMention("`@Dependabot rebase`"), true);
  assert.equal(hasMention("確認: @someone"), true);
  assert.equal(hasMention("@org/team"), true);
});

test("install, run and push go through check-diff in a real repository", (t) => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "repo-patrol-gate-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const run = (cwd, ...args) =>
    execFileSync("git", args, { cwd, encoding: "utf8", stdio: "pipe" });
  const origin = path.join(dir, "origin.git");
  const seed = path.join(dir, "seed");
  const clone = path.join(dir, "clone");
  run(dir, "init", "-q", "--bare", "-b", "main", origin);
  run(dir, "init", "-q", "-b", "main", seed);
  run(seed, "config", "user.email", "test@example.com");
  run(seed, "config", "user.name", "test");
  const basePackage = {
    scripts: { check: "biome check" },
    dependencies: { a: "^1.0.0" },
  };
  writeFileSync(path.join(seed, "package.json"), JSON.stringify(basePackage));
  run(seed, "add", "-A");
  run(seed, "commit", "-q", "-m", "base");
  run(seed, "push", "-q", origin, "main");
  run(dir, "clone", "-q", origin, clone);
  run(clone, "config", "user.email", "test@example.com");
  run(clone, "config", "user.name", "test");

  const write = (data) =>
    writeFileSync(path.join(clone, "package.json"), JSON.stringify(data));
  const check = (command) =>
    evaluate(
      { tool_name: "Bash", tool_input: { command } },
      { cwd: clone, root: clone, config: { repo: "o/r", extras: [] } },
    ).allow;

  write({ ...basePackage, dependencies: { a: "^1.1.0" } });
  assert.equal(check("pnpm install --frozen-lockfile"), true);

  write({
    ...basePackage,
    scripts: { check: "biome check", postinstall: "node x" },
  });
  assert.equal(check("pnpm install --frozen-lockfile"), false);
  assert.equal(check("pnpm run check"), false);

  // scripts を足したコミットを作り、作業ツリーでだけ戻しても push は止まる
  run(clone, "checkout", "-q", "-b", "claude/patrol-deps");
  run(clone, "commit", "-q", "-am", "scripts");
  write({ ...basePackage, dependencies: { a: "^1.1.0" } });
  assert.equal(check("pnpm install --frozen-lockfile"), true);
  assert.equal(
    check("git push origin HEAD:refs/heads/claude/patrol-deps"),
    false,
  );

  run(clone, "commit", "-q", "-am", "only the bump");
  assert.equal(
    check("git push origin HEAD:refs/heads/claude/patrol-deps"),
    true,
  );
});

function runGuard(input, env) {
  return spawnSync(process.execPath, [guardScript], {
    input,
    encoding: "utf8",
    env: { PATH: process.env.PATH, ...env },
  });
}

test("the hook does nothing outside patrol runs", () => {
  const result = runGuard(
    JSON.stringify({
      tool_name: "Bash",
      tool_input: { command: "git push origin HEAD:main" },
    }),
    {},
  );
  assert.equal(result.status, 0);
  assert.equal(result.stderr, "");
});

test("the hook blocks with exit 2 during patrol runs", (t) => {
  const fixture = createFixture(t);
  const env = { REPO_PATROL: "1", CLAUDE_PROJECT_DIR: fixture.root };
  const blocked = runGuard(
    JSON.stringify({
      tool_name: "Bash",
      tool_input: { command: "git push origin HEAD:main" },
      cwd: fixture.root,
    }),
    env,
  );
  assert.equal(blocked.status, 2);
  assert.match(blocked.stderr, /repo-patrol guard/);

  const allowed = runGuard(
    JSON.stringify({
      tool_name: "Bash",
      tool_input: { command: "ls" },
      cwd: fixture.root,
    }),
    env,
  );
  assert.equal(allowed.status, 0, allowed.stderr);

  assert.equal(runGuard("not json", env).status, 2);
});
