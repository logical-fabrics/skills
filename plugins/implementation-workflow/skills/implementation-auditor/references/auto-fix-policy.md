# Auto-fix Policy

Audit は原則として読み取り中心。`Auto-fix candidates` は候補提示であり、audit 依頼だけではファイル編集しない。

実編集できるのは、ユーザーが「修正して」と明示した狭い finding、または executor へ handoff された accepted slice の場合だけ。

Safe auto-fix candidates:

- 明らかな typo。
- dead code / unused import。
- formatter / lint fix。
- 小さな命名ズレ。
- test name や docs の明確な誤り。
- UI 文言の軽微な改善。

Plan first:

- UI flow 変更。
- DB schema / migration。
- auth / permission。
- external API。
- production behavior。
- state management。
- architecture boundary。
- large refactor。
- AI model / gateway / cost behavior。

Ask user first:

- product behavior。
- pricing / billing。
- data retention。
- production rollout。
- breaking change。
- 長期保守方針。

実編集する場合も、scope、files、verification、rollback を明示する。
