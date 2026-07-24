# Model Routing

model は agent の肩書きではなく、その task の判断難度、scope、失敗コストで選ぶ。vendor ごとの公式推奨を正とし、OpenAI と Anthropic の model family を見かけ上対称な tier へ押し込まない。

## Current Routing Baseline

2026-07-25 時点の公式情報と公開 coding-agent evaluation に基づく host 別 mapping:

| Host | 一般 main の起点 | 境界の明確な通常 worker | 明確で反復可能な leaf | 最難関への escalation |
| --- | --- | --- | --- | --- |
| Codex / OpenAI | GPT-5.6 Sol (`gpt-5.6-sol`; `gpt-5.6` alias も Sol)、`medium` | GPT-5.6 Terra (`gpt-5.6-terra`)、`xhigh` | GPT-5.6 Luna (`gpt-5.6-luna`)。決定的な確認は `low` / `medium`、code edit は `xhigh` | 単独の高難度判断は Sol `xhigh`。独立 workstream に分けられる場合だけ `ultra` |
| Claude Code | Claude Opus 5 (`claude-opus-5`)。coding / agentic は `xhigh` 起点、それ以外の判断中心 task は既定の `high` | Claude Sonnet 5 (`claude-sonnet-5`)、既定の `high`。最難関の bounded coding だけ `xhigh` | Claude Haiku 4.5 (`claude-haiku-4-5`)。effort parameter 非対応なので、effort を下げる代わりに task を狭くする | Claude Fable 5 (`claude-fable-5`)、まず既定の `high`。最も能力が要る workload だけ `xhigh`、分離可能な大規模作業だけ `ultracode` |

これは固定的な vendor lock ではなく、能力 tier の baseline である。model ID、plan 別 availability、effort control は変わり得るため、vendor の公式 model catalog、release note、help / availability page と、host で実際に選択可能な model を正とする。モデルの性能・価格・推奨用途について、この plugin 独自の品質 A/B や反復 fixture eval を release 条件にしない。

## Assignment Rules

- Codex は、model 選択に迷う一般 task と main agent を Sol `medium` から始める。複雑、open-ended、高価値、追加の分析・判断・polish が必要なら Sol のまま effort を上げる。
- Terra は、大量の既存 code / log、複数ファイルの因果関係、複雑な debugging、継続的な自己修正を含むが、architecture と product 判断は親に残る bounded implementation に `xhigh` で使う。Codex coding worker では Terra の `low` / `medium` を使わず、`high` は latency 制約を明示された場合だけにする。
- Luna は、入力、編集範囲、期待出力、verification command が明確な反復可能 task に使う。read-only verification は `low` / `medium`、code を生成・編集する bounded worker は `xhigh` にする。architecture 判断、未知の root cause、auth / billing / migration / production / security 判断は渡さない。
- Claude Code は Opus 5 を一般 main と daily coding の既定にする。公式の推奨も「迷ったら Opus 5 から始め、最も高い能力が要る workload だけ Fable 5」である。coding / agentic work は `xhigh` から始め、それ以外の判断中心 task は既定の `high` を使う。
- Sonnet 5 は speed と intelligence を両立させる worker tier に使う。境界と acceptance criteria が明確な実装、局所 debugging、evidence 確認中心の review が対象で、既定 `high`、最難関の bounded coding だけ `xhigh` にする。
- Haiku 4.5 は effort parameter に対応しない。低 effort で軽くする制御ができないため、渡す task 自体を狭く決定的にする。長い context、未知の root cause、判断を含む review には使わない。
- Fable 5 は default にせず、単一の sitting を超える長時間作業、曖昧な root-cause 調査、outage debugging、architecture 判断、大きな自律実行に使う。細かな手順ではなく達成すべき outcome を渡し、長時間継続させる場合は `/goal` を使う。
- review model も host 別に選ぶ。Codex の bounded code review は Terra `xhigh`、複雑な logic / edge-case review は Sol `xhigh`、Claude Code の bug-finding を目的とする adversarial review は Opus 5 `medium` を基準にする。Anthropic は Opus 5 の code review を precision と recall の両方が高い強みとして名指しし、かつ低 effort でも精度が落ちないと明記しているため、review lane では effort ではなく model tier を先に上げる。security、data loss、cross-slice architecture、収束しない P0/P1 は Sol `xhigh` または Opus 5 `xhigh` / Fable 5 へ上げる。定型的な evidence 確認だけなら Luna / Haiku / Sonnet 5 を使える。
- review lane の prompt に「高確度だけ」「重大なものだけ」「保守的に」といった自己フィルタを書かない。現行 model はこれを literally に従い、bug は同じように見つけていても報告を自分で落とすため recall が下がる。reviewer には severity と confidence を付けて全件報告させ、取捨は親エージェント側で行う。
- 同じ task を複数 model に無差別 fan-out しない。独立 workstream、異なる reviewer role、または不確実性を減らす明確な目的がある時だけ並列化する。
- worker が失敗したら、同じ設定で再試行する前に `depth 不足` と `tier 不足` を分ける。scope と方針が正しく推論の深さだけが不足しているなら同一 model の effort を 1 段上げる。未知の root cause、cross-slice 判断、長い context、高リスク判断が必要なら model tier を上げる。相反する evidence または高リスクの P0/P1 は直ちに frontier main へ返す。
- 同じ model / effort / prompt で同じ原因の失敗を 2 回繰り返さない。escalation prompt には試行内容、diff、log、未解決判断を渡す。
- model の自己申告だけで結果を受理しない。main agent が diff と acceptance evidence を確認する。

