# Review And Parallelism

## Main Agent Role

メインエージェントは、原則として implementation orchestrator であり直接の coder ではない。責務は以下に限定する:

- plan / repo / docs の source-of-truth 確認。
- accepted slice の分割と worker assignment。
- worker が返した patch、findings、verification の統合判断。
- conflicting edits、scope creep、stale plan、AskUser / blocked 判定。
- final response と handoff 更新。

メインエージェントが直接実装してよい例外:

- typo、copy、1 つの guard、1 つの設定値など、数分で終わる小さく可逆な変更。
- subagent / worker tool が host にない場合。
- worker 起動、handoff、統合の overhead が実装本体より明らかに大きい場合。
- secrets、destructive operation、production 操作など、委任せずメインエージェントが停止判断を保持すべき場合。

例外を使う場合も、完了報告では「小さいため直接実装した」または「委任手段がないため直接実装した」と分かるようにする。複数ファイル、UI、schema、migration、外部 API、認証、課金、infra、E2E、性能、security が絡む slice は小さい例外にしない。

## Delegation Pattern

非自明な実装では、最低限以下を分ける:

- Implementation worker: accepted slice の code change を作る。
- Review worker: touched surface と changed behavior の P0/P1 を探す。
- Verification worker: test、build、browser、screenshot、logs などの証跡を確認する。

必要なら schema、security、UX、simplicity を別 worker に分ける。メインエージェントは worker の出力をそのまま信用せず、差分と検証結果を読み、矛盾があれば追加 worker または自分で局所確認する。

## Parallelization Rules

並列化する:

- 独立した code path 調査。
- accepted slice の worker 実装。
- docs / Context7 research。
- UX review。
- simplicity / overengineering review。
- schema review。
- security / infra / delivery review。
- 独立した検証。

並列化しない:

- 同じファイル編集。
- 最終統合。
- AskUser 判断。
- destructive operation。
- secret、production、billing、auth provider、cloud resource の変更判断。

Implementation review:

- accepted slice、touched surface、changed behavior に関する P0/P1 が残っていれば修正する。
- scope 外の P0/P1 は隠さず backlog 化し、今回の完了条件とは分ける。
- P2 は今回の slice を広げすぎない範囲で修正、受け入れ、延期を記録する。

Stop conditions:

- 1 round は「全 reviewer roles が、その時点の touched surface に対して新規 P0/P1 をゼロ件で報告した round」と定義する。reviewer の一部だけが通った状態、または 1 人の reviewer が軽微と言っただけの状態を round 完了として扱わない。
- 直近 round で 1 件でも新規 P0/P1 が出た場合、修正後にもう一度全 reviewer roles を回す。findings を出した reviewer だけ再確認して打ち切らない。前 round で findings がなかった reviewer も、今回の修正で touched surface が変わっていれば再度見る。
- 「だいたい直った」「軽微な指摘しか残っていない」という主観的な収束判断で round を打ち切らない。打ち切れるのは、全 reviewer roles が当該 round で新規 P0/P1 ゼロを明示的に報告したときだけ。
- 最大 10 rounds。10 round を使い切っても新規 P0/P1 が出続けている場合は、これを完了として報告しない。残 findings、再現手順、次にすべき判断を `Next Action Contract` に明示し、`Recommended next lane` を `Execute`（続行が必要）または `Ask user`（方針判断が必要）にしてユーザーに確認する。round 数を使い切ったことだけを理由に完了扱いにしない。

1 round は、findings list、fix / accept / defer / blocked 判断、verification delta の 3 点を含む。「レビューした」とだけ書いて終わらせない。

Reviewer roles:

- Adversarial reviewer: 実装者自身の完了報告や前 round の fix 内容を信用せず、diff を他人の PR として読む。隠れた失敗、エッジケース、楽観的な「動作確認済み」表記、verification で実際には踏んでいない経路を積極的に探す。
- UX reviewer: planner `ui-ux.md` の canonical rubric に従い、実ユーザーの導線、mobile / desktop、日本語、状態表示、CTA 近接、result-centered copy、forms、accessibility を見る。
- Simplicity reviewer: 抽象化、汎用化、独自基盤、状態管理が過剰でないか。
- Schema reviewer: DB、migration、YAGNI、既存データ。
- Security reviewer: auth、secret、permission、external input。
