# Review And Parallelism

## Main Agent Role

メインエージェントは実装者と orchestrator を兼ね、受入品質を保ったまま完了までの時間・使用量・手直しを抑える。委任件数や並列数は成果ではない。main が常に持つもの:

- source of truth の確認、accepted slice の scope / risk 判定、implementation owner の決定。
- worker の diff、findings、verification evidence の受入判断と統合。
- scope creep、stale plan、AskUser / blocked の判定。secret、destructive operation、production 操作の停止判断。
- acceptance evidence の完了確認、final response、handoff 更新。

risk は implementation owner ではなく、独立 review / verification の強さを決める。

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

この JSON は delegation policy の machine-checkable な不変条件の正本で、判断の中身は次の Delegation Value Test に書く。他の file は要約してよいが、別の threshold や例外を定義しない。

### Delegation Value Test

委任は、別 context に隔離できる作業量（広い repo 探索、大量 log / test output、長い debugging、独立 workstream）が、assignment の説明・context の複製・起動待ち・方向修正・統合・再検証の overhead を明確に上回る時に使う。拮抗するなら main が直接やる。

- main が直接やる: 小さく coherent な変更、順番に依存する作業、1 ファイル編集、main がすでに context を持っている作業、`rg` / 数ファイルの読み取りで済む調査。ファイル数や risk だけを委任理由にしない。
- 委任が向く: read-heavy な探索・triage・要約、長い log / test loop、互いに state を共有しない独立 workstream、実装者と別 context で行う独立 review。
- 委任した調査を main が並行して同じように繰り返さない。待つ間は依存しない別の作業を進める。
- worker が使えない場合は scope を再評価し、main で安全に扱えるなら続行する。判断品質、権限、scope を損なう場合だけ blocked / AskUser にする。

host ごとの既定の違い:

- Claude Code の Opus 5.5 などは、指示がなくても subagent を積極的に起動する。この skill は委任を促さず、上の「main が直接やる」側に当てはまる時は委任しない。
- Codex は `ultra` 以外では、ユーザー、`AGENTS.md`、skill が求めた時に subagent を起動する。この skill は、上の「委任が向く」に当たる作業で Delegation Value Test を通った場合に限り、Codex での subagent 起動を許可する。
- どちらの host でも、`ultra` / `ultracode` / Workflow が同じ workstream を orchestrate している場合は manual fan-out を重ねない。

risk 表が求める独立 review は Delegation Value Test の対象外で、どちらの host でも fresh context で実施する。

model / effort の選択は `model-routing.md`、host の設定面は `host-adapters.md` に従う。

## Risk-based Delegation And Review

slice 開始時に low / medium / high のいずれかを選び、理由を作業メモまたは handoff に短く残す。変更中に risk が増えたら上げる。

| Risk | 目安 | 必要な実行・review role |
| --- | --- | --- |
| Low | copy / docs / isolated config、機械的で可逆、決定的 check がある | Delegation Value Test で main または implementation worker を選ぶ。独立 reviewer は任意。relevant deterministic gate は必須で、closure 前に diff と acceptance evidence を確認する |
| Medium | 通常の複数ファイル変更、共有ロジック、ユーザー可視 behavior、局所 API / state 変更 | implementation owner は Delegation Value Test で選び、独立 review role を分ける。verification は review role と兼任可能だが、acceptance evidence を独立に確認する |
| High | auth、billing、migration、data loss、security、production / infra、cross-slice architecture、広い UX / persistence、収束しない P0/P1 | implementation owner にかかわらず独立 review を置き、必要な domain（security / schema / UX 等）だけ追加する。verification role を別に立てるのは、acceptance evidence を独立に再現する必要がある場合に限る。高難度判断の model / effort は `model-routing.md` の高難度 role と host の実効設定に従う |

role は agent 数と同義ではない。main が implementation と orchestration を兼ねる場合もある。medium risk の reviewer が verification evidence も確認できるなら別 verifier を増やさない。high risk でも関係のない reviewer role を全列挙しない。

reviewer は implementation owner の自己申告を信用せず、diff、changed behavior、acceptance criteria、実際の verification output を読む。独立 review は実装者の会話履歴を引き継がない fresh context で行う。Claude Code の fork（`subagent_type: "fork"` や `context: fork`）や Codex の full-history fork は実装者の前提を共有するため、独立 review には使わない。Claude Code では bundled の `adversarial-reviewer` を使う。

委任する場合の prompt には `git add` / `git commit` / `git stash` / `git reset` / `git checkout --` / worktree 操作をしないことを書く。ベースライン比較は `git show HEAD:<path>` か read-only な差分で行う。

## Parallelization Rules

委任する場合の既定形は flat な main → leaf workers。並列化するのは独立した workstream と、独立した read-only 探索 / review / verification だけにする。書き込みを伴う並列作業は、編集対象が重ならない accepted slice に限る。1 名の worker に順番に任せるのも delegation であり、並列である必要はない。

並列化しない:

- 同じファイルの編集と最終統合。
- AskUser 判断、destructive operation、secret / production / billing / auth provider / cloud resource の変更判断。

fan-out の幅・深さ・同時数は host / workspace / repo の設定に従い、plugin 側で固定値を決めない。子 agent からの再委任は、host が許可し、親では分解できない独立 workstream がある場合だけにする。429 / rate limit を検知したら新規 spawn を止め、部分結果と未確認範囲を統合する。

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
