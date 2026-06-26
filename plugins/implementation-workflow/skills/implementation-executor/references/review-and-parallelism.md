# Review And Parallelism

並列化する:

- 独立した code path 調査。
- docs / Context7 research。
- UX review。
- simplicity / overengineering review。
- schema review。
- security / infra / delivery review。
- 独立した検証。

並列化しない:

- 同じファイル編集。
- 最終統合。
- AskUser 判断。
- destructive operation。

Implementation review:

- accepted slice、touched surface、changed behavior に関する P0/P1 が残っていれば修正する。
- scope 外の P0/P1 は隠さず backlog 化し、今回の完了条件とは分ける。
- P2 は今回の slice を広げすぎない範囲で修正、受け入れ、延期を記録する。
- 最大 5 rounds。

1 round は、findings list、fix / accept / defer / blocked 判断、verification delta の 3 点を含む。

Reviewer roles:

- UX reviewer: 実ユーザーの導線、モバイル、日本語、状態表示。
- Simplicity reviewer: 抽象化、汎用化、独自基盤、状態管理が過剰でないか。
- Schema reviewer: DB、migration、YAGNI、既存データ。
- Security reviewer: auth、secret、permission、external input。
