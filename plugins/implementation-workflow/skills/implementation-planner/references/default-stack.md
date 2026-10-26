# Default Stack

LF のハウス既定であり、汎用ベストプラクティスではない。greenfield かつ TypeScript / JavaScript の Web app / API service / mobile app で、技術選定が未確定のときだけ適用する。

適用しない場合:

- 既存 repo に技術選定がある（repo 慣習を優先する）。
- 言語が JS/TS でない（Python / Go / Rust / Ruby など。その言語・エコシステムの標準に従う）。
- 領域が Web app / API service / mobile app でない（CLI / batch / data pipeline / library / native module / 組み込み）。

これらでは下の具体 library を持ち込まない。Auth 方針（passwordless 既定）など言語非依存の原則だけは横展開してよい。

適用条件を満たす Web app / API service の既定:

- DB / ORM: Drizzle
- Auth: Better Auth
- API: Hono
- Runtime schema: Zod
- Test: Vitest
- Format / lint: Biome
- Dependency / unused exports check: Knip
- Error monitoring: Sentry

Web frontend の既定:

- Frontend: React
- Styling: Tailwind CSS
- Build / dev server: Vite

Cloudflare Workers で Web frontend と API / bindings を同じ app として動かす場合:

- `@cloudflare/vite-plugin` を標準の `dev` entrypoint にする。Vite と Workers を別プロセスに分けて `/api` proxy する構成を既定にしない。
- production が Worker + assets + bindings の同一 origin で動くなら、local dev / browser verification も同じ形にする。
- local simulator がない外部 service binding は、binding に `remote: true` を付けて標準 `dev` で実接続する。local-only の別 entrypoint を既定にして feature-ready と扱わない。

Mobile app の既定:

- Mobile framework: Expo

ルール:

- 既存 stack、設計判断、互換性要件を優先する。
- dependency を追加・更新する時と SDK / CLI の設定を変える時は、Context7 または公式 docs で current install / config を確認する。
- package は原則 latest。既存 version が latest より古く、repo の互換性制約に反しないなら、upgrade を plan の実装 step と verification に含める。
- latest を使わない場合だけ、具体的な互換性制約、既知の不具合、pin / downgrade の解除条件を `Target Architecture` または `Risks and Rollback` に書く。
- raw SQL は原則禁止。例外は `data-modeling.md` に従う。
- Sentry は local では発火させない。staging と production で有効化し、1 project の中で environment を `staging` / `production` に分ける。

API:

- Hono では公式の RPC 型（`hc<AppType>()`）と Zod validator を既定にし、手書き client 型や duplicated DTO を増やさない。
- client が読む API では、not found や error も `c.json(body, status)` のように status code 付きの typed JSON response にする。`NotFoundResponse` を augment しない限り、RPC client の推論が必要な endpoint で `c.notFound()` を返さない。
- monorepo で backend / frontend を分ける場合は、両側の TypeScript strictness と project references / build artifact の扱いを確認してから `AppType` を共有する。

Frontend:

- Styling は、既存 design system / CSS stack / component library がない場合だけ Tailwind CSS を優先候補にする。
- URL query state は、React で既存方針がない場合だけ `nuqs` を優先候補にする。
- library 選定は既存 design system、router、framework、repo 方針を優先する。UI/UX rubric が求めるのは見た目と挙動の品質であり、library ではない。

Auth:

- ユーザーにパスワードの作成・入力を求めるログインは原則採用しない。
- OAuth、Magic Link、Passkey を既定候補にする。
- Better Auth では OAuth は `socialProviders`、Magic Link は `magicLink` plugin、Passkey は別 package の `@better-auth/passkey` を使う。
- email/password を有効にする場合は例外扱いとし、理由、リスク、廃止条件を Decision Log に残す。
