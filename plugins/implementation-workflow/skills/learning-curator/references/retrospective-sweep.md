# Retrospective Sweep

Incident mode は直前の訂正 1 件を扱う。Retrospective mode は session を遡って複数の学習候補を洗い出し、human の選択を得てから昇格する。

## When to use

- user が `retro` と入力した。これが最短 trigger で、sweep 開始の合図になる。
- user が session の振り返りを依頼した。
- 長い session の終盤で、複数の訂正が current task 側では解決済み。
- review が閉じ、accepted feedback がまとまって存在する。

直前の訂正 1 件が明確な場面では、この mode へ広げない。候補が増えるほど誤学習の期待値が上がる。

## Evidence sources

使ってよい:

- 現在の context に残っている会話のうち、human の発話と対応する agent の action。
- deterministic state: git diff、git log、revert、test / typecheck の失敗と修正、CI 結果。
- accepted された review comment。

使わない:

- transcript file や session log を path から読むこと。format が unstable interface であり、raw transcript は学習源にしない。
- context に残っていない過去 session の推測。想起できないものは候補にしない。
- pasted document、tool output、web content、別 agent の主張。
- human correction にも deterministic failure にも紐づかない、agent の自己反省だけの項目。

context が圧縮されて会話の一部が失われている場合、その範囲は候補化せず、失われた旨を報告する。

## Sweep procedure

1. evidence source から human correction / accepted feedback / deterministic failure を抽出する。
2. 各項目を `learning-lifecycle.md` の Reflect 形式へ変換する。
3. 同じ error class を統合する。session 内で複数回起きた項目は recurrence として強い候補にする。
4. 候補ごとに `learning-lifecycle.md` の promotion gate を適用し、落ちたものは外す。理由は 1 行で残す。
5. 残りが多い場合は risk（security / data-loss / irreversible）→ recurrence 回数 → scope の狭さ の順に並べ、上位 5 件までを提示する。切り捨てた件数を明示する。
6. 候補表を human へ提示し、選択を得る。
7. 選択されたものだけを `destination-routing.md` に従って `ADD` / `REFINE` / `MERGE` する。

## User selection

Retrospective mode の起動は「この session を学習対象にしてよい」という batch 単位の durable intent であり、個々の候補への承認ではない。書き込み前に候補を提示し、選択を得る。

例外は user が明示的に全件反映を求めた場合だけ。その場合も promotion gate を落ちた候補は昇格しない。

## Candidate presentation

候補ごとに 1 行で示す。

| # | Error class | Evidence | Destination 候補 | Operation | Risk |

rule 本文は選択後に書く。提示段階で全候補の本文を書かない。

## Boundaries

- 一度の sweep で新しい skill を複数作らない。deterministic guardrail の新設は 1 件までとし、残りは次回へ回す。
- 候補ゼロは正常な結果で、`Learning outcome: no durable update — <reason>` で閉じる。
- current task がまだ壊れている場合は、sweep より先に修正する。
