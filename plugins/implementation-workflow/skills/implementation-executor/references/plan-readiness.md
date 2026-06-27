# Plan Readiness

実装前に plan を検証する。

Ready:

- Goal、scope、non-goals、対象ファイル、手順、検証が明確。
- Status、Last updated、Current state、Next actions、Implementation Handoff がある。
- 現在の repo、schema、routes、UI、tests と矛盾していない。
- accepted slice、touched surface、changed behavior に関する P0/P1 findings が残っていない。
- AskUser が必要な判断が残っていない。

Stale / Blocked:

- 最新のユーザー依頼と矛盾する。
- 対象 code path が変わっている。
- schema、auth、infra、API、UI の前提が古い。
- implementation-plan と abstract-plan が矛盾する。
- 複数の active-looking plan があり、ユーザー明示 plan も repo 慣習もなく、どれが source of truth か分からない。
- production、billing、auth provider、cloud resource、secret、destructive DB に触る必要があるが明示依頼がない。

Recoverable stale:

- code path、test 名、route、軽微な docs 構成、検証 command が変わっているが、現在の repo / docs / 実行確認で解消できる。
- plan 内の TODO / AskUser / assumption が、product 判断ではなく調査不足や古い記述に由来する。
- accepted slice の scope、UX、data model、security、production behavior を変えずに修正できる。

recoverable stale は、実装前に active plan / handoff を更新し、必要なら readiness check を再実行してから次の安全な slice へ進む。

Blocked stale:

- 最新依頼と矛盾し、どの scope を優先するか判断が必要。
- 複数の active-looking plan があり、repo 慣習でも source of truth を決められない。
- product、business、security、data retention、billing、production rollout、breaking change の判断が必要。
- accepted slice を超える大きな設計変更が必要。

blocked stale の場合だけ、実装せず、差分、推奨案、代替案、未回答時に進められない理由をユーザーに返す。
