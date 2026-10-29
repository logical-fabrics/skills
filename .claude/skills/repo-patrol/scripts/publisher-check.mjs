#!/usr/bin/env node
// 依存更新で新しく入る版を、npm のメタデータで確かめる。dependency-check.mjs から呼ぶ。
// usage: node publisher-check.mjs <base ref>（push される HEAD のコミットを見る）
// 終了コード: 0 通過 / 1 失敗 / 2 npm に問い合わせられなかった
//
// base と HEAD の lockfile を比べ、新しく入った「名前@版」ごとに references/dependency-triage.md の
// 「公開日と中身の確かめ方」を当てる。前の版は、base にあった同じ名前のいちばん新しい版。
//   - install script（preinstall・install・postinstall）が前の版になかった、または変わった。前の版がない名前は、あれば失敗。
//     前の版と同じものは通す（required check で毎回止めないため。巡回は triage のとおりこれも要判断にする）
//   - 公開者: 新しい版の _npmUser が前の版の maintainers にいない / provenance がなくなった / trusted publishing から人の公開に変わった。
//     人から trusted publishing への移行（provenance あり）と、trusted publishing どうしは通す。前の版がない名前は見ない
//   - 公開から 4 日未満

import { execFileSync } from "node:child_process";
import path from "node:path";
import { npmResolutions, pnpmResolutions } from "./lockfile.mjs";

const MIN_AGE_DAYS = 4;
const DAY_MS = 24 * 60 * 60 * 1000;
const INSTALL_SCRIPTS = ["preinstall", "install", "postinstall"];
const LOCKFILES = new Set([
  "pnpm-lock.yaml",
  "package-lock.json",
  "npm-shrinkwrap.json",
]);
const TRUSTED_PUBLISHER = "GitHub Actions";

const [base] = process.argv.slice(2);
if (!base) {
  console.error("usage: node publisher-check.mjs <base ref>");
  process.exit(64);
}

const git = (...args) =>
  execFileSync("git", args, {
    encoding: "utf8",
    maxBuffer: 256 * 1024 * 1024,
  });

process.chdir(git("rev-parse", "--show-toplevel").trim());
const mergeBase = git("merge-base", base, "HEAD").trim();
const lockfiles = git("diff", "--name-only", mergeBase, "HEAD")
  .split("\n")
  .filter((file) => LOCKFILES.has(path.basename(file)));

// 鍵は pnpm なら「名前@版」（古い形式は先頭に /）、npm なら「node_modules/…/名前@版」
function parseKey(key, isPnpm) {
  let id = key.replace(/^\//, "");
  if (!isPnpm) {
    const marker = id.lastIndexOf("node_modules/");
    if (marker === -1) return null;
    id = id.slice(marker + "node_modules/".length);
  }
  const at = id.lastIndexOf("@");
  if (at <= 0) return null;
  const version = id.slice(at + 1);
  return /^\d+\.\d+\.\d+/.test(version)
    ? { name: id.slice(0, at), version }
    : null;
}

// 名前 → レジストリから解決する版の集合。レジストリ以外の解決は check-diff が止める
function versionsAt(ref, file) {
  let text;
  try {
    text = git("show", `${ref}:${file}`);
  } catch {
    return new Map();
  }
  const isPnpm = path.basename(file) === "pnpm-lock.yaml";
  const resolutions = isPnpm ? pnpmResolutions(text) : npmResolutions(text);
  const byName = new Map();
  for (const [key, { registry }] of resolutions ?? []) {
    const parsed = registry ? parseKey(key, isPnpm) : null;
    if (!parsed) continue;
    if (!byName.has(parsed.name)) byName.set(parsed.name, new Set());
    byName.get(parsed.name).add(parsed.version);
  }
  return byName;
}

function compareVersions(a, b) {
  const parts = (version) => version.split(/[.+-]/).slice(0, 3).map(Number);
  const [x, y] = [parts(a), parts(b)];
  for (let i = 0; i < 3; i++) {
    if (x[i] !== y[i]) return x[i] - y[i];
  }
  return 0;
}

// _npmUser と maintainers は「名前 <メール>」の文字列か { name, email }
const personName = (person) =>
  (typeof person === "string" ? person : (person?.name ?? ""))
    .replace(/\s*<[^>]*>\s*$/, "")
    .trim();

// 2 つ以上の項目を頼むと、npm view は項目名を鍵にしたオブジェクトを返す
function view(spec, fields) {
  const out = execFileSync("npm", ["view", spec, ...fields, "--json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
  return out === "" ? {} : JSON.parse(out);
}

const added = new Map();
for (const file of lockfiles) {
  const before = versionsAt(mergeBase, file);
  for (const [name, versions] of versionsAt("HEAD", file)) {
    for (const version of versions) {
      if (before.get(name)?.has(version)) continue;
      const previous = [...(before.get(name) ?? [])]
        .sort(compareVersions)
        .at(-1);
      added.set(`${name}@${version}`, { name, version, previous });
    }
  }
}

const problems = [];
try {
  for (const [spec, { name, version, previous }] of added) {
    const next = view(spec, [
      "scripts",
      "_npmUser",
      "dist.attestations",
      "time",
    ]);
    const prev = previous
      ? view(`${name}@${previous}`, [
          "scripts",
          "_npmUser",
          "maintainers",
          "dist.attestations",
        ])
      : null;

    for (const hook of INSTALL_SCRIPTS) {
      const command = next.scripts?.[hook];
      if (command !== undefined && command !== prev?.scripts?.[hook]) {
        problems.push(
          `${spec}: ${hook} が${prev ? `前の版（${previous}）から増えた・変わった` : "ある"}（${command}）`,
        );
      }
    }

    const published = Date.parse(next.time?.[version] ?? "");
    if (Number.isNaN(published)) {
      problems.push(`${spec}: 公開日が分からない`);
    } else if (Date.now() - published < MIN_AGE_DAYS * DAY_MS) {
      problems.push(
        `${spec}: 公開から ${MIN_AGE_DAYS} 日たっていない（${new Date(published).toISOString()}）`,
      );
    }

    if (prev) {
      const user = personName(next._npmUser);
      const trusted = user === TRUSTED_PUBLISHER;
      const prevTrusted = personName(prev._npmUser) === TRUSTED_PUBLISHER;
      const provenance = Boolean(next["dist.attestations"]);
      const prevProvenance = Boolean(prev["dist.attestations"]);
      if (!(trusted && provenance)) {
        if (prevTrusted && !trusted) {
          problems.push(
            `${spec}: 前の版は trusted publishing だったのに、${user || "公開者が分からない"} が公開している`,
          );
        } else if (
          !trusted &&
          !(prev.maintainers ?? []).map(personName).includes(user)
        ) {
          problems.push(
            `${spec}: 公開者 ${user || "（不明）"} が前の版（${previous}）の maintainers にいない`,
          );
        }
        if (prevProvenance && !provenance) {
          problems.push(`${spec}: 前の版にあった provenance がない`);
        }
      }
    }
  }
} catch (error) {
  console.error(`npm に問い合わせられなかった: ${error.message}`);
  process.exit(2);
}

console.log(`新しく入る版: ${added.size} 件`);
if (problems.length > 0) {
  console.log("確かめが要る版がある:");
  for (const problem of problems) console.log(`  ${problem}`);
  process.exit(1);
}
console.log("公開者・install script・公開日に問題はない");
