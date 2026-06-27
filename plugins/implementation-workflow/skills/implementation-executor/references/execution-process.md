# Execution Process

- dirty worktree を確認する。ユーザーや他エージェントの変更を戻さない。
- 既存の命名、format、test、UI pattern を読む。
- 最小の coherent slice を決める。
- 編集前に影響範囲を確認する。
- 変更後は近いテストから走らせる。
- 失敗したら原因を読む。安易な fallback、skip、mock、snapshot 更新で成功扱いしない。
- plan に seed / sample / demo asset でユーザーの主成果物を代替する設計が含まれていたら、そのまま実装しない。失敗表示と復旧導線へ直すか、plan lane / audit lane に戻す。
- scope を広げる必要がある場合は理由を明示し、必要ならユーザー確認する。
- コミットは定期的に行う方針を推奨するが、実際の `git commit` はユーザーの明示依頼がある場合だけ行う。
