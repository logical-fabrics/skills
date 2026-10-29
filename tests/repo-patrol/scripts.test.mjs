import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
  chmodSync,
  cpSync,
  existsSync,
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

// 設定ファイルを置いた git リポジトリを作る。slack-post.sh は宛先とリポジトリをここから読む。
function slackRepo(t, config) {
  const dir = tempDir(t);
  execFileSync("git", ["init", "-q"], { cwd: dir });
  mkdirSync(path.join(dir, ".claude"));
  writeFileSync(path.join(dir, ".claude", "repo-patrol.md"), config);
  const file = path.join(dir, "report.json");
  return {
    post: (report, env = {}, options = []) => {
      writeFileSync(
        file,
        typeof report === "string" ? report : JSON.stringify(report),
      );
      return runScript("slack-post.sh", [...options, file], {
        cwd: dir,
        env: { LANG: "ja_JP.UTF-8", ...env },
      });
    },
  };
}

const SLACK_CONFIG =
  "# repo-patrol の設定\n\n## リポジトリ\n\no/r\n\n## Slack チャンネル\n\n`C0123ABCD`\n\n## 検証\n\nなし\n";

// 2026-10-27 は火曜
const report = (items, extra = {}) => ({
  date: "2026-10-27",
  base: "main",
  items,
  ...extra,
});
const mergeItem = (extra = {}) => ({
  kind: "merge",
  number: 12,
  label: "巡回 PR: 依存更新 2 件（`a` 1.2.4・`b` 2.0.1）",
  ci: "success",
  isNew: false,
  nudge: false,
  ...extra,
});
const decisionItem = (extra = {}) => ({
  kind: "decision",
  number: 48,
  label: "`knip` 7.0.0",
  reason: "メジャー更新",
  commentedNow: false,
  security: false,
  ...extra,
});
const ciFailureItem = (extra = {}) => ({
  kind: "ci_failure",
  workflow: "CI",
  url: "https://github.com/o/r/actions/runs/123/job/4",
  isNew: false,
  ...extra,
});
const closingItem = (extra = {}) => ({
  kind: "closing_soon",
  number: 31,
  title: "古い Issue",
  firstNotice: false,
  ...extra,
});

// プレビューの出力から Block Kit の blocks を取り出す
function previewBlocks(result) {
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout.split("（Block Kit:）\n")[1]);
}

// chat.postMessage の代わり。REJECT_BLOCKS=1 なら、blocks のある本文に invalid_blocks を返す
function fakeSlack(t) {
  const bin = tempDir(t);
  const log = path.join(bin, "curl.log");
  writeFileSync(
    path.join(bin, "curl"),
    `#!/usr/bin/env bash
out=
data=
while [ $# -gt 0 ]; do
  case $1 in
  -o) out=$2; shift ;;
  --data-binary) data=$2; shift ;;
  -H) case $2 in Authorization:*) echo "$2" >>"$CURL_LOG.auth" ;; esac; shift ;;
  esac
  shift
done
printf '%s\\n' "$data" >>"$CURL_LOG"
if [ "$REJECT_BLOCKS" = 1 ] && printf '%s' "$data" | grep -q '"blocks"'; then
  echo '{"ok":false,"error":"invalid_blocks"}' >"$out"
else
  echo '{"ok":true,"ts":"1.2"}' >"$out"
fi
printf 200
`,
  );
  chmodSync(path.join(bin, "curl"), 0o755);
  return {
    env: (reject = "0") => ({
      REPO_PATROL: "1",
      PATH: `${bin}:${process.env.PATH}`,
      CURL_LOG: log,
      REJECT_BLOCKS: reject,
    }),
    auth: () =>
      existsSync(`${log}.auth`) ? readFileSync(`${log}.auth`, "utf8") : "",
    sent: () => {
      if (!existsSync(log)) return [];
      const lines = readFileSync(log, "utf8").trim().split("\n");
      rmSync(log);
      return lines.map((line) => JSON.parse(line));
    },
  };
}

