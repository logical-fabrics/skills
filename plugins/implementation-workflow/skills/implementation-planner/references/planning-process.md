# Planning Process

## Route Selection

Executor-only でよい:

- 文言修正、局所バグ、小さなリファクタ、既存 plan の明確な 1 slice。
- UI 判断、DB、認可、外部サービス、本番影響がない変更。

Lightweight route でよい（すべて満たす時）:

- 可逆で、影響範囲が 1-2 ファイル程度に閉じる。
- product、UX、DB、認可、外部サービス、production rollout の判断が不要。
- ユーザーが永続 plan を求めていない。
- 次セッションへの引き継ぎが、チャット上の要約と検証結果で足りる。

この route では plan file も `abstract-plan.html` も作らず、短い方針、変更対象、検証だけを示す。

Planner が必要:

- UI/UX 判断が必要。
- 複数領域にまたがる。
- DB、schema、認可、権限、課金、外部サービス、本番データ、deploy に影響する。
- 仕様の解釈が複数あり、実装すると戻しにくい。
- 人間向け合意形成が必要。

Research が先:

- 公式 docs や現在の code で解消できる unknown が残る。

repo、一次情報、実行確認で解ける unknown は聞かずに調査する。人間が所有する判断（product 方針、UX の方向性、コスト受容、リスク受容、rollout）は調査で代替せず、`ask-user.md` の 3 テストと checkpoint に従ってまとめて確認する。

## Freshness

既存 plan で次を確認する:

- 最新のユーザー依頼と矛盾していないか。
- 現在の code、schema、routes、UI、tests と一致しているか。
- 使用 library / cloud / API の仕様が古くないか。
- package / library / SDK / CLI version が latest 原則に沿っているか。上げられる dependency の upgrade が実装 step と検証に入っているか。
- TODO / unknown / assumption が残っていないか。
- 議論履歴、途中案、解消済み reviewer memo、古い差分説明が、現在の実行内容を読みにくくしていないか。
- `abstract-plan.html` と `implementation-plan.md` が矛盾していないか。
- active-looking plan が複数残っておらず、この作業の active plan（`docs/implementation/<slug>.md` または repo 慣習上の plan）が明確か。別の作業の plan を編集していないか。

P0/P1 の矛盾があれば、実装計画を更新してから handoff する。
