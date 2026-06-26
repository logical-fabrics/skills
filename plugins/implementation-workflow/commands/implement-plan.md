---
description: Execute the referenced active plan or implementation handoff safely.
argument-hint: "[plan file, handoff, step, or slice]"
---

# Implement Plan

Use the `implementation-workflow:implementation-executor` skill.

Execute the user-referenced plan file, repo active plan, `docs/implementation/current.md`, `abstract-plan.html`, or Implementation Handoff. Start with freshness and readiness checks, keep the slice narrow, verify before finishing, and do not perform production, cloud, auth-provider, destructive DB, or git write operations unless explicitly requested.
