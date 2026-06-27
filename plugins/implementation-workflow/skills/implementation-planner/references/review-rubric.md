# Review Rubric

## Severity

- P0: 安全に使えない。残っていれば停止。
- P1: 高確率で失敗、手戻り、UX 劣化、保守不能を起こす。修正または blocked。
- P2: 改善点。修正、受け入れ、延期のいずれかを記録する。

## Required Reviewers

- Implementation reviewer: 実装手順、scope、検証可能性。
- Adversarial reviewer: 隠れた失敗、矛盾、曖昧さ。
- UX reviewer: `ui-ux.md` の canonical rubric に従い、初見/日常利用、mobile/desktop、状態表示、各 component / 文言のユーザー価値、判断材料と CTA の近接、導線ラベル、result-centered copy、中立的な判断材料提示、forms、accessibility、視線移動とマウス移動を見る。
- Simplicity reviewer: 過剰設計、不要な抽象化、将来予測の複雑化。

Conditional reviewers:

- Schema reviewer: DB schema / migration / validation。
- Security reviewer: auth、secret、permission、CI、external input。
- Delivery reviewer: CI/CD、staging、production、OGP、monitoring。
- AI reviewer: AI UX、AI Gateway、latency、cost、fallback。特に、ユーザーの入力、本人素材、ライブ生成、AI 生成結果などの主成果物を、別素材、seed、sample、mock、demo asset で置き換えて成功扱いしていないかを確認する。

## Stop Conditions

- accepted scope、touched surface、changed behavior に関する P0/P1 がゼロになるまで改善する。
- ユーザーが期待する成果物を別素材で代替して success / preview / published / sent / paid / deleted などの状態に進める設計は P1 以上とし、本人入力と切り離された seed / sample 用途へ分離するまで closure しない。
- scope 外の P0/P1 は隠さず、blocked または backlog として記録する。
- P2 は ledger に残す。
- 最大 10 rounds を超える場合は、残課題と判断不能点を明示してユーザーに確認する。

## Review Round

1 round は次の 3 点を含む:

1. Findings list。
2. 各 finding の fix / accept / defer / blocked 判断。
3. 変更後の verification delta。

「レビューした」とだけ書いて終わらせない。
