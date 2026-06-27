# Default Stack

このファイルは LF のハウス既定であり、汎用ベストプラクティスではない。**greenfield かつ TypeScript / JavaScript の Web アプリで、技術選定が未確定のときだけ**適用する。

適用しない場合:

- 既存 repo に技術選定がある（その repo 慣習を優先する）。
- 言語が JS/TS でない（Python / Go / Rust / Ruby など。その言語・エコシステムの標準に従う）。
- 領域が Web UI でない（CLI / batch / data pipeline / library / mobile / native / 組み込み）。

これらでは、ここに並ぶ具体 library を持ち込まない。下の Auth 方針（passwordless 既定）など、言語非依存の原則だけは横展開してよい。

既存 repo の明確な選択がない場合、または greenfield で特段指示がない場合（上記の適用条件を満たすとき）:

- DB / ORM: Drizzle
- Auth: Better Auth
- API: Hono
- Frontend: React
- Styling: Tailwind CSS
- Build / dev server: Vite
- Test: Vitest
- Format / lint: Biome
- Dependency / unused exports check: Knip
- Runtime schema: Zod
- Error monitoring: Sentry

ルール:

- 既存 stack、設計判断、互換性要件を優先する。
- 新規 dependency は Context7 または公式 docs で current install / config を確認する。
- package は原則最新。ただし既存 repo の制約に合わせる。
- raw SQL は原則禁止。例外は `data-modeling.md` に従う。
- Sentry は local では発火させない。staging と production で有効化し、1 project の中で environment を `staging` / `production` として分ける。

Frontend:

- Styling は、既存 design system / CSS stack / component library がない場合だけ Tailwind CSS を優先候補にする。
- URL query state は、React で既存方針がない場合だけ `nuqs` を優先候補にする。
- UI/UX rubric は見た目や挙動の品質を要求する。library 選定は既存 design system、router、framework、repo 方針を優先する。

Auth:

- ユーザーにパスワード作成・入力を求めるログインは原則採用しない。
- OAuth、Magic Link、Passkey を既定候補にする。
- Better Auth では OAuth は `socialProviders`、Magic Link は plugin、Passkey は plugin を使う。
- email/password を有効にする場合は例外扱いとし、理由、リスク、廃止条件を Decision Log に残す。
