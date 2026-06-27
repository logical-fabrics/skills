# Contributing

このリポジトリは、Logical Fabrics のエンジニアへ配布する agent skills / plugins の正本です。

## 原則

- 既存 plugin の skill body を直接重複させない。
- Codex 固有情報は `.codex-plugin/`、Claude Code 固有情報は `.claude-plugin/` に閉じ込める。
- 共通ルールは `skills/<skill>/references/` に分割する。
- スキル本文は日本語を既定にする。
- 社員が使い続けても成果物が散らからないよう、artifact lifecycle を壊さない。
- 過剰設計を避ける。新しい仕組みを足す前に、既存の references / scripts / docs で足りるか確認する。
- この repo の運用で再利用すべきルールは memory ではなく、`AGENTS.md`、`CLAUDE.md`、`CONTRIBUTING.md`、`docs/` に残す。
- Claude Code では薄い slash command alias を増やさず、skill の自然文 trigger と description を優先する。独立した手動 workflow がある場合だけ command を追加する。
- 配布済み plugin の manifest、skills、references、description、component inventory、host exposure を変えたら、`.codex-plugin/plugin.json` と `.claude-plugin/plugin.json` の version を同じ値に bump する。
- version を変えないと、Claude Code などの installed plugin が既存 version を最新と判断し、更新内容を再取得しないことがある。

## 変更前チェック

1. 変更対象 skill の `SKILL.md` を読む。
2. 関連する `references/` を読む。
3. Codex / Claude Code のどちらか片方だけに効く変更か、共通変更かを分ける。
4. 社員配布時に壊れる導入手順がないか確認する。
5. 配布済み plugin に影響する変更なら、version bump が必要か確認する。

## 変更後チェック

```bash
pnpm validate
pnpm lint
```

plugin discovery や command 動作に関わる変更では、[docs/release-process.md](docs/release-process.md) の smoke test も行う。
