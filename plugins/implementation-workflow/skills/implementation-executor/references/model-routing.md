# Model Routing

model は task の不確実性と必要な能力、effort は必要な推論の深さで選ぶ。受入条件を満たしつつ、実行・再試行・委任・統合の総コストを抑える。新しい model や高い effort への統一は目的ではない。

2026-09-05 確認。以下の pair は公式推奨を踏まえた plugin の起点であり、全 workload の最適値や host default を実証したものではない。実行時はこの file と `host-adapters.md` で完結する。正本 repo の `docs/model-routing-research.md` は maintainer 向け調査記録であり、plugin 同梱対象外・通常実行時の参照は不要。

## Selection Order

1. ユーザーが選んだ main の model / effort、budget、組織 policy を尊重する。自動選択は現在の host が許す委譲先と実行設定の範囲で行い、main の設定変更や別 session 起動を強制しない。
2. main が通常の要件確認・code 調査・実装を進め、その中で scope、未知点、受入条件を把握する。ユーザーに毎回 model 選択を求めず、routing 専用の追加調査や事前 benchmark は行わない。
3. `review-and-parallelism.md` の Delegation Value Test を通す。曖昧さや複数箇所の結合が残る feature は main が実装まで持ってよい。通常実装という分類だけで Terra / Sonnet に降ろさない。
4. 委譲する時に下表で pair を選ぶ。軽い model へ渡すのは、scope、期待する結果、確認方法、親へ戻す条件を短く明示できる部分。context 隔離のための探索委譲と model の軽量化は別判断とし、未知の root cause 等は強い pair または main で扱う。
5. host の model / effort / definition / fork / 権限制約を確認し、explicit、適切な既存 definition、意図した継承で適用する。要求値と実効値を区別し、結果は diff と acceptance evidence で受理する。

指定がなければ `balanced`。品質を受入条件で固定し、完了までの時間・使用量・再試行・handoff・統合・人間の手直しを含めて判断する。単価や初回応答の速さだけで model を選ばない。

## Task-based Starting Points

Codex の ID は Astra=`gpt-6-astra`、Sol=`gpt-5.6-sol`、Terra=`gpt-5.6-terra`、Luna=`gpt-5.6-luna`。Claude の model 名は世代を指し、`opus` / `sonnet` 等の alias がその世代へ解決するかは provider / override による。

Claude API の ID は Opus 5=`claude-opus-5`、Sonnet 5=`claude-sonnet-5`、Fable 5.1=`claude-fable-5-1`、Haiku 4.5=`claude-haiku-4-5-20251001`。これらを通常 Agent invocation に渡せるとは限らないため、`host-adapters.md` の設定面を確認する。

| Task / role | Codex の起点 | Claude Code の起点 | 上げる条件 |
| --- | --- | --- | --- |
| main の新規選択を求められた | Astra `low`、判断が深い時は `medium` | Opus 5 `high`、一連のアプリ構築を強い model に任せるなら Fable 5.1 `high` | 既存 main は維持し、難しい判断には高難度 role |
| 既知 command の実行、抽出、明確な read-only 確認 | Luna `low` | Haiku 4.5、effort なし | ログの因果関係を追うなら通常 worker |
| 機械的な局所編集、expected diff と確認方法が明確 | Luna `medium` | Sonnet 5 `high`（bundled worker） | 推測を要する変更なら通常 worker |
| scope・期待結果・確認方法が明確になった実装 / 探索 / debugging | Terra `medium` | Sonnet 5 `high` | 複雑な制御フローや edge case は Terra `high` / Opus 5 `high` |
| 独立した bug-finding / code review | Terra `high` | Opus 5 `medium`（bundled reviewer） | 高リスク・深い設計判断は高難度 role |
| architecture、未知の root cause、高リスクの独立 review / 統合 | Astra `high` | Opus 5 `high`、長時間・最難関は Fable 5.1 `high` | 追加の推論が必要なら `xhigh`、時間・使用量を許容する最難関だけ `max` |

- Sol は Astra が利用不能、または cost / latency 制約がある時の複雑作業の候補。`medium` / `high` を task に合わせる。許可されない model へ data を送らない。
- Luna / Haiku に未知の architecture、security、auth / billing / migration 判断を委ねない。高い effort を小型 model の能力不足の代替にしない。
- Opus 5 review の `medium` は低 effort でも bug-finding が強いという公式情報を踏まえた初期 policy。全 review の品質保証ではなく、高リスク review には別の受入判断が必要。
- Fable 5.1 `low` / `medium` と Astra の低 effort も、通常実装の候補から除外しない。強い model が理解済みの仕事をそのまま完了する方が、軽量化と再説明より安く速い場合がある。全件の置換や費用優位を断定せず、host 制約と受入結果で判断する。
- コストは cache、出力、再計画、親の再調査、並列起動の context 複製を含めて判断する。API 価格を Codex / Claude Code の plan 使用量や usage credits の換算値として扱わない。

## Effort And Escalation

