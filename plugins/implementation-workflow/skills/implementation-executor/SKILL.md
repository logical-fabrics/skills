---
name: implementation-executor
description: Execute an existing Japanese implementation plan safely and incrementally. Use when the user asks in Japanese or English to implement, execute, build, fix, or continue from a plan artifact, docs/implementation/<slug>.md, docs/implementation/current.md, implementation-plan.md, abstract-plan.html, Implementation Handoff, or an approved implementation plan. Japanese natural-language triggers include "current.md の次を実装して", "計画を実装して", "この plan を実行して", "前回の続きから実装して", "P1 を潰して", "検証までやって". Do not use for creating a plan from scratch, broad brainstorming, ordinary code review, deployment-only work, or destructive production operations unless explicitly requested.
---

# Implementation Executor

承認済みまたは明確な実装計画を、repo の規約に沿って狭く検証可能な slice で実装する。

## Capability Boundary

main は要件理解から実装・統合までを担当する。目標は受入品質を保ったまま、完了までの時間・使用量・手直しを抑えること。委任や model の軽量化は手段であり目的ではない。

- plan、repo、docs、schema、routes、UI、tests、設定を読み、plan の古さと判断点を明示する。
- 既定は main 1 体で実装・test・検証まで通す。worker に渡すかは `references/review-and-parallelism.md` の Delegation Value Test で決める。小さく coherent で main に context が揃った作業は、複数ファイルでも main が実装する。
- worker の diff、findings、verification evidence を読み、accept / reject / 差し戻しを決める。
- active plan と handoff の status、completed、next action、verification record を更新する。

Disallowed unless explicitly requested:
- production deploy と、production / billing / auth provider / cloud resource / production database / secret の変更。
- git push、commit、merge、rebase、reset。
- plan を超える scope expansion。
- hidden fallback と、主成果物を seed / sample / mock / demo asset で代替して成功扱いすること。

禁止と許可の完全な定義は `references/safety-guardrails.md`。

## Core Rules

- source of truth は、ユーザーの最新依頼と明示 plan / scope、現在の repo 実態、repo 既存慣習、作業ごとの plan（artifact または local の `docs/implementation/<slug>.md`）の順に確認する。古い plan は停止理由ではなく検証対象であり、絶対視しない。
- ユーザーが plan ファイルを明示したら、それを今回の source of truth にする。active plan への統合は継続運用が必要な場合だけ提案する。
- 依頼された scope を成果物とする。勝手に狭めず、広げず、別の作業に置き換えない。依頼が誤っていると判断したら 1 文で述べ、依頼どおりの範囲をやりきる。
- ユーザーや他エージェントの未コミット変更を戻さない。
- 実装は最小の coherent slice にする。既存の stack、命名、format、test、UI pattern を優先する。
- Delegation Value Test（implementation owner を決める）と low / medium / high risk 判定（独立 review / verification の強さを決める）は別々に行う。どちらも `references/review-and-parallelism.md`。
- 委任時の model / effort は `references/model-routing.md`、host 固有の設定面は `references/host-adapters.md` に従う。
- 軽微で可逆な修正では計画成果物を増やさず、変更内容と検証を簡潔に報告する。
- UI/UX を最上位価値にする。過剰設計は避ける。
- plan の fallback / degraded mode が主成果物を別素材で置き換える設計なら、実装せず P1 として plan / audit へ戻す。失敗は失敗として表示し、再試行、入力変更、既存の本物候補選択、後で再開の導線にする。
- package / library / SDK / CLI を追加・更新・設定変更する時は、current docs と package manager の latest を確認する。古い version への固定は互換性制約がある場合だけにし、理由と解除条件を残す。
- リファクタリングは重要。命名、責務、重複、記述差異が LLM の誤読を招くなら、同じ slice で直す。
- Context7、公式 docs、web で確かめるべき不確実性があれば調べる。
- accepted slice、touched surface、changed behavior に未解決 P0/P1 が残る間、または acceptance criteria の evidence が揃わない間は完了しない。scope 外の P1 は backlog 化すれば完了してよい。
- Execute lane 内では、accepted slice の実装、局所 plan 更新、review、修正、検証、handoff 更新まで自律的に進める。repo / docs / 実行確認で安全に解消できる stale は直してから進む。
- 未承認の別 slice、不可逆操作、production / billing / auth provider / cloud resource / secret / destructive DB 変更へは承認なしに広げない。
- 完了時は `Next Action Contract` を残し、続行 / audit へ戻す / 完了 / 人間判断のどれかを明示する。

## Workflow

1. ユーザーの最新依頼と plan / handoff を読む。
2. `references/plan-readiness.md` で freshness check を行う。
3. `references/artifact-lifecycle.md` で active plan と handoff の更新方針を確認する。
4. 次の実装 slice を狭く決める。
5. `references/review-and-parallelism.md` で Delegation Value Test と risk 判定を行う。委任する場合だけ `references/model-routing.md` で model tier、effort、escalation 条件を決める。
6. 現在の code path、tests、UI、schema、config を確認する。
7. `references/execution-process.md` と canonical delegation contract に従い、main または worker が編集と実装 command を実行する。統合と acceptance 判断は常に main が持つ。
8. 変更領域に関係する references を読む。
9. `references/review-and-parallelism.md` に従って実装レビューを行う。
10. `references/testing-verification.md` に従って検証する。
11. `references/review-and-parallelism.md` の closure 条件に従い、risk 上必要な reviewer / check で未解決 P0/P1 がないことと acceptance evidence が揃ったことを確認する。finding 修正後は changed surface に関係する role / check だけを再実行し、同じ原因で進展しなければ escalation する。
12. active plan の status / completed / next actions / verification / `Next Action Contract` を必要に応じて更新し、変更内容、検証、残リスク、未完了事項を簡潔に報告する。

## Required References

必要なものだけ読む:

- `references/plan-readiness.md`: stale plan、slice selection、blocked 条件。
- `references/artifact-lifecycle.md`: Execute lane での active plan 更新と handoff。置き場所と完了時の扱いの正本は planner 側。
- `references/execution-process.md`: 実装手順、dirty worktree、scope control。
- `references/review-and-parallelism.md`: 委任判断、並列化、review loop、reviewer roles。
- `references/model-routing.md`: Opus 5.5 / Sonnet 5.5 / Haiku 5.5 / Fable 5.1 と GPT-6 Astra / GPT-6.1 Sol / GPT-6 Luna の役割分担、effort、escalation。
- `references/testing-verification.md`: local checks、UI verification、失敗時の扱い。
- `references/safety-guardrails.md`: destructive operation、fallback、secret、production、git。
- `references/ui-implementation.md`: UI 実装、responsive、screenshot、routing、改行。
- `references/data-and-migrations.md`: DB、schema、migration、既存 ORM、raw SQL。
- `references/host-adapters.md`: Codex / Claude Code 固有差分。

## Optional Scripts

- `scripts/check-plan-ready.mjs <plan.md>`

スクリプトは補助であり、plan と repo を読む代替にしない。
