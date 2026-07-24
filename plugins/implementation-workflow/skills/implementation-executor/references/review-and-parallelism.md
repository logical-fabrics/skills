# Review And Parallelism

## Main Agent Role

メインエージェントは implementation orchestrator であり、accepted slice の risk と規模に応じて自分で実装するか worker へ委任する。責務は以下:

- plan / repo / docs の source-of-truth 確認。
- accepted slice の risk 判定、分割、worker assignment。
- worker が返した patch、findings、verification の統合判断。
- conflicting edits、scope creep、stale plan、AskUser / blocked 判定。
- acceptance evidence の完了確認、final response、handoff 更新。

メインエージェントが直接実装してよい例:

- typo、copy、1 つの guard、1 つの設定値など、小さく可逆な変更。
- low-risk で scope と verification が明確な単一 slice。
- subagent / worker tool が host にない場合。
- worker 起動、handoff、統合の overhead が実装本体より明らかに大きい場合。
- secrets、destructive operation、production 操作など、委任せずメインエージェントが停止判断を保持すべき場合。

複数ファイル、UI、schema、migration、外部 API、認証、課金、infra、E2E、性能、security が絡むだけで機械的に agent 数を増やさない。changed behavior、失敗コスト、独立 workstream の有無で決める。

## Risk-based Delegation And Review

slice 開始時に low / medium / high のいずれかを選び、理由を作業メモまたは handoff に短く残す。変更中に risk が増えたら上げる。

| Risk | 目安 | 必要な実行・review role |
| --- | --- | --- |
| Low | copy / docs / isolated config、機械的で可逆、決定的 check がある | main または implementation worker。独立 reviewer は任意。relevant deterministic gate と diff self-review は必須 |
| Medium | 通常の複数ファイル変更、共有ロジック、ユーザー可視 behavior、局所 API / state 変更 | implementation role と独立 review role を分ける。verification は review role と兼任可能だが、acceptance evidence を独立に確認する |
| High | auth、billing、migration、data loss、security、production / infra、cross-slice architecture、広い UX / persistence、収束しない P0/P1 | implementation と独立 review を分け、必要な domain（security / schema / UX 等）だけ追加する。verification role を別に立てるのは、acceptance evidence を独立に再現する必要がある場合に限る。高難度の統合判断は Opus 5 `xhigh` / Fable 5 / Sol へ escalation する |

role は agent 数と同義ではない。low risk に 3 worker を強制せず、medium risk の reviewer が verification evidence も確認できるなら別 verifier を増やさない。high risk でも関係のない reviewer role を全列挙しない。

reviewer は worker の自己申告を信用せず、diff、changed behavior、acceptance criteria、実際の verification output を読む。委任プロンプトには `git add` / `git commit` / `git stash` / `git reset` / `git checkout --` / worktree 操作をしないことを明示する。ベースライン比較は `git show HEAD:<path>` か read-only な差分で行う。

## Parallelization Rules

既定形は flat な main → leaf workers とする。並列化するのは独立した workstream または独立した read-only review / verification だけで、依存する task は順番に進める。

この既定はコスト都合ではない。Claude Opus 5 世代の main agent は前世代より subagent へ委任しやすく、放置すると必要のない fan-out が増える。委任してよい場面を先に決め、同時に走らせる worker 数の上限を持ってから fan-out する。詳細は `model-routing.md` の委任 guardrail に従う。

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
- review loop は固定 10 rounds を目的にしない。同じ原因で 2 回進展がない、evidence が相反する、または risk が上がった場合は model / role / scope を escalation する。安全に解けない判断だけユーザーへ戻す。

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
