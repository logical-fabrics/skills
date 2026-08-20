# Prompt Guide

`implementation-workflow` は、3 つの implementation lane と、lane 横断の learning loop で使う。

| やりたいこと | 期待する skill | 自然文プロンプト例 |
| --- | --- | --- |
| 既存実装を見直す | `implementation-auditor` | `現在の実装を見直して、UX・設計・テスト・過剰設計の問題を洗い出して` |
| 実装計画を作る | `implementation-planner` | `この機能の実装計画を作って。docs/implementation/current.md にまとめて` |
| 計画を実装する | `implementation-executor` | `docs/implementation/current.md の次の slice を実装して、検証までやって` |
| 人間の訂正を future session に残す | `learning-curator` | `今の訂正、再発防止して` |

Codex でも Claude Code でも、基本は自然文プロンプトで発火する想定。Claude Code では薄い slash command alias は配布しない。

どの lane でも報告のリズムは共通で、最初に何をするかを 1 文、作業中は重要な発見と方針変更だけ、完了時は結論から述べる。逐次実況は既定で行わない。細かく進捗を見たい場合は、その旨を依頼に書く。

基本思想は「lane 内では止まらない。lane 境界は勝手に越えない」。Audit は知るため、Plan は人間が方向性を確認するため、Execute は accepted slice をやりきるために分ける。各 lane の最後には `Next Action Contract` を出し、次に使う入口、理由、実行可能 slice、人間判断の要否、推奨 prompt を明示する。

長時間・複数 slice・検証ループを前提にする Plan / Execute では、Codex / Claude Code の `/goal` を使う。Plan の goal は「レビュー指摘がなくなるまで計画を完成させる」ためであり、実装開始を意味しない。Execute の goal は accepted slice を実装・検証・handoff 更新までやりきるために使う。Goal には長い計画全文を貼らず、目的、成功条件、制約、検証条件だけを書く。詳細は明示 plan または `docs/implementation/current.md` に置く。

## 迷ったら

| 状況 | 使う入口 |
| --- | --- |
| まず現状の問題を知りたい | Audit |
| 実装前に合意したい、範囲が広い、DB/UI/認証/infra が絡む | Plan |
| 既に active plan または明示 plan があり、編集してよい | Execute |
| agent の誤りを訂正した、同じ feedback を繰り返した、今後の rule にしたい | Learn |
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

```text
それは違う。対象は repo のルールではなく plugin の配布物。次から同じ scope mistake をしないように学びを残して
```

最短の推奨形:

```text
今の訂正、再発防止して。
```

## Learn

agent の誤りを直した後、同じ mistake class の再発を減らしたい時に使う。入口は 2 つある。直前の訂正 1 件を扱う Incident mode の短い推奨 trigger は `今の訂正、再発防止して`。session を遡って複数の候補を洗い出す Retrospective mode は `retro` の一語で呼べる。長い形なら `このセッションで直したことを振り返って、残す価値のある学びを候補として出して` のように依頼する。Retrospective mode では候補一覧が提示され、選んだものだけが保存される。通常の訂正表現は UserPromptSubmit hook が候補として検知し、`learning-curator` の判断を同じ turn に追加する。`再発防止して`、`覚えて`、`次から`、`今後は`、`二度と`、`AGENTS.md に追記` のような明示的 durable intent があり、final response に learning outcome がない場合だけ、Stop hook が一度だけ continuation を要求する。

例:

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
- regex 発火だけでは保存せず、accepted / correct / generalizable / actionable / scoped / novel / safe を確認する。
- 既存 guidance を検索し、`ADD` / `REFINE` / `MERGE` / `NOOP` の一つを選ぶ。
- always-on rule は canonical `AGENTS.md` / `CLAUDE.md`、multi-step workflow は skill、machine-checkable な危険 behavior は hook / test / linter へ置く。
- Codex の generated memory state は直接編集せず、host-native memory を mandatory team rule の唯一の保存先にしない。
- raw prompt や transcript を永続化しない。
- Retrospective mode では、候補は context に残る会話、git state、accepted review だけから作り、transcript file は読まない。候補を提示して選択を得るまで書き込まない。
- 最後に `Learning outcome: ...` で変更先または NOOP 理由を報告する。

