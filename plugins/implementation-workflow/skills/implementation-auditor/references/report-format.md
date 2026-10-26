# Report Format

Audit report は、次に何を直すかが分かる簡潔な形にする。長さは findings の量に比例させ、埋め草、重複した summary、boilerplate を足さない。該当がない section は 1 行で「該当なし」と書くか省く。

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

永続化する場合は、上記を `docs/implementation/current.md` の `Quality Review Findings` または `Improvement Backlog` に統合する。

`Next Action Contract` は次に選ぶ入口を示すだけで、Plan / Execute へ自動遷移しない。

Audit では通常 `Goal recommended: no`。長時間の Execute へ進む必要が明らかな場合だけ、次 lane の候補として `/goal` 用の短い draft を残す。
