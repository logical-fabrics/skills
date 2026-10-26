# Auto-fix Policy

Audit は読み取りが中心。`Auto-fix candidates` は候補提示であり、audit 依頼だけではファイルを編集しない。

実編集してよいのは、ユーザーが「修正して」と明示した狭い finding か、executor へ handoff された accepted slice だけ。実編集する場合は scope、files、verification、rollback を示す。

Safe auto-fix candidates:

- 明らかな typo。
- dead code / unused import。
- formatter / lint fix。
- 小さな命名ズレ。
- test name や docs の明確な誤り。
- UI 文言の軽微な改善。

Plan first:

- UI flow 変更、state management。
- DB schema / migration。
- auth / permission。
- external API、production behavior。
- architecture boundary、large refactor。
- AI model / gateway / cost behavior。

Ask user first:

- product behavior。
- pricing / billing、data retention。
- production rollout、breaking change。
- 長期保守方針。
