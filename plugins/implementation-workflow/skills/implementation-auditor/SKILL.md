---
name: implementation-auditor
description: Audit an existing implementation in Japanese and identify what to improve next. Use when the user asks, in Japanese or English, to review the current implementation, find quality problems, reassess architecture, reduce technical debt, improve UX, run a periodic health check, or identify safe follow-up fixes. Japanese natural-language triggers include "現在の実装を見直して", "立ち返りレビューして", "改善点を洗い出して", "技術負債を見て", "UX と設計を audit して", "過剰設計になっていないか確認して", "リファクタリング候補を出して". Do not use for creating a new feature plan from scratch or directly implementing broad changes unless the user explicitly asks to fix a narrow set of findings.
---

# Implementation Auditor

既存実装の UX、構造、検証、運用、負債、過剰設計を洗い出し、次に直すべきことを明確にする。新機能を作る skill ではない。

## Capability Boundary

Allowed:
- 現在の repo、docs、schema、routes、UI、tests、logs、config、active plan を読む。
- 実ブラウザ、test、lint、typecheck、build、static analysis を必要に応じて実行する。
- 問題を P0/P1/P2 に分類する。
- 改善 backlog または `docs/implementation/current.md` の更新案を作る。
- 明らかに安全な修正候補を `Auto-fix candidates` として提示する。

Disallowed unless explicitly requested:
- 広範囲の実装修正。
- audit 依頼だけでのファイル編集。
- production / billing / auth provider / cloud resource / production database / secret の変更。
- active plan を無視した大きな scope expansion。
- 古い plan や会話履歴だけを source of truth にすること。

禁止と許可の完全な定義は `../implementation-executor/references/safety-guardrails.md`。

## Core Rules

- 日本語を既定にする。
- 依頼された audit scope をそのまま成果物の範囲にする。狭めず、広げず、別の作業に置き換えない。scope が誤っていると判断した場合は 1 文で述べ、依頼どおりの範囲をやりきる。
- UI/UX を最上位価値として見る。短期 UX を理由に、過剰設計、不要な抽象化、独自基盤を肯定しない。
- findings は証拠に基づき、推測は推測と書く。
- 優先順位は、ユーザー価値、リスク、修正コスト、検証容易性で付ける。
- 各 finding に Evidence、Impact、Recommended next action、Verification を持たせる。next action は `Plan first` / `Execute small fix` / `Ask user` / `Accept risk` から選ぶ。
- auditor は候補提示が基本。実編集は、ユーザーが「修正して」と明示した狭い finding か、executor へ handoff された accepted slice に限る。
- audit 成果物を増やさない。永続化が必要な場合は `references/artifact-lifecycle.md` に従う。
- Audit lane 内では、repo 調査、実挙動確認、優先順位付け、次 action の整理まで自律的に進める。Plan / Execute へは勝手に移らない。
- audit 結果の最後に `Next Action Contract` を置き、次 lane、理由、実行可能 slice、人間判断の要否、推奨 prompt を書く。

## Workflow

1. 最新依頼と audit scope を確認する。
2. `references/artifact-lifecycle.md` で active plan と既存レビュー成果物を確認する。
3. `references/audit-process.md` に従い、現在の source of truth を読む。
4. 必要に応じて実ブラウザ、test、lint、typecheck、build を実行する。
5. `references/audit-rubric.md` で UX、architecture、simplicity、tests、data、security、delivery、observability、AI をレビューする。
6. findings を P0/P1/P2 に分類する。
7. `references/auto-fix-policy.md` に従い、今すぐ安全に直せるものと plan 化するものを分ける。
8. 必要なら `docs/implementation/current.md` の改善 backlog 更新案を作る。
9. 実装が必要な場合は、executor が扱える最小 slice と verification を示す。
10. `Next Action Contract` で、人間が次に選ぶ入口を示す。

## Required References

必要なものだけ読む:

- `references/artifact-lifecycle.md`: audit 成果物を増やさない運用。
- `references/audit-process.md`: 立ち返りレビューの進め方。
- `references/audit-rubric.md`: review domains と P0/P1/P2。
- `references/auto-fix-policy.md`: 自動修正してよいもの、plan 化するもの。
- `references/report-format.md`: audit report と improvement backlog の形式。

## Optional Scripts

- `scripts/check-audit-report.mjs <audit-report.md>`

スクリプトは補助であり、repo と実装を読む代替にしない。
