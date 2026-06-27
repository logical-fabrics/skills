# Accessibility

ユーザー向け UI、公開 UI、日常利用 UI を変更する場合に読む。

- 規格準拠を良い UX の証明として扱わない。実ユーザーが操作できること、誤解しないこと、回復できることを実ブラウザで確認する。
- WCAG などの規格は、見落とし防止と最低限の guardrail としてだけ使う。
- keyboard だけで主要操作を完了できること。
- focus indicator が見えること。
- focus order が画面の意味順と合っていること。
- form label、error message、help text、required state が視覚表示と支援技術の両方で理解できること。
- icon-only button は accessible name を持つこと。
- contrast、text size、target size、reflow、reduced motion を確認する。
- 自動 a11y check は補助。keyboard 操作と screenshot 確認を省略しない。