test("slack-post renders the report as Block Kit in order of severity", (t) => {
  const repo = slackRepo(t, SLACK_CONFIG);
  const blocks = previewBlocks(
    repo.post(
      report(
        [
          mergeItem({ isNew: true }),
          closingItem(),
          decisionItem(),
          mergeItem({
            number: 13,
            label: "`actions/setup-node` 6.1.0（npm 以外の Dependabot PR）",
            ci: "pending",
            ageDays: 3,
          }),
          ciFailureItem(),
        ],
        {
          sessionUrl: "https://claude.ai/code/session_abc123",
          notes: {
            deferred: [{ number: 3, label: "`c` 2.0.0", reason: "メジャー" }],
            baseCi: "success",
          },
        },
      ),
    ),
  );
  const link = (number) =>
    `<https://github.com/o/r/issues/${number}|#${number}>`;
  const section = (...lines) => ({
    type: "section",
    text: { type: "mrkdwn", text: lines.join("\n"), verbatim: true },
  });
  assert.deepEqual(blocks, [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "r の巡回（2026-10-27）: 要対応 5 件",
        emoji: true,
      },
    },
    section("<!channel>"),
    section(
      "*:x: main の CI が失敗*",
      "• <https://github.com/o/r/actions/runs/123/job/4|CI>",
    ),
    section(
      "*:thinking_face: 要判断*",
      `• ${link(48)} \`knip\` 7.0.0: メジャー更新`,
    ),
    section(
      "*:eyes: マージしてください*",
      `• ${link(12)} 巡回 PR: 依存更新 2 件（ \`a\` 1.2.4・ \`b\` 2.0.1）・CI 成功`,
      `• ${link(13)} \`actions/setup-node\` 6.1.0（npm 以外の Dependabot PR）・作成から 3 日・CI 実行中`,
    ),
    section(
      "*:hourglass_flowing_sand: 7 日以内に閉じる予定*",
      `• ${link(31)} 古い Issue`,
    ),
    { type: "divider" },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: [
            `:zzz: 見送り中: ${link(3)} \`c\` 2.0.0（メジャー）`,
            ":white_check_mark: main の CI: 成功",
            "<https://claude.ai/code/session_abc123|実行ログ>",
          ].join("\n"),
          verbatim: true,
        },
      ],
    },
  ]);
});

test("slack-post mentions the channel only for new facts in the items", (t) => {
  const repo = slackRepo(t, SLACK_CONFIG);
  const quiet = [mergeItem(), decisionItem(), ciFailureItem(), closingItem()];
  const cases = [
    [quiet, false],
    [[mergeItem({ isNew: true })], true],
    [[mergeItem({ nudge: true, ageDays: 7 })], true],
    [[decisionItem({ commentedNow: true })], true],
    [[decisionItem({ security: true })], true],
    [[ciFailureItem({ isNew: true })], true],
    [[closingItem({ firstNotice: true })], true],
  ];
  for (const [items, mentioned] of cases) {
    const result = repo.post(report(items));
    const blocks = previewBlocks(result);
    const label = JSON.stringify(items);
    assert.equal(
      blocks[0].text.text,
      `r の巡回（2026-10-27）: 要対応 ${items.length} 件`,
      label,
    );
    assert.equal(blocks[1].text.text === "<!channel>", mentioned, label);
    assert.equal(/^<!channel> /m.test(result.stdout), mentioned, label);
  }
});

test("slack-post escapes outside text and links only allowed URLs", (t) => {
  const repo = slackRepo(t, SLACK_CONFIG);
  const blocks = previewBlocks(
    repo.post(
      report([
        ciFailureItem({
          workflow: "<!channel>",
          url: "https://github.com/o/r/actions/runs/9",
        }),
        ciFailureItem({ url: "https://github.com/other/r/actions/runs/9" }),
        ciFailureItem({ url: "https://evil.example/o/r/actions/runs/9" }),
        decisionItem({
          number: undefined,
          label: "題名 <!channel> <https://evil.example|click>",
          reason:
            "#7 a#8 https://x.example/#9 &#10; `#11` <@U999999>\n## 見出し",
        }),
      ]),
    ),
  );
  assert.deepEqual(
    blocks.slice(1).map((block) => block.text.text),
    [
      [
        "*:x: main の CI が失敗*",
        "• <https://github.com/o/r/actions/runs/9|&lt;!channel&gt;>",
        "• CI: https://github.com/other/r/actions/runs/9",
        "• CI: https://evil.example/o/r/actions/runs/9",
      ].join("\n"),
      [
        "*:thinking_face: 要判断*",
        "• 題名 &lt;!channel&gt; &lt;https://evil.example|click&gt;: <https://github.com/o/r/issues/7|#7> a#8 https://x.example/#9 &amp;#10; `#11` &lt;@U999999&gt; ## 見出し",
      ].join("\n"),
    ],
  );
});

