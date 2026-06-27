# Output Contracts

## Active plan file

優先順位:

1. ユーザーが明示した plan file。
2. 既存 repo の計画置き場慣習。
3. `docs/implementation/current.md`。

ユーザーが `implementation-plan.md` などのファイルを明示した場合、その依頼ではそのファイルを source of truth とする。継続運用が必要なら、`docs/implementation/current.md` へ統合する提案を出す。

慣習も明示もない場合は `docs/implementation/current.md` を使い、単発の `implementation-plan-v2.md` や `final.md` を repo root に増やさない。

## Lightweight output

軽微で可逆な作業では、永続 plan を作らなくてよい。以下をチャット上で簡潔に示す:

- 方針。
- 変更対象。
- 検証方法。
- 永続 plan を作らない理由。

軽量 route は、次セッションで迷うほどの判断、未解決リスク、複数領域の変更がない場合だけ使う。

## implementation-plan content

実装担当 LLM / engineer 向け。これは `current.md`（active plan）と同一の section 契約であり、別テンプレートを増やさない。必須 section（`##` 見出し）:

- `## Status`: `draft` / `approved` / `in-progress` / `blocked` / `done` / `superseded`
- `## Last updated`
- `## Goal`
- `## Source of Truth`
- `## Scope / Non-goals`
- `## Current State`: 現状と、完了済み slice の記録（completed）を含める。
- `## Target Architecture`
- `## Step-by-step Implementation`: 各 step は checkbox で完了管理する。
- `## Files to Change`
- `## Verification Plan`: 直近の verification status（通った / 失敗した / 未実行）を含める。
- `## Review Findings`: P0/P1/P2 ledger と open decisions を含める。
- `## Risks and Rollback`
- `## Next actions`: 次に実行する最小 slice。
- `## Implementation Handoff`

コードの細部まで伝える。ファイル、関数、schema、route、command、test、acceptance criteria を書く。

`current.md` を active plan として使う場合も、この section 契約をそのまま使う。`scripts/validate-plan-structure.mjs` はこの見出し集合を検証する。`Completed` / `Verification status` / `Open decisions` は独立 section にせず、上記の `Current State` / `Verification Plan` / `Review Findings` に畳む。

## abstract-plan.html

人間向け。複数領域、UI/UX、本番影響、DB、認可、外部サービス、または合意形成が必要なときだけ作る。

必須:

- 最初の画面で目的、状態、全体像が分かる。
- Mermaid などの図を使う。
- 人間がコードを読まない前提で、アーキテクチャ、判断、リスク、検証を説明する。
- コード変数名や細かい関数名を露出しすぎない。
- active plan またはユーザー明示 plan と内容が矛盾しない。

軽微な修正では作らない。過剰な成果物は workflow 自体の UX を悪くする。

作成する場合、既定の保存先は `docs/implementation/abstract-plan.html`。完了後に source of truth として残す必要がなければ archive または削除候補にする。
