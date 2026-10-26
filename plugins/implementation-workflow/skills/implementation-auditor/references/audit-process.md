# Audit Process

Audit の目的は実装を責めることではなく、実害と改善順序を明確にすること。

subagent は、互いに独立した広い scope（例: UI 導線と data model）を read-only で並行調査する価値がある時だけ使う。委任の判断は `../../implementation-executor/references/review-and-parallelism.md`、model / effort は同 directory の `model-routing.md` に従う。findings の統合と高リスク finding の判断は main が行う。

1. Scope を決める: 全体 health check、UI/UX、architecture / refactoring、data model、tests / verification、delivery / observability、AI feature。
2. Source of truth を読む: 現在の repo、active plan、docs、schema、routes、UI、tests、deployment / CI config。
3. 実挙動を確認する。Web UI は可能なら実ブラウザで主要導線を見る。test / lint / typecheck / build は scope に応じて実行する。
4. 問題を evidence と impact で整理する。
5. findings ごとに next action（`Execute small fix` / `Plan first` / `Ask user` / `Accept risk`）を付ける。自動修正候補は `auto-fix-policy.md` の Safe auto-fix candidates に当たるものだけにする。
6. すぐ実装しない場合も、再開できるよう `Next review action` を示す。
7. `Next Action Contract` に、次の入口、理由、実行可能 slice、人間判断の要否、推奨 prompt を書く。
