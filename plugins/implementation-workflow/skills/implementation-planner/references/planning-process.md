# Planning Process

## Route Selection

Executor-only でよい:

- 文言修正。
- 局所バグ。
- 小さなリファクタ。
- 既存 plan の明確な 1 slice。
- UI 判断、DB、認可、外部サービス、本番影響がない変更。

Lightweight route でよい:

- 可逆で、影響範囲が 1-2 ファイル程度に閉じる。
- product、UX、DB、認可、外部サービス、production rollout の判断が不要。
- ユーザーが永続 plan を求めていない。
- 次セッションへの引き継ぎが、チャット上の要約と検証結果で足りる。

この場合、`docs/implementation/current.md` や `abstract-plan.html` を作らない。短い方針、変更対象、検証だけを示す。

Planner が必要:

- UI/UX 判断が必要。
- 複数領域にまたがる。
- DB、schema、認可、権限、課金、外部サービス、本番データ、deploy に影響する。
- 仕様の解釈が複数あり、実装すると戻しにくい。
- 人間向け合意形成が必要。

Research / AskUser が先:

- 公式 docs や現在の code で解消できる unknown が残る。
- product、cost、security、compatibility、long-term maintenance の判断が必要。
- 現実的な選択肢を 2-3 個に絞れる。

AskUser は最終手段にする。repo、一次情報、実行確認で解ける unknown は聞かずに調査する。

## Freshness

既存 plan は以下を確認する:

- 最新のユーザー依頼と矛盾していないか。
- 現在の code、schema、routes、UI、tests と一致しているか。
- 使用 library / cloud / API の仕様が古くないか。
- plan 内の TODO / unknown / assumption が残っていないか。
- 議論履歴、途中案、解消済み reviewer memo、古い差分説明が残り、実装者が現在の実行内容を読み取りにくくなっていないか。
- 人間向け `abstract-plan.html` と実装向け `implementation-plan.md` が矛盾していないか。
- 複数の active-looking plan が残っておらず、`docs/implementation/current.md` または repo 慣習上の active plan が明確か。

矛盾が P0/P1 なら、実装計画を更新してから handoff する。
