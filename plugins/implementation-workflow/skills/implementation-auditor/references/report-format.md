# Report Format

Audit report は簡潔にする。長い評論ではなく、次に何を直すかが分かる形にする。

Recommended format:

```md
# Implementation Audit

## Summary

- Overall state:
- Biggest risk:
- Recommended next slice:

## Findings

### P1: <title>

- Evidence:
- Impact:
- Recommended fix:
- Verification:
- Owner skill: implementation-planner / implementation-executor

## Auto-fix Candidates

- <small safe fix>

## Improvement Backlog

1. <next slice>
2. <later>

## Session Handoff

- Read next:
- Run next:
- Open decisions:
```

永続化する場合は、上記を `docs/implementation/current.md` の `Quality Review Findings` または `Improvement Backlog` に統合する。

