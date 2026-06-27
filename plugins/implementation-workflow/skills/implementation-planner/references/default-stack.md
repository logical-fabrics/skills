# Default Stack

既存 repo の明確な選択がない場合、または greenfield で特段指示がない場合:

- DB / ORM: Drizzle
- Auth: Better Auth
- API: Hono
- Frontend: React
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

Auth:

- ユーザーにパスワード作成・入力を求めるログインは原則採用しない。
- OAuth、Magic Link、Passkey を既定候補にする。
- Better Auth では OAuth は `socialProviders`、Magic Link は plugin、Passkey は plugin を使う。
- email/password を有効にする場合は例外扱いとし、理由、リスク、廃止条件を Decision Log に残す。
