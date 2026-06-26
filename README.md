# LF Skills

Logical Fabrics のエンジニア向けに配布する Codex / Claude Code 共通プラグイン集です。

## Summary

このリポジトリは、Logical Fabrics のエンジニアが Codex と Claude Code で同じ開発プロセスを使うための社内プラグイン集です。最初のプラグインとして `implementation-workflow` を提供します。

リポジトリ名は `lf-skills` です。今後、複数の plugin / skill を同じリポジトリに追加していく前提で、Codex と Claude Code の marketplace として使います。

`implementation-workflow` は、実装をいきなり始めるための道具ではありません。現在の実装を読み、必要なら調査し、実装計画を作り、複数観点でレビューし、最小単位で実装し、検証し、残った問題をまた計画に戻すためのワークフローです。開発が複数セッションにまたがっても、次の担当者や次の AI セッションが迷わず再開できることを重視します。

特に重視すること:

- UI/UX を最上位価値として扱う。
- コンポーネントと文言の一つ一つが、ユーザーの理解、判断、操作、安心、回復に役立つか確認する。
- なくしても UX 影響がない要素は削除し、情報不足で次に何をすればよいか分からない状態は避ける。
- 既存プロジェクトの設計、命名、テスト、UI ルールを優先する。
- 過剰設計、不要な抽象化、見せかけの品質ゲートを避ける。
- 実装計画、実装、レビュー、検証、修正の改善ループを回す。
- 古い会話履歴ではなく、現在の repo、明示された plan、active plan を source of truth にする。
- UI 変更では、実ブラウザでハッピーパス、モバイル、デスクトップ、戻る、リロード、URL 状態、日本語の改行を確認する。
- DB schema 変更では YAGNI、migration、rollback、既存データへの影響を厳しく見る。
- 不明点は調査し、調査で決められない判断だけユーザーに確認する。

このプラグインは以下の 3 つの入口で使います。

| 入口 | 使う場面 | 期待する動き |
| --- | --- | --- |
| Audit | 今の実装が本当に良い状態か見直したい | UX、設計、過剰設計、テスト、DB、運用などを evidence 付きでレビューする |
| Plan | 実装前に方針を固めたい | 実装担当 LLM が迷わない計画を作り、複数観点レビューで改善する |
| Execute | 既存 plan に沿って実装したい | 最小 slice で実装し、検証し、必要なら plan / handoff を更新する |

よく使うプロンプト:

```text
現在の実装を見直して、UX・設計・テスト・過剰設計の問題を洗い出して
```

```text
この機能の実装計画を作って。docs/implementation/current.md にまとめて
```

```text
docs/implementation/current.md の次の slice を実装して、検証までやって
```

詳しい使い方は [docs/prompt-guide.md](docs/prompt-guide.md) を参照してください。

## 構成

```text
plugins/
  implementation-workflow/
    .codex-plugin/plugin.json
    .claude-plugin/plugin.json
    skills/
      implementation-auditor/
      implementation-planner/
      implementation-executor/
    commands/
docs/
scripts/
```

## 方針

- 共通の skill body は `plugins/<plugin>/skills/` に置く。
- Codex 固有情報は `.codex-plugin/` に閉じ込める。
- Claude Code 固有情報は `.claude-plugin/` と `commands/` に閉じ込める。
- スキル本文は日本語を既定にする。
- UI/UX を最上位価値にしつつ、過剰設計を避ける。
- 既存プロジェクトの設計、命名、テスト、UI ルールを優先する。
- Cloudflare、Drizzle、Better Auth、Hono、React、Vite、Vitest、Zod は、既存スタックが未確定のときの既定候補として扱う。

## 成果物運用

この workflow は、開発が複数セッションにまたがる前提で動きます。

ユーザーが plan ファイルを明示しておらず、既存プロジェクトに慣習もない場合、計画成果物は以下に集約します。

```text
docs/implementation/
  README.md
  current.md
  abstract-plan.html
  archive/
```

- 既存 repo に慣習やユーザー明示 plan がない場合、`current.md` が既定の active plan。
- 新しいセッションは、会話履歴ではなく明確な active plan と現在の repo を source of truth にする。
- 古い plan は横に増やさず、必要なものだけ `archive/` に薄く残す。
- `abstract-plan.html` は人間向け合意形成が必要な場合だけ作る。
- `implementation-plan-v2.md`、`final.md`、`final-final.md` のようなファイル増殖は禁止。

## 検証

```bash
pnpm install
pnpm validate
pnpm lint
```

`pnpm validate` は、plugin manifest、skill frontmatter、reference link、Claude command frontmatter の最低限の静的構造を検証します。配布前には host 側の plugin discovery smoke test も行ってください。

品質ゲートは [docs/quality-gates.md](docs/quality-gates.md) にまとめています。

## 社内配布

このリポジトリを clone した上で、Codex / Claude Code の marketplace として登録します。

```bash
git clone https://github.com/logical-fabrics/lf-skills.git
cd lf-skills
pnpm install --frozen-lockfile
pnpm validate
```

Codex:

```bash
codex plugin marketplace add "$(pwd)"
codex plugin add implementation-workflow --marketplace lf-skills
```

Claude Code:

```bash
claude plugins marketplace add "$(pwd)"
claude plugins install implementation-workflow@lf-skills
```

この環境では、`implementation-workflow@lf-skills` が Codex と Claude Code の両方に install されることを確認済みです。

導入手順は [docs/installation.md](docs/installation.md) を参照してください。

社員向けの使い方とプロンプト例は [docs/prompt-guide.md](docs/prompt-guide.md) を参照してください。

## 運用

- 変更ルール: [CONTRIBUTING.md](CONTRIBUTING.md)
- リリース手順: [docs/release-process.md](docs/release-process.md)
- 変更履歴: [CHANGELOG.md](CHANGELOG.md)
