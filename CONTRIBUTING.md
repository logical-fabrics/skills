# Contributing

このリポジトリは、Logical Fabrics のエンジニアへ配布する agent skills / plugins の正本です。

## 原則

- 既存 plugin の skill body を直接重複させない。
- Codex 固有情報は `.codex-plugin/`、Claude Code 固有情報は `.claude-plugin/` に閉じ込める。
- host の plugin schema が root-level component directory を要求する場合は公式配置を優先し、その component が host 固有であることを docs と host adapter に明記する。現在の `agents/` は Claude Code plugin subagents として扱う。
- manifest のメタ表現は host スキーマに合わせる（意図的な host 固有差分）。Codex は marketplace 提示用の `interface` ブロックを使う。Claude Code には `interface` 概念がないため、提示メタは top-level の `displayName` / `keywords` で表し、`interface` は入れない。Claude は未知フィールドを無視するが `claude plugin validate --strict` が警告にするため。`version` は両 manifest で常に同値。
- 共通ルールは `skills/<skill>/references/` に分割する。
- スキル本文は日本語を既定にする。
- `SKILL.md` の frontmatter デリミタ `---` は必ずファイル 1 行目に置く。先頭に HTML コメント等を置くと frontmatter バリデーションが壊れる。
- 社員が使い続けても成果物が散らからないよう、artifact lifecycle を壊さない。
- 過剰設計を避ける。新しい仕組みを足す前に、既存の references / scripts / docs で足りるか確認する。
- この repo の運用で再利用すべきルールは memory ではなく、`AGENTS.md`、`CLAUDE.md`、`CONTRIBUTING.md`、`docs/` に残す。
- Claude Code では薄い slash command alias を増やさず、skill の自然文 trigger と description を優先する。独立した手動 workflow がある場合だけ command を追加する。
- 配布済み plugin の manifest、skills、references、description、component inventory、host exposure を変えたら、`.codex-plugin/plugin.json` と `.claude-plugin/plugin.json` の version を同じ値に bump する。
- version を変えないと、Claude Code などの installed plugin が既存 version を最新と判断し、更新内容を再取得しないことがある。

## スキル本文の書き方

対象は Claude Opus 5.5 / Sonnet 5 / Fable 5.1 と GPT-6 Astra / Sol / Luna 世代。根拠は `docs/model-routing-research.md`。

- host がすでに持つ振る舞い（進捗報告の頻度、自律的に最後までやること、独立した tool call の並列化、一般的な委任判断）を skill で再定義しない。skill には plugin 固有の lane 境界、成果物契約、品質基準、安全上の制約だけを書く。
- `CRITICAL` / `MUST` / 太字の多用 / 「必ず」の連発で強調しない。現行 model は指示に敏感で、強調は過剰発火につながる。条件と理由を平叙文で書く。
- 「よく考えて」「step by step」「もう一度自己確認して」のような推論の代替指示を書かない。推論量は effort で調整し、skill には必要な検証と evidence を具体的に書く。
- 委任は host で既定が違う。Claude Code は指示がなくても subagent を起動するので、skill は起動を抑える条件を書く。Codex は skill や `AGENTS.md` の指示で起動するので、許可する条件を明示する。どちらも `implementation-executor/references/review-and-parallelism.md` を正本にする。
- model 名、effort、host の設定仕様は `model-routing.md` と `host-adapters.md` に集約し、他の file では参照だけにする。host の version 番号や環境変数は、判断に必要なものだけを書く。

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