test("slack-post rejects a report that does not match the format", (t) => {
  const repo = slackRepo(t, SLACK_CONFIG);
  const cases = [
    ["{", /JSON として読めない/],
    [[], /報告 はオブジェクトにする/],
    [{ items: [] }, /報告\.date がない/],
    [report([], { date: "2026-02-30" }), /報告\.date の形が違う（YYYY-MM-DD/],
    [report([], { extra: 1 }), /報告\.extra は使わないキー/],
    [
      report([], { sessionUrl: "https://evil.example/code/session_a" }),
      /報告\.sessionUrl の形が違う/,
    ],
    [report([{ kind: "note", text: "x" }]), /items\[0\]\.kind は/],
    [
      report([mergeItem({ packages: ["a"] })]),
      /items\[0\]\.packages は使わないキー/,
    ],
    [report([mergeItem({ isNew: undefined })]), /items\[0\]\.isNew がない/],
    [report([mergeItem({ ci: "ok" })]), /items\[0\]\.ci の形が違う（success/],
    [
      report([mergeItem({ number: "12" })]),
      /items\[0\]\.number の形が違う（正の整数/,
    ],
    [
      report([mergeItem({ label: "あ".repeat(301) })]),
      /items\[0\]\.label の形が違う（空でない 300 文字以内/,
    ],
    [
      report([], { notes: { baseCi: "failure" } }),
      /notes\.baseCi の形が違う（success か unknown/,
    ],
    [
      report([], { notes: { closed: { issues: 1 } } }),
      /notes\.closed は使わないキー/,
    ],
    [
      report([], { notes: { deferred: [{ label: "a" }] } }),
      /notes\.deferred\[0\]\.reason がない/,
    ],
  ];
  for (const [input, message] of cases) {
    const result = repo.post(input);
    assert.equal(result.status, 1, JSON.stringify(input));
    assert.match(result.stderr, message, JSON.stringify(input));
  }

  const noRepo = slackRepo(t, "## Slack チャンネル\n\n`#engineer`\n");
  const result = noRepo.post(report([mergeItem()]));
  assert.equal(result.status, 1);
  assert.match(result.stderr, /リポジトリ/);
});

test("slack-post posts an empty report only on Mondays", (t) => {
  const repo = slackRepo(t, SLACK_CONFIG);
  const slack = fakeSlack(t);
  const empty = (date) =>
    report([], {
      date,
      sessionUrl: "https://claude.ai/code/session_abc123",
      notes: { baseCi: "success" },
    });

  const tuesday = repo.post(empty("2026-10-27"), slack.env());
  assert.equal(tuesday.status, 0, tuesday.stderr);
  assert.match(tuesday.stdout, /報告することがないので投稿しなかった/);
  assert.deepEqual(slack.sent(), []);

  const monday = repo.post(empty("2026-10-26"), slack.env());
  assert.equal(monday.status, 0, monday.stderr);
  const [sent] = slack.sent();
  assert.equal(sent.text, "r の巡回（2026-10-26）: 異常なし");
  assert.deepEqual(
    sent.blocks.map((block) => block.type),
    ["header", "divider", "context"],
  );
  assert.equal(
    sent.blocks[2].elements[0].text,
    ":white_check_mark: main の CI: 成功\n<https://claude.ai/code/session_abc123|実行ログ>",
  );
});

test("slack-post accepts a channel name as the destination", (t) => {
  const repo = slackRepo(
    t,
    "## リポジトリ\n\no/r\n\n## Slack チャンネル\n\n`#engineer`\n",
  );
  const preview = repo.post(report([mergeItem()]));
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
    const result = repo.post(report([mergeItem()]), { REPO_PATROL: "1" });
    assert.equal(result.status, 1, config);
    assert.match(result.stderr, /Slack チャンネル/);
  }
});

test("slack-post keeps the blocks within Slack's limits", (t) => {
  const repo = slackRepo(
    t,
    `## リポジトリ\n\no/${"r".repeat(200)}\n\n## Slack チャンネル\n\n\`C0123ABCD\`\n`,
  );
  const closing = (count) =>
    Array.from({ length: count }, (_, i) =>
      closingItem({ number: i + 1, title: "あ".repeat(290) }),
    );
  const blocks = previewBlocks(repo.post(report(closing(60))));
  assert.equal(blocks[0].text.text.length, 150);
  const sections = blocks.filter((block) => block.type === "section");
  assert.ok(sections.length > 1);
  for (const section of sections) {
    assert.ok(section.text.text.length <= 3000, section.text.text.length);
  }
  assert.match(
    sections[0].text.text,
    /^\*:hourglass_flowing_sand: 7 日以内に閉じる予定\*\n• /,
  );

  const many = repo.post(report(closing(600)));
  assert.equal(many.status, 0, many.stderr);
  assert.match(many.stdout, /（Block Kit:）\nnull\n$/);
});