通常の first-time bug fix、単発の要件変更、仮定の議論、引用文は learning trigger にしない。曖昧な最初の correction は自動保存せず、再発・accepted review・検証可能な高リスク invariant、または明示的 durable intent がある時に昇格する。

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
最近の実装が複雑になってきたので、立ち返りレビューをして。今すぐ直すべきものと、docs/implementation/current.md に backlog 化すべきものを分けて。
```

期待する動き:

- 原則として読み取り中心。
- evidence 付きで findings を出す。
- すぐ直せる小さなものは `Auto-fix candidates` に分けるが、audit 依頼だけでは編集しない。
- 大きな変更は executor が扱える改善 slice に分ける。
- 不要な audit ファイルを増やさない。
- 最後に `Next Action Contract` を出し、Plan / Execute / Ask user / Accept risk / Done のどれに進むべきかを示す。

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
この不具合を直す計画を作って。軽微なら abstract-plan.html は不要。docs/implementation/current.md を active plan にして。
```

```text
abstract-plan.html を artifact として publish して、URL を Implementation Handoff に残して。共有範囲は組織内だけにして。
```

```text
DB schema 変更を含むので、YAGNI と migration/rollback を厳しく見た実装計画を作って。
```

期待する動き:

- 明示 plan や repo 慣習がなければ、`docs/implementation/current.md` を active plan にする。
- 人間向け合意形成が必要な場合だけ `abstract-plan.html` を作る。正本は repo の file。共有したい場合は、Claude Code なら artifact、Codex app なら Sites へ publish するよう頼む。publish は依頼したときだけ行われ、URL は `Implementation Handoff` に残る。
- P0/P1 がなくなるまで計画レビューする。
- 不明点は調査し、調査で決められないことだけ選択肢付きで聞く。
- Plan から Execute へは自動遷移しない。最後に `Next Action Contract` で、実行承認が必要か、次の最小 slice は何かを示す。

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
前回の続き。current.md の未完了項目から、P1 を潰す最小の修正を実装して。
```

期待する動き:

- 最初に plan freshness を確認する。
- 古い plan をそのまま信じない。
- 実装は最小 slice にする。
- worker の主目的は main context の温存である。accepted slice の詳細を読む前に、隔離できる探索、log、試行錯誤、独立 workstream の context と、assignment、context 複製、起動、調整、競合回避、統合の overhead を比較する。context benefit が有意に大きい場合だけ委任する。
- overhead が context benefit 以上なら main が直接実装する。必要 context がすでに揃い、scope、expected diff、verification が明確な小さく coherent な作業は、複数ファイルでも無理に委任しない。専用の `micro-task exception` 宣言は不要。正本は `implementation-executor/references/review-and-parallelism.md`。
- low / medium / high risk は delegation 判断と分離する。risk は独立 review / verification の強さを決める。medium risk は implementation owner と独立 review、high risk は必要な domain review / verification を分けるが、role 数を固定しない。
- model / effort / escalation は `implementation-executor/references/model-routing.md` に従う。vendor 間で tier を無理に対称化せず、公式情報と host で実際に選択可能な model を正とする。
- 委任時の orchestration は flat な main → workers を既定にし、並列化は独立 workstream がある場合だけ行う。Codex `xhigh`（単独推論）と `ultra`（自動 subagents）、Claude Code の通常 subagents と `ultracode` / dynamic workflow を区別し、host-native orchestration と manual fan-out を同じ workstream に重ねない。
- UI 変更は changed behavior と risk に応じて、affected route の browser smoke、responsive screenshot、route / auth / persistence の targeted E2E、release 時の full E2E を使い分ける。
- UI 検証を実行した場合は、確認した route、viewport、browser/tool、state、未確認 state、残リスクと、価値がある場合だけ screenshot/trace path を報告する。
- 完了時に `current.md` の handoff を必要に応じて更新する。
- accepted slice 内では、局所的な stale plan 修正、実装、risk-based review、修正、再検証までやりきる。未解決 P0/P1 がなく、acceptance criteria の evidence が揃った時だけ完了する。
- 完了時に `Next Action Contract` を出し、続けるなら次の最小 slice、止めるなら人間判断が必要な理由を示す。
- 依頼した scope をそのまま実行する。勝手に狭めず、広げず、別作業に置き換えない。依頼が誤っていると判断した場合は 1 文で指摘した上で、依頼どおりの範囲をやりきる。

共通の出口形式。正本の定義は plugin の `implementation-planner/references/output-contracts.md` にあり、以下は利用者が確認するための転記:

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
