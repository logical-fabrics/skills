# Audit Rubric

## Severity

- P0: ユーザーが安全に使えない、データ破壊、本番事故、主導線破壊。
- P1: 高確率で UX 劣化、保守不能、バグ、検証不能、手戻りを生む。
- P2: 改善点。修正、受け入れ、延期の判断を残す。

## Review Domains

UX:

- 初見ユーザーが迷わないか。
- 日常利用で操作が重くないか。
- 日本語、モバイル、改行、loading、empty、error、permission が破綻していないか。
- URL、戻る、リロード、直接アクセスが期待通りか。

Architecture:

- 名前と責務が一致しているか。
- 関数、component、module が適切に分割されているか。
- 同じ概念が別名や別 schema で表現されていないか。
- 変更しづらい密結合がないか。

Simplicity:

- 現在のユーザー価値に見合わない抽象化、汎用化、設定化、独自基盤、複雑な state 管理がないか。
- 将来予測だけで DB schema、API、feature flag、queue、event を増やしていないか。

Verification:

- 重要導線に test または実ブラウザ確認があるか。
- mock-only 成功を real path 成功として扱っていないか。
- regression を防ぐ最低限の coverage があるか。

Data / Auth / Security:

- schema が YAGNI に反していないか。
- raw SQL、権限、validation、migration、rollback が安全か。
- auth UI が passwordless 方針、復帰導線、失敗時説明を満たすか。

Delivery / Operations:

- CI/CD、staging、production、OGP、monitoring、analytics、Sentry、robots が必要に応じて整っているか。
- logs、metrics、trace、business events で問題追跡できるか。

AI:

- AI が入力負荷、言語化負荷、認知負荷を下げているか。
- AI output がテキストだけに閉じず、比較、選択、修正しやすい形か。
- Gateway、latency、cost、failure、retry、不可逆操作の確認が設計されているか。