test("on Actions the run URL is the log link and the Slack token is sent as a header", (t) => {
  const url = runScript("session-url.sh", [], {
    env: {
      GITHUB_RUN_ID: "42",
      GITHUB_REPOSITORY: "o/r",
      GITHUB_SERVER_URL: "https://github.com",
    },
  });
  assert.equal(url.status, 0, url.stderr);
  assert.equal(url.stdout, "https://github.com/o/r/actions/runs/42\n");

  const repo = slackRepo(t, SLACK_CONFIG);
  const slack = fakeSlack(t);
  const input = report([mergeItem()], { sessionUrl: url.stdout.trim() });
  const posted = repo.post(input, {
    ...slack.env(),
    SLACK_BOT_TOKEN: "xoxb-test",
  });
  assert.equal(posted.status, 0, posted.stderr);
  const [message] = slack.sent();
  assert.match(
    JSON.stringify(message.blocks),
    /<https:\/\/github\.com\/o\/r\/actions\/runs\/42\|実行ログ>/,
  );
  assert.equal(slack.auth(), "Authorization: Bearer xoxb-test\n");
});

test("slack-post posts once, falls back to plain text and never posts with --check", (t) => {
  const repo = slackRepo(t, SLACK_CONFIG);
  const slack = fakeSlack(t);
  const input = report([mergeItem({ isNew: true })]);

  const accepted = repo.post(input, slack.env());
  assert.equal(accepted.status, 0, accepted.stderr);
  assert.match(accepted.stdout, /投稿した（ts=1\.2）/);
  const [rich] = slack.sent();
  assert.equal(rich.channel, "C0123ABCD");
  assert.equal(rich.text, "<!channel> r の巡回（2026-10-27）: 要対応 1 件");
  assert.equal(rich.blocks.length, 3);

  const rejected = repo.post(input, slack.env("1"));
  assert.equal(rejected.status, 0, rejected.stderr);
  assert.match(rejected.stderr, /invalid_blocks/);
  const [first, second] = slack.sent();
  assert.ok(first.blocks);
  assert.equal(second.blocks, undefined);
  assert.equal(
    second.text,
    [
      "<!channel> r の巡回（2026-10-27）: 要対応 1 件",
      "",
      "*:eyes: マージしてください*",
      "• <https://github.com/o/r/issues/12|#12> 巡回 PR: 依存更新 2 件（ `a` 1.2.4・ `b` 2.0.1）・CI 成功",
    ].join("\n"),
  );

  const checked = repo.post(input, slack.env(), ["--check"]);
  assert.equal(checked.status, 0, checked.stderr);
  assert.match(checked.stdout, /投稿しない。宛先: C0123ABCD/);
  assert.deepEqual(slack.sent(), []);
  const invalid = repo.post(report([{ kind: "x" }]), slack.env(), ["--check"]);
  assert.equal(invalid.status, 1);
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

function createRepo(t, baseLock = BASE_LOCK) {
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
  writeFileSync(path.join(dir, "pnpm-lock.yaml"), baseLock);
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

test("check-diff accepts an existing alias whose peers change", (t) => {
  // d の依存 url-v1 は url を指す別名。peer の版が変わると、親の鍵と別名の値の括弧が書き換わる
  const aliased = (react) =>
    BASE_LOCK.replace(
      "  d@1.0.0: {}",
      `  d@1.0.0(react@${react}):\n    dependencies:\n      url-v1: url@0.11.4(react@${react})`,
    );
  const repo = createRepo(t, aliased("19.2.7"));
  repo.writeLock(aliased("19.2.8"));
  const result = repo.check();
  assert.equal(result.status, 0, result.stdout);

  // 同じ別名でも、ほかのパッケージの依存に現れたら増えている
  repo.writeLock(
    aliased("19.2.7").replace(
      "  a@1.2.0: {}",
      "  a@1.2.0:\n    dependencies:\n      url-v1: url@0.11.4",
    ),
  );
  assert.equal(repo.check().status, 1);
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
  const bodies = path.join(dir, "bodies.log");
  const issuesFile = path.join(dir, "issues.json");
  writeFileSync(issuesFile, JSON.stringify(issues));
  writeFileSync(
    path.join(dir, "gh"),
    `#!/usr/bin/env bash
echo "$*" >> "${log}"
for arg in "$@"; do
  case $arg in body=@*) cat "\${arg#body=@}" >> "${bodies}" ;; esac
done
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
    bodies: () => readFileSync(bodies, "utf8"),
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
    env: {
      ...gh.env,
      GITHUB_RUN_ID: "42",
      GITHUB_SERVER_URL: "https://github.com",
    },
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
  // close は Actions の workflow が行うので、コメントの実行ログはその実行
  assert.match(
    gh.bodies(),
    /— repo-patrol ・ 実行ログ: https:\/\/github\.com\/o\/r\/actions\/runs\/42\n/,
  );
});

test("the workflows of this repository are the templates", () => {
  for (const [name, command] of [
    [
      "repo-patrol-stale.yml",
      /bash \.claude\/skills\/repo-patrol\/scripts\/stale\.sh "\$GITHUB_REPOSITORY" close/,
    ],
    [
      "repo-patrol-dependency-check.yml",
      /node "\$RUNNER_TEMP\/base\/\.claude\/skills\/repo-patrol\/scripts\/dependency-check\.mjs" "\$BASE_SHA"/,
    ],
    // 人が secrets と vars.REPO_PATROL_MODE を置くまで動かず、Slack のトークンは投稿の step にだけ渡す
    [
      "repo-patrol.yml",
      /if: vars\.REPO_PATROL_MODE == 'observe' \|\| vars\.REPO_PATROL_MODE == 'live'\n[\s\S]*uses: anthropics\/claude-code-action@v1[\s\S]*- name: Post the report to Slack\n {8}if: vars\.REPO_PATROL_MODE == 'live'\n {8}run: bash \.claude\/skills\/repo-patrol\/scripts\/slack-post\.sh \/tmp\/repo-patrol\/report\.json\n {8}env:\n {10}SLACK_BOT_TOKEN: \$\{\{ secrets\.SLACK_BOT_TOKEN \}\}/,
    ],
  ]) {
    const template = readFileSync(
      path.join(scriptsDir, "..", "workflows", name),
      "utf8",
    );
    const own = readFileSync(
      path.resolve(scriptsDir, "../../../../.github/workflows", name),
      "utf8",
    );
    assert.equal(own, template, name);
    assert.match(template, command, name);
    // 依存の検査は base の定義で動かす（PR が check を外せないように）
    if (name === "repo-patrol-dependency-check.yml") {
      assert.match(template, /^on:\n {2}pull_request_target:\n/m);
    }
  }
});

// npm view の代わり。「名前@版 → その版のメタデータ」の表を引く。表にない版と、レジストリを決めていない呼び出しは失敗
function fakeNpm(t, versions) {
  const dir = tempDir(t);
  const file = path.join(dir, "versions.json");
  writeFileSync(file, JSON.stringify(versions));
  writeFileSync(
    path.join(dir, "npm"),
    `#!/usr/bin/env node
const versions = JSON.parse(require("node:fs").readFileSync(${JSON.stringify(file)}, "utf8"));
const [command, spec, ...rest] = process.argv.slice(2);
if (command !== "view" || !rest.includes("--registry=https://registry.npmjs.org/") || !(spec in versions)) {
  console.error("E404 " + process.argv.slice(2).join(" "));
  process.exit(1);
}
process.stdout.write(JSON.stringify(versions[spec]));
`,
  );
  chmodSync(path.join(dir, "npm"), 0o755);
  return { PATH: `${dir}:${process.env.PATH}` };
}

const daysAgo = (days) =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
const npmPerson = (name) => `${name} <${name}@example.com>`;
const TRUSTED = "GitHub Actions <npm-oidc-no-reply@github.com>";
const PROVENANCE = {
  url: "https://registry.npmjs.org/-/npm/v1/attestations/x",
};
const release = (version, extra = {}) => ({
  _npmUser: npmPerson("alice"),
  maintainers: [npmPerson("alice")],
  time: { [version]: daysAgo(10) },
  ...extra,
});
// BASE_LOCK → BUMPED_LOCK で新しく入る版（a・realc は前の版あり、@scope/url は新しい名前）と、その前の版
const releases = () => ({
  "a@1.2.0": release("1.2.0"),
  "a@1.3.0": release("1.3.0"),
  "realc@1.0.0": release("1.0.0"),
  "realc@1.1.0": release("1.1.0"),
  "@scope/url@0.11.4": release("0.11.4"),
});

function bumpedRepo(t) {
  const repo = createRepo(t);
  repo.writeLock(BUMPED_LOCK);
  execFileSync("git", ["commit", "-q", "-am", "bump"], { cwd: repo.dir });
  return repo;
}

test("publisher-check fails on new install scripts, publisher changes and young versions", (t) => {
  const repo = bumpedRepo(t);
  const cases = [
    ["既存の版の更新", () => {}, 0, /新しく入る版: 3 件/],
    [
      "install script が増えた",
      (v) => {
        v["a@1.3.0"].scripts = { postinstall: "node x.js" };
      },
      1,
      /a@1\.3\.0: postinstall が前の版（1\.2\.0）から増えた・変わった/,
    ],
    [
      "前の版と同じ install script",
      (v) => {
        v["a@1.2.0"].scripts = { postinstall: "node x.js" };
        v["a@1.3.0"].scripts = { postinstall: "node x.js" };
      },
      0,
      /問題はない/,
    ],
    [
      "新しい名前の install script",
      (v) => {
        v["@scope/url@0.11.4"].scripts = { install: "node-gyp rebuild" };
      },
      1,
      /@scope\/url@0\.11\.4: install がある/,
    ],
    [
      "maintainers にいない公開者",
      (v) => {
        v["a@1.3.0"]._npmUser = npmPerson("mallory");
      },
      1,
      /公開者 mallory が前の版（1\.2\.0）の maintainers にいない/,
    ],
    [
      "provenance がなくなった",
      (v) => {
        v["a@1.2.0"].dist = { attestations: PROVENANCE };
      },
      1,
      /a@1\.3\.0: 前の版にあった provenance がない/,
    ],
    [
      "trusted publishing から人の公開へ",
      (v) => {
        v["a@1.2.0"]._npmUser = TRUSTED;
        v["a@1.2.0"].dist = { attestations: PROVENANCE };
      },
      1,
      /trusted publishing だったのに、alice が公開している/,
    ],
    [
      "人から trusted publishing へ",
      (v) => {
        v["a@1.3.0"]._npmUser = TRUSTED;
        v["a@1.3.0"].dist = { attestations: PROVENANCE };
      },
      0,
      /問題はない/,
    ],
    [
      "trusted publishing どうし",
      (v) => {
        for (const spec of ["a@1.2.0", "a@1.3.0"]) {
          v[spec]._npmUser = TRUSTED;
          v[spec].dist = { attestations: PROVENANCE };
        }
      },
      0,
      /問題はない/,
    ],
    [
      "公開から 4 日未満",
      (v) => {
        v["realc@1.1.0"].time = { "1.1.0": daysAgo(1) };
      },
      1,
      /realc@1\.1\.0: 公開から 4 日たっていない/,
    ],
    [
      "npm に問い合わせられない",
      (v) => {
        delete v["@scope/url@0.11.4"];
      },
      2,
      /npm に問い合わせられなかった/,
    ],
  ];
  for (const [label, change, status, output] of cases) {
    const versions = releases();
    change(versions);
    const result = spawnSync(
      process.execPath,
      [path.join(scriptsDir, "publisher-check.mjs"), "main"],
      { cwd: repo.dir, encoding: "utf8", env: fakeNpm(t, versions) },
    );
    assert.equal(
      result.status,
      status,
      `${label}: ${result.stdout}${result.stderr}`,
    );
    assert.match(result.stdout + result.stderr, output, label);
  }
});

// lockfile を base と HEAD の 2 つのコミットにした git リポジトリ
function lockRepo(t, file, baseText, headText) {
  const dir = tempDir(t);
  const git = (...args) => execFileSync("git", args, { cwd: dir });
  git("init", "-q", "-b", "main");
  git("config", "user.email", "test@example.com");
  git("config", "user.name", "test");
  writeFileSync(path.join(dir, file), baseText);
  git("add", "-A");
  git("commit", "-q", "-m", "base");
  git("checkout", "-q", "-b", "dependabot/npm_and_yarn/x");
  writeFileSync(path.join(dir, file), headText);
  git("commit", "-q", "-am", "bump");
  return dir;
}

test("publisher-check reads the installed package behind aliases and peer suffixes", (t) => {
  const tarball = (name, version) =>
    `https://registry.npmjs.org/${name}/-/${name.split("/").at(-1)}-${version}.tgz`;
  const npmLock = (packages) =>
    JSON.stringify({
      lockfileVersion: 3,
      packages: { "": { name: "app" }, ...packages },
    });
  const entry = (name, version, extra = {}) => ({
    version,
    resolved: tarball(name, version),
    integrity: "sha512-x",
    ...extra,
  });
  const run = (dir, versions) =>
    spawnSync(
      process.execPath,
      [path.join(scriptsDir, "publisher-check.mjs"), "main"],
      {
        cwd: dir,
        encoding: "utf8",
        env: fakeNpm(t, versions),
      },
    );

  // npm の別名: node_modules/lodash の中身は evil。evil を確かめる（lodash@1.0.0 を見て通さない）
  const alias = lockRepo(
    t,
    "package-lock.json",
    npmLock({ "node_modules/@s/b": entry("@s/b", "1.0.0") }),
    npmLock({
      "node_modules/@s/b": entry("@s/b", "1.0.1"),
      "node_modules/lodash": entry("evil", "1.0.0", { name: "evil" }),
    }),
  );
  const result = run(alias, {
    "@s/b@1.0.0": release("1.0.0"),
    "@s/b@1.0.1": release("1.0.1"),
    "lodash@1.0.0": release("1.0.0"),
    "evil@1.0.0": release("1.0.0", {
      scripts: { postinstall: "node steal.js" },
    }),
  });
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stdout, /evil@1\.0\.0: postinstall がある/);
  assert.doesNotMatch(result.stdout, /lodash/);

  // resolved が版と食い違う解決は、レジストリから取るものとして扱わない（check-diff が止める）
  const mismatched = lockRepo(
    t,
    "package-lock.json",
    npmLock({ "node_modules/a": entry("a", "1.0.0") }),
    npmLock({
      "node_modules/a": entry("a", "1.0.1", {
        resolved: tarball("a", "1.0.0"),
      }),
    }),
  );
  const diff = spawnSync(
    process.execPath,
    [path.join(scriptsDir, "check-diff.mjs"), "main", "--head"],
    {
      cwd: mismatched,
      encoding: "utf8",
    },
  );
  assert.equal(diff.status, 1, diff.stdout);
  assert.match(
    diff.stdout,
    /node_modules\/a@1\.0\.1 がレジストリ以外から解決される/,
  );

  // pnpm lockfile v6 の peer 付きの鍵は、括弧を除いた名前と版で確かめる
  const pnpmLock = (key) =>
    [
      "lockfileVersion: '6.0'",
      "",
      "packages:",
      "",
      `  ${key}:`,
      "    resolution: {integrity: sha512-q}",
      "",
    ].join("\n");
  const peers = lockRepo(
    t,
    "pnpm-lock.yaml",
    pnpmLock("/@tanstack/q@5.0.0(react@18.2.0)"),
    pnpmLock("/@tanstack/q@5.1.0(react@18.2.0)"),
  );
  const peerResult = run(peers, {
    "@tanstack/q@5.0.0": release("5.0.0"),
    "@tanstack/q@5.1.0": release("5.1.0"),
  });
  assert.equal(peerResult.status, 0, peerResult.stdout + peerResult.stderr);
  assert.match(peerResult.stdout, /新しく入る版: 1 件/);
});

test("dependency-check uses the checker and the extra paths of the base copy", (t) => {
  const config = (extras) =>
    `# repo-patrol の設定\n\n## リポジトリ\n\no/r\n\n## 差分に含めてよい追加のパス\n\n${extras.map((extra) => `- \`${extra}\``).join("\n")}\n`;
  // workflow が base のコミットから取り出すもの（スキルと設定）
  const baseCopy = (extras) => {
    const dir = tempDir(t);
    cpSync(
      path.dirname(scriptsDir),
      path.join(dir, ".claude", "skills", "repo-patrol"),
      {
        recursive: true,
      },
    );
    writeFileSync(path.join(dir, ".claude", "repo-patrol.md"), config(extras));
    return dir;
  };
  // PR のチェックアウト。自分の設定では biome.json を許しているが、検査はこれを使わない
  const repo = createRepo(t);
  mkdirSync(path.join(repo.dir, ".claude"));
  writeFileSync(
    path.join(repo.dir, ".claude", "repo-patrol.md"),
    config(["biome.json"]),
  );
  execFileSync("git", ["add", "-A"], { cwd: repo.dir });
  execFileSync("git", ["commit", "-q", "-m", "config"], { cwd: repo.dir });
  execFileSync("git", ["branch", "-f", "main", "HEAD"], { cwd: repo.dir });
  repo.writeLock(BUMPED_LOCK);
  writeFileSync(path.join(repo.dir, "biome.json"), "{}\n");
  execFileSync("git", ["add", "-A"], { cwd: repo.dir });
  execFileSync("git", ["commit", "-q", "-m", "bump"], { cwd: repo.dir });

  const check = (copy) =>
    spawnSync(
      process.execPath,
      [
        path.join(
          copy,
          ".claude/skills/repo-patrol/scripts/dependency-check.mjs",
        ),
        "main",
      ],
      { cwd: repo.dir, encoding: "utf8", env: fakeNpm(t, releases()) },
    );
  const allowed = check(baseCopy(["biome.json"]));
  assert.equal(allowed.status, 0, allowed.stdout + allowed.stderr);
  const denied = check(baseCopy([]));
  assert.equal(denied.status, 1, denied.stdout + denied.stderr);
  assert.match(denied.stdout, /biome\.json: 依存ファイルではない/);
});

function auditSummary(t, report) {
  const file = path.join(tempDir(t), "audit.json");
  writeFileSync(
    file,
    typeof report === "string" ? report : JSON.stringify(report),
  );
  return spawnSync("node", [path.join(scriptsDir, "audit-summary.mjs"), file], {
    encoding: "utf8",
  });
}

test("audit-summary lists every installed version and marks direct dependencies", (t) => {
  const result = auditSummary(t, {
    advisories: {
      1: {
        id: 1,
        module_name: "fast-uri",
        severity: "low",
        github_advisory_id: "GHSA-dddd-eeee-ffff",
        vulnerable_versions: "<3.1.9",
        patched_versions: ">=3.1.9",
        findings: [
          {
            version: "3.1.8",
            paths: [
              "a>b>c>fast-uri",
              "a>b>d>fast-uri",
              "a>e>fast-uri",
              "a>f>fast-uri",
            ],
          },
        ],
      },
      2: {
        id: 2,
        module_name: "zod",
        severity: "high",
        github_advisory_id: "GHSA-aaaa-bbbb-cccc",
        vulnerable_versions: "<4.6.6",
        patched_versions: ">=4.6.6",
        title: "memory",
        // 先頭の finding は推移依存。直接依存の版はその後ろにある
        findings: [
          { version: "3.25.76", paths: ["apps__mobile>expo>@expo/cli>zod"] },
          { version: "4.4.3", paths: ["apps__web>ai>zod", ".>zod"] },
        ],
      },
    },
  });
  assert.equal(result.status, 0, result.stderr);
  const lines = result.stdout.trimEnd().split("\n");
  assert.equal(
    lines[0],
    "zod\thigh\tGHSA-aaaa-bbbb-cccc\t対象: <4.6.6\t修正: >=4.6.6\tmemory",
  );
  assert.equal(lines[1], "  4.4.3\t直接\t.>zod ; apps__web>ai>zod");
  assert.equal(lines[2], "  3.25.76\t推移\tapps__mobile>expo>@expo/cli>zod");
  assert.match(lines[3], /^fast-uri\tlow\t/);
  assert.equal(
    lines[4],
    "  3.1.8\t推移\ta>b>c>fast-uri ; a>b>d>fast-uri ; a>e>fast-uri ほか 1 件",
  );
  assert.equal(lines[5], "advisory 2 件（直接依存に当たるもの 1 件）");
});

test("audit-summary reads npm reports and skips advisories inherited from dependencies", (t) => {
  const result = auditSummary(t, {
    auditReportVersion: 2,
    vulnerabilities: {
      ai: {
        name: "ai",
        severity: "high",
        isDirect: true,
        via: ["zod"],
        nodes: ["node_modules/ai"],
      },
      zod: {
        name: "zod",
        severity: "high",
        isDirect: true,
        via: [
          {
            source: 1,
            name: "zod",
            url: "https://github.com/advisories/GHSA-aaaa-bbbb-cccc",
            severity: "high",
            range: "<4.6.6",
          },
        ],
        nodes: ["node_modules/zod"],
      },
    },
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(
    result.stdout,
    "zod\thigh\tGHSA-aaaa-bbbb-cccc\t対象: <4.6.6\n  ?\t直接\tnode_modules/zod\nadvisory 1 件（直接依存に当たるもの 1 件）\n",
  );
});

test("audit-summary fails when the report is not an audit result", (t) => {
  for (const report of [
    "not json",
    { error: { code: "ERR_PNPM_AUDIT_BAD_RESPONSE" } },
    { metadata: {} },
  ]) {
    const result = auditSummary(t, report);
    assert.equal(result.status, 2, JSON.stringify(report));
  }
});

// wait-checks.sh が呼ぶ REST をまねる。チェックもワークフローも付いていないコミットを返す。
function noChecksGh(t, commitAgeSeconds) {
  const dir = tempDir(t);
  writeFileSync(
    path.join(dir, "gh"),
    `#!/usr/bin/env bash
case "$*" in
  *"/check-runs"*) echo '[]' ;;
  *"/status"*) echo '{"state":"pending","statuses":[]}' ;;
  *"actions/runs"*) echo '[]' ;;
  *"commits/"*) echo "$(( $(date +%s) - ${commitAgeSeconds} ))" ;;
  *"pulls/"*) echo '{"state":"open","mergeable_state":"clean","head":{"sha":"abcdef1234567"}}' ;;
  *) echo "unexpected: $*" >&2; exit 1 ;;
