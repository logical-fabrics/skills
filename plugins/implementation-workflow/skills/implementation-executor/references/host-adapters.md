# Host Adapters

Codex / Claude Code 共通:

- `SKILL.md` と `references/` を正本として読む。
- host 固有 tool 名は必要な場合だけ使う。
- 日本語を既定にする。

Codex:

- Codex app browser、MCP、tool は Codex 固有として扱う。
- Codex plugin manifest は `.codex-plugin/plugin.json`。

Claude Code:

- slash command は薄い alias として扱う。
- plugin skill は namespace が付く前提で扱う。
- Claude plugin manifest は `.claude-plugin/plugin.json`。

