# Output Contracts

## Active plan file

優先順位:

1. ユーザーが明示した plan file。
2. 既存 repo の計画置き場慣習。
3. `docs/implementation/current.md`。

ユーザーが `implementation-plan.md` などのファイルを明示した場合、その依頼ではそのファイルを source of truth とする。継続運用が必要なら、`docs/implementation/current.md` へ統合する提案を出す。

慣習も明示もない場合は `docs/implementation/current.md` を使い、単発の `implementation-plan-v2.md` や `final.md` を repo root に増やさない。

## implementation-plan content

実装担当 LLM / engineer 向け。必須:

- Status
- Last updated
- Goal
- Source of Truth
- Scope / Non-goals
- Current State
- Target Architecture
- Step-by-step Implementation
- Files to Change
- Verification Plan
- Review Findings
- Risks and Rollback
- Implementation Handoff

コードの細部まで伝える。ファイル、関数、schema、route、command、test、acceptance criteria を書く。

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
