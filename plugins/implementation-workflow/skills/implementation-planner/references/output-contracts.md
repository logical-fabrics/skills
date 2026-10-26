# Output Contracts

## Active plan file

置き場所の優先順位（明示 plan file、repo 慣習、`docs/implementation/current.md`）は `artifact-lifecycle.md` の Placement に従う。単発の `implementation-plan-v2.md` や `final.md` を repo root に増やさない。

## Lightweight output

軽微で可逆な作業では永続 plan を作らなくてよい。チャットで次を簡潔に示す:

- 方針。
- 変更対象。
- 検証方法。
- 永続 plan を作らない理由。
- `Next Action Contract`: 次 lane、理由、実行可能 slice、人間判断の要否、推奨 prompt。

この route は、次セッションで迷うほどの判断、未解決リスク、複数領域の変更がない場合だけ使う。

## implementation-plan content

実装担当 LLM / engineer 向け。`current.md`（active plan）と同一の section 契約であり、別テンプレートを増やさない。必須 section（`##` 見出し）:

- `## Status`: `draft` / `approved` / `in-progress` / `blocked` / `done` / `superseded`
- `## Last updated`
- `## Goal`
- `## Source of Truth`
- `## Scope / Non-goals`
- `## Current State`: 現状と、完了済み slice の記録（completed）。
- `## Target Architecture`
- `## Step-by-step Implementation`: 各 step を checkbox で完了管理する。
- `## Files to Change`
- `## Verification Plan`: 直近の verification status（通った / 失敗した / 未実行）を含める。
- `## Review Findings`: P0/P1/P2 ledger、open decisions、Decision Log（planner が代行した material 判断の 1 行記録）。
- `## Risks and Rollback`
- `## Next actions`: 次に実行する最小 slice。
- `## Implementation Handoff`

ファイル、関数、schema、route、command、test、acceptance criteria までコードの細部を書く。

Active plan は実装者の作業入口であり、planning session の記録ではない:

- 何を変えるかと、実装者が誤った設計に戻らないだけの判断理由を残す。どの議論でそこに至ったかは、実装判断に効かない限り書かない。
- 履歴、会話の経緯、途中案、差分説明、解消済み review メモ、古い TODO は削る。更新時は追記せず、現在の truth として rewrite する。
- 過剰な装飾、全見出しや重要語の bold 化、絵文字、装飾罫線、見た目だけの callout、長い前口上は削る。
- 棄却案は、誤実装を防ぐ重要な非採用理由がある場合だけ `Scope / Non-goals`、`Review Findings`、`Risks and Rollback` のいずれかに短く残す。
- Markdown は構造化のために使う。`##` 見出し、checkbox、短い箇条書き、必要な表、コードブロックはよい。強調は P0/P1、停止条件、破壊的操作、未解決判断など、実装安全性に効く箇所だけにする。
- 長さは task に合わせる。実装に効く内容は省かず、埋め草の段落、重複 summary、boilerplate は足さない。
- 必須 section は見出しを残す契約であり、文字数を埋める契約ではない。該当がない section は 1 行で「該当なし」と理由を書く。

Section hygiene:

- `## Current State`: 現在の実装状態、完了済み slice、最後に確認した事実だけ。時系列ログや session recap にしない。
- `## Review Findings`: 未解決 findings、受け入れる残リスク、誤実装を防ぐ重要判断、Decision Log だけ。解消済み findings は本文に反映したら原則削る。Decision Log の entry は `Decision Log:` で始まる 1 行（判断、採用案、主な代替案、選定理由）で書き、checkbox・P0/P1 ラベル・未解決マーカー語（TODO / TBD / 未確定 / 要確認 / AskUser / Blocked）を含めない。veto されたら本文へ反映して削る。基準は `ask-user.md`。
- `## Step-by-step Implementation`: 実行順、対象ファイル、acceptance criteria に絞る。検討過程や reviewer ごとの発言を混ぜない。
- `## Implementation Handoff`: 次に読むファイル、実行する最小 slice、直近 verification、残リスクに絞る。会話履歴を読ませる前提にしない。

