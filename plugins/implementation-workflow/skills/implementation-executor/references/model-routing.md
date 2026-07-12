# Model Routing

model は agent の肩書きではなく、その task の判断難度、scope、失敗コストで選ぶ。vendor ごとの公式推奨を正とし、OpenAI と Anthropic の model family を見かけ上対称な tier へ押し込まない。

## Current Routing Baseline

2026-07-13 時点の公式情報と公開 coding-agent evaluation に基づく host 別 mapping:

| Host | 一般 main の起点 | 境界の明確な通常 worker | 明確で反復可能な leaf | 最難関への escalation |
| --- | --- | --- | --- | --- |
| Codex / OpenAI | GPT-5.6 Sol (`gpt-5.6-sol`; `gpt-5.6` alias も Sol)、`medium` | GPT-5.6 Terra (`gpt-5.6-terra`)、`xhigh` | GPT-5.6 Luna (`gpt-5.6-luna`)。決定的な確認は `low` / `medium`、code edit は `xhigh` | 単独の高難度判断は Sol `xhigh`。独立 workstream に分けられる場合だけ `ultra` |
| Claude Code | Claude Sonnet 5 (`claude-sonnet-5`)、既定の `high` | Sonnet 5、通常 `high`。短く明確で latency / cost を優先するときだけ `medium` 以下を検討 | Claude Haiku 4.5 (`claude-haiku-4-5`)、通常 `low` | Claude Fable 5 (`claude-fable-5`)、まず既定の `high`。必要時だけ `xhigh` / `max`、分離可能な大規模作業だけ `ultracode` |

これは固定的な vendor lock ではなく、能力 tier の baseline である。model ID、plan 別 availability、effort control は変わり得るため、vendor の公式 model catalog、release note、help / availability page と、host で実際に選択可能な model を正とする。モデルの性能・価格・推奨用途について、この plugin 独自の品質 A/B や反復 fixture eval を release 条件にしない。

## Assignment Rules

- Codex は、model 選択に迷う一般 task と main agent を Sol `medium` から始める。複雑、open-ended、高価値、追加の分析・判断・polish が必要なら Sol のまま effort を上げる。
- Terra は、大量の既存 code / log、複数ファイルの因果関係、複雑な debugging、継続的な自己修正を含むが、architecture と product 判断は親に残る bounded implementation に `xhigh` で使う。Codex coding worker では Terra の `low` / `medium` を使わず、`high` は latency 制約を明示された場合だけにする。
- Luna は、入力、編集範囲、期待出力、verification command が明確な反復可能 task に使う。read-only verification は `low` / `medium`、code を生成・編集する bounded worker は `xhigh` にする。architecture 判断、未知の root cause、auth / billing / migration / production / security 判断は渡さない。
- Claude Code は Sonnet 5 `high` を daily coding と通常 main の既定にする。effort は task が短く明確で latency / cost を優先するときだけ下げる。
- Fable 5 は default にせず、単一の sitting を超える長時間作業、曖昧な root-cause 調査、outage debugging、architecture 判断、大きな自律実行に使う。細かな手順ではなく達成すべき outcome を渡し、長時間継続させる場合は `/goal` を使う。
- review model も host 別に選ぶ。Codex の bounded code review は Terra `xhigh`、複雑な logic / edge-case review は Sol `xhigh`、Claude Code の通常 review は Sonnet 5 `high` を基準にする。security、data loss、cross-slice architecture、収束しない P0/P1 は Sol `xhigh` または Fable 5 へ上げる。定型的な evidence 確認だけなら Luna / Haiku を使える。
- 同じ task を複数 model に無差別 fan-out しない。独立 workstream、異なる reviewer role、または不確実性を減らす明確な目的がある時だけ並列化する。
- worker が失敗したら、同じ設定で再試行する前に `depth 不足` と `tier 不足` を分ける。scope と方針が正しく推論の深さだけが不足しているなら同一 model の effort を 1 段上げる。未知の root cause、cross-slice 判断、長い context、高リスク判断が必要なら model tier を上げる。相反する evidence または高リスクの P0/P1 は直ちに frontier main へ返す。
- 同じ model / effort / prompt で同じ原因の失敗を 2 回繰り返さない。escalation prompt には試行内容、diff、log、未解決判断を渡す。
- model の自己申告だけで結果を受理しない。main agent が diff と acceptance evidence を確認する。

## Cost-performance-aware Effort Ladder

model tier は task の不確実性、context、失敗コストで選ぶ。Codex の code-generating worker は、モデル単価を Luna / Terra で調整し、effort は `xhigh` に固定する。小型 model と低 effort を重ねて品質を二重に下げない。

`none` / `low` / `medium` は Codex の implementation と review に使わない。出力が tool により決定される read-only verification は Luna `low` / `medium` を使える。Sol `medium` は model 選択に迷う一般 main の公式起点として維持する。

