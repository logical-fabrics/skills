# Prompt Guide

`implementation-workflow` は、3 つの implementation lane（Audit / Plan / Execute）と、lane 横断の Learn で使う。

| やりたいこと | 期待する skill | 自然文プロンプト例 |
| --- | --- | --- |
| 既存実装を見直す | `implementation-auditor` | `現在の実装を見直して、UX・設計・テスト・過剰設計の問題を洗い出して` |
| 実装計画を作る | `implementation-planner` | `この機能の実装計画を作って` |
| 計画を実装する | `implementation-executor` | `この作業の plan の次の slice を実装して、検証までやって` |
| 人間の訂正を future session に残す | `learning-curator` | `今の訂正、再発防止して` |

- Codex でも Claude Code でも、普通の自然文で依頼すれば skill が発火する。特別な書式は要らない。
- Claude Code 向けの slash command alias は配布しない。
- 進捗報告の頻度は host の標準に任せる。細かく見たい時はその旨を依頼に書く。

基本思想は「lane 内では止まらない。lane 境界は勝手に越えない」。

- Audit は現状を知るために使う。
- Plan は人間が方向性を確認するために使う。
- Execute は accepted slice をやりきるために使う。
- 各 lane は最後に `Next Action Contract` を出す。

長時間・複数 slice・検証ループを前提にする Plan / Execute では `/goal` を使う。

- Plan の goal は、レビュー指摘がなくなるまで計画を仕上げるためのもので、実装開始を意味しない。
- Execute の goal は、accepted slice を実装・検証・handoff 更新までやりきるために使う。
- goal には目的、成功条件、制約、検証条件だけを書く。計画の詳細は明示 plan か `docs/implementation/<slug>.md` に置く。

## 迷ったら

| 状況 | 使う入口 |
| --- | --- |
| まず現状の問題を知りたい | Audit |
| 実装前に合意したい、範囲が広い、DB/UI/認証/infra が絡む | Plan |
| 既に active plan または明示 plan があり、編集してよい | Execute |
| agent の誤りを訂正した、同じ feedback を繰り返した、今後の rule にしたい | Learn |
| セッションを終える、次回に引き継ぎたい | Session Handoff |

## Learn

agent の誤りを直した後、同じ mistake class の再発を減らしたい時に使う。

- 直前の訂正 1 件は Incident mode で扱う。短い trigger は `今の訂正、再発防止して`。
- session 全体を振り返る時は Retrospective mode を使う。`retro` の一語で呼べる。
- Retrospective mode は候補一覧を出し、選んだものだけを保存する。
- 通常の訂正表現は UserPromptSubmit hook が候補として検知し、同じ turn に `learning-curator` の判断を足す。
- `再発防止して`、`覚えて`、`次から`、`今後は`、`二度と`、`AGENTS.md に追記` のような明示的 durable intent があり、final response に learning outcome がない時だけ、Stop hook が一度だけ continuation を求める。

例:

```text
それは違う。対象は repo のルールではなく plugin の配布物。次から同じ scope mistake をしないように学びを残して
```

```text
今の訂正を次からも守れるようにルール化して。保存先は既存の AGENTS.md、CLAUDE.md、skill、hook を調べて最適なものを選んで。
```

```text
この review feedback は前にも出した。同じ error class を防げるよう、既存 rule と重複しない形で反映して。
```

```text
私が agent の変更を revert して正しく直した。diff と repo の source of truth を確認し、一般化できる部分だけ学びにして。
```

```text
retro
```

```text
このセッションで直したことを振り返って、残す価値のある学びを候補として出して。保存先と operation も添えて。
```

期待する動き:

- current task の誤りを先に直す。
- regex の発火だけでは保存しない。accepted / correct / generalizable / actionable / scoped / novel / safe を確認する。
- 既存 guidance を検索し、`ADD` / `REFINE` / `MERGE` / `NOOP` の一つを選ぶ。
- always-on rule は canonical な `AGENTS.md` / `CLAUDE.md` に置く。
- multi-step workflow は skill に置く。
- machine-checkable な危険 behavior は hook / test / linter に置く。
- Codex の generated memory state は直接編集しない。
- host-native memory を mandatory team rule の唯一の保存先にしない。
- raw prompt や transcript を永続化しない。
- Retrospective mode の候補は、context に残る会話、git state、accepted review だけから作る。transcript file は読まない。
- Retrospective mode では、候補を提示して選択を得るまで書き込まない。
- 最後に `Learning outcome: ...` で変更先か NOOP の理由を報告する。

