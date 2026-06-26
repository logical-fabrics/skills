# Data Modeling

DB、schema、migration、validation がある場合に読む。

- 既存 repo の ORM、migration、validation、schema、package、config を優先する。
- Drizzle / Zod は greenfield または既存選定がない場合の既定候補。
- raw SQL は原則禁止。
- raw SQL の例外は、既存 ORM / query builder で表現できない DB 固有機能、明確な性能要件、一時 migration、検証用 read に限る。
- 例外は Decision Log に理由、範囲、入力安全性、test、戻し方を残す。
- ユーザー入力を含む SQL 文字列連結は禁止。

Schema review:

- DB schema の新規作成・変更では schema reviewer を必須にする。
- YAGNI を必須観点にする。
- 現在の user flow、整合性、検索、権限、監査に必要な列、table、index だけ採用する。
- 将来用 column、汎用 key-value 設定、未使用 status、未使用 enum、抽象的すぎる relation、過剰な履歴 table は原則禁止。
- migration、backfill、rollback / forward-fix、index、constraint、既存データ、権限影響を一緒に確認する。
