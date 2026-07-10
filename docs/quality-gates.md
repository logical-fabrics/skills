# Quality Gates

このリポジトリで plugin / skill を変更する時の最低品質ゲート。

## Required

- `pnpm validate` が通る。
- `pnpm lint` が通る。
- 新しい skill は `SKILL.md` に `Capability Boundary`、`Core Rules`、`Workflow`、`Required References` を持つ。
- `SKILL.md` から参照する `references/*.md` が存在する。
- plugin に `hooks/hooks.json` がある場合、JSON 構造と参照 script が `pnpm validate` で検証される。
- Claude Code では薄い slash command alias を増やさず、skill の自然文 trigger を優先する。
- Codex / Claude Code 固有情報を共通本文に混ぜない。

## Review

- 社員が初見で導入できるか。
- セッションをまたいでも、ユーザー明示 plan、repo 慣習上の active plan、または `docs/implementation/current.md` から再開できるか。
- 古い plan や audit report が増殖しないか。
- audit / plan / execute の lane 境界を勝手に越えず、各 lane の最後に次 action が明確か。
- repo / docs / 実行確認で解ける unknown をユーザーに戻しすぎていないか。
- UI/UX 価値を守れているか。
- verification が changed behavior と risk に比例し、軽微な変更へ full E2E や無関係な viewport / state matrix を要求していないか。
- 過剰設計になっていないか。
- 既存プロジェクトの慣習を壊さないか。

## Blocking

- plugin manifest が壊れている。
- skill discovery を阻害する frontmatter 不備がある。
- reference link が欠けている。
- hook command が存在しない script を参照している。
- 成果物 lifecycle に反する指示がある。
- hidden fallback、mock-only success、production 変更の無断実行を許す記述がある。
