# Artifact Lifecycle

開発は複数セッションにまたがる。成果物は「明確な active plan」と「薄い archive」に保ち、次の LLM と人間の認知負荷を増やさない。

## Placement

優先順位:

1. ユーザーが明示した plan file。今回の source of truth にする。
2. 既存 repo にある計画置き場の慣習（`docs/implementation/current.md` を使っている repo を含む）。
3. 既定: 作業ごとの `docs/implementation/<slug>.md`。

既定の構成:

```text
docs/implementation/
  README.md
  <slug>.md
  archive/
    YYYY-MM-DD-<slug>.md
```

- `<slug>.md`: 1 つの作業（feature、修正、移行）の active plan。`<slug>` は作業名を短い kebab-case にし、branch 名があればそれに揃える。
- `README.md`: この構成の説明だけを書く。進行中の plan の一覧は書かない。全員が編集する一覧は merge conflict の元になるため。
- `archive/`: 完了、棄却、置換された plan の薄い記録。
- `abstract-plan.html` は repo で追跡しない（Human-facing Sharing）。

複数人・複数 branch の運用:

- plan はその作業の branch で code と一緒に commit する。cloud session や別の担当者が clone から再開できるようにするため。
- 1 つの作業に plan は 1 つ。別の作業の plan を編集しない。
- 作業が終わる PR で、plan を `archive/` に薄くして移すか、残す価値がなければ削除する。default branch に active な plan を溜めない。

`implementation-plan-v2.md`、`final.md`、`final-final.md`、session ごとの謎ファイルを作らない。

## Active Plan

active plan は次セッションの入口。section 契約は `output-contracts.md` の implementation-plan content と同一にし、別テンプレートを増やさない。

- 必須 section は `output-contracts.md` の `##` 見出し集合（`## Status` 〜 `## Implementation Handoff`）に従う。
- `Status` は `draft` / `approved` / `in-progress` / `blocked` / `done` / `superseded` のいずれか。
- 完了済み slice は `## Current State`、直近 verification は `## Verification Plan`、open decisions は `## Review Findings` に畳む。独立 section を増やさない。
- 書き方（rewrite 方針、残す判断理由、削るもの）は `output-contracts.md` の implementation-plan content に従う。

同じ作業では新しい plan を作らず、その作業の plan を更新する。作業の方向が根本から変わったら、古い plan を `archive/` に移してから置き換える。

## Human-facing Sharing

`abstract-plan.html` は人間向けの表示物で、正本は active plan。repo で追跡しない。作り方は host ごとに次のとおり:

- Claude Code: Artifact tool が使える時は artifact として作り、非公開で publish する。保存先は host の既定（repo の外）に任せ、見た目と図は組み込み design skill に任せる。URL を active plan の `## Implementation Handoff` に記録し、更新は同じ URL へ再 publish する。新しい artifact を増やさない。
- Artifact tool が使えない時と Codex: `docs/implementation/<slug>.abstract-plan.html` に file を作り、`.git/info/exclude` に `docs/implementation/*.abstract-plan.html` を足して追跡から外す。`.gitignore` は変えない。
- Codex: 継続的に参照される plan なら Sites での共有を提案する。Sites は hosting であり、公開範囲を選ぶ操作が要るため、agent からは publish しない。URL が返れば同じ場所に記録する。
- Claude Code は既定で publish し、Codex は file を渡して提案にとどめる。これは意図した host 固有差分。詳細は `host-adapters.md`。

publish 直後の artifact は作成者だけが見られる。共有範囲を広げる操作（link 共有、組織への公開など）は、ユーザーの明示的な指示がある場合だけ行う。publish できない環境（`host-adapters.md`）でも作業を止めず、file だけで完結させる。

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

各セッション終了時、必要なら active plan の `Implementation Handoff` を更新する。

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
- `abstract-plan.html` は人間の合意形成に効く場合だけ維持する。repo の外にあるので archive せず、不要になったら local file を削除する。
- docs を更新したら、計画内の status と handoff も合わせる。
