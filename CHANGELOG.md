# Changelog

## 0.3.2

- Moved `adversarial-reviewer` from Sonnet 5 `high` to Opus 5 `medium`. Anthropic names code review and bug-finding as an Opus 5 strength with both high precision and high recall, and states it stays accurate at lower effort, so the review lane raises the model tier before the effort level. The agent holds no delegation tool, so the Claude 5 generation's stronger tendency to spawn subagents does not apply to it.
- Removed the reviewer's own confidence filter. Asking for "high-confidence P0/P1 only" is followed literally by current models, which drop findings they already identified and lower measured recall. The reviewer now reports every finding outside style preference and out-of-scope idealism with a `confidence` field beside `severity`, and the parent agent keeps the filtering and final acceptance it already owned.
- Added the matching rule to `model-routing.md`: the Claude Code adversarial review baseline is Opus 5 `medium`, Sonnet 5 stays the tier for evidence-confirmation review, and review-lane prompts must not carry self-filtering language.
- Migration: update the installed plugin and restart Claude Code. Expect the reviewer to return more findings per pass, including low-severity and low-confidence ones; treat `confidence` as the field to sort on rather than reintroducing a filter in the prompt.

## 0.3.1

- Restored the `Next Action Contract` block in the executor's `artifact-lifecycle.md`. Pointing at the canonical definition in another skill's reference was one hop too far: a behavior smoke showed the executor writing a free-prose `## Next Action Contract` section instead of filling the seven contract fields inside `## Implementation Handoff`. The block is an output skeleton, not duplicated instruction prose, so each lane keeps a copy and the canonical definition governs its fields.
- Migration: none for users; installed plugin users should update to restore the handoff contract format.

## 0.3.0

