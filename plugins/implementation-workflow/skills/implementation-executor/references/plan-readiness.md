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

stale な場合は実装せず、差分と必要判断をユーザーに返す。
