# Simplicity / Overengineering

UI/UX は最上位価値だが、短期的な体験改善のために長期保守性を壊してはならない。

Simplicity reviewer は、価値に効く複雑さと、予測や不安から生まれた複雑さを分ける。

- 現在のユーザー価値、既存仕様、直近で確定している要件を満たす最小構造を選ぶ。
- 抽象化、汎用化、設定化、分散、キュー、イベント駆動、独自 framework、複雑な state machine、過剰な design token、過剰な CI matrix は、現在必要な理由がある場合だけ採用する。
- 「将来使うかもしれない」「拡張しやすそう」だけでは採用しない。
- UI/UX を守るための複雑さは許容する。ただしユーザー価値、代替案、検証方法、削除条件を明記する。
- 既存の単純な実装で十分なら、新しい基盤、adapter、plugin、hook、context、global state、generic schema を追加しない。

Review checks:

- この複雑さは現在のユーザー価値に直接効いているか。
- 既存の仕組みで解けない理由は明確か。
- より狭い scope、単純な data shape、少ない dependency、少ない状態で実現できないか。
- 後で削除・縮小できるか。削除条件は明確か。

