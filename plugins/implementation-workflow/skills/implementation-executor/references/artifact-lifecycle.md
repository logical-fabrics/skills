# Artifact Lifecycle

実装中も成果物を増やしすぎない。次セッションが迷わず再開できる状態を維持する。

## Active Plan

優先順位:

1. ユーザーが明示した plan file。
2. 既存 repo の active plan 慣習。
3. `docs/implementation/current.md`。

既存 repo に慣習がなく、ユーザーも明示していない場合、active plan は以下に置く:

```text
docs/implementation/current.md
```

active plan の section 契約は planner `output-contracts.md` の implementation-plan content と同一（`## Status` 〜 `## Implementation Handoff`）。executor もこの 1 テンプレートだけを更新し、別形式を作らない。

実装開始時:

- ユーザー明示 plan、repo 慣習上の active plan、または `docs/implementation/current.md` があるか確認する。
- `## Status`、`## Last updated`、`## Current State`、`## Next actions`、`## Implementation Handoff` を読む。
- 古い計画、別名 plan、archive を source of truth にしない。ただしユーザーが明示した plan は今回の source of truth とする。

実装終了時:

- 完了した slice を `## Current State`（completed）と `## Step-by-step Implementation` の checkbox に反映する。
- 次の最小 slice を `## Next actions` に反映する。
- 通った verification と失敗した verification を `## Verification Plan` に更新する。
- scope、UX、schema、infra、security、cost、production behavior が変わった場合は plan を更新する。
- `## Implementation Handoff` に `Next Action Contract` を残す。

`Next Action Contract`:

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

executor は accepted slice 内ではやりきる。次の未承認 slice、audit への立ち返り、または product 判断が必要な場合は、この contract で明示して止める。

長時間・複数 slice・検証ループを続ける場合は `Goal recommended: yes` にし、必要なら `/goal` 用の短い文面を `Goal draft` に残す。軽微な修正、通常 audit、ユーザー判断待ちでは `Goal recommended: no` にする。

## Archive / Cleanup

- 完了または置換された active plan は `docs/implementation/archive/YYYY-MM-DD-slug.md` に薄く残す。
- 古い draft、途中 reviewer memo、一時 HTML を増やさない。
- 新しいファイルを作る前に、既存の active plan を更新できないか確認する。
- `abstract-plan.html` は人間向け合意形成が必要な場合だけ残す。

## Do Not

- `implementation-plan-v2.md`、`final.md`、`final-final.md` を作らない。
- セッションごとの plan ファイルを乱立させない。
- 古い plan を消さずに新 plan を横に置かない。
- 会話履歴だけを次セッションの source of truth にしない。
