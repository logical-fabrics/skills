# Model Routing

model は task の不確実性と必要な能力で、effort は必要な推論の深さで選ぶ。受入条件を満たしたうえで、実行・再試行・委任・統合を含めた総コストを抑える。新しい model や高い effort に揃えること自体は目的ではない。

2026-09-24 確認。下表は vendor の公式推奨に沿った起点で、全 workload の最適値を実測したものではない。実行時はこの file と `host-adapters.md` だけで判断できる。

## Selection Order

1. ユーザーが選んだ main の model / effort、budget、組織 policy をそのまま使う。main の設定変更や別 session の起動を求めない。
2. main は通常どおり要件確認・調査・実装を進め、その中で scope、未知点、受入条件を把握する。routing のためだけの調査や benchmark はしない。
3. 委任するかは `review-and-parallelism.md` の Delegation Value Test で決める。曖昧さや複数箇所の結合が残る feature は main が実装まで持つ。
4. 委任する時だけ下表で worker の pair を選ぶ。軽い model に渡すのは、scope、期待結果、確認方法、親へ戻す条件を短く書ける部分に限る。探索の隔離と model の軽量化は別の判断にする。
5. host の設定面（明示指定、agent definition、継承）で適用する。要求した値と実際に使われた値は違うことがあるので、結果は diff と acceptance evidence で受理する。

## Task-based Starting Points

ID: GPT-6 Astra=`gpt-6-astra`、Sol=`gpt-6-sol`、Luna=`gpt-6-luna`。Claude Opus 5.5=`claude-opus-5-5`、Sonnet 5=`claude-sonnet-5`、Fable 5.1=`claude-fable-5-1`、Haiku 4.5=`claude-haiku-4-5-20251001`。Claude Code の `opus` / `sonnet` / `haiku` / `fable` alias の解決先は provider と環境変数で変わる。

| Task / role | Codex | Claude Code | 上げる条件 |
| --- | --- | --- | --- |
| main を新しく選ぶよう求められた | Sol `medium`。code・app・research をまたぐ長い workflow は Astra `low` | Opus 5.5 `medium`。長時間・最難関の一連作業は Fable 5.1 `high` | 難しい判断は下の高難度 role へ |
| 既知 command の実行、抽出、明確な read-only 確認 | Luna `high`（定型なら `medium`） | Haiku 4.5（effort なし） | log の因果関係を追うなら通常 worker |
| 期待 diff と確認方法が明確な機械的編集 | Luna `high` | Sonnet 5 `high`（bundled `implementation-worker`） | 推測が要る変更なら通常 worker |
| scope・期待結果・確認方法が明確な実装 / 探索 / debugging | Sol `medium` | Sonnet 5 `high` | 複雑な制御フローや edge case は Sol `high` / Opus 5.5 `high` |
| 独立した bug-finding / code review | Sol `high`（fresh context） | Opus 5.5 `medium`（bundled `adversarial-reviewer`） | 高リスク・深い設計判断は高難度 role |
| architecture、未知の root cause、高リスクの review / 統合 | Astra `medium`〜`high` | Opus 5.5 `high`、最難関は Fable 5.1 `high` | 測定できる品質差がある時だけ `xhigh` / `max` |

- Luna / Haiku に未知の architecture、security、auth / billing / migration の判断を任せない。高い effort で小型 model の能力不足を補おうとしない。
- Opus 5.5 は `medium` が既定で、Opus 5 の `high` と同等以上の coding / review 品質を持つ。Opus 5 時代の `high` 設定をそのまま持ち込まない。
- GPT-5.6 系は旧世代。GPT-6 が選択できない環境でだけ使う: GPT-6 Astra / 複雑な Sol の作業 → GPT-5.6 Sol、通常の GPT-6 Sol の作業 → GPT-5.6 Terra、GPT-6 Luna → GPT-5.6 Luna。
- Fable 5.1 や Astra の低 effort も通常実装の候補から外さない。理解済みの仕事を強い model がそのまま終える方が、軽い model への再説明より速く安い場合がある。
- コストは cache、出力、再計画、親の再調査、並列起動時の context 複製まで含めて考える。API 価格を Codex / Claude Code の plan 使用量に換算しない。

## Effort And Escalation

- Codex の既定は Sol `medium`、Luna `high`、Astra `low`。計画・分析・確認が多い task だけ上げる。`max` は単独推論を深くする設定、`ultra` は subagents による並列 orchestration で、Luna には `ultra` がない。ほとんどの task はどちらも不要。
- Claude は Opus 5.5 が `medium`、Sonnet 5 / Fable 5.1 が `high` を既定とする。`xhigh` / `max` は測定できる品質差がある時だけにする。Haiku 4.5 は effort 非対応。同じ effort 名でも model 間で推論量は同じではない。
- 失敗したら原因を分ける。入力不足なら context を補い、tool / 権限 / 環境の失敗はその原因を直す。方針が妥当で推論が足りない時だけ effort を上げる。未知の因果関係、scope 外判断、相反する高リスク evidence は main または高難度 role に戻す。
- 同じ原因に対して同じ model / effort / prompt で再試行を繰り返さない。再割当時は試行内容、diff、重要 log、未解決判断を渡す。
- `ultra` / `ultracode` は失敗した worker の「次の effort」として使わない。独立 workstream がある時だけ検討する。

## Early Return And Outcome Record

- worker は要件 / 設計の矛盾、想定外の scope 拡大、説明できない失敗、相反する evidence に当たった時点で、その判断に依存する編集を止めて main に返す。原因と修正が明確な局所エラーは担当内で直してよい。
- 返却には部分 diff、実行した確認、evidence、未解決判断を含める。main は同じ仕事を最初からやり直さず、context 補完、直接実装、設定調整、別 worker への再割当から選ぶ。
- 委任した作業は、既存の handoff / verification record または最終報告に、task の種類、使った pair（確認できなければ `unverified`）、受入結果、差し戻しの有無を短く残す。新しい ledger や telemetry は作らない。永続的な routing policy や agent definition の変更は提案にとどめ、承認後に行う。

## Assignment

委任時の prompt には次を短く含める:

- role、accepted scope、read / write scope、禁止操作（`safety-guardrails.md` のうち該当するもの）、必要な context と repo 固有の規約。
- 選んだ model / effort とその理由（host 側の既定や definition をそのまま使う場合はその旨）。
- acceptance criteria、必要な verification、親へ戻す条件、返却形式。

「もう一度自己確認せよ」のような一般的な指示を重ねず、必要な検証と evidence を具体的に指定する。review には severity、confidence、evidence 付きで findings を返させ、取捨は親が行う。更新され得る仕様は、低 effort の worker にも一次資料の確認を明示する。

## Primary Sources

- [Codex models](https://learn.chatgpt.com/docs/models)
- [Codex subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents)
- [OpenAI latest model guide](https://developers.openai.com/api/docs/guides/latest-model)
- [Claude effort](https://platform.claude.com/docs/en/build-with-claude/effort)
- [Prompting Claude Opus 5.5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5-5)
- [Claude prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)
- [Claude Code subagents](https://code.claude.com/docs/en/sub-agents)
