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
- `Next Action Contract`: 次 lane、理由、実行可能 slice、人間判断の要否、推奨 prompt。

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

Active plan は実装者が読むための作業入口であり、planning session の記録ではない。必須:

- 現在採用する方針と、実装者が迷わないだけの判断理由を残す。
- 履歴、会話の経緯、途中案、差分説明、解消済み review メモ、古い TODO は削る。
- 過剰な装飾、全見出しや重要語の bold 化、絵文字、装飾罫線、見た目だけの callout、長い前口上は削る。
- 棄却案は、誤実装を防ぐ重要な非採用理由がある場合だけ `Scope / Non-goals`、`Review Findings`、`Risks and Rollback` のいずれかに短く残す。
- plan 更新時は追記で履歴を積むのではなく、現在の truth として読み直せる形に rewrite する。
- 「この計画で何を変えるか」は具体的に書く。「どの議論でそこに至ったか」は実装判断に効かない限り書かない。
- Markdown formatting は構造化のために使う。`##` 見出し、checkbox、短い箇条書き、必要な表、コードブロックはよい。強調は P0/P1、停止条件、破壊的操作、未解決判断など、実装安全性に効く場合だけ最小限にする。
- 文書の長さは task が必要とする量に合わせる。実装に効く内容は省かないが、埋め草の段落、重複した summary、boilerplate で分量を足さない。
- 必須 section は見出しを残す契約であって、文字数を埋める契約ではない。今回該当がない section は、無理に埋めず 1 行で「該当なし」とその理由を書く。

Section hygiene:

- `## Current State`: 現在の実装状態、完了済み slice、最後に確認した事実だけを書く。時系列ログや session recap にしない。
- `## Review Findings`: 未解決 findings、受け入れる残リスク、誤実装を防ぐ重要判断だけを書く。解消済み findings は、修正後の計画本文に反映したら原則削る。
- `## Step-by-step Implementation`: 実行順、対象ファイル、acceptance criteria に集中する。検討過程や reviewer ごとの発言を混ぜない。
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

Plan の成果物では、ユーザーが実行承認する前提のときは `Human decision required: yes` にする。AI は plan lane 内の調査と review は自律的に進めるが、Plan から Execute へはユーザーの明示依頼なしに移らない。

package / library / SDK / CLI を追加・更新・設定変更する plan では、`## Target Architecture` または `## Step-by-step Implementation` に latest 確認結果を書く。既存 version より上げられるものは upgrade step として扱い、latest を使わないものは `## Risks and Rollback` に pin / downgrade 理由、互換性制約、解除条件を書く。

長時間・複数 slice・複数 review rounds を前提にする Plan では `Goal recommended: yes` とし、`Goal draft` に計画完成用の短い `/goal` 文面を書く。Plan goal は、調査、計画作成、複数観点 review、P0/P1 closure、handoff 作成までに限定し、実装開始を含めない。

長時間・複数 slice・検証ループを前提にする Execute handoff でも `Goal recommended: yes` とし、`Goal draft` に実行用の短い `/goal` 文面を書く。Goal draft は目的、成功条件、制約、検証条件だけに絞り、詳細な手順は active plan に置く。

`current.md` を active plan として使う場合も、この section 契約をそのまま使う。`scripts/validate-plan-structure.mjs` はこの見出し集合を検証する。`Completed` / `Verification status` / `Open decisions` は独立 section にせず、上記の `Current State` / `Verification Plan` / `Review Findings` に畳む。

## abstract-plan.html

人間向け。これは Markdown 計画の焼き直しではなく、人間が数分で全体像、判断、リスク、検証方針を確認するための成果物である。

次のいずれかを含む計画では、ユーザーが明示的に不要と言わない限り、`abstract-plan.html` を作成または更新する:

- 複数領域、複数コンポーネント、複数ユーザーフローにまたがる。
- DB/schema、API 境界、auth/security、外部サービス、課金/コスト、deploy/production に影響する。
- UI/UX、product model、ユーザーに見えるワークフローについて非自明な判断を含む。
- active plan が長文化し、人間がコード変数や実装詳細を読まないと全体判断できない。
- 実装担当者だけでなく、ユーザーや reviewer の合意形成が必要である。

必須:

- 最初の画面で目的、状態、全体像が分かる。
- Mermaid などの図を使う。
- 人間がコードを読まない前提で、アーキテクチャ、判断、リスク、検証を説明する。
- コード変数名や細かい関数名を露出しすぎない。
- active plan またはユーザー明示 plan と内容が矛盾しない。

`abstract-plan.html` は人間向けなので、視覚的な階層、余白、色、図、カード表現を使ってよい。ただし装飾は理解を速くするために限り、実装者向け Markdown plan の簡潔さを置き換えない。

軽微な修正では作らない。過剰な成果物は workflow 自体の UX を悪くする。ただし「軽微」と言えるのは、次セッションで迷うほどの判断、未解決リスク、複数領域の変更、ユーザー向け体験の分岐がない場合に限る。

作らない場合:

- `Next Action Contract` または final response に `abstract-plan.html: 不要` と理由を書く。
- 理由は「単純だから」ではなく、影響範囲、判断の有無、次セッションの再開容易性に基づいて書く。

作成する場合、既定の保存先は `docs/implementation/abstract-plan.html`。完了後に source of truth として残す必要がなければ archive または削除候補にする。

人間へ配る必要がある場合は、host の共有チャネル（Claude Code の artifact、Codex app の Sites）へ publish してよい。file が正本であることは変わらない。publish したら URL を `## Implementation Handoff` に 1 行で記録し、次セッションがその URL を更新できるようにする。条件と制約は `host-adapters.md` を見る。
