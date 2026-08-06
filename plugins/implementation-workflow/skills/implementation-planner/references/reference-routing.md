# Reference Routing

すべての references を毎回読む必要はない。依頼内容に応じて読む。

Always:

- `source-of-truth.md`
- `planning-process.md`
- `artifact-lifecycle.md`
- `output-contracts.md`
- `review-rubric.md`
- `ask-user.md`

UI / Web app:

- `ui-ux.md`
- `accessibility.md`
- `performance.md`
- `simplicity.md`

UI / Web app では `ui-ux.md` を canonical UI/UX rubric として扱う。executor / auditor 側の UI checklist は、この file の実装・監査向け要約であり、基準が衝突した場合は `ui-ux.md` を優先する。

Backend / API / CLI / batch / data pipeline / library (UI なし):

- `simplicity.md`
- `refactoring.md`
- `observability.md`
- `ci-security.md` when deploy、secret、CI が絡む場合。
- Backend / API が greenfield かつ JS/TS で既存選定がない場合だけ、`default-stack.md` の API 既定（Hono typed RPC、Zod 等）を確認する。Frontend / mobile 候補は持ち込まない。
- UI references（`ui-ux.md`、`accessibility.md`、`performance.md` の画面系）は読み込まない。`ui-ux.md` の「ユーザーの理解・判断・回復」原則は、CLI 出力・API レスポンス・エラーメッセージの分かりやすさとして読み替える。

非 JS / 非 Web / 非 API / 非 mobile の言語・領域 (Python / Go / Rust / Ruby / native module / 組み込み):

- `simplicity.md`
- `refactoring.md`
- `observability.md`
- `data-modeling.md`（DB がある場合の YAGNI / schema review の汎用部分のみ。Drizzle / Zod 等の JS 固有候補は適用しない）
- `default-stack.md` は読まない。技術選定は repo 慣習と当該言語の標準に従う。`default-stack.md` は greenfield かつ TS/JS Web / API / mobile に限った LF ハウス既定であり、他言語・他領域には適用しない。

mobile / native UI:

- `ui-ux.md` の原則（state machine、result-centered copy、操作後の進捗、回復）は platform UI に読み替えて適用する。
- `accessibility.md` は platform の a11y guideline（iOS / Android / 各 framework）へ読み替える。
- 技術選定は repo 慣習と platform 標準を優先する。greenfield かつ JS/TS mobile app で既存選定がない場合だけ、`default-stack.md` の mobile 既定（Expo）を確認する。Web 候補（React/Vite/Tailwind 等）は根拠なく持ち込まない。

AI feature:

- `ai-ux.md`
- `ai-runtime.md`
- `observability.md`
- `simplicity.md`

DB / schema / migration:

- `data-modeling.md`
- `simplicity.md`
- `ci-security.md` when migration or deployment is involved.

Auth:

- `default-stack.md` only for greenfield or no existing choice.
- `accessibility.md`
- `security / delivery` concerns via `ci-security.md` and `delivery.md` when environment or secrets are affected.

Delivery / production / staging:

- `delivery.md`
- `observability.md`
- `ci-security.md`

Refactoring / architecture / technical debt:

- `refactoring.md`
- `simplicity.md`
- `audit-rubric` equivalent from auditor when doing a broad health check.

Codex / Claude Code behavior:

- `host-adapters.md`

## Reference Index

上の routing で選んだ file が何を持っているか:

- `source-of-truth.md`: 判断の優先順位。
- `planning-process.md`: 計画ループ、freshness、route selection。
- `artifact-lifecycle.md`: 成果物の置き場所、active plan、archive、session handoff。
- `output-contracts.md`: 成果物契約と `Next Action Contract` の正本。
- `review-rubric.md`: P0/P1/P2、reviewer roles、改善ループ。
- `ask-user.md`: Decision Interview の正本。通過テスト、checkpoint、質問フォーマット、Decision Log。
- `ui-ux.md`: UI/UX canonical rubric、視覚検証、URL 状態、改行品質。
- `ai-ux.md`: AI-first UX。
- `ai-runtime.md`: Cloudflare AI Gateway、Workers AI、Gemma。
- `default-stack.md`: greenfield または既存選定がない場合の Drizzle、Better Auth、Hono（typed RPC）、React、Vite、Vitest、Zod、Expo。
- `data-modeling.md`: schema、Drizzle、raw SQL、YAGNI。
- `delivery.md`: CI/CD、Cloudflare、staging、production、OGP。
- `accessibility.md`: 実操作で確認する accessibility guardrails。
- `performance.md`: Core Web Vitals と latency。
- `observability.md`: monitoring、logs、traces、business events。
- `ci-security.md`: GitHub Actions hardening、OIDC、dependency review。
- `simplicity.md`: overengineering review。
- `refactoring.md`: LLM が読みやすい構造。
- `host-adapters.md`: Codex / Claude Code 固有差分。
- `../../implementation-executor/references/safety-guardrails.md`: 禁止・許可される操作の正本。
- `../../implementation-executor/references/model-routing.md`: model / effort / 委任 guardrail の正本。
