# Installation

## Codex

Codex は marketplace 経由で plugin を install します。

リポジトリを clone した場所で実行します。

```bash
cd <LF_SKILLS_DIR>
pnpm install --frozen-lockfile
pnpm validate
codex plugin marketplace add "$(pwd)"
codex plugin list
codex plugin add implementation-workflow --marketplace lf-skills
```

`codex plugin marketplace add` が返す marketplace 名が `lf-skills` ではない場合、`codex plugin list` で表示された名前を `--marketplace` に指定します。

確認:

- `implementation-workflow` が installed plugins に出る。
- 新しい Codex セッションで `implementation-planner`、`implementation-executor`、`implementation-auditor` が skill として見える。
- `現在の実装を見直して`、`実装計画を作って`、`current.md の次を実装して` の自然文で期待する skill が発火する。

## Claude Code

Claude Code は marketplace 経由で plugin を install します。

```bash
cd <LF_SKILLS_DIR>
pnpm install --frozen-lockfile
pnpm validate
claude plugins validate --strict plugins/implementation-workflow
claude plugins marketplace add "$(pwd)"
claude plugins install implementation-workflow@lf-skills
claude plugins details implementation-workflow
```

自然文プロンプトの例は [prompt-guide.md](prompt-guide.md) を参照してください。

確認:

- `implementation-workflow` の details に `implementation-planner`、`implementation-executor`、`implementation-auditor` の 3 skills が出る。
- `claude plugins validate --strict` が warning なしで通る。
- 自然文で `現在の実装を見直して`、`実装計画を作って`、`current.md の次を実装して` が期待通りに routing される。

## 更新

```bash
cd <LF_SKILLS_DIR>
git pull
pnpm validate
pnpm lint
```

配布前には `pnpm validate`、`pnpm lint`、host smoke test を必ず通してください。
