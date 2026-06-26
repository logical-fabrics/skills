# Safety Guardrails

禁止:

- hidden fallback。
- production deploy。
- billing / auth provider / cloud resource / production DB / secret の変更。
- destructive git operation。
- user changes の revert。
- secret、認証情報、支払い情報の log / artifact / AI prompt 混入。

許可:

- bounded retry。
- ユーザーに見える degraded mode。ただし plan / final に記録する。
- 明示依頼がある場合の commit。ただし unrelated change を含めない。

不安がある場合:

- current docs / Context7 / web / code を調べる。
- 調査で解けない material decision はユーザーに確認する。

