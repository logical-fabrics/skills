# Data And Migrations

- 既存 repo の ORM、migration、validation、schema、package、config を優先する。
- Drizzle / Zod は greenfield 計画または既存選定がない場合の planner 側の既定候補であり、executor が既存 repo へ勝手に持ち込まない。
- raw SQL は原則禁止。
- raw SQL 例外は、既存 repo の ORM / query builder で表現できない DB 固有機能、明確な性能要件、一時 migration、検証用 read に限る。
- ユーザー入力を含む SQL 文字列連結は禁止。

Schema changes:

- schema reviewer を入れる。
- YAGNI を確認する。
- 将来用 column、汎用 key-value、未使用 enum / status、過剰な履歴 table を避ける。
- migration、backfill、rollback / forward-fix、index、constraint、既存データ、権限影響を確認する。
- schema と runtime validation / API contract の source of truth を明確にする。
