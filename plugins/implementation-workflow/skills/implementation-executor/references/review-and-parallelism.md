# Review And Parallelism

## Main Agent Role

メインエージェントは実装者と orchestrator を兼ね、受入品質を維持して完了までの総時間・使用量・手直しを抑える。main context の温存はそのための手段である。worker は探索、長い log、試行錯誤、独立 workstream の詳細を別 context に隔離し、main が短い結果と evidence だけを統合するために使う。委任件数や並列数そのものを成果にしない。責務は以下:

- plan / repo / docs の source-of-truth 確認。
- accepted slice の context 収支、risk、分割、implementation owner の判断。
- 委任する場合の worker assignment、model / effort 選択、方向修正。
- worker が返した patch、findings、verification の統合判断。
- conflicting edits、scope creep、stale plan、AskUser / blocked 判定。
- acceptance evidence の完了確認、final response、handoff 更新。

リスクは implementation owner ではなく、独立 review / verification の強さを決める。secrets、destructive operation、production 操作などの停止判断は常にメインが所有する。

<!-- executor-delegation-contract:start -->
```json
{
  "version": 3,
  "primary_objective": "accepted-outcome-with-total-cost-awareness",
  "delegate_when": "expected-context-savings-exceed-overhead",
  "main_direct_when": "overhead-meets-or-exceeds-context-savings",
  "risk_controls": "independent-review-and-verification",
  "parallelize_when": "independent-workstreams",
  "worker_unavailable": "reassess-context-benefit-and-scope"
}
```
<!-- executor-delegation-contract:end -->

この JSON object は executor delegation policy の machine-checkable な不変条件の正本であり、以下の Delegation Value Test が判断手順の正本である。`SKILL.md` や利用者向け docs は結論を短く要約してよいが、別の threshold、例外 gate、implementation owner の既定値を定義しない。

### Delegation Value Test

main が通常の要件確認と必要な調査を進め、委譲候補が見えた時に次を比較する。routing だけの追加調査はしない。

**Context benefit:**

- main から隔離できる repo 探索、log、test output、debugging history、候補比較の量。
- 独立 workstream を別 context で完結させ、短い結論、diff、evidence だけを返せるか。
- 長い作業中も main が source of truth、ユーザー判断、他 slice の統合に集中できるか。

**Delegation overhead:**

- assignment のために複製する plan、制約、既知 context の量。
- spawn latency、方向修正、shared-file conflict、結果統合、再検証の負担。
- main がすでに持っている context を worker に再説明するだけにならないか。

期待する context benefit が overhead を**有意に上回る時だけ**委任する。同程度、判断が拮抗、または overhead の方が大きい場合は main が直接実装する。task の小ささ、ファイル数、low risk は参考信号であって単独の gate ではない。必要 context がすでに main に揃い、scope、expected diff、verification が明確な小さく coherent な変更は、複数ファイルでも main が直接実装してよい。

広い探索、大量 log、長い debugging / verification loop、独立 workstream は、調査目的・範囲・返却条件が定まった時点で詳細を隔離できる。main が全詳細を先読みする必要はないが、広い探索という理由だけで委譲や軽量化を強制しない。model の選択、早期返却、結果記録は `model-routing.md` に従う。

worker が利用できない場合は context 収支と scope を再評価する。main で扱える coherent scope へ安全に絞れる、または overhead が節約量以上なら直接続行できる。大量 context によって判断品質を損なう、権限がない、scope を不当に狭める必要がある場合だけ blocked / AskUser とする。

複数ファイル、UI、schema、migration、外部 API、認証、課金、infra、E2E、性能、security が絡むだけで機械的に agent 数を増やさない。changed behavior、失敗コスト、独立 workstream の有無で決める。

## Risk-based Delegation And Review

slice 開始時に low / medium / high のいずれかを選び、理由を作業メモまたは handoff に短く残す。変更中に risk が増えたら上げる。

| Risk | 目安 | 必要な実行・review role |
| --- | --- | --- |
| Low | copy / docs / isolated config、機械的で可逆、決定的 check がある | Delegation Value Test で main または implementation worker を選ぶ。独立 reviewer は任意。relevant deterministic gate は必須で、closure 前に diff と acceptance evidence を確認する |
| Medium | 通常の複数ファイル変更、共有ロジック、ユーザー可視 behavior、局所 API / state 変更 | implementation owner は Delegation Value Test で選び、独立 review role を分ける。verification は review role と兼任可能だが、acceptance evidence を独立に確認する |
| High | auth、billing、migration、data loss、security、production / infra、cross-slice architecture、広い UX / persistence、収束しない P0/P1 | implementation owner にかかわらず独立 review を置き、必要な domain（security / schema / UX 等）だけ追加する。verification role を別に立てるのは、acceptance evidence を独立に再現する必要がある場合に限る。高難度判断の model / effort は `model-routing.md` の高難度 role と host の実効設定に従う |

