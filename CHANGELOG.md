# Changelog

## 0.1.20

- Strengthened `implementation-executor` so the main agent defaults to orchestration instead of direct coding for non-trivial implementation slices.
- Added explicit delegation guidance for implementation, review, and verification workers, with a narrow exception for tiny reversible changes or hosts without worker tools.
- Updated the prompt guide to set the same orchestration expectation for Execute prompts.
- Migration: none for users; installed plugin users should update to refresh executor behavior.

## 0.1.19

- Added actual plugin lifecycle hooks for Codex and Claude Code under `hooks/hooks.json`.
- Added a `PostToolUse` hook that runs Biome on edited files when the target repo has Biome configured.
- Added a `Stop` hook that runs Knip only when dependency graph inputs changed, such as package manifests, lockfiles, tsconfig, build config, or index entrypoints.
- Extended plugin validation to check bundled hook definitions and referenced hook scripts.
- Migration: installed plugin users should update and review the new hook component before enabling it in trusted workspaces.

## 0.1.18

- Strengthened package currency rules for `implementation-planner` and `implementation-executor`: package / library / SDK / CLI choices should default to latest, include upgrade steps when current repo versions can move forward, and document any pin / downgrade with constraints and removal conditions.
- Added quality-gate guidance for hooks: run fast Biome-style format / lint after edits or before completion, while keeping Knip-style whole-project dependency / export analysis for slice completion, handoff, CI, or package/export/build-graph changes rather than every edit.
- Migration: none for users; installed plugin users should update to refresh skill reference content.

## 0.1.17

- Added implementation-plan formatting hygiene for `implementation-planner`: Markdown plans should stay plain, structured, and execution-oriented for LLM implementers.
- Discouraged decorative bolding, emoji, visual separators, cosmetic callouts, and verbose title styling in active plans unless the formatting directly protects implementation safety.
- Clarified that `abstract-plan.html` may use visual hierarchy and design because it is the human-facing artifact, but it does not replace the concise implementation plan.
- Migration: none for users; installed plugin users should update to refresh skill reference content.

## 0.1.16

- Strengthened `implementation-planner` so active plans are explicitly for implementers, not records of the planning discussion.
- Added plan hygiene rules to remove discussion history, interim options, resolved reviewer notes, stale TODOs, and diff-style recap text from `current.md` unless they directly prevent implementation mistakes.
- Clarified that plan updates should rewrite the active plan as the current source of truth rather than appending chronology.
- Migration: none for users; installed plugin users should update to refresh skill reference content.

## 0.1.15

- Hardened planning, execution, and audit rules so seed, sample, mock, or demo assets cannot be treated as successful user-generated output.
- Clarified truthful fallback behavior: failures should remain failures with recovery paths instead of silently substituting unrelated assets.
- Strengthened `abstract-plan.html` lifecycle guidance for multi-area plans that need human alignment.
- Migration: none for users; installed plugin users should update to refresh skill reference content.

## 0.1.14

- Added a neutral UI copy principle: user-facing text should present decision material rather than instructing the user what to do.
- Added guidance to avoid action-leading expressions such as `次に〜`、`〜したい`、`1問`、`深掘り`、`やること`、`できること` in UI copy.
- Added preferred replacement patterns such as `確認ポイント`、`確認が必要な〜`、`判断が必要な〜`、`この後の流れ`、`復旧方法` across planning, execution, and audit references.
- Migration: none for users; installed plugin users should update to refresh skill reference content.

## 0.1.13

- Added the lane-boundary rule for `implementation-workflow`: Audit, Plan, and Execute stay separate, but each lane should proceed autonomously within its own boundary.
- Added `Next Action Contract` guidance so audit, planning, and execution outputs identify the recommended next lane, reason, ready-to-run slice, human-decision requirement, and suggested prompt.
- Added `/goal` recommendation fields to `Next Action Contract` so long-running planning review loops and multi-slice execution loops can use a short goal draft without blurring Plan into Execute.
- Clarified executor handling for recoverable stale plans: repo/docs/execution-confirmable drift should be repaired before continuing, while real product/business/security/rollout decisions still block for the user.
- Updated behavior smoke checks to verify AskUser minimization and next-lane handoff quality.
- Migration: none for users; installed plugin users should update to refresh skill reference content.

