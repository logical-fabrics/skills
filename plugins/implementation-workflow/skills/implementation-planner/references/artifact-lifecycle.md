# Artifact Lifecycle

開発は複数セッションにまたがる。成果物は「明確な active plan」と「薄い archive」に保ち、次の LLM と人間の認知負荷を増やさない。

## Placement

優先順位:

1. ユーザーが明示した plan file。今回の source of truth にし、継続運用が必要なときだけ `current.md` への統合を提案する。
2. 既存 repo にある計画置き場の慣習。
3. `docs/implementation/current.md`。

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
- `abstract-plan.html`: 人間向け合意形成が必要なときに作る。作成条件は `output-contracts.md`。軽微な作業では作らない。
- `README.md`: このディレクトリの読み方と active plan へのリンク。
- `archive/`: 完了、棄却、置換された計画の薄い記録。

`implementation-plan-v2.md`、`final.md`、`final-final.md`、session ごとの謎ファイルを作らない。

## Active Plan

`current.md` は次セッションの入口。section 契約は `output-contracts.md` の implementation-plan content と同一にし、別テンプレートを増やさない。

- 必須 section は `output-contracts.md` の `##` 見出し集合（`## Status` 〜 `## Implementation Handoff`）に従う。
- `Status` は `draft` / `approved` / `in-progress` / `blocked` / `done` / `superseded` のいずれか。
- 完了済み slice は `## Current State`、直近 verification は `## Verification Plan`、open decisions は `## Review Findings` に畳む。独立 section を増やさない。
- 書き方（rewrite 方針、残す判断理由、削るもの）は `output-contracts.md` の implementation-plan content に従う。

既定では、新しい plan を作るより `current.md` を更新する。新計画が必要なら、古い `current.md` を `archive/` に移してから置き換える。

## Human-facing Sharing

`abstract-plan.html` の正本は repo の file。人間が読む入口は host ごとに次のとおり:

- Claude Code: Artifact tool が使える環境では、作成・更新のたびに同じ file を非公開の artifact として publish し、URL を active plan の `## Implementation Handoff` に記録する。2 回目以降は記録済み URL を更新し、新しい artifact を増やさない。artifact の作り方（design guidance の読み込みなど）は host の Artifact tool の指示に従う。
- Codex: Sites は人間が app 側で起動する機能で、agent の tool ではない。file を作り、継続的に参照される plan なら Sites での共有を提案する。URL が返れば同じ場所に記録する。
- Claude Code は既定で publish し、Codex は file を渡して提案にとどめる。これは意図した host 固有差分。詳細は `host-adapters.md`。

publish 直後の artifact は作成者だけが見られる。共有範囲を広げる操作（link 共有、組織への公開など）は、ユーザーの明示的な指示がある場合だけ行う。publish できない環境でも作業を止めず、file だけで完結させる。

archive は後から判断を追うための薄い記録にする。

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

Plan lane の終了前に `abstract-plan.html` の要否を明示的に判定する。作らない場合は `Next Action Contract` または final response に `abstract-plan.html: 不要` と理由を書く。

必須:

- 今回完了したこと。
- まだ終わっていないこと。
- 次に読むべきファイル。
- 次に実行する最小 slice。
- 最後に通った verification。
- 失敗した verification と残リスク。

次セッションは、会話履歴ではなく active plan と現在の repo を source of truth にする。

## Cleanup Rules

- 作業に使わない一時ファイルは残さない。
- 古い plan を source of truth として残さない。`superseded` と `replaced by` を明記する。
- active plan から、経緯説明、差分メモ、解消済み review、古い TODO、不要な判断ログ、装飾を削る（基準は `output-contracts.md`）。
- `abstract-plan.html` は人間の合意形成に効く場合だけ維持する。実装完了後は archive するか削除候補にする。
- docs を更新したら、計画内の status と handoff も合わせる。
