# Artifact Lifecycle

開発は複数セッションにまたがる。成果物は「明確な active plan」と「完了後の薄い記録」に保ち、次の LLM と人間の認知負荷を増やさない。

## Placement

plan は PR に入れない。repo で追跡せず、code の差分と混ぜない。

優先順位:

1. ユーザーが明示した plan（file または artifact URL）。今回の source of truth にする。
2. 既存 repo にある計画置き場の慣習（`docs/implementation/current.md` を追跡している repo を含む）。慣習が plan を追跡していれば従う。
3. 既定: host ごとに次のとおり。

| Host | plan の置き場 | 人間向けの概要 |
| --- | --- | --- |
| Claude Code（Artifact tool あり） | Markdown の artifact 1 つ（非公開） | 同じ artifact の先頭に置く。別の artifact を作らない |
| Codex、Artifact tool がない時 | local file `docs/implementation/<slug>.md` | 必要なら `docs/implementation/<slug>.abstract-plan.html` |

- `<slug>` は作業名を短い kebab-case にし、branch 名があればそれに揃える。
- Claude Code の plan は、この skill の指示として Markdown で publish する。repo の外（scratchpad があればそこ）に `<repo>-<slug>.md` を書き、Artifact tool で publish する。Markdown の artifact は file 名が title になるため、この名前で後から探せる。
- Claude Code の plan は Artifact tool の read で読み戻し、編集して同じ URL へ再 publish する。cloud session でも同じアカウントなら読める。
- local file を使う時は、`.git/info/exclude` に `docs/implementation/` を足して追跡から外す。`.gitignore` は変えない。
- local file は cloud session や別のマシンに届かない。そこで再開する必要がある時は、そうユーザーに伝える。
- 1 つの作業に plan は 1 つ。別の作業の plan を編集しない。
- artifact は作成者だけが見られる。チームメイトとの共有は、ユーザーの明示的な指示がある時だけ行う（Human-facing Sharing）。

`implementation-plan-v2.md`、`final.md`、`final-final.md`、session ごとの謎ファイルを作らない。

## Active Plan

active plan は次セッションの入口。section 契約は `output-contracts.md` の implementation-plan content と同一にし、別テンプレートを増やさない。

- 必須 section は `output-contracts.md` の `##` 見出し集合（`## Status` 〜 `## Implementation Handoff`）に従う。artifact では各 section を見出しにする。
- `Status` は `draft` / `approved` / `in-progress` / `blocked` / `done` / `superseded` のいずれか。
- 完了済み slice は `## Current State`、直近 verification は `## Verification Plan`、open decisions は `## Review Findings` に畳む。独立 section を増やさない。
- 書き方（rewrite 方針、残す判断理由、削るもの）は `output-contracts.md` の implementation-plan content に従う。

同じ作業では新しい plan を作らず、その作業の plan を更新する。artifact は同じ URL へ再 publish する。作業の方向が根本から変わったら、古い plan を `superseded` にしてから新しい plan を作る。

## Human-facing Sharing

人間向けの概要（`abstract-plan.html` の内容。作成条件は `output-contracts.md`）は host ごとに次のとおり作る:

- Claude Code: plan の artifact の先頭、`## Status` の前に置く。図は Mermaid の code block で書く（artifact が描画する）。HTML を手で組み立てない。
- Codex と Artifact tool がない時: `docs/implementation/<slug>.abstract-plan.html` を作る。Codex では、継続的に参照される plan なら Sites での共有を提案する。Sites は hosting であり、公開範囲を選ぶ操作が要るため、agent からは publish しない。
- Claude Code は既定で publish し、Codex は file を渡して提案にとどめる。これは意図した host 固有差分。詳細は `host-adapters.md`。

publish 直後の artifact は作成者だけが見られる。共有範囲を広げる操作（チームメイトへの編集権限、link 共有、組織への公開など）は、ユーザーの明示的な指示がある場合だけ行う。publish できない環境（`host-adapters.md`）でも作業を止めず、local file で完結させる。

作業が終わったら `Status` を `done` にし、plan を薄く畳む。

残す:

- 最終 status。
- 採用した判断。
- 棄却した重要案。
- 完了した verification。
- 次に再開する場合の注意。

残さない:

- 古い draft の全文コピー。
- 途中の reviewer メモ全量。
- 一時的な TODO。

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
- 人間向けの概要は合意形成に効く場合だけ維持する。不要になった local file は削除する。
- docs を更新したら、計画内の status と handoff も合わせる。
