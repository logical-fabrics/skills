# Host Adapters

Codex / Claude Code 共通:

- `SKILL.md` と `references/` を正本として読む。
- host 固有 tool 名は必要な場合だけ使う。
- 日本語を既定にする。
- 長時間・複数 slice・検証ループを前提にする実行では `/goal` を使う。目的、成功条件、制約、検証条件に絞り、詳細は active plan に置く。
- 計画が未確定、軽微な修正、通常 audit、ユーザー判断待ちでは `/goal` を作らない。

Codex:

- Codex app browser、MCP、tool は Codex 固有として扱う。
- Codex plugin manifest は `.codex-plugin/plugin.json`。

Claude Code:

- thin slash command alias は配布しない。skill の自然文 trigger と description を入口にする。
- plugin skill は namespace が付く前提で扱う。
- Claude plugin manifest は `.claude-plugin/plugin.json`。