## Claude 5 世代の委任と prompt 前提

Claude Opus 5 世代は前世代より subagent へ委任しやすい。この plugin の flat orchestration 既定は、コスト削減のためではなく、この委任傾向に対する guardrail である。

- 委任してよい場面を明示する。独立した workstream、独立した read-only review / verification、親では分解できない bounded な実装に限る。「重そうだから」を委任理由にしない。
- 同時に走らせる worker 数の上限を決めてから fan-out する。上限は host / workspace / repo の cap を正とし、plugin 側で固定値を上書きしない。
- narrow な task では scope を明示的に制約する。Opus 5 世代は task scope を自分で広げやすい。
- 委任 prompt に「作業後に自己検証せよ」「self-check せよ」といった一般的な自己検証指示を入れない。Opus 5 世代は言われなくても自己検証し、指示を残すと over-verification になる。
- ただし evidence の質に関する規律は別軸として維持する。worker の自己申告だけで受理しない、CLI の成功メッセージを唯一の根拠にしない、実際の出力を親が読む、は削らない。
- 出力の長さは effort では縮まない。簡潔さが必要なら、prompt で目標の長さや形式を指定する。

## Effort Ladder

effort は固定値ではなく、eval で sweep する軸として扱う。前世代の設定をそのまま引き継がず、その workload で品質が保てる下限を測ってから決める。

model tier は task の不確実性、context、失敗コストで選ぶ。Codex の code-generating worker は、モデル単価を Luna / Terra で調整し、effort は `xhigh` に固定する。小型 model と低 effort を重ねて品質を二重に下げない。

Claude 側の起点:

| Model | 起点 | 下げてよい条件 | 上げる条件 |
| --- | --- | --- | --- |
| Opus 5 | coding / agentic は `xhigh`、それ以外の判断中心 task は `high` | `low` / `medium` は前世代 Opus より強い。eval で品質が保てる範囲では、cost と latency の主制御として積極的に使ってよい | 制約なしの token 消費が正当化される frontier task だけ `max` |
| Sonnet 5 | `high`（既定） | 短く決定的で latency / cost を優先する worker | 最難関の bounded coding / agentic task は `xhigh` |
| Haiku 4.5 | effort 非対応 | — | task が長 context / 未知の root cause / 判断を含むなら Sonnet 5 へ戻す |
| Fable 5 | `high`（既定） | 定型作業は `medium` / `low` でも前世代の `xhigh` を上回ることがある | 最も能力が要る workload だけ `xhigh` |

`xhigh` / `max` で走らせる場合は、thinking と action の両方に余裕が要るため出力上限を大きく取る。Opus 5 は `xhigh` / `max` で thinking を無効化できない。

