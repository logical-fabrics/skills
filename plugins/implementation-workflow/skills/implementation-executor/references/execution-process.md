# Execution Process

- dirty worktree を確認する。ユーザーや他エージェントの変更を戻さない。
- git worktree を新規作成したら、.gitignore された自動生成ファイル（型定義、ルートツリー生成物など）と worktree ローカルの DB state を再生成する。忘れると tsc / e2e の失敗で初めて発覚する。
- 既存の命名、format、test、UI pattern を読み、最小の coherent slice を決める。
- main で直接やるか worker に渡すかは `review-and-parallelism.md` の Delegation Value Test で決める。main は source of truth、scope / risk、assignment、diff / evidence の受入、active plan / handoff を持つ。
- 編集前に影響範囲を確認する。変更後は近いテストから走らせる。
- format / lint の post-edit hook がある repo では、編集後に Biome などの高速な局所整形・lint を走らせ、自動修正後は差分を確認する。
- Knip のような全体解析（dependency / unused exports / unused files）は every-edit hook にしない。package、exports、entrypoint、config、build graph を触った slice の完了時か、handoff 前の quality gate で走らせる。
- 失敗したら原因を読む。安易な fallback、skip、mock、snapshot 更新で成功扱いしない。
- plan が seed / sample / demo asset でユーザーの主成果物を代替する設計なら、そのまま実装しない。失敗表示と復旧導線へ直すか、plan lane / audit lane に戻す。
- dev server / platform runtime / binding 設定を触る場合は、標準の `dev` command を production に近い統合入口に寄せる。frontend と runtime の別起動 proxy 構成や、外部 binding を外した local-only path を既定として残さない。
- 今回変更した feature が local simulator のない external service / media / AI / storage binding に依存するなら、標準 dev で remote binding / 実接続を使う。未接続なら feature-ready と報告しない。依存しない slice に実接続 gate を足さない。
- scope を広げる必要があれば理由を明示し、必要ならユーザーに確認する。
- `git commit` はユーザーの明示依頼がある場合だけ行う。定期的なコミットは推奨する。
