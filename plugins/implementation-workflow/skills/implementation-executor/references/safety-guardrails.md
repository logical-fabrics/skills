# Safety Guardrails

禁止:

- hidden fallback。
- ユーザーの入力、本人素材、ライブ生成、外部送信、課金、削除、公開などの主成果物を、別素材、seed、sample、mock、demo asset で代替して成功または準成功として扱うこと。
- production deploy。
- billing / auth provider / cloud resource / production DB / secret の変更。
- destructive git operation。
- user changes の revert。
- secret、認証情報、支払い情報の log / artifact / AI prompt 混入。

許可:

- bounded retry。
- ユーザーに見える degraded mode。ただし plan / final に記録する。
- seed / sample / demo asset を本人入力と切り離した初期状態、説明、テスト、セーフモードに使うこと。
- 明示依頼がある場合の commit。ただし unrelated change を含めない。

不安がある場合:

- current docs / Context7 / web / code を調べる。
- 調査で解けない material decision はユーザーに確認する。