esac
`,
  );
  chmodSync(path.join(dir, "gh"), 0o755);
  return { PATH: `${dir}:${process.env.PATH}` };
}

test("wait-checks.sh reports no checks soon when no workflow is expected", (t) => {
  const env = noChecksGh(t, 180);
  const none = runScript("wait-checks.sh", ["o/r", "1", "-", "0"], { env });
  assert.equal(none.status, 5, none.stdout + none.stderr);

  // ワークフロー名を引用符で囲み忘れると、名前の続きが分に入る。CI の失敗とは別の終了コードにする
  const unquoted = runScript(
    "wait-checks.sh",
    ["o/r", "1", "CI,repo-patrol", "dependency", "check"],
    { env },
  );
  assert.equal(unquoted.status, 64, unquoted.stdout + unquoted.stderr);

  // 待つワークフローがあるときは、10 分たつまで起動を待つ
  const waiting = runScript("wait-checks.sh", ["o/r", "1", "testing", "0"], {
    env,
  });
  assert.equal(waiting.status, 3, waiting.stdout + waiting.stderr);
  assert.match(
    waiting.stdout,
    /pending\ttesting\tワークフローが起動していない/,
  );
  // 巡回は出力を読んで次の手を決めるので、時間切れでは呼び直させない
  assert.match(waiting.stdout, /呼び直さない/);
});
