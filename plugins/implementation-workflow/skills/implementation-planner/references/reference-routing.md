# Reference Routing

すべての references を毎回読む必要はない。依頼内容に応じて読む。

Always:

- `source-of-truth.md`
- `planning-process.md`
- `artifact-lifecycle.md`
- `output-contracts.md`
- `review-rubric.md`

UI / Web app:

- `ui-ux.md`
- `accessibility.md`
- `performance.md`
- `simplicity.md`

UI / Web app では `ui-ux.md` を canonical UI/UX rubric として扱う。executor / auditor 側の UI checklist は、この file の実装・監査向け要約であり、基準が衝突した場合は `ui-ux.md` を優先する。

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

Ask user:

- `ask-user.md` only when research cannot decide a material product, UX, cost, security, schema, compatibility, or production behavior decision.