- Codex は明確な作業の `low`、通常の `medium`、複雑な分析・review の `high`、特に難しい作業の `xhigh` / `max` を使い分ける。コードを書くという理由だけで `xhigh` に固定せず、`low` / `medium` を一律禁止しない。
- Claude の Opus 5 / Sonnet 5 / Fable 5.1 は公式の `high` を基点に、workload の evidence があれば下げる。Haiku 4.5 は effort 非対応。同じ effort 名でも model 間の計算量や品質は同じではない。
- `quality` では曖昧・高リスクな仕事を最初から強い model へ渡す。`throughput` でも受入条件は下げず、明確で反復可能な部分だけ軽くする。初回から全候補を試す benchmark は不要。
- 失敗時は原因を分ける。入力不足は context を補い、tool / 権限 / 環境の失敗はその原因を直す。方針が妥当で推論が足りない時だけ同一 model の effort を上げる。未知の因果関係、scope 外判断、長 context の統合、相反する高リスク evidence は frontier role へ返す。
- 同じ原因に対して同じ model / effort / prompt の再試行を繰り返さない。試行、diff、重要 log、未解決判断を渡す。設定変更だけで直ると決めつけない。
- `max` は単独推論の選択肢。`ultra` / `ultracode` は host-native orchestration を伴うため、失敗した worker の単純な「次の effort」として起動しない。独立 workstream がある時だけ検討する。

## Automatic Reassessment And Outcome Record

- worker は要件 / 設計の矛盾、想定外の scope 拡大、原因を説明できない失敗、相反する evidence に当たった時点で、その判断に依存する編集を止めて main へ返す。再試行回数を満たすまで待たない。原因と修正が明確な局所エラーは担当内で直してよい。
- 返却には部分 diff、実行した確認、evidence、未解決判断を含める。main は既存の作業を引き継ぎ、context 補完、直接実装、同じ worker の設定調整、適切な強い worker への再割当を判断する。同じ仕事を最初から重複実行しない。
- routing を行った作業の完了 / 返却時に、既存の作業メモ・handoff・verification record のいずれかへ短く記録する。既存 artifact が不要な小変更では最終報告で足りる。新しい ledger や telemetry 基盤は作らない。
- 記録するのは task の種類 / scope、requested / effective pair（不明なら `unverified`）、受入結果、分かる範囲の経過時間と使用量、差し戻し・main の手直し・人間の介入。未取得値は `unknown` とし、token 数を推測したり API 金額を plan 使用量へ換算したりしない。既存の tool metadata を使い、記録だけのために別 session や監視を起動しない。
- 次の似た作業では利用可能な既存記録を参考にする。ただし少数の成功や単価だけで品質・費用優位を一般化しない。受入基準、scope、host、effort が違う記録は同条件の比較として扱わない。
- 実行内の再割当は自律的に行うが、永続的な routing policy、agent definition、ユーザー設定の変更は自動で行わない。改善が見えたら根拠と適用範囲を提案し、承認後に変更する。

## Spawn-time Contract

委任時には role と必要な pair を判断する。API parameter の形式ではなく、現在の host tool / definition が受け付ける設定を使う。

- 明示 override が可能で、選んだ pair を適用する必要がある時は model と effort の両方を指定する。
- 既存 definition / 継承の実効 pair が task に合う場合は、その利用を明示すればよい。full-history fork を捨てて model を変える負担も Delegation Value Test に含める。継承そのものを失敗としない。
- 実効値を検証できない時は `unverified`、必要な値を設定できない時は `selection-unavailable` とする。安全に同じ role を満たす fallback があれば続ける。必要な独立 review / acceptance を満たせない時だけ親へ未解決として返す。
- effort だけのために別の CLI / SDK session を自動起動しない。既存の許可された interface と definition で解けるかを先に判断する。review の model を強くするために編集権限を広げない。

assignment には次を短く含める。別の ledger は作らない。

- role、accepted scope、read / write scope、禁止操作、必要な context。
- requested model / effort、選択理由、`quality` / `balanced` / `throughput`。
- 適用方法（explicit / definition / inherited）、分かる範囲の effective pair。差異・fallback・未確認値があれば理由。
- acceptance criteria と必要な verification、上位へ返す条件、期待する短い返却形式。

## Execution And Prompt Discipline

- outcome、成功条件、一次資料、変更範囲を渡す。許可済み lane は最後まで進め、途中の追加指示を元の目的・制約に統合する。
- 回答が必要な判断は依存する作業だけ保留し、独立した作業を続ける。未回答を承認と扱わない。skill が停止理由なら該当 file と指示を示す。
- 依存しない検索・読み取りはまとめ、編集・承認・依存する処理は順に進める。leaf worker を待つ間も独立した親の作業があれば進める。同じ workstream に host-native orchestration と manual fan-out を重ねない。
- 低 effort でも current docs / 検索の条件を省略しない。特に Fable 5.1 `low` は検索を減らす傾向があるため、更新され得る仕様への出典確認を明示する。
- review は severity、confidence、evidence を付けて findings を返す。高確度・高 severity のみという自己フィルタは避け、取捨は親で行う。style preference や無関係な scope 拡張は findings に混ぜない。
- 一般的な「もう一度自己確認せよ」を重ねず、必要な検証と evidence を指定する。gate が通った後の再検証は新しい変更・失敗・未解決の懸念がある時だけ行う。
- 出力の短さは effort でなく返却形式で制御する。Fable 5.1 の長い tool loop でも各 lane の Reporting Cadence を守り、最終応答は依頼全体を説明する。

## Primary Sources

- [Codex models and effort](https://learn.chatgpt.com/docs/models)
- [Codex subagent configuration](https://learn.chatgpt.com/docs/agent-configuration/subagents)
- [OpenAI model catalog](https://developers.openai.com/api/docs/models)
- [Astra prompting and migration](https://developers.openai.com/api/docs/guides/latest-model?model=gpt-6-astra)
- [Claude model overview](https://platform.claude.com/docs/en/models/overview)
- [Claude effort](https://platform.claude.com/docs/en/build-with-claude/effort)
- [Opus 5 prompting](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5)
- [Fable 5.1 prompting](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5-1)
