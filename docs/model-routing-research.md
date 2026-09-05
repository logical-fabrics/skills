# Model routing の調査と採用方針

確認日: 2026-09-05。対象: implementation-workflow の model / effort / delegation 指示。運用上の正本は [model-routing.md](../plugins/implementation-workflow/skills/implementation-executor/references/model-routing.md)、host 機構の正本は [host-adapters.md](../plugins/implementation-workflow/skills/implementation-executor/references/host-adapters.md)。

## 結論

作業別の推奨 pair は残し、coding worker の `xhigh` 固定と全 spawn の明示 override 強制を外す。既存 main の設定は維持し、必要な品質を満たす pair を、現在の host が提供する設定面で適用する。実効値と要求値を区別することが最優先の修正である。

公式資料から一意の「最適な pair」は決まらない。以下は未計測の万能な最適値ではなく、公式推奨に沿った初期方針である。品質の受入条件を維持し、実作業で不足・過剰が分かった時だけ調整する。

## 確認した根拠

| 根拠 | 確認内容 | この repo の判断 |
| --- | --- | --- |
| [Codex models](https://learn.chatgpt.com/docs/models) | 明確な作業は low、通常は medium、難しい分析は high / extra high。max と ultra は通常作業には不要 | 書き込みの有無だけでは effort を決めない |
| [Codex subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents) | worker ごとに model / effort を設定でき、継承も正式な経路。custom file は spawn 設定をさらに上書きできる | explicit / definition / inherited と effective pair を区別する |
| [Terra](https://developers.openai.com/api/docs/models/gpt-5.6-terra) / [Luna](https://developers.openai.com/api/docs/models/gpt-5.6-luna) | cost / workload の違いがあり、API は medium を既定として複数 effort を提供 | Terra medium を通常 worker、Luna low / medium を明確な leaf の起点とする |
| [Opus 5 prompting](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5) | 低 effort でも code review / bug-finding が強い。medium が全用途で最適とはしていない | bundled reviewer の Opus medium を維持し、高リスク判断とは分ける |
| [Claude effort](https://platform.claude.com/docs/en/build-with-claude/effort) | model ごとの推奨があり、effort は厳密な token budget ではない | 一律の最大化や同名 level の vendor 間比較を避ける |
| [Fable 5.1 prompting](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5-1) | low も小型 model の高 effort と比較する候補。低 effort では検索を減らす傾向がある | Fable を escalation 専用に閉じ込めず、task evidence と設定可能性がある時の代替候補とする |
| [Claude subagents](https://code.claude.com/docs/en/sub-agents) / [model config](https://code.claude.com/docs/en/model-config) | version、provider alias、環境変数、allowlist、thinking 設定が実効値に影響する | frontmatter だけで選択成功としない |
| [Agent SDK TypeScript](https://code.claude.com/docs/en/agent-sdk/typescript) | AgentInput と AgentDefinition は別型。定義側の model / effort の自由度を通常 tool 入力へ転用できない | 現在の tool schema を優先し、effort のためだけの別 CLI / SDK 起動はしない |

## 現在の host で確認したこと

CLI version / help、bundled catalog、公開 tool schema を確認した。モデル比較用の推論実験は行っていない。

- Codex CLI は `0.153.2`。`codex debug models --bundled` の Astra / Sol の default reasoning は `low`、Terra / Luna は `medium`。これは binary 同梱値であり、account availability や実行中 app の default の証拠ではない。
- 同 catalog の Astra / Sol / Terra は `low` / `medium` / `high` / `xhigh` / `max` / `ultra`、Luna は `ultra` を含まない。API で対応してもこの catalog には `none` がない。API、binary、active tool を分ける必要がある。
- この調査 session の `collaboration.spawn_agent` は `model` / `reasoning_effort` を受け付けるが、full-history fork と override の併用を禁止する。Astra / high / `fork_turns: "none"` で独立調査の dispatch が成功した。これは品質比較や全 host の動作保証ではない。
- Claude Code は `2.1.261`。通常 Agent の per-call effort は公式型にない。Fable / full ID の通常 Agent override は公開 schema を確認できない限り利用可能と断定しない。
- bundled agent は `sonnet` / `high`、`opus` / `medium`、`haiku` / effort なし。alias の解決先は固定しない。既存 3 definitions のまま通常作業を扱い、必要な高 effort の read-only profile がない時は制限を報告する。

## 採用しない指示

- 「全 coding worker を xhigh」: 公式の task 別 effort 推奨と合わず、必要性の evidence がない。
- 「毎回 override。継承は選択失敗」: 適切な既存設定を捨て、fork の context 引き渡しを増やす。
- 「Fable low は常に安い」: task 全体の cost、検索不足、再試行、host の適用制限を無視する。
- 「SDK なら指定できるので今の Agent tool にも渡す」: interface が異なる。
- 「profile を使ったので model と effort は保証済み」: override / provider / allowlist で変わる。
- 「高 effort reviewer がないので編集用 worker を流用」: review の権限境界を崩す。

## 検証の範囲

0.9.0 の frozen-lockfile install、構造 validation、lint、hook test 19 件、Claude Code strict validation と inventory（4 skills / 3 agents / 3 hook events）は成功。公式仕様と diff による独立 scenario review で未解決 P0/P1 はない。配布先で不要な maintainer 資料を必須参照にしないことも確認した。

scenario review は既存 main、機械的編集、複雑な review、継承、override、read-only profile 不足の指示上の整合確認であり、モデルを実行した比較試験ではない。Codex への 0.9.0 新規 install / 新規 session discovery、model 間の性能、task 全体の費用、全 provider の alias 解決、全 account の利用可否は未検証。資料の更新が揃わない場合は、能力の推奨は最新 model page、指定方法は該当 host docs と実際の schema を優先する。
