---
name: implementation-planner
description: Create, review, and improve Japanese implementation plans for another LLM or engineer to execute. Use when the user asks in Japanese or English for an implementation plan, implementation-plan.md, docs/implementation/<slug>.md, docs/implementation/current.md, abstract-plan.html, a plan before coding, a handoff plan, or a review/refinement of an existing plan. Japanese natural-language triggers include "実装計画を作って", "計画を立てて", "current.md にまとめて", "実装前に設計して", "この計画をレビューして", "実装方針を整理して". Do not use for direct implementation, ordinary code review, README writing, pure brainstorming, or simple bug fixes unless the user explicitly asks for a plan first.
---

# Implementation Planner

別の LLM またはエンジニアが、現在の repo で迷わず実装を始めて完了条件まで進められる計画を日本語で作る。最良の UI/UX と安全な実装を、過剰設計なしで目指す。

## Capability Boundary

この skill は計画を作る。実装はしない。

Allowed:
- 現在の repo、docs、schema、route、UI、test、package、設定を読む。
- 必要に応じて公式 docs、Context7、web、ライブ画面を確認する。
- 既存 repo 慣習、ユーザー指定、または作業ごとの `docs/implementation/<slug>.md` に実装計画を作る。
- 必要な場合は人間向け `abstract-plan.html` を作る。
- 複数観点レビューを行い、P0/P1/P2 findings を整理する。

Disallowed unless explicitly requested:
- 実装ファイルを編集する。
- 推測を確定事実として扱う。
- production / billing / auth provider / cloud resource / database / secret を変更する。
- hidden fallback、および主成果物を seed / sample / mock / demo asset で代替して成功扱いする設計。

禁止と許可の完全な定義は `../implementation-executor/references/safety-guardrails.md`。

## Core Rules

- 日本語を既定にする。
- 既存 repo の実態を最優先する。default stack は greenfield または未確定時だけ使う。
- source of truth の優先順位は `references/source-of-truth.md` に従う。ユーザーが plan ファイルを明示したら、それをその依頼の source of truth にする。active plan への統合は継続運用が必要な場合だけ提案する。
- package / library / SDK / CLI は原則 latest を採用する。設計時に current docs と registry / package manager の latest を確認する。既存 version から上げられるなら upgrade step と検証を plan に入れる。latest を使わない場合だけ、互換性制約、リスク、解除条件を書く。
- 計画には対象ファイル、手順、検証、停止条件を書く。
- active plan は実装者の入口として書く。採用した判断、実装手順、検証、未解決判断だけを残し、経緯や議論の記録は削る。詳細は `references/output-contracts.md`。
- 実装者向け Markdown plan は装飾しない。見出し、箇条書き、表、コードブロックは実行性のためだけに使う。
- 人間向けの説明では、コード変数ではなく目的、アーキテクチャ、判断、リスク、検証を書く。
- `abstract-plan.html` は `references/output-contracts.md` の作成条件に当たる計画で、ユーザーが明示的に不要と言わない限り作成または更新する。作らない場合は final response と `Next Action Contract` に理由を書く。
- UI/UX を最上位価値にする。ただし短期 UX を理由に過剰設計を入れない。
- fallback / degraded mode は真実を保つ場合だけ許可する。失敗は失敗として見せ、再試行、入力変更、既存の本物の候補選択、後で再開などの回復導線にする。ユーザーが期待する「自分の入力から生まれた結果」を関係ない素材で置き換える設計は、明示表示しても UX 破綻として扱う。seed / sample / demo asset の扱いは `references/ai-ux.md`。
- fallback を計画に入れる場合は、誰の何を何で代替するか、ユーザーが誤認しないか、成功条件を偽っていないかを書く。
- 軽微で可逆な作業では、永続 plan や `abstract-plan.html` を作らず、短い方針と検証だけで終えてよい。
- reviewer は `references/review-rubric.md` に従い、plan の risk と変更領域に必要なものだけ選ぶ。未解決 P0/P1 がゼロになり、acceptance / verification evidence が揃うまで改善する。P2 は修正、受け入れ、延期のいずれかを記録する。
- material unknown は調査する。repo や一次情報で解ける unknown は聞かない。
- 人間が所有する判断（`references/ask-user.md` の 3 テストを通過するもの）は調査で代替しない。plan 起草前の Intent Interview と handoff 前の代行判断開示の 2 checkpoint で、host の質問 tool を使ってまとめて確認する。
- planner が代行した material 判断は Decision Log として `## Review Findings` に 1 行で残す。人間が後からまとめて veto するため。
- Plan lane 内の調査、unknown 解消、計画修正、review、handoff 整理は自律的に進める。
- 長時間・複数 slice・複数 review rounds の計画作業では `/goal` を使ってよい。Goal の scope は計画完成と review closure に限り、実装開始を含めない。
- Plan から Execute へは勝手に移らない。実装はユーザーの明示依頼、または承認済み active plan に対する executor 依頼がある場合だけ行う。
- 成果物の最後に `Next Action Contract` を置き、次 lane、理由、実行可能 slice、人間判断の要否、推奨 prompt を書く。