| Task shape | Codex の起点 | Escalation |
| --- | --- | --- |
| lint、test、log、既知 pattern の read-only 確認 | Luna `low` / `medium` | evidence が相反するなら Terra へ返す |
| exact scope、expected diff、verification が揃う bounded coding | Luna `xhigh` | 長い context / debugging / 自己修正が必要なら Terra `xhigh` |
| 通常の複数ファイル implementation、長い context、複雑 debugging | Terra `xhigh` | 未知の判断、cross-slice、高リスクなら Sol `xhigh` |
| architecture、未知の root cause、高リスク統合判断 | Sol `xhigh` | 分離可能な複数 workstream なら `ultra` |

同じ品質目標なら、公開 coding-agent evaluation 上の Pareto frontier と公式の価格差を初期 routing の根拠に使える。ただし公開図の `max` は API evaluation の参考点であり、Codex で選択不能なら routing 候補にしない。benchmark cost は実 workload の請求額ではないため、単一スコアで固定せず、task の token 量、latency、retry cost、実際の acceptance evidence を優先する。

## Host-native Modes And Effort

- GPT-5.6 Sol / Terra / Luna は、2026-07-13 時点で Codex と OpenAI API で利用でき、Codex の対象 model は plan / workspace により異なる。旧 limited preview 前提は使わない。選択不能なら task を止めず、host で選択可能な最新 model から同じ tier の役割を満たす model を選び、重要な fallback だけ handoff に残す。
- Codex の既定 Power は Sol `medium`。一般 main は必要に応じて `high` / `xhigh` へ上げ、code-generating worker は Luna / Terra `xhigh` を使う。Codex で選択できない `max` を要求しない。`ultra` は自動 subagents を使う orchestration mode であり、単独 agent の effort の代替と見なさない。
- Claude Code の dynamic workflow は script が多数の subagent を orchestrate する仕組みで、`ultracode` は `xhigh` effort と自動 workflow orchestration を組み合わせる session mode である。通常の manual subagent delegation と同義ではない。
- Codex `ultra` または Claude Code `ultracode` / dynamic workflow を使う場合、同じ workstream に plugin の manual fan-out を重ねない。host-native orchestration に assignment と cap の管理を委ね、main は結果の統合と acceptance evidence の確認に集中する。
- Claude Fable 5 と Sonnet 5 の model default effort は `high`。plugin agent が明示的に下げるのは、短く明確で intelligence-sensitive ではない task に限る。
- Luna `xhigh` で長い context、複雑な debugging、継続的な自己修正が必要になったら Terra `xhigh` へ上げる。未知の root cause、scope 外判断、高リスク判断が必要になったら Sol `xhigh` へ戻す。Claude Code の Haiku は Sonnet 5 へ戻し、Sonnet 5 でも task が長時間・高難度の investigation / architecture 判断へ変わったら Fable 5 へ上げる。
- Claude Fable 5 は adaptive thinking が常時有効で、30-day data retention が必要。zero-data-retention や組織 policy と衝突する repo / data を自動で送らず、許可された model tier を選ぶ。

## Delegation Prompt Contract

外部 agent / subagent の model を指定できる host では、委任 prompt または agent config に最低限以下を含める:

- model ID または model tier。
- effort / reasoning level（host が対応する場合）。
- optimization priority（`quality` / `balanced` / `throughput`）と retry cost。
- 同一 model 内の effort escalation と、上位 model へ返す条件。
- worker role と accepted slice。
- read / write scope と禁止操作。
- acceptance criteria と verification command。
- escalation condition と返却形式。

model を指定できない host では、task を tier 相当の難度まで狭め、重要な場合だけ選択不能だったことを報告する。retired model や暗黙 default への fallback を避けるため、指定可能なのに model / effort を省略しない。

## Primary Sources

- [OpenAI GPT-5.6 launch and coding evaluations](https://openai.com/index/gpt-5-6/)
- [OpenAI current model catalog](https://developers.openai.com/api/docs/models)
- [OpenAI GPT-5.6 Terra](https://developers.openai.com/api/docs/models/gpt-5.6-terra)
- [OpenAI GPT-5.6 Luna](https://developers.openai.com/api/docs/models/gpt-5.6-luna)
- [OpenAI Codex model selection](https://learn.chatgpt.com/docs/models)
- [OpenAI Codex subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents)
- [Anthropic Claude Fable 5](https://platform.claude.com/docs/en/about-claude/models/introducing-claude-fable-5-and-claude-mythos-5)
- [Anthropic current model overview](https://platform.claude.com/docs/en/about-claude/models/overview)
- [Claude Code dynamic workflows and ultracode](https://code.claude.com/docs/en/workflows)
- [Claude data retention](https://platform.claude.com/docs/en/manage-claude/api-and-data-retention)
