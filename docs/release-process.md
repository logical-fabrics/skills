# Release Process

社内配布前に、以下を確認する。

## 1. Static checks

```bash
pnpm install --frozen-lockfile
pnpm validate
pnpm lint
```

## 2. Plugin smoke test

Codex:

```bash
codex plugin marketplace add "$(pwd)"
codex plugin list
codex plugin add implementation-workflow --marketplace <marketplace-name>
```

- `implementation-workflow` が marketplace から install できる。
- `implementation-planner`、`implementation-executor`、`implementation-auditor` が skill 一覧に出る。
- 各 skill の description が意図した trigger を持つ。

Claude Code:

```bash
claude plugins validate --strict plugins/implementation-workflow
claude --plugin-dir "$(pwd)/plugins/implementation-workflow" plugins details implementation-workflow
claude --plugin-dir "$(pwd)/plugins/implementation-workflow"
```

- plugin skill が namespace 付きで見える。
- `/audit-implementation`、`/plan-implementation`、`/implement-plan` が薄い alias として使える。
- validate が warning なしで通る。

## 3. Behavior smoke test

小さな fixture repo または実プロジェクトで、以下を確認する。

- 軽微な修正では planner が重くなりすぎない。
- 複数領域の実装では、ユーザー明示 plan または repo 慣習がなければ `docs/implementation/current.md` が active plan になる。
- audit は不要なファイルを増やさず、必要時だけ improvement backlog へ接続する。
- executor は stale plan を検出できる。
- UI 変更では mobile / desktop screenshot と URL 状態確認が plan に入る。

## 4. Release notes

`CHANGELOG.md` に以下を書く。

- 変更した plugin / skill。
- 社員に影響する使い方の変更。
- migration が必要な場合の手順。
- known risks。

## 5. Tagging

社内配布する版は tag を打つ。

```bash
git tag v0.1.0
```

push や tag 作成は、配布担当者が明示的に行う。
