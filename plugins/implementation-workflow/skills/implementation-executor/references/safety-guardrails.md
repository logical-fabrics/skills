# Safety Guardrails

この file は planner / executor / auditor と委任 worker に共通の正本。各 `SKILL.md` には lane 固有の禁止と要点だけを置き、完全な列挙はここに集約する。

禁止:

- hidden fallback。
- ユーザーの入力、本人素材、ライブ生成、外部送信、課金、削除、公開などの主成果物を、別素材、seed、sample、mock、demo asset で代替して成功または準成功として扱うこと。
- production deploy。
- billing / auth provider / cloud resource / production DB / secret の変更。
- destructive git operation。
- user changes の revert。
- 委任した worker による git add / commit / stash / reset / checkout -- / worktree 操作。委任プロンプトで明示的に禁止する。ベースライン比較は stash ではなく `git show HEAD:<path>` か別 worktree で行わせる。
- secret、認証情報、支払い情報の log / artifact / AI prompt 混入。
- repo の内容を外部ホスティングへ publish すること（Claude Code の artifact、Codex app の Sites 等）を、ユーザーの依頼や明示的な合意なしに行うこと。publish 先が作成者限定でも、外部インフラへの送信であることは変わらない。
- publish したページの共有範囲を、ユーザーの明示的な指示なしに広げること。共有先を組織内に限定できない環境では、顧客の設計や非公開情報を含むページを共有しない。

許可:

- bounded retry。
- ユーザーに見える degraded mode。ただし plan / final に記録する。
- seed / sample / demo asset を本人入力と切り離した初期状態、説明、テスト、セーフモードに使うこと。
- 明示依頼がある場合の commit。ただし unrelated change を含めない。

不安がある場合:

- current docs / Context7 / web / code を調べる。
- 調査で解けない material decision はユーザーに確認する。