`## Implementation Handoff` には `Next Action Contract` block を含める。この block 定義は plugin 全体の正本であり、executor / auditor / docs 側は再掲せずここを参照する:

```md
### Next Action Contract

- Recommended next lane: Audit / Plan / Execute / Ask user / Accept risk / Done
- Reason:
- Ready-to-run slice:
- Human decision required: yes / no
- Goal recommended: yes / no
- Goal draft:
- Suggested prompt:
```

- ユーザーが実行承認する前提の Plan 成果物では `Human decision required: yes` にする。Plan から Execute へはユーザーの明示依頼なしに移らない。
- `ask-user.md` の Checkpoint B を通過した plan は、blocked を除き、未解決の人間判断（3 テスト通過の open decision）を `Next Action Contract` へ持ち越さない。
- planner では lane enum の `Ask user` を blocked のみに使い、実行承認そのものだけを `Human decision required` に残す。

package / library / SDK / CLI を追加・更新・設定変更する plan では、latest 確認結果を `## Target Architecture` または `## Step-by-step Implementation` に書く。上げられる既存 version は upgrade step にする。latest を使わないものは `## Risks and Rollback` に pin / downgrade 理由、互換性制約、解除条件を書く。

Goal:

- 長時間・複数 slice・複数 review rounds の Plan では `Goal recommended: yes` とし、`Goal draft` に計画完成用の短い `/goal` 文面を書く。Plan goal は調査、計画作成、複数観点 review、P0/P1 closure、handoff 作成までに限り、実装開始を含めない。
- 長時間・複数 slice・検証ループの Execute handoff でも `Goal recommended: yes` とし、`Goal draft` に実行用の短い `/goal` 文面を書く。
- Goal draft は目的、成功条件、制約、検証条件だけに絞り、詳細な手順は active plan に置く。

`scripts/validate-plan-structure.mjs` はこの見出し集合を検証する。`Completed` / `Verification status` / `Open decisions` は独立 section にせず、`Current State` / `Verification Plan` / `Review Findings` に畳む。

## abstract-plan.html

人間向け。Markdown 計画の焼き直しではなく、人間が数分で全体像、判断、リスク、検証方針を確認するための成果物。

次のいずれかを含む計画では、ユーザーが明示的に不要と言わない限り作成または更新する:

- 複数領域、複数コンポーネント、複数ユーザーフローにまたがる。
- DB/schema、API 境界、auth/security、外部サービス、課金/コスト、deploy/production に影響する。
- UI/UX、product model、ユーザーに見えるワークフローについて非自明な判断を含む。
- active plan が長く、コード変数や実装詳細を読まないと全体判断できない。
- 実装担当者だけでなく、ユーザーや reviewer の合意形成が必要。

必須:

- 最初の画面で目的、状態、全体像が分かる。
- Mermaid などの図を使う。
- 人間がコードを読まない前提で、アーキテクチャ、判断、リスク、検証を説明する。
- コード変数名や細かい関数名を露出しすぎない。
- active plan またはユーザー明示 plan と矛盾しない。

視覚的な階層、余白、色、図、カード表現は使ってよい。装飾は理解を速くする範囲に限り、実装者向け Markdown plan の簡潔さを置き換えない。

軽微な修正では作らない。過剰な成果物は workflow の UX を悪くする。「軽微」と言えるのは、次セッションで迷うほどの判断、未解決リスク、複数領域の変更、ユーザー向け体験の分岐がない場合だけ。

作らない場合:

- `Next Action Contract` または final response に `abstract-plan.html: 不要` と理由を書く。
- 理由は「単純だから」ではなく、影響範囲、判断の有無、次セッションの再開容易性に基づいて書く。

既定の保存先は `docs/implementation/abstract-plan.html`。完了後に source of truth として残す必要がなければ archive または削除候補にする。

Claude Code で Artifact tool が使える場合は、同じ内容を非公開の artifact として publish し、URL を `## Implementation Handoff` に 1 行で記録する。以後の更新は同じ URL へ行う。Codex では file を渡し、必要なら Sites での共有を提案する。どちらも file が正本。条件と制約は `artifact-lifecycle.md` と `host-adapters.md`。
