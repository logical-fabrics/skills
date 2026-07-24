# Artifact Lifecycle

成果物の置き場所、active plan の section 契約、archive、cleanup の正本は planner の `../../implementation-planner/references/artifact-lifecycle.md` と `../../implementation-planner/references/output-contracts.md`。ここには Execute lane 固有の差分だけを書く。

## Execute Lane Delta

実装開始時:

- ユーザー明示 plan、repo 慣習上の active plan、または `docs/implementation/current.md` があるか確認する。
- `## Status`、`## Last updated`、`## Current State`、`## Next actions`、`## Implementation Handoff` を読む。
- 古い計画、別名 plan、archive を source of truth にしない。ただしユーザーが明示した plan は今回の source of truth とする。

実装終了時:

- 完了した slice を `## Current State`（completed）と `## Step-by-step Implementation` の checkbox に反映する。
- 次の最小 slice を `## Next actions` に反映する。
- 通った verification と失敗した verification を `## Verification Plan` に更新する。
- scope、UX、schema、infra、security、cost、production behavior が変わった場合は plan を更新する。
- `## Implementation Handoff` の中に `Next Action Contract` を残す。独立した `##` section にせず、以下の block をそのまま埋める。散文で要約しない。

```md
### Next Action Contract

- Recommended next lane: Audit / Plan / Execute / Ask user / Accept risk / Done
- Reason:
- Ready-to-run slice:
- Human decision required: yes / no
- Goal recommended: yes / no
- Goal draft:
- Suggested prompt:
```

項目定義の正本は `../../implementation-planner/references/output-contracts.md`。上は Execute lane 向けの写しなので、項目を増減する場合は正本を先に変える。

executor は accepted slice 内ではやりきる。次の未承認 slice、audit への立ち返り、または product 判断が必要な場合は、この contract で明示して止める。

長時間・複数 slice・検証ループを続ける場合は `Goal recommended: yes` にし、必要なら `/goal` 用の短い文面を `Goal draft` に残す。軽微な修正、通常 audit、ユーザー判断待ちでは `Goal recommended: no` にする。

新しいファイルを作る前に、既存の active plan を更新できないか確認する。
