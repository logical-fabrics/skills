---
name: implementation-executor
description: Execute an existing Japanese implementation plan safely and incrementally. Use when the user asks in Japanese or English to implement, execute, build, fix, or continue from docs/implementation/current.md, implementation-plan.md, abstract-plan.html, Implementation Handoff, or an approved implementation plan. Japanese natural-language triggers include "current.md の次を実装して", "計画を実装して", "この plan を実行して", "前回の続きから実装して", "P1 を潰して", "検証までやって". Do not use for creating a plan from scratch, broad brainstorming, ordinary code review, deployment-only work, or destructive production operations unless explicitly requested.
---

# Implementation Executor

承認済みまたは明確な実装計画に従って、現在の repo の規約を守りながら実装する。作業は狭く、検証可能で、レビューしやすく保つ。

## Capability Boundary

Allowed:
- 実装計画、現在の repo、docs、schema、routes、UI、tests、package、設定を読む。
- accepted scope に必要なファイルを編集する。
- local の lint、typecheck、test、build、E2E、UI 検証を実行する。
- plan が古い場合、実装前に差分と判断点を明示する。

Disallowed unless explicitly requested:
- production deploy。
- git push、commit、merge、rebase、reset。
- billing、auth provider、cloud resource、production database、secret の変更。
- plan を超える scope expansion。
- hidden fallback。

## Core Rules

- 既存 repo を source of truth とする。古い plan は検証対象であり、絶対視しない。
- source of truth は、ユーザーの最新依頼と明示 plan / scope、現在の repo 実態、repo 既存慣習、`docs/implementation/current.md` の順に確認する。
- ユーザーが plan ファイルを明示した場合、その plan を今回の source of truth とする。継続運用が必要な場合だけ `docs/implementation/current.md` への統合を提案する。
- ユーザーや他エージェントの未コミット変更を戻さない。
- 実装は最小の coherent slice にする。
- 既存 stack、命名、format、test、UI pattern を優先する。
- 軽微で可逆な修正は、計画成果物を増やさず、変更内容と検証を簡潔に報告する。
- UI/UX を最上位価値にする。ただし過剰設計を避ける。
- リファクタリングは重要。命名、責務、重複、記述差異が LLM の誤読を招く場合は同じ slice で直す。
- Context7、公式 docs、web を使うべき不確実性があれば調査する。
- accepted slice、touched surface、changed behavior に関する P0/P1 findings が残る状態で完了しない。scope 外の P1 は backlog 化して完了可能にする。
- Execute lane 内では、accepted slice の実装、必要な局所 plan 更新、review、修正、検証、handoff 更新まで自律的にやりきる。
- 古い plan は停止理由ではなく検証対象として扱う。repo / docs / 実行確認で安全に解消できる stale は直してから進む。
- ただし未承認の別 slice、不可逆操作、production / billing / auth provider / cloud resource / secret / destructive DB 変更へは勝手に広げない。
- 完了時は `Next Action Contract` を残し、次に続けるべきか、audit へ戻すべきか、完了か、人間判断が必要かを明示する。

## Workflow

1. ユーザーの最新依頼と plan / handoff を読む。
2. `references/plan-readiness.md` で freshness check を行う。
3. `references/artifact-lifecycle.md` で active plan と session handoff の更新方針を確認する。
4. 次の実装 slice を狭く決める。
5. 現在の code path、tests、UI、schema、config を確認する。
6. `references/execution-process.md` に従って実装する。
7. 変更領域に応じて relevant references を読む。
8. `references/review-and-parallelism.md` に従って実装レビューを行う。
9. `references/testing-verification.md` に従って検証する。
10. P0/P1 がなくなるまで修正と再検証を行う。最大 5 review rounds。
11. active plan の status / completed / next actions / verification / `Next Action Contract` を必要に応じて更新し、変更内容、検証、残リスク、未完了事項を簡潔に報告する。

## Required References

必要なものだけ読む:

- `references/plan-readiness.md`: stale plan、slice selection、blocked 条件。
- `references/artifact-lifecycle.md`: active plan、archive、session handoff、古い成果物の扱い。
- `references/execution-process.md`: 実装手順、dirty worktree、scope control。
- `references/review-and-parallelism.md`: 並列化、review loop、reviewer roles。
- `references/testing-verification.md`: local checks、UI verification、失敗時の扱い。
- `references/safety-guardrails.md`: destructive operation、fallback、secret、production、git。
- `references/ui-implementation.md`: UI 実装、responsive、screenshot、routing、改行。
- `references/data-and-migrations.md`: DB、schema、migration、既存 ORM、raw SQL。
- `references/host-adapters.md`: Codex / Claude Code 固有差分。

## Optional Scripts

- `scripts/check-plan-ready.mjs <plan.md>`

スクリプトは補助であり、plan と repo を読む代替にしない。
