# Installation

このドキュメントは、`logical-fabrics/skills` repository を Codex / Claude Code の marketplace として登録し、必要な plugin を install する手順です。

現在この repository で配布している plugin は `implementation-workflow` です。plugin が増えた場合は、同じ marketplace 登録の上で install 対象の plugin 名を置き換えます。

## Prerequisites

```bash
cd <LF_SKILLS_DIR>
pnpm install --frozen-lockfile
pnpm validate
```

## Codex

Codex は marketplace 経由で plugin を install します。

Marketplace 登録:

```bash
cd <LF_SKILLS_DIR>
codex plugin marketplace add "$(pwd)"
codex plugin list
```

`implementation-workflow` の install:

```bash
codex plugin add implementation-workflow --marketplace skills
```

`codex plugin marketplace add` が返す marketplace 名が `skills` ではない場合、`codex plugin list` で表示された名前を `--marketplace` に指定します。

`implementation-workflow` の確認:

- `implementation-workflow` が installed plugins に出る。
- 新しい Codex セッションで `implementation-planner`、`implementation-executor`、`implementation-auditor` が skill として見える。
- `現在の実装を見直して`、`実装計画を作って`、`current.md の次を実装して` の自然文で期待する skill が発火する。

## Claude Code

Claude Code は marketplace 経由で plugin を install します。

Marketplace 登録:

```bash
cd <LF_SKILLS_DIR>
claude plugins marketplace add "$(pwd)"
```

`implementation-workflow` の validate / install:

```bash
claude plugins validate --strict plugins/implementation-workflow
claude plugins install implementation-workflow@skills
claude plugins details implementation-workflow
```

自然文プロンプトの例は [prompt-guide.md](prompt-guide.md) を参照してください。

確認:

- `implementation-workflow` の details に `implementation-planner`、`implementation-executor`、`implementation-auditor` の 3 skills が出る。
- `claude plugins validate --strict` が warning なしで通る。
- 自然文で `現在の実装を見直して`、`実装計画を作って`、`current.md の次を実装して` が期待通りに routing される。

## 更新

Repository 更新後、install 済み plugin を最新化します。

```bash
cd <LF_SKILLS_DIR>
git pull
pnpm validate
pnpm lint
```

`implementation-workflow` を更新する例:

```bash
claude plugins update implementation-workflow@skills
```

配布前には `pnpm validate`、`pnpm lint`、host smoke test を必ず通してください。
