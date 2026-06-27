---
name: implementation-planner
description: Create, review, and improve Japanese implementation plans for another LLM or engineer to execute. Use when the user asks in Japanese or English for an implementation plan, implementation-plan.md, docs/implementation/current.md, abstract-plan.html, a plan before coding, a handoff plan, or a review/refinement of an existing plan. Japanese natural-language triggers include "実装計画を作って", "計画を立てて", "current.md にまとめて", "実装前に設計して", "この計画をレビューして", "実装方針を整理して". Do not use for direct implementation, ordinary code review, README writing, pure brainstorming, or simple bug fixes unless the user explicitly asks for a plan first.
---

# Implementation Planner

日本語で、別の LLM またはエンジニアが迷わず実装できる計画を作る。目的は、最良の UI/UX と安全な実装を、過剰設計なしで実現すること。

## Capability Boundary

この skill は計画を作る。実装はしない。

Allowed:
- 現在の repo、docs、schema、route、UI、test、package、設定を読む。
- 公式 docs、Context7、web、ライブ画面を必要に応じて確認する。
- 既存 repo 慣習、ユーザー指定、または `docs/implementation/current.md` に実装計画を作る。
- 必要な場合は人間向け `abstract-plan.html` を作る。
- 複数観点レビューを行い、P0/P1/P2 findings を整理する。

Disallowed unless explicitly requested:
- 実装ファイルを編集する。
- production、billing、auth provider、cloud resource、database、secret を変更する。
- 推測を確定事実として扱う。
- hidden fallback を成功扱いする。

## Core Rules

- 日本語を既定にする。
- 既存 repo の実態を最優先する。greenfield または未確定時だけ default stack を使う。
- source of truth は、ユーザーの最新依頼と明示 plan / scope、現在の repo 実態、repo 既存慣習、`docs/implementation/current.md` の順に確認する。
- ユーザーが plan ファイルを明示した場合、そのファイルをその依頼の source of truth として扱う。継続運用が必要な場合だけ `docs/implementation/current.md` への統合を提案する。
- 計画は implementation LLM 向けに具体化する。対象ファイル、手順、検証、停止条件を書く。
- 人間向けにはコード変数ではなく、目的、アーキテクチャ、判断、リスク、検証を説明する。
- UI/UX を最上位価値にする。ただし短期 UX を理由に過剰設計を入れない。
- 軽微で可逆な作業では、永続 plan や `abstract-plan.html` を作らず、短い方針と検証だけで終えてよい。
- レビューは P0/P1 がゼロになるまで回す。P2 は修正、受け入れ、延期のいずれかを記録する。
- material unknown は調査する。repo や一次情報で解けず、product / business / rollout 判断が必要な場合だけ AskUserTool または host equivalent を使う。
- Plan lane 内では、調査、unknown 解消、計画修正、review、handoff 整理まで自律的に進める。
- 長時間・複数 slice・複数 review rounds を前提にする計画作業では `/goal` を使ってよい。Goal の scope は計画完成と review closure に限定し、実装開始を含めない。
- ただし Plan から Execute へは勝手に移らない。実装は、ユーザーの明示依頼、または承認済み active plan に対する executor 依頼がある場合だけ行う。
- 成果物の最後に `Next Action Contract` を置き、次 lane、理由、実行可能 slice、人間判断の要否、推奨 prompt を明示する。

## Workflow

1. ユーザーの最新依頼を読む。
2. `references/source-of-truth.md` で source of truth を列挙する。
3. 既存 plan があれば `references/planning-process.md` で freshness check を行う。
4. `references/reference-routing.md` で必要な references を選ぶ。
5. material unknown を Research / AskUser / Blocked に分類する。
6. `references/artifact-lifecycle.md` で保存場所、active plan、archive 方針を決める。
7. `references/output-contracts.md` に従って計画成果物を作る。
8. `references/review-rubric.md` で adversarial、implementation、UX、simplicity などのレビューを行う。
9. 関連 profile のレビュー観点を追加する。
10. P0/P1 がなくなるまで修正する。最大 10 review rounds。
11. `Next Action Contract` と `Implementation Handoff` で終える。

## Required References

必要なものだけ読む:

- `references/source-of-truth.md`: 判断の優先順位。
- `references/planning-process.md`: 計画ループ、freshness、route selection。
- `references/reference-routing.md`: 依頼内容から読む references を選ぶ routing table。
- `references/artifact-lifecycle.md`: 成果物の置き場所、active plan、archive、session handoff。
- `references/output-contracts.md`: `current.md`、明示 plan、`abstract-plan.html` の成果物契約。
- `references/review-rubric.md`: P0/P1/P2、reviewer roles、改善ループ。
- `references/ask-user.md`: AskUser 条件と選択肢提示。
- `references/ui-ux.md`: UI/UX canonical rubric、視覚検証、URL状態、改行品質。
- `references/ai-ux.md`: AI-first UX。
- `references/ai-runtime.md`: Cloudflare AI Gateway、Workers AI、Gemma。
- `references/default-stack.md`: greenfield または既存選定がない場合の Drizzle、Better Auth、Hono（typed RPC）、React、Vite、Vitest、Zod、Expo。
- `references/data-modeling.md`: schema、Drizzle、raw SQL、YAGNI。
- `references/delivery.md`: CI/CD、Cloudflare、staging、production、OGP。
- `references/accessibility.md`: 実操作で確認する accessibility guardrails。
- `references/performance.md`: Core Web Vitals と latency。
- `references/observability.md`: monitoring、logs、traces、business events。
- `references/ci-security.md`: GitHub Actions hardening、OIDC、dependency review。
- `references/simplicity.md`: overengineering review。
- `references/refactoring.md`: LLM が読みやすい構造。
- `references/host-adapters.md`: Codex / Claude Code 固有差分。

## Optional Scripts

- `scripts/validate-plan-structure.mjs <plan.md>`
- `scripts/extract-open-questions.mjs <plan.md>`

スクリプトは補助であり、計画と repo を読む代替にしない。
