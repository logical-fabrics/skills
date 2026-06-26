# Host Adapters

この plugin は Codex / Claude Code 共通の Agent Skills として書く。

共通:

- `SKILL.md` と `references/` を正本にする。
- 日本語を既定にする。
- host 固有の tool 名は、必要な場合だけ明記する。

Codex:

- `.codex-plugin/plugin.json` は Codex 配布用。
- Codex 固有の用語、app browser、tool、MCP は Codex 専用として分けて書く。

Claude Code:

- `.claude-plugin/plugin.json` は Claude Code 配布用。
- `commands/` は薄い alias として使い、skill 本体を重複させない。
- Claude Code 固有の slash command や namespace は Claude 専用として分けて書く。