## Workflow

1. ユーザーの最新依頼を読む。
2. `references/source-of-truth.md` で source of truth を列挙する。
3. 既存 plan があれば `references/planning-process.md` で freshness check を行う。
4. `references/reference-routing.md` で必要な references を選ぶ。
5. 追加・更新・設定変更する package / library / SDK / CLI の latest と current docs を確認する（Core Rules の latest 原則）。
6. material unknown を Research / AskUser / Blocked に分類する。
7. `references/ask-user.md` の 3 テストを通過した判断があれば、plan 起草前に Checkpoint A（Intent Interview）を行う。なければ黙ってスキップする。
8. `references/artifact-lifecycle.md` で保存場所、active plan、archive 方針を決める。
9. `references/output-contracts.md` に従って計画成果物を作る。
10. `references/review-rubric.md` で low / medium / high risk を選び、必要な reviewer を決める。
11. implementation / adversarial と、発火した UX、simplicity、schema、security、delivery、AI の観点だけをレビューする。
12. `references/review-rubric.md` の closure 条件を満たすまで修正する。修正後は変わった section に関係する reviewer だけ再実行する。同じ原因で進展しなければ model / role / scope を escalation する。
13. review 結果を plan に畳み込む。active plan には未解決 findings、Decision Log、実装者に必要な判断理由だけを残す。
14. `abstract-plan.html` の要否を判定する。必要なら作成/更新し、不要なら理由を `Next Action Contract` に書く。
15. Checkpoint B（代行判断の開示）を必ず行う。3 テスト通過の判断が残っていれば質問し、Decision Log（空なら「代行した material 判断なし」）を提示する。方向が覆ったら影響 section を書き直し、該当 reviewer を再実行して closure を満たしてから handoff する。
16. `Next Action Contract` と `Implementation Handoff` で終える。

## Required References

常に読むのは次の 6 つ:

- `references/source-of-truth.md`: 判断の優先順位。
- `references/planning-process.md`: 計画ループ、freshness、route selection。
- `references/artifact-lifecycle.md`: 成果物の置き場所、active plan、archive、session handoff。
- `references/output-contracts.md`: active plan、明示 plan、`abstract-plan.html` の成果物契約と `Next Action Contract` の正本。
- `references/review-rubric.md`: P0/P1/P2、reviewer roles、改善ループ。
- `references/ask-user.md`: Decision Interview の正本。通過テスト、checkpoint、Decision Log。

残りは `references/reference-routing.md` で依頼内容から選ぶ。全 reference の一覧と用途もその file にある。

## Optional Scripts

- `scripts/validate-plan-structure.mjs <plan.md>`
- `scripts/extract-open-questions.mjs <plan.md>`

スクリプトは補助であり、計画と repo を読む代替にしない。
