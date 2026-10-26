# Review And Parallelism

## Main Agent Role

main は実装者と orchestrator を兼ねる。目標は受入品質を保ったまま、完了までの時間・使用量・手直しを抑えること。委任件数や並列数は成果ではない。

main が常に持つ:

- source of truth の確認、slice の scope / risk 判定、implementation owner の決定。
- worker の diff・findings・evidence の受入判断と統合。
- scope creep、stale plan、AskUser / blocked、secret・destructive・production 操作の停止判断。
- 完了確認、final response、handoff 更新。

<!-- executor-delegation-contract:start -->
```json
{
  "version": 4,
  "primary_objective": "accepted-outcome-with-total-cost-awareness",
  "default_owner": "main-single-agent",
  "delegate_when": "expected-context-savings-exceed-overhead",
  "self_check_delegation": "none",
  "main_direct_when": "overhead-meets-or-exceeds-context-savings",
  "risk_controls": "independent-review-and-verification",
  "parallelize_when": "independent-workstreams",
  "worker_unavailable": "reassess-context-benefit-and-scope"
}
```
<!-- executor-delegation-contract:end -->

この JSON が delegation policy の不変条件の正本。判断の中身は下の Delegation Value Test に書く。他の file は要約だけにし、別の閾値や例外を作らない。

### Delegation Value Test

既定は main 1 体で、調査・実装・test・修正まで通す。coding はこれらが同じ context を共有して連続するため、分けると説明・context 複製・起動待ち・方向修正・統合・再検証の overhead が増え、token も数倍になる。委任は、別 context に隔離できる作業量がこの overhead を明確に上回る時だけ。拮抗したら main がやる。

- main が直接やる: 数回の tool call で終わる作業、小さく coherent な変更、順番に依存する作業、1 ファイル編集、main が context を持つ作業、`rg` や数ファイルの読み取りで済む調査。ファイル数や risk だけを委任理由にしない。
- 委任が向く: main の context を埋める read-heavy な探索・triage・要約、大量の log / test output を伴う loop、state を共有しない大きな独立 workstream、独立 review。
- 工程ではなく context で分ける。feature を実装した者がその test も書く。
- 自分の作業の検証や再確認に subagent を使わない。test や lint は main が実行する。例外は risk 表の独立 review と、出力が main の context を埋めるほど大きい verification。
- 1 体で足りるなら 1 体。委任した調査を main が並行して繰り返さない。待つ間は依存しない作業を進める。
- worker が main の判断や context を何度も求めるなら、部分結果を受け取って main で続ける。
- worker が使えない時は、main で安全に扱えるなら続行する。判断品質・権限・scope を損なう時だけ blocked / AskUser。

host 差分:

- Claude Code は指示がなくても subagent を起動する。この skill は委任を促さず、「main が直接やる」作業では委任しない。
- Codex は `ultra` 以外では、ユーザー・`AGENTS.md`・skill が求めた時だけ subagent を起動する。この skill が許可するのは「委任が向く」作業で test を通った時だけ。
- `ultra` / `ultracode` / Workflow が同じ workstream を orchestrate していれば manual fan-out を重ねない。

risk 表が求める独立 review は Delegation Value Test の対象外。どちらの host でも fresh context で行う。model / effort は `model-routing.md`、host の設定は `host-adapters.md`。

## Risk-based Review

slice 開始時に risk を選び、理由を作業メモか handoff に 1 行残す。risk が増えたら上げる。risk は owner ではなく、review / verification の強さを決める。

| Risk | 目安 | 必要な role |
| --- | --- | --- |
| Low | copy / docs / isolated config、機械的で可逆、決定的 check がある | 関係する deterministic gate は必須。独立 reviewer は任意。closure 前に diff と acceptance evidence を確認する |
| Medium | 通常の複数ファイル変更、共有ロジック、ユーザー可視 behavior、局所 API / state 変更 | 独立 reviewer。verification を兼ねてよいが、acceptance evidence は独立に確認する |
| High | auth、billing、migration、data loss、security、production / infra、cross-slice architecture、広い UX / persistence、収束しない P0/P1 | 独立 reviewer と、必要な domain（security / schema / UX 等）だけの追加 reviewer。evidence を独立に再現する必要がある時だけ別 verifier。model / effort は `model-routing.md` の高難度 role と host の実効設定に従う |

- role は agent 数ではない。不要な reviewer や verifier を足さない。
- reviewer は実装者の自己申告を信用せず、diff、changed behavior、acceptance criteria、実際の verification output を読む。
- 独立 review は実装者の会話を引き継がない fresh context で行う。fork（Claude Code の `subagent_type: "fork"` / `context: fork`、Codex の full-history fork）は使わない。Claude Code では bundled の `adversarial-reviewer` を使う。
- 委任 prompt には `git add` / `git commit` / `git stash` / `git reset` / `git checkout --` / worktree 操作の禁止を書く。比較は `git show HEAD:<path>` などの read-only 操作で行う。

## Parallelization Rules

- 委任の形は flat な main → leaf workers。1 体に順番に任せるのも委任で、並列である必要はない。
- 並列にするのは独立 workstream と、read-only の探索 / review / verification だけ。書き込みの並列は編集対象が重ならない slice に限る。
- 並列にしない: 同じファイルの編集と最終統合、AskUser 判断、destructive・secret・production・billing・auth provider・cloud resource の判断。
- 幅・深さ・同時数は host / repo の設定に従い、plugin では固定しない。子からの再委任は、host が許可し親で分解できない独立 workstream がある時だけ。
- 429 / rate limit を検知したら新規 spawn を止め、部分結果と未確認範囲を統合する。

## Findings And Closure

- accepted slice、touched surface、changed behavior の未解決 P0/P1 は直す。scope 外の P0/P1 は backlog 化し、今回の完了条件と分ける。
- P2 は修正・受け入れ・延期のどれかを記録する。slice を広げすぎない。
- 修正後は、その finding と変わった surface に必要な reviewer / check だけ再実行する。
- review の回数に目標や上限を置かない。同じ原因で 2 回進展がない、evidence が相反する、risk が上がった時は model / role / scope を escalation する。安全に解けない判断だけユーザーへ戻す。

完了条件（両方）:

1. risk 上必要な reviewer / check を通し、accepted slice、touched surface、changed behavior に未解決 P0/P1 がない。
2. acceptance criteria に対応する evidence（実装、test、browser、build、log 等）が揃い、未確認範囲と残リスクが書かれている。

「reviewer が何も出さなかった」「test が通った」だけでは完了にしない。不要な reviewer の再実行や、model 品質を測る独自 eval は要求しない。

## Reviewer Roles

changed behavior と risk に関係する role だけ選ぶ:

- Adversarial: medium / high risk の correctness、隠れた失敗、verification gap。
- UX: ユーザー可視 flow、mobile / desktop、copy、forms、accessibility を変えた時。
- Simplicity: 新しい abstraction、基盤、状態管理、広い refactor を足した時。
- Schema: DB、migration、既存データを変えた時。
- Security: auth、secret、permission、external input、infra boundary を変えた時。

各 review は findings、fix / accept / defer / blocked の判断、確認した evidence を返す。「レビューした」だけで終わらせない。