role は agent 数と同義ではない。main が implementation と orchestration を兼ねる場合もある。medium risk の reviewer が verification evidence も確認できるなら別 verifier を増やさない。high risk でも関係のない reviewer role を全列挙しない。

reviewer は implementation owner の自己申告を信用せず、diff、changed behavior、acceptance criteria、実際の verification output を読む。委任する場合の prompt には `git add` / `git commit` / `git stash` / `git reset` / `git checkout --` / worktree 操作をしないことを明示する。ベースライン比較は `git show HEAD:<path>` か read-only な差分で行う。

## Parallelization Rules

委任する場合の既定形は flat な main → leaf workers とする。並列化するのは独立した workstream または独立した read-only review / verification だけで、依存する task は順番に進める。1 名の worker に順番に任せる場合も delegation であり、並列実行である必要はない。

並列化の目的も main context の温存と独立 workstream の待ち時間短縮である。fan-out による assignment、競合、統合の overhead が上回るなら 1 worker または main で順番に進める。詳細は `model-routing.md` の委任 guardrail に従う。

並列化に向く例:

- 独立した code path 調査。
- 競合しない accepted slice の実装。
- docs / Context7 research。
- risk 上必要な UX / schema / security review。
- 独立した検証。

並列化しない:

- 同じファイル編集。
- 最終統合。
- AskUser 判断。
- destructive operation。
- secret、production、billing、auth provider、cloud resource の変更判断。

Fan-out 制御:

- host / workspace / repo の concurrency、depth、rate、workflow size cap を正とする。plugin 独自の固定幅、深さ、agent 総数で上書きしない。
- manual delegation は flat に保つ。子 agent からの再委任は、host が明示的に許可し、親では分解できない独立 workstream がある場合だけにする。
- Codex `ultra` または Claude Code `ultracode` / dynamic workflow が同じ workstream を orchestrate している場合、manual fan-out を重ねない。
- 429 / rate limit を検知したら新規 spawn を止め、host の retry guidance を尊重する。同じ branch で反復する場合は部分結果と未確認範囲を親へ返す。

## Findings And Closure

- accepted slice、touched surface、changed behavior に関する未解決 P0/P1 があれば修正する。
- scope 外の P0/P1 は隠さず backlog 化し、今回の完了条件とは分ける。
- P2 は今回の slice を広げすぎない範囲で修正、受け入れ、延期を記録する。
- finding 修正後は、その finding と修正で変わった surface に必要な reviewer / check だけを再実行する。無関係な全 reviewer roles を毎回回さない。
- review loop に固定回数の目標や上限を置かない。同じ原因で 2 回進展がない、evidence が相反する、または risk が上がった場合は model / role / scope を escalation する。安全に解けない判断だけユーザーへ戻す。

完了条件は次の両方:

1. accepted slice、touched surface、changed behavior に未解決 P0/P1 がない。
2. acceptance criteria に対応する implementation / test / browser / build / log 等の evidence が揃い、未確認範囲と残リスクが明示されている。

「reviewer が新規 finding を出さなかった」だけでも、「test が通った」だけでも closure にしない。逆に、risk 上不要な reviewer 全員の形式的な再実行や、model 品質を測る独自反復 fixture eval は要求しない。

## Reviewer Roles

changed behavior と risk に関係する role だけ選ぶ:

- Adversarial reviewer: medium / high risk の一般的な correctness、隠れた失敗、verification gap。
- UX reviewer: ユーザー可視 flow、mobile / desktop、copy、forms、accessibility を変えた場合。
- Simplicity reviewer: 新しい abstraction、基盤、状態管理、広い refactor を加えた場合。
- Schema reviewer: DB、migration、既存データを変えた場合。
- Security reviewer: auth、secret、permission、external input、infra boundary を変えた場合。

各 review の返却には findings、fix / accept / defer / blocked 判断、確認した acceptance evidence を含める。「レビューした」だけで終わらせない。
