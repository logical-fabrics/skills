# Report Format

Audit report は、次に何を直すかが分かる簡潔な形にする。長さは findings の量に比例させ、埋め草、重複した summary、boilerplate を足さない。該当がない section は「該当なし」の 1 行にするか省く。

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
- Recommended next action: Plan first / Execute small fix / Ask user / Accept risk
- Recommended fix:
- Verification:
- Owner skill: implementation-planner / implementation-executor

## Auto-fix Candidates

- <small safe fix>

## Improvement Backlog

1. <next slice>
2. <later>

## Next Action Contract

- Recommended next lane: Plan / Execute / Ask user / Accept risk / Done
- Reason:
- Ready-to-run slice:
- Human decision required: yes / no
- Goal recommended: yes / no
- Goal draft:
- Suggested prompt:

## Session Handoff

- Read next:
- Run next:
- Open decisions:
```

`Next Action Contract` の項目定義の正本は `../../implementation-planner/references/output-contracts.md`。上のブロックは Audit lane 向けの写しで、next lane から Audit を除いてある。項目を増やす場合は正本を先に変える。

- `Next Action Contract` は次の入口を示すだけで、Plan / Execute へ自動遷移しない。
- 通常は `Goal recommended: no`。長時間の Execute が明らかに必要な場合だけ、次 lane 候補として `/goal` 用の短い draft を残す。
- 永続化する場合は、上記を 該当作業の active plan の `Quality Review Findings` または `Improvement Backlog` に統合する。
