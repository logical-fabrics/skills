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
- ユーザーがページ、タブ、詳細画面、検索結果、管理対象、workflow step と認識する状態が URL に載っているか。local state だけで画面が切り替わり、戻る、リロード、直接アクセス、共有 URL が期待とずれる場合は P1 候補にする。
- 認証、権限、onboarding、tenant selection などの gate で、開こうとした URL が保持されているか。権限不足や対象なしを無関係な default 画面への redirect で隠していないか。
- planner `ui-ux.md` の canonical rubric に照らして、layout/action placement、result-centered copy、state/recovery、forms/accessibility が破綻していないか。
- ユーザーの入力、本人素材、ライブ生成、AI 生成結果などの主成果物が、別素材、seed、sample、mock、demo asset で代替されて成功扱いされていないか。明示表示されていても、ユーザー期待と異なる成果物を preview / published / sent / success に進めるなら finding にする。
- 特に、判断材料と CTA の距離、desktop の視線移動、導線ラベルの一貫性、操作後の結果説明、通知/共有/可逆性、不要な理由入力、操作後に仕事が進んだと分かるかを確認する。
- ユーザー向け文言が、行動を指示する `次に〜`、`〜したい`、`1問`、`深掘り`、`やること`、`できること` に寄っていないか確認する。判断材料を中立に示す `確認ポイント`、`確認が必要な〜`、`判断が必要な〜`、`この後の流れ`、`復旧方法` などへ置き換えられる場合は finding にする。
- キュー型 UI では、操作後に対象がキューから外れるか、次の対象に進むか、完了状態や戻り先が分かるかを確認する。
- 「保留」など、押しても業務上の扱いが変わらない操作が選択肢になっていないか確認する。

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
- 標準の `dev` command が production に近い runtime / binding contract を通っているか。frontend と backend/runtime の分離 proxy や local-only binding で、本来必要な接続失敗を隠していないか。
- 外部 service / media / AI / storage など、機能成立に必要な binding が remote / live 接続なしでは動かない場合、その未確認を feature-ready として扱っていないか。
- regression を防ぐ最低限の coverage があるか。

Data / Auth / Security:

- schema が YAGNI に反していないか。
- raw SQL、権限、validation、migration、rollback が安全か。
- auth UI が passwordless 方針、復帰導線、失敗時説明を満たすか。

Delivery / Operations:

- CI/CD、staging、production、OGP、monitoring、analytics、Sentry、robots が必要に応じて整っているか。
- logs、metrics、trace、business events で問題追跡できるか。
- local dev、staging、production の起動経路が不必要に分岐していないか。platform 公式の統合 dev path があるのに、古い split dev server / proxy を標準にしていないか。

AI:

- AI が入力負荷、言語化負荷、認知負荷を下げているか。
- AI output がテキストだけに閉じず、比較、選択、修正しやすい形か。
- Gateway、latency、cost、failure、retry、不可逆操作の確認が設計されているか。
- 失敗時に「別素材を出して成功に見せる」のではなく、失敗理由、再試行、入力変更、既存の本物候補選択、後で再開の導線になっているか。