`none` / `low` / `medium` は Codex の implementation と review に使わない。出力が tool により決定される read-only verification は Luna `low` / `medium` を使える。Sol `medium` は model 選択に迷う一般 main の公式起点として維持する。

| Task shape | Codex の起点 | Escalation |
| --- | --- | --- |
| lint、test、log、既知 pattern の read-only 確認 | Luna `low` / `medium` | evidence が相反するなら Terra へ返す |
| exact scope、expected diff、verification が揃う bounded coding | Luna `xhigh` | 長い context / debugging / 自己修正が必要なら Terra `xhigh` |
| 通常の複数ファイル implementation、長い context、複雑 debugging | Terra `xhigh` | 未知の判断、cross-slice、高リスクなら Sol `xhigh` |
| architecture、未知の root cause、高リスク統合判断 | Sol `xhigh` | 分離可能な複数 workstream なら `ultra` |

同じ品質目標なら、公開 coding-agent evaluation 上の Pareto frontier と公式の価格差を初期 routing の根拠に使える。ただし公開図の `max` は API evaluation の参考点であり、Codex で選択不能なら routing 候補にしない。benchmark cost は実 workload の請求額ではないため、単一スコアで固定せず、task の token 量、latency、retry cost、実際の acceptance evidence を優先する。

## Host-native Modes And Effort

- GPT-5.6 Sol / Terra / Luna は、2026-07-25 時点で Codex と OpenAI API で利用でき、Codex の対象 model は plan / workspace により異なる。旧 limited preview 前提は使わない。選択不能なら task を止めず、host で選択可能な最新 model から同じ tier の役割を満たす model を選び、重要な fallback だけ handoff に残す。
- Codex の既定 Power は Sol `medium`。一般 main は必要に応じて `high` / `xhigh` へ上げ、code-generating worker は Luna / Terra `xhigh` を使う。Codex で選択できない `max` を要求しない。`ultra` は自動 subagents を使う orchestration mode であり、単独 agent の effort の代替と見なさない。
- Claude Code の dynamic workflow は script が多数の subagent を orchestrate する仕組みで、`ultracode` は `xhigh` effort と自動 workflow orchestration を組み合わせる session mode である。通常の manual subagent delegation と同義ではない。
- Codex `ultra` または Claude Code `ultracode` / dynamic workflow を使う場合、同じ workstream に plugin の manual fan-out を重ねない。host-native orchestration に assignment と cap の管理を委ね、main は結果の統合と acceptance evidence の確認に集中する。
- Claude Opus 5 / Sonnet 5 / Fable 5 の default effort は `high`。plugin agent が明示的に下げるのは、その workload で品質が保てると確認できた場合に限る。Haiku 4.5 は effort parameter に対応しないので、effort 指定ではなく task の絞り込みで制御する。
- Luna `xhigh` で長い context、複雑な debugging、継続的な自己修正が必要になったら Terra `xhigh` へ上げる。未知の root cause、scope 外判断、高リスク判断が必要になったら Sol `xhigh` へ戻す。Claude Code の Haiku は Sonnet 5 へ戻し、Sonnet 5 でも判断が重くなったら Opus 5 へ、単一の sitting を超える長時間 investigation / architecture 判断になったら Fable 5 へ上げる。
- Claude Fable 5 は adaptive thinking が常時有効で、30-day data retention が必要。zero-data-retention や組織 policy と衝突する repo / data を自動で送らず、許可された model tier を選ぶ。Opus 5 / Sonnet 5 はこの retention 制約を持たないため、retention 制約下の default escalation 先は Fable 5 ではなく Opus 5 にする。

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
- [Anthropic current model overview](https://platform.claude.com/docs/en/about-claude/models/overview)
- [Anthropic Claude Fable 5](https://platform.claude.com/docs/en/about-claude/models/introducing-claude-fable-5-and-claude-mythos-5)
- [Anthropic model migration guide (Opus 4.8 → Opus 5)](https://platform.claude.com/docs/en/about-claude/models/migration-guide)
- [Anthropic effort parameter](https://platform.claude.com/docs/en/build-with-claude/effort)
- [Claude Code dynamic workflows and ultracode](https://code.claude.com/docs/en/workflows)
- [Claude data retention](https://platform.claude.com/docs/en/manage-claude/api-and-data-retention)
