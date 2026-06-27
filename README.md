# Logical Fabrics Skills

Logical Fabrics のエンジニア向けに配布する Codex / Claude Code 共通プラグイン集です。

## Summary

このリポジトリは、Logical Fabrics のエンジニアが Codex と Claude Code で共通の agent plugin / skill を使うための社内 marketplace です。

リポジトリ名は `logical-fabrics/skills` です。複数の plugin を同じリポジトリで配布できる前提で、共通の skill body、host 固有 manifest、導入手順、release checks を管理します。

現在配布している plugin は `implementation-workflow` の 1 つです。今後 plugin が増えても、README は repo / marketplace 全体の入口として保ち、各 plugin の詳細は plugin catalog と個別 docs に分けます。

## Plugin Catalog

| Plugin | Status | Purpose | Docs |
| --- | --- | --- | --- |
| `implementation-workflow` | active | 実装の audit、plan、execute を Codex / Claude Code で揃える | [docs/prompt-guide.md](docs/prompt-guide.md) |

### implementation-workflow

`implementation-workflow` は、実装をいきなり始めるための道具ではありません。現在の実装を読み、必要なら調査し、実装計画を作り、複数観点でレビューし、最小単位で実装し、検証し、残った問題をまた計画に戻すための workflow です。

主な入口:

| Entry | Use case | Expected behavior |
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

Design priorities:

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

## Repository Principles

この repository 全体で重視すること:

- この repo は plugin / skill の配布正本として扱う。
- 共通の skill body と host 固有 manifest を分ける。
- Codex と Claude Code の挙動は、意図した host 固有差分を docs に明記する場合を除き揃える。
- 新しい plugin は、この README の catalog、導入 docs、release checks から辿れる状態にする。
- 配布済み plugin の manifest、skill discovery、command 露出、配布挙動を変える場合は、release process に従う。
- この repo の運用ルールは外部 memory に頼らず、`AGENTS.md`、`CONTRIBUTING.md`、`docs/` に残す。

## Repository Layout

```text
plugins/
  <plugin-name>/
    .codex-plugin/plugin.json
    .claude-plugin/plugin.json
    skills/
      <skill-name>/
        SKILL.md
        references/
        scripts/
docs/
scripts/
```

現存 plugin:

```text
plugins/
  implementation-workflow/
    skills/
      implementation-auditor/
      implementation-planner/
      implementation-executor/
```

## Shared Conventions

- 共通の skill body は `plugins/<plugin>/skills/` に置く。
- Codex 固有情報は `.codex-plugin/` に閉じ込める。
- Claude Code 固有情報は `.claude-plugin/` に閉じ込める。
- スキル本文は日本語を既定にする。
- Claude Code では薄い slash command alias を増やさず、skill の自然文 trigger と description を優先する。
- 配布済み plugin の manifest、skills、references、description、component inventory、host exposure を変えたら version を bump する。
- Plugin 固有の技術スタック、成果物 lifecycle、プロンプト例は、その plugin の docs または references に閉じる。

## Artifact Lifecycle

`implementation-workflow` は、開発が複数セッションにまたがる前提で動きます。

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

新しい plugin を追加する場合は、その plugin 固有の成果物 lifecycle を plugin docs または references に明記します。

## Validation

```bash
pnpm install
pnpm validate
pnpm lint
```

`pnpm validate` は、plugin manifest、skill frontmatter、reference link の最低限の静的構造を検証します。配布前には host 側の plugin discovery smoke test も行ってください。

品質ゲートは [docs/quality-gates.md](docs/quality-gates.md) にまとめています。

## Internal Distribution

このリポジトリを clone した上で、Codex / Claude Code の marketplace として登録します。

```bash
git clone https://github.com/logical-fabrics/skills.git
cd skills
pnpm install --frozen-lockfile
pnpm validate
```

Codex で `implementation-workflow` を install する例:

```bash
codex plugin marketplace add "$(pwd)"
codex plugin add implementation-workflow --marketplace skills
```

Claude Code で `implementation-workflow` を install する例:

```bash
claude plugins marketplace add "$(pwd)"
claude plugins install implementation-workflow@skills
```

この環境では、`implementation-workflow@skills` が Codex と Claude Code の両方に install されることを確認済みです。

導入手順は [docs/installation.md](docs/installation.md) を参照してください。

社員向けの `implementation-workflow` の使い方とプロンプト例は [docs/prompt-guide.md](docs/prompt-guide.md) を参照してください。

## Operations

- 変更ルール: [CONTRIBUTING.md](CONTRIBUTING.md)
- リリース手順: [docs/release-process.md](docs/release-process.md)
- 変更履歴: [CHANGELOG.md](CHANGELOG.md)
