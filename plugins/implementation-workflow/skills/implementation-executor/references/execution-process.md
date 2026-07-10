# Execution Process

- dirty worktree を確認する。ユーザーや他エージェントの変更を戻さない。
- git worktree を新規作成したら、.gitignore された自動生成ファイル（型定義、ルートツリー生成物など）や worktree ローカルの DB state を再生成するステップを踏む。忘れると検証（tsc / e2e）が失敗して初めて発覚する。
- 既存の命名、format、test、UI pattern を読む。
- 最小の coherent slice を決める。
- 編集前に影響範囲を確認する。
- 変更後は近いテストから走らせる。
- format / lint の post-edit hook が利用できる repo では、編集後に Biome などの高速で局所的な整形・lint を走らせる。自動修正後は差分を確認する。
- Knip のような dependency / unused exports / unused files の全体解析は every-edit hook にしない。package、exports、entrypoint、config、build graph を触った slice の完了時、または handoff 前の quality gate として走らせる。
- 失敗したら原因を読む。安易な fallback、skip、mock、snapshot 更新で成功扱いしない。
- plan に seed / sample / demo asset でユーザーの主成果物を代替する設計が含まれていたら、そのまま実装しない。失敗表示と復旧導線へ直すか、plan lane / audit lane に戻す。
- dev server / platform runtime / binding 設定を触る場合は、標準の `dev` command を production に近い統合入口に寄せる。frontend と runtime を別起動にする古い proxy 構成や、外部 binding を外した local-only path を既定として残さない。
- 今回変更した feature が external service / media / AI / storage などに依存し、その binding に local simulator がない場合は、標準 dev で remote binding / 実接続を使うか、未接続時は feature-ready と報告しない。依存しない slice へ実接続 gate を追加しない。
- scope を広げる必要がある場合は理由を明示し、必要ならユーザー確認する。
- コミットは定期的に行う方針を推奨するが、実際の `git commit` はユーザーの明示依頼がある場合だけ行う。
