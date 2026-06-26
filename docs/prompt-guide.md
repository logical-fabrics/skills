# Prompt Guide

`implementation-workflow` は、主に 3 つの入口で使う。

| やりたいこと | 期待する skill | Claude command | 自然文プロンプト例 |
| --- | --- | --- | --- |
| 既存実装を見直す | `implementation-auditor` | `/audit-implementation` | `現在の実装を見直して、UX・設計・テスト・過剰設計の問題を洗い出して` |
| 実装計画を作る | `implementation-planner` | `/plan-implementation` | `この機能の実装計画を作って。docs/implementation/current.md にまとめて` |
| 計画を実装する | `implementation-executor` | `/implement-plan` | `docs/implementation/current.md の次の slice を実装して、検証までやって` |

Codex でも Claude Code でも、基本は自然文プロンプトで発火する想定。Claude Code では必要に応じて slash command も使える。

## 迷ったら

| 状況 | 使う入口 |
| --- | --- |
| まず現状の問題を知りたい | Audit |
| 実装前に合意したい、範囲が広い、DB/UI/認証/infra が絡む | Plan |
| 既に active plan または明示 plan があり、編集してよい | Execute |
| セッションを終える、次回に引き継ぎたい | Session Handoff |

Claude Code で自然文発火させたい場合も、特別な書式は不要。以下のように普通に依頼する。

```text
現在の実装を見直して
```

```text
実装計画を作って
```

```text
current.md の次を実装して
```

## Audit

現在の実装が本当に良い状態かを見直す時に使う。

例:

```text
現在の実装を audit して。UX、設計、過剰設計、テスト、DB、運用の観点で P0/P1/P2 に分けて。
```

```text
この画面の実装を見直して。特にモバイル UX、日本語の改行、URL 状態、loading/error、過剰な state 管理を確認して。
```

```text
最近の実装が複雑になってきたので、立ち返りレビューをして。今すぐ直すべきものと、docs/implementation/current.md に backlog 化すべきものを分けて。
```

期待する動き:

- 原則として読み取り中心。
- evidence 付きで findings を出す。
- すぐ直せる小さなものは `Auto-fix candidates` に分けるが、audit 依頼だけでは編集しない。
- 大きな変更は executor が扱える改善 slice に分ける。
- 不要な audit ファイルを増やさない。

## Plan

実装前に設計、範囲、検証、リスクを固める時に使う。

例:

```text
候補者一覧の検索体験を改善したい。実装計画を作って。UI/UX、URL 状態、モバイル、テスト、過剰設計レビューまで含めて。
```

```text
この不具合を直す計画を作って。軽微なら abstract-plan.html は不要。docs/implementation/current.md を active plan にして。
```

```text
DB schema 変更を含むので、YAGNI と migration/rollback を厳しく見た実装計画を作って。
```

期待する動き:

- `docs/implementation/current.md` を active plan にする。
- 人間向け合意形成が必要な場合だけ `abstract-plan.html` を作る。
- P0/P1 がなくなるまで計画レビューする。
- 不明点は調査し、調査で決められないことだけ選択肢付きで聞く。

## Execute

すでにある active plan を狭い slice で実装する時に使う。

例:

```text
docs/implementation/current.md の Implementation Handoff を読んで、次の最小 slice を実装して。検証までやって。
```

```text
この plan の Step 1 だけ実装して。UI は実ブラウザでハッピーパスとモバイル表示を確認して。
```

```text
前回の続き。current.md の未完了項目から、P1 を潰す最小の修正を実装して。
```

期待する動き:

- 最初に plan freshness を確認する。
- 古い plan をそのまま信じない。
- 実装は最小 slice にする。
- UI 変更は実ブラウザ、スクリーンショット、戻る/リロード/直接 URL を確認する。
- 完了時に `current.md` の handoff を必要に応じて更新する。

## Session Handoff

セッションを終える時は、次のように頼む。

```text
ここまでの作業を docs/implementation/current.md の Implementation Handoff に反映して。次のセッションが迷わず再開できるようにして。
```

期待する内容:

- 完了したこと。
- 未完了のこと。
- 次に読むファイル。
- 次に実装する最小 slice。
- 最後に通った検証。
- 失敗した検証と残リスク。

## Avoid

避けるプロンプト:

```text
全部いい感じにやって
```

```text
全部直して
```

```text
とりあえず実装して
```

代わりに、対象、目的、確認してほしい観点、実装してよい範囲を書く。

良い例:

```text
求人詳細画面の応募導線を改善したい。まず audit して、UX と過剰設計の問題を P0/P1/P2 で出して。実装はまだしない。
```

```text
audit の P1 だけを対象に、docs/implementation/current.md に実装計画を作って。
```

```text
current.md の Step 1 だけ実装して。DB schema と production 設定には触らない。
```
