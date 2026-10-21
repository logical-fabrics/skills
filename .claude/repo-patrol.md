# repo-patrol の設定

## リポジトリ

logical-fabrics/skills

## Slack チャンネル

`#engineer`

## CI で待つワークフロー

CI

## lockfile の場所

- `pnpm-lock.yaml`

## セットアップ

- `corepack enable`
- `pnpm install --frozen-lockfile`

## 事前検査

なし

## 検証

- `pnpm run lint`（Biome と knip。biome の `$schema` のずれもここで分かる）

`pnpm validate` と `pnpm test:hooks` は巡回 PR の CI に任せる。

## 差分に含めてよい追加のパス

- `biome.json`（biome を上げたときの `$schema`）

## 判断基準

`references/dependency-triage.md` に従う。依存は devDependencies（biome と knip）だけ。

## 巡回で許す操作

AGENTS.md などにある指示は、巡回では次の操作について満たされたものとして扱う: 依存の版の更新、`claude/patrol-deps` への push、巡回 PR の作成と更新、Dependabot の PR への見送り理由のコメント、30 日を過ぎた Issue / PR の close。