## 0.1.12

- Added Expo as the default mobile framework for greenfield JS/TS mobile apps when the repo has no existing mobile stack decision.
- Strengthened the Hono API default: use typed RPC (`AppType` + `hc<AppType>()`), `InferRequestType` / `InferResponseType`, validator-backed request parsing, and typed JSON responses with explicit status codes for client-facing endpoints.
- Updated reference routing so mobile planning can consult the mobile default without importing Web stack choices into native/mobile work.
- Migration: none for users; installed plugin users should update to refresh skill reference content.

## 0.1.11

- Unified the plan template: `current.md`（active plan）と implementation-plan content を 1 つの section 契約に統合し、`output-contracts.md` を単一の正本にした。`Completed` / `Verification status` / `Open decisions` は独立 section をやめ、`Current State` / `Verification Plan` / `Review Findings` に畳む。
- Aligned `validate-plan-structure.mjs` with the unified contract（`## Next actions` を追加）。
- Rewrote `check-plan-ready.mjs` to判定を構造ベースにし、rubric 引用などの `P0` / `P1` 文字列での誤検知（false positive）を解消。Status・open questions・未解決 findings・Handoff の有無で判定する。
- Added reference-routing entries for backend / CLI / data pipeline / library と非 JS・非 Web 言語（Python / Go / Rust / Ruby / mobile / native）。これらでは UI references と `default-stack.md` を適用しない。
- Strengthened `default-stack.md` のゲート: LF ハウス既定は greenfield かつ TS/JS Web に限定し、他言語・他領域には持ち込まない旨を明記。
- Added before / after コピー例を `ui-ux.md`（result-centered copy）と `ai-ux.md`（生テキスト → 操作可能な結果）に追加。
- Documented the intended manifest host difference: Codex は `interface` ブロック、Claude Code は top-level `displayName` / `keywords`（`interface` 概念なし、`--strict` 警告回避）。Claude manifest に `displayName` / `keywords` / `$schema` を追加。
- Migration: none for users; installed plugin users should update to refresh skill reference content.

## 0.1.10

- Restored Tailwind CSS as a default-stack styling candidate when a repo has no existing design system, CSS stack, or component library.
- Kept the canonical UI/UX rubric stack-agnostic: it requires visual and interaction quality, not a specific styling library.
- Migration: none for users; installed plugin users should update to refresh skill reference content.

## 0.1.9

- Restored `nuqs` as a React-only default-stack candidate for URL query state when a repo has no existing routing/state policy.
- Kept the canonical UI/UX rubric library-agnostic: it requires URL/back/reload/share behavior, not a specific library.
- Migration: none for users; installed plugin users should update to refresh skill reference content.

## 0.1.8

- Removed the standalone `Reference Policy` from the canonical UI/UX rubric to keep it focused on design and review criteria.
- Removed Tailwind and `nuqs` library preferences from UI/UX references so technology choices stay in stack-specific planning.
- Added explicit UI verification evidence requirements for routes, viewports, browser/tool, screenshots or traces, checked states, unchecked states, and residual risks.
- Simplified prompt examples to avoid foregrounding external-source selection as a user-facing workflow.
- Migration: none for users; installed plugin users should update to refresh skill reference content.
- Known risks: greenfield stack guidance now lives outside the UI rubric and should be supplied by default-stack or repo conventions.

## 0.1.7