learning trigger にしないもの:

- 通常の first-time bug fix、単発の要件変更、仮定の議論、引用文。
- 曖昧な最初の correction。再発、accepted review、検証可能な高リスク invariant、明示的 durable intent のどれかがある時に昇格する。

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
この判断画面を audit して。判断材料と CTA が近いか、desktop で視線移動やマウス移動が大きすぎないか、同じ意図の導線やボタンラベルが重複していないかを重点的に見て。
```

```text
この画面の文言を audit して。システム内部の保存・分類・処理ではなく、ユーザーが何を決めていて、操作後に誰に見えるか、通知されるか、戻せるかが伝わっているかを見て。
```

```text
この画面の UI/UX を、ui-ux.md の rubric に沿って見直して。状態表示、戻れるか、エラー回復、フォーム入力負荷、アクセシビリティ、desktop/mobile の情報配置まで確認して。
```

```text
最近の実装が複雑になってきたので、立ち返りレビューをして。今すぐ直すべきものと、active plan に backlog 化すべきものを分けて。
```

期待する動き:

- 読み取りを中心にする。
- findings には evidence を付ける。
- すぐ直せる小さなものは `Auto-fix candidates` に分ける。audit の依頼だけでは編集しない。
- 大きな変更は executor が扱える改善 slice に分ける。
- 不要な audit ファイルを増やさない。
- 最後の `Next Action Contract` で、Plan / Execute / Ask user / Accept risk / Done のどれに進むかを示す。

## Plan

実装前に設計、範囲、検証、リスクを固める時に使う。

例:

```text
候補者一覧の検索体験を改善したい。実装計画を作って。UI/UX、URL 状態、モバイル、テスト、過剰設計レビューまで含めて。
```

```text
レポートを読んで承認する画面を改善したい。判断材料の近くに主要アクションを置くこと、desktop で情報と操作を離しすぎないこと、導線ラベルを一貫させることを含めて実装計画を作って。
```

```text
見送り操作の UI を改善したい。理由入力を必須にしないこと、相手に通知されるか、一覧からどう変わるか、あとで見直せるかをユーザー目線で説明することを含めて計画して。
```

```text
この管理画面の UI/UX 設計をまとめ直して。実ユーザーの業務フロー、既存 design system、実ブラウザ evidence を優先し、外部資料は仮説と見落とし防止としてだけ使って。
```

```text
この審査 UI を見直して。操作後に対象がキューから外れるか、次の対象に進むか、完了状態や戻り先が分かるかを重点的に確認して。押しても何も進まない保留ボタンがあれば疑って。
```

```text
この不具合を直す計画を作って。軽微なら abstract-plan.html は不要。plan は docs/implementation/ に作業ごとに置いて。
```

```text
abstract-plan.html の artifact を組織内に共有できる状態にして。
```

```text
DB schema 変更を含むので、YAGNI と migration/rollback を厳しく見た実装計画を作って。
```

期待する動き:

- 明示 plan や repo の慣習がなければ、作業ごとの `docs/implementation/<slug>.md` を active plan にする。branch で code と一緒に commit する。
- `abstract-plan.html` は人間向けの合意形成が必要な計画でだけ作る。正本は repo の file。
- Claude Code では `abstract-plan.html` を Artifact tool で作り、非公開で publish し、URL を `Implementation Handoff` に残す。見た目と図は組み込み design skill に任せ、以後の更新も同じ URL に出す。
- artifact の共有範囲は、依頼された時だけ広げる。
- Codex では file を渡し、必要なら app の Sites での共有を提案する。
- P0/P1 がなくなるまで計画をレビューする。
- 不明点は調査する。調査で決められないことだけ選択肢付きで聞く。
- Plan から Execute へは自動で進まない。最後の `Next Action Contract` で、実行承認の要否と次の最小 slice を示す。

## Execute

active plan を狭い slice で実装する時に使う。

例:

```text
この branch の plan の Implementation Handoff を読んで、次の最小 slice を実装して。検証までやって。
```

```text
この plan の Step 1 だけ実装して。UI は実ブラウザでハッピーパスとモバイル表示を確認して。
```

```text
この plan の UI slice を実装して。desktop と mobile の screenshot で、判断材料と CTA の距離、ボタンラベルの重複、実際の手の移動が不自然でないかまで確認して。
```

```text
この plan の copy 修正 slice を実装して。内部状態や保存理由ではなく、操作後の結果、通知、共有範囲、戻せるかが伝わる文言になっているか確認して。
```

```text
この plan の UI slice を実装して。完了前に ui-implementation.md の Completion QA と実ブラウザ screenshot を通して。
```

```text
この queue 型 UI の操作後 UX を実装して。承認、見送り、完了の後に、対象が一覧から外れるか次の対象へ進むこと、通知/共有の有無、undo 可能性が分かることを確認して。
```

```text
前回の続き。plan の未完了項目から、P1 を潰す最小の修正を実装して。
```

期待する動き:

- 最初に plan の freshness を確認し、古い plan をそのまま信じない。
- 実装は最小 slice にする。
- 依頼された scope をそのまま実行する。勝手に狭めず、広げず、別作業に置き換えない。
- 依頼が誤っていると判断した時は 1 文で指摘し、依頼どおりの範囲をやりきる。
- coding は main 1 体で実装・test・修正まで通す。
- 工程（実装 / test / 確認）で agent を分けない。
- 自分の作業の再確認を subagent に任せない。test や lint は main が実行する。
- 委任は、広い探索、長い log / test 調査、独立 workstream、独立 review のように、別 context に隔離する価値が overhead を明確に上回る時だけ。判断の正本は `implementation-executor/references/review-and-parallelism.md`。
- risk（low / medium / high）は委任の判断と分ける。risk は独立 review と verification の強さを決める。
- 独立 review は実装者の会話を引き継がない fresh context で行い、fork は使わない。
- 委任は flat な main → workers にする。並列化は独立 workstream がある時だけ。
- Codex の `ultra`、Claude Code の `ultracode` / Workflow が orchestrate している workstream に manual fan-out を重ねない。
- model / effort は `implementation-executor/references/model-routing.md` に従い、既存 main の設定を尊重する。根拠は `docs/model-routing-research.md`。
- UI 変更の検証は、changed behavior と risk に応じて、affected route の browser smoke、responsive screenshot、route / auth / persistence の targeted E2E、release 時の full E2E を使い分ける。
- UI 検証をした時は、確認した route、viewport、browser/tool、state、未確認の state、残リスクを報告する。screenshot / trace の path は価値がある時だけ添える。
- accepted slice 内では、局所的な stale plan の修正、実装、risk-based review、修正、再検証までやりきる。
- 完了するのは、未解決 P0/P1 がなく、acceptance criteria の evidence が揃った時だけ。
- 完了時は必要に応じて active plan の handoff を更新する。
- 最後の `Next Action Contract` で、続けるなら次の最小 slice を、止めるなら人間判断が要る理由を示す。

共通の出口形式。正本は plugin の `implementation-planner/references/output-contracts.md` で、以下は利用者向けの転記:

```md
## Next Action Contract

- Recommended next lane: Audit / Plan / Execute / Ask user / Accept risk / Done
- Reason:
- Ready-to-run slice:
- Human decision required: yes / no
- Goal recommended: yes / no
- Goal draft:
- Suggested prompt:
```

## Session Handoff

セッションを終える時は、次のように頼む。

```text
ここまでの作業を active plan の Implementation Handoff に反映して。次のセッションが迷わず再開できるようにして。
```

handoff に入る内容:

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

代わりに、lane、対象、目的、確認してほしい観点、実装してよい範囲を書く。

```text
現在の実装を audit して。次に進むべき lane も Next Action Contract で示して。
```

```text
この plan を作って。実装はまだしない。最後に Execute へ進める最小 slice と確認すべき判断を出して。
```

```text
この accepted slice を実装して。検証と handoff 更新までやりきって。
```

```text
求人詳細画面の応募導線を改善したい。まず audit して、UX と過剰設計の問題を P0/P1/P2 で出して。実装はまだしない。
```

```text
audit の P1 だけを対象に、実装計画を作って。
```

```text
plan の Step 1 だけ実装して。DB schema と production 設定には触らない。
```
