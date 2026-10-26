# Plan Readiness

実装前に plan を検証する。

Ready:

- Goal、scope、non-goals、対象ファイル、手順、検証が明確。
- Status、Last updated、Current state、Next actions、Implementation Handoff がある。
- 現在の repo、schema、routes、UI、tests と矛盾しない。
- package / library / SDK / CLI version が latest 原則と矛盾しない。古い version には互換性制約と解除条件が書かれている。
- accepted slice、touched surface、changed behavior に P0/P1 findings が残っていない。
- AskUser が必要な判断が残っていない。`## Review Findings` 内の `Decision Log:` で始まる行は planner が解決済みの代行判断なので、未解決判断や blocked 理由として扱わない。

Stale / Blocked:

- 最新のユーザー依頼と矛盾する。
- 対象 code path が変わっている。
- schema、auth、infra、API、UI の前提が古い。
- implementation-plan と abstract-plan が矛盾する。
- active-looking plan が複数あり、ユーザー明示 plan も repo 慣習もなく、source of truth を決められない。
- production、billing、auth provider、cloud resource、secret、destructive DB に触る必要があるが明示依頼がない。

Recoverable stale:

- code path、test 名、route、軽微な docs 構成、検証 command の変化で、現在の repo / docs / 実行確認で解消できる。
- plan 内の TODO / AskUser / assumption が、product 判断ではなく調査不足や古い記述に由来する。
- accepted slice の scope、UX、data model、security、production behavior を変えずに直せる。

recoverable stale は、実装前に active plan / handoff を更新し、必要なら readiness check を再実行して、次の安全な slice へ進む。

Blocked stale:

- 最新依頼と矛盾し、どの scope を優先するか判断が必要。
- active-looking plan が複数あり、repo 慣習でも source of truth を決められない。
- product、business、security、data retention、billing、production rollout、breaking change の判断が必要。
- accepted slice を超える大きな設計変更が必要。

blocked stale の場合だけ実装せず、差分、推奨案、代替案、未回答では進められない理由をユーザーに返す。