- Refreshed Claude Code model routing for the Claude 5 generation: Claude Opus 5 is now the default general main and daily coding model (xhigh for coding / agentic work, high otherwise), Claude Sonnet 5 is the bounded worker tier, Claude Fable 5 is reserved for the highest-capability and longest-running work, and Claude Haiku 4.5 is documented as not supporting the effort parameter.
- Rewrote the effort guidance as a swept axis rather than fixed values: carried-over effort settings should be re-measured, Opus 5 low / medium are usable as the primary cost and latency control where quality holds, and response length is controlled by the prompt because effort only changes thinking volume.
- Reframed the flat orchestration default as a guardrail against the Claude 5 generation's stronger tendency to delegate, added explicit delegation-scenario and worker-cap rules, and stopped requiring a separate verification role at high risk unless acceptance evidence needs independent reproduction.
- Told delegation prompts not to carry generic self-verification instructions, which cause over-verification on current models, while keeping the evidence-quality rules (do not accept a worker's self-report, do not treat a CLI success message as the sole proof).
- Removed the retention-constrained default escalation path: Opus 5 has no 30-day data retention requirement, so it is now the escalation target when Fable 5 conflicts with organization policy.
- Collapsed duplicated guidance to single canonical locations: model routing to `model-routing.md`, the `Next Action Contract` block to `output-contracts.md`, prohibited operations to `safety-guardrails.md`, and artifact placement / archive / cleanup to the planner `artifact-lifecycle.md` with lane-specific deltas only.
- Replaced the planner `SKILL.md` twenty-item reference list with the five always-read references plus the routing table, and moved the full reference index into `reference-routing.md`.
- Made `verification-worker` a real leaf: it no longer loads the whole `implementation-executor` skill, and its unsupported `effort` setting was removed.
- Downgraded the `ui-ux.md` banned-word rule from three repeated lists to one principle plus the Before / After examples, and added a missing example.
- Added host sharing channels for `abstract-plan.html`: Claude Code can publish it as an artifact from the skill, and Codex users can share it through Sites in the app. The repository file stays the source of truth, publishing requires an explicit request, and the published URL is recorded in `## Implementation Handoff`.
- Documented the intended host difference (Claude publishes from the skill, Codex is started by a person in the app) together with the conditions that block publishing regardless of plan: zero data retention / CMEK / HIPAA organizations, Bedrock / Vertex / Foundry, API-key or gateway-token sessions, and CI runs. A published artifact is private to its author on every plan; the Pro / Max limitation applies to sharing, where a public link is the only available audience.
- Added a guardrail against publishing repository content to external hosting without an explicit request, and a separate one against widening a published page's audience, including not sharing pages with customer or non-public design when the audience cannot be restricted to the organization.
- Made plugin agent `effort` and `skills` optional in validation so leaf agents can run without loading a whole skill, and added a deterministic check that rejects `effort` on models that do not accept it.
- Added the cross-lane `learning-curator` skill to convert accepted human corrections and recurring review feedback into deduplicated target-repository instructions, reusable skills, or deterministic guardrails.
- Added a cross-host `UserPromptSubmit` command hook that detects likely correction signals and injects the curation workflow without treating regex matches as proof of a durable learning.
- Added a one-shot `Stop` outcome gate only for high-precision, explicit persistence requests such as `覚えて`, `次から`, and direct AGENTS.md / CLAUDE.md update requests.
- Added `今の訂正、再発防止して` as the recommended short natural-language trigger for the learning workflow and explicit persistence gate.
- Kept hook state ephemeral and metadata-only: raw prompts, transcripts, secrets, and generated Codex memory state are not persisted or edited.
- Documented promotion thresholds, ADD / REFINE / MERGE / NOOP delta updates, canonical destination routing, false-positive fixtures, behavior replay, and the methodology derived from Codex / Claude Code guidance, Anthropic Hookify, OpenHands agent-memory, accumulated behavioral rules, Reflexion, ExpeL, and ACE.
- Migration: update the installed plugin, review and trust the changed hooks in Codex, then restart Codex / Claude Code so the new skill and hook definitions are loaded.

## 0.2.2

- Made Codex routing follow the settings actually selectable in the host: bounded coding workers use GPT-5.6 Luna xhigh, context-heavy or complex-debugging workers use Terra xhigh, and high-difficulty judgment uses Sol xhigh.
- Removed Codex max from the routing contract. Public API max evaluations remain cost-performance evidence, while Codex ultra is treated only as multi-agent orchestration for separable workstreams, not as a single-agent max substitute.
- Limited Luna low / medium to deterministic verification, excluded low / medium from code-generating workers and review, and added optimization priority plus retry cost to the delegation prompt contract.
- Refreshed GPT-5.6 primary sources to the general-availability launch and current model catalog. Claude Code agent model and effort defaults are unchanged.
- Migration: installed plugin users should update and restart Codex / Claude Code to refresh model-routing behavior.

## 0.2.1

- Corrected model routing to follow each vendor's official defaults without forcing symmetric tiers: Codex now starts an uncertain general task on GPT-5.6 Sol at medium effort, while Claude Code keeps Sonnet 5 at its default high effort for daily coding and reserves Fable 5 for the hardest and longest-running work.
- Kept GPT-5.6 Terra for bounded everyday workers, GPT-5.6 Luna / Claude Haiku 4.5 for clear repeatable leaf tasks, and raised the bundled Claude implementation worker from medium to Sonnet 5's official default high effort.

## 0.2.0

- Reworked model routing around current official OpenAI and Anthropic guidance: GPT-5.6 is no longer treated as limited preview, routine implementation defaults to GPT-5.6 Terra / Claude Sonnet 5, and GPT-5.6 Sol / Claude Fable 5 are reserved for difficult synthesis, high-risk decisions, and long-running work.
- Replaced the custom two-level, 8-10-agent fan-out prescription with a flat host-native default. Codex Ultra and Claude Code ultracode / dynamic workflows are used only for work that divides cleanly, and are not stacked with manual fan-out.
- Changed implementation review from a mandatory three-worker, all-reviewers-for-up-to-ten-rounds loop to low / medium / high risk profiles with closure based on zero unresolved P0/P1 findings and complete acceptance evidence.
- Added Claude Code plugin subagents for implementation, adversarial review, and verification with bounded model, effort, turn, and tool policies. Codex continues to use its built-in or project-configured subagents because Codex plugins do not distribute the same agent component format.
- Made model capability, pricing, availability, retention, and effort guidance depend on current vendor primary sources; local release checks do not attempt small-sample model quality or cost-performance benchmarking.
- Made the Knip Stop hook session-edit-aware so pre-existing dirty worktree changes do not trigger it, tracked successful pnpm / npm / yarn / bun changes through Bash wrappers such as `rtk`, and added a non-blocking Knip recheck after continuation edits without creating a Stop loop.
- Updated `@biomejs/biome` to 2.5.3 and Knip to 6.26.0.
- Migration: update the installed plugin and restart Codex / Claude Code so the new skills, agents, hooks, and routing guidance are loaded.

## 0.1.26

- Replaced blanket UI verification with risk-based levels that distinguish targeted browser smoke, targeted E2E, and full E2E.
- Limited desktop/mobile screenshots, URL-state matrices, auth/permission checks, and UI state permutations to changes that can affect those behaviors.
- Clarified that review rounds rerun the closest verification delta, while full E2E or release gates normally run once at closure unless a later fix affects their surface.
- Prevented unrelated route-state findings from automatically expanding an accepted implementation slice, while retaining P0/P1 treatment for target loss, wrong-target actions, and input loss.
- Migration: none for users; installed plugin users should update to refresh verification behavior.

## 0.1.25

- Updated multi-agent model routing for the July 2026 model generation: Claude Fable 5 / GPT-5.6 Sol now anchor orchestration and hardest judgment, Claude Sonnet 5 / GPT-5.6 Terra are the default implementation workers, and Claude Haiku 4.5 / GPT-5.6 Luna handle bounded mechanical leaf tasks.
- Added task-risk-based escalation, explicit model / effort delegation prompts, GPT-5.6 limited-preview fallback rules, and a guard against multiplying Codex `ultra` built-in subagents with manual fan-out.
- Documented current host-specific model IDs, GPT-5.6 `max` versus `ultra`, and Claude Fable 5's 30-day retention constraint, based on current OpenAI and Anthropic primary sources.
- Migration: none for users; installed plugin users should update to refresh model routing behavior.

## 0.1.24

- Added cross-project execution learnings to `implementation-executor` references: delegation prompts must forbid worker `git add` / `commit` / `stash` / `reset` / `checkout --` / worktree operations (baseline comparison via `git show HEAD:<path>` or a separate worktree, not stash), and the same prohibition was added to the safety guardrail list, after rogue commits from unprompted `git add -A` / `git stash` occurred in multiple projects.
- Strengthened URL state UX rules across planner and executor references: reload, direct URL, browser back / forward, or post-login return showing a different user-recognized work state, workflow step, or target is now a P0 blocker rather than a generic P1 UX concern.
- Added fan-out control to the parallelization rules: depth capped at 2 levels (main→child→grandchild, no great-grandchildren; grandchildren are leaves with no spawn tools), width capped at 4 children each spawning 2-3 grandchildren, a global in-flight cap of 8-10 agents, a 429 circuit breaker with Retry-After + jitter backoff, and the rule that only leaf agents do real work.
- Strengthened verification discipline: do not treat a tool's self-reported success message as the sole proof of success; verify framework/library bug claims against official docs + Context7 + web before concluding; check reference implementations and environment (PATH / setup) before deep-diving internals or declaring a command uninstalled; and wait on CI with the tool's watch command instead of `sleep`-polling.
- Added a Codex-only rule to `implementation-executor` host adapters: external Codex calls must state the model and effort in the prompt, since omitting them can make the backend fall back to a retired model and fail.
- Added a worktree hygiene step: after creating a new git worktree, regenerate gitignored generated artifacts (type defs, route-tree output) and worktree-local DB state so verification does not fail only at tsc / e2e time.
- Documented the `SKILL.md` frontmatter convention in `CONTRIBUTING.md`: the `---` delimiter must be on line 1 (a leading HTML comment breaks frontmatter validation).
- Migration: none for users; installed plugin users should update to refresh executor behavior.

## 0.1.23

- Raised `implementation-executor`'s review loop round cap from 5 to 10, matching `implementation-planner`, after observing 5 rounds was sometimes too few to reach a clean round (zero new P0/P1 across all reviewer roles) before escalating.
- Migration: none for users; installed plugin users should update to refresh executor review behavior.

## 0.1.22

- Fixed `implementation-planner` and `implementation-executor` review loop convergence (manual re-review kept surfacing new findings even though the review loop had already ended). Defined a "round" as a full pass where every required reviewer (and every triggered conditional reviewer) reports zero new P0/P1, instead of letting partial coverage or a subjective "looks roughly fine" call end the loop.
- Required re-running all required/triggered reviewers after any fix, not just the reviewer that raised the finding, and re-checking any section whose content changed even if that reviewer had no prior findings there.
- Added an `Adversarial reviewer` role to the `implementation-executor` review loop, mirroring the planner's adversarial reviewer, to actively hunt for hidden failures and optimistic "verified" claims rather than rubber-stamping.
- Required explicit non-completion and escalation via `Next Action Contract` when the round cap (5 for executor, 10 for planner) is reached while new P0/P1 findings are still appearing, instead of silently reporting completion once rounds run out.
- Migration: none for users; installed plugin users should update to refresh planner/executor review behavior.

## 0.1.21

- Added planning guidance for Cloudflare Workers / Vite-style full-stack apps: prefer platform-supported integrated dev servers over split frontend/runtime proxy setups.
- Strengthened execution and verification rules so the standard `dev` command must exercise the runtime and binding contract needed for the real feature.
- Added audit checks for local-only or mock-only dev paths that hide required external service, media, AI, storage, or platform binding failures.
- Migration: installed plugin users should update to refresh skill reference content.

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
