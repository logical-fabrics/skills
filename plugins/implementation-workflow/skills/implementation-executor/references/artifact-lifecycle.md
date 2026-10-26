# Artifact Lifecycle

成果物の置き場所、active plan の section 契約、archive、cleanup の正本は planner の `../../implementation-planner/references/artifact-lifecycle.md` と `../../implementation-planner/references/output-contracts.md`。ここには Execute lane 固有の差分だけを書く。

## Execute Lane Delta

実装開始時:

- plan を次の順で特定する: ユーザー明示 plan、repo 慣習上の active plan、現在の branch 名に合う `docs/implementation/<slug>.md`、`docs/implementation/` 直下に active plan が 1 つだけならそれ。複数あって決まらなければユーザーに確認する。別の作業の plan は編集しない。
- `## Status`、`## Last updated`、`## Current State`、`## Next actions`、`## Implementation Handoff` を読む。
- 古い計画、別名 plan、archive を source of truth にしない。ユーザーが明示した plan は今回の source of truth にする。

実装終了時:

- 完了した slice を `## Current State`（completed）と `## Step-by-step Implementation` の checkbox に反映する。
- 次の最小 slice を `## Next actions` に書く。
- 通った / 失敗した verification を `## Verification Plan` に書く。
- scope、UX、schema、infra、security、cost、production behavior が変わったら plan を更新する。Claude Code で `abstract-plan.html` を更新したら、handoff に記録済みの artifact URL へ再 publish する。
- `## Implementation Handoff` の中に次の `Next Action Contract` block をそのまま埋める。独立した `##` section にせず、散文で要約しない。

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

項目定義の正本は `../../implementation-planner/references/output-contracts.md`。上は写しなので、項目の増減は正本を先に変える。

accepted slice 内はやりきる。次の未承認 slice、audit への立ち返り、product 判断が必要なら、この contract に書いて止める。

長時間・複数 slice・検証ループを続けるなら `Goal recommended: yes` にし、必要なら `/goal` 用の短い文面を `Goal draft` に書く。軽微な修正、通常 audit、ユーザー判断待ちでは `Goal recommended: no` にする。

新しいファイルを作る前に、既存の active plan を更新できないか確認する。
