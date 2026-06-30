# Default Stack

このファイルは LF のハウス既定であり、汎用ベストプラクティスではない。**greenfield かつ TypeScript / JavaScript の Web app / API service / mobile app で、技術選定が未確定のときだけ**適用する。

適用しない場合:

- 既存 repo に技術選定がある（その repo 慣習を優先する）。
- 言語が JS/TS でない（Python / Go / Rust / Ruby など。その言語・エコシステムの標準に従う）。
- 領域が Web app / API service / mobile app でない（CLI / batch / data pipeline / library / native module / 組み込み）。

これらでは、ここに並ぶ具体 library を持ち込まない。下の Auth 方針（passwordless 既定）など、言語非依存の原則だけは横展開してよい。

既存 repo の明確な選択がない場合、または greenfield で特段指示がない場合（上記の適用条件を満たす Web app / API service のとき）:

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

- Vite と Workers runtime / bindings を別プロセスに分け、frontend dev server から `/api` proxy する構成を既定にしない。
- 公式 docs と current package を確認し、`@cloudflare/vite-plugin` など platform 公式の統合 dev server が使えるなら、それを標準の `dev` entrypoint にする。
- production が Worker + assets + bindings の同一 origin で動くなら、local dev / browser verification も同じ形を標準にする。
- 外部 service binding に local simulator がない場合でも、開発にその接続が必要なら標準 `dev` で remote binding / 実接続を使う。local-only の別 entrypoint を既定にして feature-ready と扱わない。

Mobile app の既定:

- Mobile framework: Expo

ルール:

- 既存 stack、設計判断、互換性要件を優先する。
- 新規 dependency、更新する dependency、設定を変える SDK / CLI は Context7 または公式 docs で current install / config を確認する。
- package は原則 latest。既存 version が latest より古く、repo の互換性制約に反しないなら、version upgrade を plan の実装 step と verification に含める。
- latest を使わない場合だけ、具体的な互換性制約、既知の不具合、pin / downgrade の解除条件を `Target Architecture` または `Risks and Rollback` に残す。
- raw SQL は原則禁止。例外は `data-modeling.md` に従う。
- Sentry は local では発火させない。staging と production で有効化し、1 project の中で environment を `staging` / `production` として分ける。

API:

- Hono を使う場合は、server route type を client に渡す RPC 型を既定にする。`export type AppType = typeof route`（または compose 済み routes）と `hc<AppType>()` を使い、手書き client 型や duplicated DTO を増やさない。
- request / response 型が必要な箇所では `InferRequestType` / `InferResponseType` を使う。
- request validation は Zod などの validator と Hono の validation flow に寄せ、handler では `c.req.valid()` で検証済み値を読む。
- RPC 型推論を壊さないため、route は宣言済み変数から `typeof` を export できる形にし、larger app では routes を chain / compose して型を保つ。
- client が読む API では、not found や error も `c.json(body, status)` のように status code 付きの typed JSON response にする。RPC client の推論が必要な endpoint で無自覚に `c.notFound()` を返さない。
- monorepo で backend / frontend を分ける場合は、両側の TypeScript strictness と project references / build artifact の扱いを確認してから `AppType` を共有する。

Frontend:

- Styling は、既存 design system / CSS stack / component library がない場合だけ Tailwind CSS を優先候補にする。
- URL query state は、React で既存方針がない場合だけ `nuqs` を優先候補にする。
- UI/UX rubric は見た目や挙動の品質を要求する。library 選定は既存 design system、router、framework、repo 方針を優先する。

Auth:

- ユーザーにパスワード作成・入力を求めるログインは原則採用しない。
- OAuth、Magic Link、Passkey を既定候補にする。
- Better Auth では OAuth は `socialProviders`、Magic Link は plugin、Passkey は plugin を使う。
- email/password を有効にする場合は例外扱いとし、理由、リスク、廃止条件を Decision Log に残す。
