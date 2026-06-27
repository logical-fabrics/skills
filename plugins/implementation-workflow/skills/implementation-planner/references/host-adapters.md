# Host Adapters

この plugin は Codex / Claude Code 共通の Agent Skills として書く。

共通:

- `SKILL.md` と `references/` を正本にする。
- 日本語を既定にする。
- host 固有の tool 名は、必要な場合だけ明記する。

Codex:

- `.codex-plugin/plugin.json` は Codex 配布用。
- marketplace 提示用の `interface` ブロック（`displayName` / `shortDescription` / `defaultPrompt` / `brandColor` 等）は Codex 側のみに置く。Codex は `interface` を推奨フィールドとして扱う。
- Codex 固有の用語、app browser、tool、MCP は Codex 専用として分けて書く。

Claude Code:

- `.claude-plugin/plugin.json` は Claude Code 配布用。
- Claude Code に `interface` 概念はない。提示メタは top-level の `displayName` / `keywords` で表し、`interface` ブロックは入れない。Claude は未知 top-level フィールドを無視するが `claude plugin validate --strict`（release smoke で使用）が警告にするため。
- 2 manifest の version は常に揃える。`interface`（Codex）と `displayName` + `keywords`（Claude）の差は、各 host のスキーマ差による意図的な host 固有差分。
- thin slash command alias は配布しない。入口を増やすより、skill の自然文 trigger と description を整える。
- Claude Code 固有の namespace は Claude 専用として分けて書く。
