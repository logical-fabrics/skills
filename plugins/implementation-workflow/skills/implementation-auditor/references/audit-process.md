# Audit Process

audit を subagent に分けるのは、互いに独立した広い scope（例: UI 導線と data model）を read-only で並行調査する価値がある時だけにする。委任の判断は `../../implementation-executor/references/review-and-parallelism.md`、model / effort は同じ directory の `model-routing.md` に従う。findings の統合と高リスク finding の判断は main が行う。

1. Scope を決める。
   - 全体 health check。
   - UI/UX。
   - architecture / refactoring。
   - data model。
   - tests / verification。
   - delivery / observability。
   - AI feature。
2. Source of truth を読む。
   - 現在の repo。
   - active plan。
   - docs。
   - schema。
   - routes。
   - UI。
   - tests。
   - deployment / CI config。
3. 実際の挙動を確認する。
   - Web UI は可能なら実ブラウザで主要導線を見る。
   - test / lint / typecheck / build は scope に応じて実行する。
4. 問題を evidence と impact で整理する。
5. findings ごとに `Plan first` / `Execute small fix` / `Ask user` / `Accept risk` の next action を付ける。
6. 自動修正候補、plan 化候補、要ユーザー判断、受け入れ可能なリスクに分ける。
7. すぐに実装しない場合も、次に再開できるよう `Next review action` を明示する。
8. `Next Action Contract` で、次に使う入口、理由、実行可能 slice、人間判断の要否、推奨 prompt を明示する。

Audit の目的は責めることではない。現在の実装をより良くするため、実害と改善順序を明確にする。
