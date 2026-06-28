# Artifact Lifecycle

開発は複数セッションにまたがる。謎の計画ファイルや古い設計が増え続けると、次の LLM と人間の認知負荷が上がる。成果物は「明確な active plan」と「薄い archive」を原則にする。

## Placement

優先順位:

1. ユーザーが明示した plan file。
2. 既存 repo にある計画置き場の慣習。
3. `docs/implementation/current.md`。

ユーザーが特定ファイルを明示した場合は、そのファイルを今回の source of truth とする。継続運用が必要なときだけ `current.md` への統合を提案する。

慣習がない場合の既定:

```text
docs/implementation/
  README.md
  current.md
  abstract-plan.html
  archive/
    YYYY-MM-DD-slug.md
```

- `current.md`: 既定の active implementation plan。
- `abstract-plan.html`: 人間向け合意形成が必要なときに作る。複数領域、複数ユーザーフロー、DB/schema、API 境界、auth/security、外部サービス、課金/コスト、deploy/production、非自明な product/UX 判断を含む計画では、ユーザーが明示的に不要と言わない限り作成または更新する。軽微な作業では作らない。
- `README.md`: このディレクトリの読み方と active plan へのリンク。
- `archive/`: 完了、棄却、置換された計画の薄い記録。

`implementation-plan-v2.md`、`final.md`、`final-final.md`、session ごとの謎ファイルを作らない。

## Active Plan

`current.md` を使う場合、それは次セッションの入口である。section 契約は `output-contracts.md` の implementation-plan content と同一にする。別テンプレートを増やさない。

- 必須 section は `output-contracts.md` の `##` 見出し集合（`## Status` 〜 `## Implementation Handoff`）に従う。
- `Status` は `draft` / `approved` / `in-progress` / `blocked` / `done` / `superseded` のいずれか。
- 完了済み slice は `## Current State`、直近 verification は `## Verification Plan`、open decisions は `## Review Findings` に畳む。独立 section を増やさない。
- `current.md` は議論履歴ではなく、実装者が今読む source of truth である。plan 更新時は session recap、変更経緯、解消済み指摘、古い案を積み増さず、現在の実行内容として読み直せるように rewrite する。
- 判断理由は、実装者が誤った設計に戻らないために必要な範囲だけ残す。会話でどう合意したか、どの reviewer が何を言ったかは、実装に必要でなければ削る。

既定運用では、新しい plan を作るよりまず `current.md` を更新する。新計画が必要な場合は、古い `current.md` を `archive/` に移してから置き換える。

## Archive

archive は履歴の墓場ではなく、後から判断を追うための薄い記録。

archive に残す:

- 最終 status。
- 採用した判断。
- 棄却した重要案。
- 完了した verification。
- 次に再開する場合の注意。

archive に残さない:

- 古い draft の全文コピー。
- 途中の reviewer メモ全量。
- 一時的な TODO。
- 生成されたが使われなかった HTML。

## Session Handoff

各セッション終了時、必要なら `current.md` の `Implementation Handoff` を更新する。

Plan lane の終了前に、`abstract-plan.html` の要否を必ず明示的に判定する。作らない場合は、`Next Action Contract` または final response に `abstract-plan.html: 不要` と理由を残す。

必須:

- 今回完了したこと。
- まだ終わっていないこと。
- 次に読むべきファイル。
- 次に実行する最小 slice。
- 最後に通った verification。
- 失敗した verification と残リスク。

次セッションは、会話履歴ではなく明確な active plan と現在の repo を source of truth にする。

## Cleanup Rules

- 作業に使わない一時ファイルは残さない。
- 古い plan を source of truth として残さない。`superseded` と `replaced by` を明記する。
- active plan から、経緯説明、差分メモ、解消済み review、古い TODO、実装者に不要な判断ログを削る。
- active plan から、過剰な強調、絵文字、装飾罫線、見た目だけの callout、冗長な見出し装飾を削る。Markdown は実装者が構造を読むために使う。
- `abstract-plan.html` は人間の合意形成に効く場合だけ維持する。実装が完了したら archive するか削除候補にする。
- docs を更新したら、計画内の status と handoff も合わせる。
