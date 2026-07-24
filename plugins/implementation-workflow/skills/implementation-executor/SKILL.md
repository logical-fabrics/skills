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
- accepted scope と risk に関係する local の lint、typecheck、test、build、targeted E2E、UI 検証を実行する。full E2E は repo / user / release gate または高リスク変更で必要な場合に限る。
- plan が古い場合、実装前に差分と判断点を明示する。

Disallowed unless explicitly requested:
- production deploy と、production / billing / auth provider / cloud resource / production database / secret の変更。
- git push、commit、merge、rebase、reset。
- plan を超える scope expansion。
- hidden fallback と、主成果物を seed / sample / mock / demo asset で代替して成功扱いすること。

禁止と許可の完全な定義は `references/safety-guardrails.md`。

## Core Rules

- 既存 repo を source of truth とする。古い plan は検証対象であり、絶対視しない。
- source of truth は、ユーザーの最新依頼と明示 plan / scope、現在の repo 実態、repo 既存慣習、`docs/implementation/current.md` の順に確認する。
- ユーザーが plan ファイルを明示した場合、その plan を今回の source of truth とする。継続運用が必要な場合だけ `docs/implementation/current.md` への統合を提案する。
- ユーザーや他エージェントの未コミット変更を戻さない。
- 実装は最小の coherent slice にする。
- `references/review-and-parallelism.md` に従って low / medium / high risk を選び、必要な role だけ分ける。low-risk の小さく可逆な変更はメインエージェントが直接実装してよい。medium / high risk では implementation と独立 review を分け、高リスク時だけ domain reviewer / verifier を追加する。
- orchestration の既定形は flat な main → leaf workers とする。host の concurrency / depth cap を尊重し、Codex `ultra` または Claude Code `ultracode` / dynamic workflow と manual fan-out を同じ workstream に重ねない。
- model / effort / escalation を選択できる host では `references/model-routing.md` を canonical policy とする。ここでは再掲しない。
- 既存 stack、命名、format、test、UI pattern を優先する。
- 軽微で可逆な修正は、計画成果物を増やさず、変更内容と検証を簡潔に報告する。
- UI/UX を最上位価値にする。ただし過剰設計を避ける。
- plan に fallback / degraded mode が書かれていても、それがユーザーの期待する主成果物を別素材で置き換える設計なら実装せず、P1 として plan / audit へ戻す。失敗は失敗として表示し、再試行、入力変更、既存の本物候補選択、後で再開の導線にする。
- package / library / SDK / CLI を追加・更新・設定変更する場合は、current docs と package manager の latest を確認する。latest より古い version に固定するのは互換性制約がある場合だけにし、理由と解除条件を残す。
- リファクタリングは重要。命名、責務、重複、記述差異が LLM の誤読を招く場合は同じ slice で直す。
- Context7、公式 docs、web を使うべき不確実性があれば調査する。
- accepted slice、touched surface、changed behavior に関する未解決 P0/P1 が残る状態、または acceptance criteria に対応する evidence が揃っていない状態で完了しない。scope 外の P1 は backlog 化して完了可能にする。
- Execute lane 内では、accepted slice の実装、必要な局所 plan 更新、review、修正、検証、handoff 更新まで自律的にやりきる。
- 古い plan は停止理由ではなく検証対象として扱う。repo / docs / 実行確認で安全に解消できる stale は直してから進む。
- ただし未承認の別 slice、不可逆操作、production / billing / auth provider / cloud resource / secret / destructive DB 変更へは勝手に広げない。
- 完了時は `Next Action Contract` を残し、次に続けるべきか、audit へ戻すべきか、完了か、人間判断が必要かを明示する。

## Workflow

1. ユーザーの最新依頼と plan / handoff を読む。
2. `references/plan-readiness.md` で freshness check を行う。
3. `references/artifact-lifecycle.md` で active plan と session handoff の更新方針を確認する。
4. 次の実装 slice を狭く決める。
5. `references/review-and-parallelism.md` と `references/model-routing.md` で orchestration / delegation plan、model tier、effort、escalation 条件を決める。
6. 現在の code path、tests、UI、schema、config を確認する。
7. `references/execution-process.md` に従って実装する。risk に応じて直接実装または worker 委任を選び、メインエージェントは統合と acceptance 判断を担う。
8. 変更領域に応じて relevant references を読む。
9. `references/review-and-parallelism.md` に従って実装レビューを行う。
10. `references/testing-verification.md` に従って検証する。
11. `references/review-and-parallelism.md` の closure 条件に従い、risk 上必要な reviewer / check で未解決 P0/P1 がないことと、acceptance evidence が揃ったことを確認する。finding 修正後は changed surface に関係する role / check だけを再実行し、同じ原因で進展しない場合は escalation する。
12. active plan の status / completed / next actions / verification / `Next Action Contract` を必要に応じて更新し、変更内容、検証、残リスク、未完了事項を簡潔に報告する。

## Required References

必要なものだけ読む:

- `references/plan-readiness.md`: stale plan、slice selection、blocked 条件。
- `references/artifact-lifecycle.md`: Execute lane での active plan 更新と handoff。置き場所と archive の正本は planner 側。
- `references/execution-process.md`: 実装手順、dirty worktree、scope control。
- `references/review-and-parallelism.md`: 並列化、review loop、reviewer roles。
- `references/model-routing.md`: Opus 5 / Fable 5 / Sonnet 5 / Haiku 4.5 と GPT-5.6 Sol / Terra / Luna の役割分担、availability、effort、委任 guardrail、escalation。
- `references/testing-verification.md`: local checks、UI verification、失敗時の扱い。
- `references/safety-guardrails.md`: destructive operation、fallback、secret、production、git。
- `references/ui-implementation.md`: UI 実装、responsive、screenshot、routing、改行。
- `references/data-and-migrations.md`: DB、schema、migration、既存 ORM、raw SQL。
- `references/host-adapters.md`: Codex / Claude Code 固有差分。

## Optional Scripts

- `scripts/check-plan-ready.mjs <plan.md>`

スクリプトは補助であり、plan と repo を読む代替にしない。
