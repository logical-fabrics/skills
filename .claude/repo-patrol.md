# repo-patrol の設定

## リポジトリ

logical-fabrics/skills

## Slack チャンネル

`#engineer`

## CI で待つワークフロー

CI

## lockfile の場所

- `pnpm-lock.yaml`

## 差分に含めてよい追加のパス

- `biome.json`（biome を上げたときの `$schema`）

## 判断基準

`references/dependency-triage.md` に従う。依存は devDependencies（biome と knip）だけ。

## 巡回で許す操作

AGENTS.md などにある指示は、巡回では次の操作について満たされたものとして扱う: Dependabot の PR への見送り理由のコメント。