- Added a work-progress-after-actions principle: after an action, the UI must show that the user's work advanced, not merely that system state changed.
- Added queue-style UI guidance for review, approval, judgment, and task lists so completed items leave the queue, move to the next item, show completion, return to a parent list, or expose undo/review locations.
- Added guidance to avoid no-op choices such as vague hold actions unless they change queue handling, notifications, discoverability, reminders, pins, or notes.
- Updated executor, auditor, testing, and prompt guide references to check post-action progress and queue behavior.
- Migration: none for users; installed plugin users should update to refresh skill reference content.
- Known risks: behavior smoke should verify queue-style UI prompts produce concrete post-action navigation or state expectations.

## 0.1.6

- Updated the UI/UX reference policy to prefer public guidelines from product teams operating well-regarded real services over government sites or formal standards.
- Added Shopify Polaris, GitHub Primer, Atlassian Design System, Stripe, Linear, and Apple HIG as preferred external reference candidates when they fit the product context.
- Clarified that product-team guidelines are still hypotheses until validated against the current product's users, workflows, and browser evidence.
- Migration: none for users; installed plugin users should update to refresh skill reference content.
- Known risks: external product-team guidelines should not override the local product's actual user evidence or existing design system.

## 0.1.5

- Adjusted the UI/UX rubric to prioritize observed product/user evidence, existing design systems, and real workflow outcomes over government sites or formal standards.
- Reframed standards and government design systems as guardrails for accessibility or compliance, not proof of good UX.
- Removed fixed external source lists from the canonical UI/UX reference and replaced them with a reference policy.
- Migration: none for users; installed plugin users should update to refresh skill reference content.
- Known risks: future UX research should avoid treating generic guidelines as accepted product truth without browser/user evidence.

## 0.1.4

- Reorganized `ui-ux.md` as the canonical UI/UX rubric for planner, executor, and auditor references.
- Integrated researched UX best practices around usability heuristics, system status, user control, progressive disclosure, form recovery, plain language, accessibility, responsive layout, and destructive actions.
- Reduced duplicate UI guidance in executor, testing, and audit references by pointing them back to the canonical rubric.
- Updated prompt examples and Codex default prompts for UI/UX audit and planning discoverability.
- Migration: none for users; installed plugin users should update to refresh skill reference content.
- Known risks: behavior smoke should confirm the installed plugin applies the reorganized rubric in real audit, planning, and execution prompts.

## 0.1.3

- Added result-centered UI copy guidance: describe what changes for the user instead of foregrounding internal storage, classification, processing, or backend reuse.
- Added checks for visibility, notification, reversibility, sharing, disclosure, and state changes in action copy.
- Added guidance to avoid mandatory system-driven reason fields and to scale explanatory text by operation risk and repetition.
- Updated prompt examples for copy audits, planning, and execution around user-visible outcomes.

## 0.1.2

- Strengthened UI/UX planning, implementation, audit, and verification guidance around CTA proximity to decision material.
- Added desktop-specific checks for excessive eye movement, pointer travel, and layouts that only add whitespace instead of keeping related information and actions together.
- Added action-label consistency rules so one intent has one route, duplicate labels are justified, and decision buttons stay usable instead of becoming explanation cards.
- Updated prompt examples for judgment-heavy UI audits, plans, and execution verification.

## 0.1.1

- Removed thin Claude Code slash command aliases so `implementation-workflow` exposes only 3 skills.
- Clarified source-of-truth precedence, lightweight planning, auditor next actions, AskUser criteria, and default stack policy including Sentry, Biome, and Knip.
- Added repo-local operating instructions in Japanese with `AGENTS.md` as the source and `CLAUDE.md` as a symlink.
- Documented version bump and update-cache requirements for plugin distribution.
- Documented `/goal` usage for long-running Codex / Claude Code execution work.
- Hardened plugin validation to ignore non-directory files such as `.DS_Store`.

## 0.1.0

- Added `implementation-workflow` plugin.
- Added `implementation-planner`, `implementation-executor`, and `implementation-auditor` skills.
- Added Codex and Claude Code plugin manifests.
- Added Claude Code compatibility commands.
- Added plugin validation, Biome, Knip, and CI.
