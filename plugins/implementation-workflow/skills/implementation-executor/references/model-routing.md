# Model Routing

model は agent の肩書きではなく、その task の判断難度、scope、失敗コストで選ぶ。vendor ごとの公式推奨を正とし、OpenAI と Anthropic の model family を見かけ上対称な tier へ押し込まない。

## Current Routing Baseline

2026-09-05 に公式 model catalog、prompting / migration guide、host docs を確認した host 別 mapping。推奨用途は公式情報、具体的な role / effort pair はこの plugin の起点であり、vendor default と同義ではない:

| Host | 一般 main の起点 | 境界の明確な通常 worker | 明確で反復可能な leaf | 最難関への escalation |
| --- | --- | --- | --- | --- |
| Codex / OpenAI | GPT-6 Astra (`gpt-6-astra`)、`medium` | GPT-5.6 Terra (`gpt-5.6-terra`)、`xhigh` | GPT-5.6 Luna (`gpt-5.6-luna`)。決定的な確認は `low` / `medium`、code edit は `xhigh` | 単独の高難度判断は Astra `xhigh`、選択可能で必要なら `max`。独立 workstream に分けられる場合だけ `ultra` |
| Claude Code | Claude Opus 5 (`claude-opus-5`)。demanding coding / agentic は `xhigh` 起点、それ以外の判断中心 task は既定の `high` | Claude Sonnet 5 (`claude-sonnet-5`)、既定の `high`。最難関の bounded coding だけ `xhigh` | Claude Haiku 4.5 (`claude-haiku-4-5`)。effort parameter 非対応なので、effort を下げる代わりに task を狭くする | Claude Fable 5.1 (`claude-fable-5-1`)、まず既定の `high`。最も能力が要る workload だけ `xhigh`、分離可能な大規模作業だけ `ultracode` |

これは固定的な vendor lock ではなく、能力 tier の baseline である。model ID、plan 別 availability、effort control は変わり得るため、vendor の公式 model catalog、release note、help / availability page と、host で実際に選択可能な model を正とする。モデルの性能・価格・推奨用途について、この plugin 独自の品質 A/B や反復 fixture eval を release 条件にしない。

## Assignment Rules

- Codex は、model 選択に迷う一般 task と main agent を Astra `medium` から始める。複雑、open-ended、高価値、追加の分析・判断・polish が必要なら Astra のまま effort を上げる。
- Sol (`gpt-5.6-sol`) は複雑な作業の代替候補として残す。Astra が未提供、または cost / latency 制約がある場合は Sol `medium` / `xhigh` を task に応じて選ぶ。
- Terra は、大量の既存 code / log、複数ファイルの因果関係、複雑な debugging、継続的な自己修正を含むが、architecture と product 判断は親に残る bounded implementation に `xhigh` で使う。Codex coding worker では Terra の `low` / `medium` を使わず、`high` は latency 制約を明示された場合だけにする。
- Luna は、入力、編集範囲、期待出力、verification command が明確な反復可能 task に使う。read-only verification は `low` / `medium`、code を生成・編集する bounded worker は `xhigh` にする。architecture 判断、未知の root cause、auth / billing / migration / production / security 判断は渡さない。
- Claude Code は Opus 5 を一般 main と daily coding の既定にする。公式の推奨も「迷ったら Opus 5 から始め、最も高い能力が要る workload だけ Fable 5.1」である。この plugin の demanding coding / agentic work は `xhigh` から始め、それ以外の判断中心 task は既定の `high` を使う。
- Sonnet 5 は speed と intelligence を両立させる worker tier に使う。境界と acceptance criteria が明確な実装、局所 debugging、evidence 確認中心の review が対象で、既定 `high`、最難関の bounded coding だけ `xhigh` にする。
- Haiku 4.5 は effort parameter に対応しない。低 effort で軽くする制御ができないため、渡す task 自体を狭く決定的にする。長い context、未知の root cause、判断を含む review には使わない。
- Fable 5.1 は default にせず、単一の sitting を超える長時間作業、曖昧な root-cause 調査、outage debugging、architecture 判断、大きな自律実行に使う。細かな手順ではなく達成すべき outcome を渡し、長時間継続させる場合は `/goal` を使う。
- review model も host 別に選ぶ。Codex の bounded code review は Terra `xhigh`、複雑な logic / edge-case review は Astra `xhigh`、Claude Code の bug-finding を目的とする adversarial review は Opus 5 `medium` を基準にする。Anthropic は Opus 5 の code review を precision と recall の両方が高い強みとして名指しし、かつ低 effort でも精度が落ちないと明記しているため、review lane では effort ではなく model tier を先に上げる。security、data loss、cross-slice architecture、収束しない P0/P1 は Astra `xhigh` または Opus 5 `xhigh` / Fable 5.1 へ上げる。定型的な evidence 確認だけなら Luna / Haiku / Sonnet 5 を使える。
- review lane の prompt に「高確度だけ」「重大なものだけ」「保守的に」といった自己フィルタを書かない。現行 model はこれを literally に従い、bug は同じように見つけていても報告を自分で落とすため recall が下がる。reviewer には severity と confidence を付けて全件報告させ、取捨は親エージェント側で行う。
- 同じ task を複数 model に無差別 fan-out しない。独立 workstream、異なる reviewer role、または不確実性を減らす明確な目的がある時だけ並列化する。
- worker が失敗したら、同じ設定で再試行する前に `depth 不足` と `tier 不足` を分ける。scope と方針が正しく推論の深さだけが不足しているなら同一 model の effort を 1 段上げる。未知の root cause、cross-slice 判断、長い context、高リスク判断が必要なら model tier を上げる。相反する evidence または高リスクの P0/P1 は直ちに frontier main へ返す。
- 同じ model / effort / prompt で同じ原因の失敗を 2 回繰り返さない。escalation prompt には試行内容、diff、log、未解決判断を渡す。
- model の自己申告だけで結果を受理しない。main agent が diff と acceptance evidence を確認する。

## 委任と prompt 前提

Astra / Claude 5 世代では委任の条件を明示する。worker の主目的は、探索、長い log、試行錯誤、独立 workstream の詳細を main context から隔離することであり、agent 数を増やすことではない。

- `review-and-parallelism.md` の Delegation Value Test を spawn 前に行う。期待する context benefit が handoff / coordination / integration overhead を有意に上回る場合だけ委任する。
- 独立 workstream、広い探索、長い debugging / verification loop、独立した read-only review は委任価値が高い。必要 context がすでに main に揃った小さく coherent な実装は、複数ファイルでも main が直接進めてよい。
- 同時に走らせる worker 数の上限を決めてから fan-out する。上限は host / workspace / repo の cap を正とし、plugin 側で固定値を上書きしない。
- narrow な task では、やらないことも含めて scope を明示する。明示がないと隣接コードの修正や追加 test へ広がるため。
- 委任 prompt にも lane の rubric にも、「作業後に自己検証せよ」「self-check せよ」「diff を自分でレビューせよ」といった一般的な自己検証指示を入れない。Opus 5 世代は言われなくても自己検証し、指示を残すと over-verification になる。
- ただし evidence の質に関する規律は別軸として維持する。worker の自己申告だけで受理しない、CLI の成功メッセージを唯一の根拠にしない、実際の出力を親が読む、closure 前に diff と acceptance evidence を確認する、は削らない。求めるのは「もう一度確認する手順」ではなく「確認した結果の evidence」である。
- 出力の長さは effort では縮まない。簡潔さが必要なら、prompt で目標の長さや形式を指定する。
- agentic session 中の実況と最終応答は、lane ごとの `SKILL.md` の `Reporting Cadence` に従う。既定の narration 量は model 世代で変わるため、cadence は model 更新時に再調整する。
- ファイルへ書く成果物の分量は task が必要とする量に合わせる。plan / report の分量規律は `../../implementation-planner/references/output-contracts.md` と `../../implementation-auditor/references/report-format.md` を正とする。

## 新モデルでの実行規律

- Astra / Fable 5.1 には目的、成功条件、一次資料、変更範囲を渡す。依頼済みの lane を完了まで進め、調査で解ける疑問や通常の可逆な判断だけで停止しない。途中の追加指示は元の目的・制約に統合する。
- 回答が必要な判断は、回答依存の作業を保留し、独立した調査・検証を続ける。未回答を承認と扱わない。skill の指示が停止理由なら、該当 file と指示を示す。
- Fable 5.1 は tool loop 中の報告が少ないため、各 lane の Reporting Cadence に従って途中経過を返す。最終応答は依頼全体の結果を説明する。
- 依存しない検索・読み取りは同じ turn でまとめ、編集・承認・依存する処理は順に進める。委任先を待つ間も独立した親の作業があれば続ける。
- 低 effort でも current docs / 検索が必要な条件を省略しない。Fable 5.1 の low では検索を減らす傾向があるため、更新され得る仕様には出典確認を明示する。
- 小さな修正は局所編集にし、依頼外の変更・test を増やさない。必要な gate が通った後の再検証は、新しい変更・失敗・未解決の懸念がある場合だけ行う。

## Effort Ladder

effort は固定値ではなく、eval で sweep する軸として扱う。model 更新時は設定を引き継がず、その workload で品質が保てる下限を測ってから決める。

model tier は task の不確実性、context、失敗コストで選ぶ。Codex の code-generating worker は、モデル単価を Luna / Terra で調整し、effort は `xhigh` に固定する。小型 model と低 effort を重ねて品質を二重に下げない。

Claude 側の起点:

| Model | 起点 | 下げてよい条件 | 上げる条件 |
| --- | --- | --- | --- |
| Opus 5 | demanding coding / agentic は `xhigh`、それ以外の判断中心 task は `high` | `low` / `medium` は前世代 Opus より強い。eval で品質が保てる範囲では、cost と latency の主制御として積極的に使ってよい | 制約なしの token 消費が正当化される frontier task だけ `max` |
| Sonnet 5 | `high`（既定） | 短く決定的で latency / cost を優先する worker | 最難関の bounded coding / agentic task は `xhigh` |
| Haiku 4.5 | effort 非対応 | — | task が長 context / 未知の root cause / 判断を含むなら Sonnet 5 へ戻す |
| Fable 5.1 | `high`（既定） | 定型 / latency-sensitive task で品質を保てる evidence がある時に `medium` / `low` | 最難関は `xhigh`、token 消費を許容する場合は `max` |

API harness の出力上限は thinking と action の両方を含む。Fable 5.1 は `high` 以上、Opus 5 は `xhigh` / `max` で十分な上限を確保する。Opus 5 は `xhigh` / `max` で thinking を無効化できない。

`none` / `low` / `medium` は Codex の code-generating / review worker に使わない。これは plugin policy であり、一般 main の Astra `medium` は別に扱う。出力が tool により決定される read-only verification は Luna `low` / `medium` を使える。Astra の API は `none` をサポートしない。

| Task shape | Codex の起点 | Escalation |
| --- | --- | --- |
| lint、test、log、既知 pattern の read-only 確認 | Luna `low` / `medium` | evidence が相反するなら Terra へ返す |
| exact scope、expected diff、verification が揃う bounded coding | Luna `xhigh` | 長い context / debugging / 自己修正が必要なら Terra `xhigh` |
| 通常の複数ファイル implementation、長い context、複雑 debugging | Terra `xhigh` | 未知の判断、cross-slice、高リスクなら Astra `xhigh` |
| architecture、未知の root cause、高リスク統合判断 | Astra `xhigh` | 分離可能な複数 workstream なら `ultra` |

同じ品質目標なら、公開 coding-agent evaluation 上の Pareto frontier と公式の価格差を初期 routing の根拠に使える。ただし公開図の `max` は API evaluation の参考点であり、Codex で選択不能なら routing 候補にしない。benchmark cost は実 workload の請求額ではないため、単一スコアで固定せず、task の token 量、latency、retry cost、実際の acceptance evidence を優先する。

## Host-native Modes And Effort

- Astra の availability は rollout、sign-in、client、plan / workspace に依存する。GPT-5.6 Sol / Terra / Luna も含め current host で選択可能か確認する。選択不能なら同じ role を満たす選択可能な pair を選び、fallback を handoff に残す。
- Codex の Power default は account / rollout に依存する。plugin の一般 main の起点は Astra `medium`。必要に応じて `high` / `xhigh` / 選択可能な `max` へ上げ、code-generating worker は Luna / Terra `xhigh` を使う。`ultra` は自動 subagents を使う orchestration mode であり、API effort の列挙値と混同しない。
- Claude Code の dynamic workflow は script が多数の subagent を orchestrate する仕組みで、`ultracode` は `xhigh` effort と自動 workflow orchestration を組み合わせる session mode である。通常の manual subagent delegation と同義ではない。
- Codex `ultra` または Claude Code `ultracode` / dynamic workflow を使う場合、同じ workstream に plugin の manual fan-out を重ねない。host-native orchestration に assignment と cap の管理を委ね、main は結果の統合と acceptance evidence の確認に集中する。
- Claude Opus 5 / Sonnet 5 / Fable 5.1 の default effort は `high`。plugin agent が明示的に下げるのは、その workload で品質が保てると確認できた場合に限る。Haiku 4.5 は effort parameter に対応しないので、effort 指定ではなく task の絞り込みで制御する。
- Luna `xhigh` で長い context、複雑な debugging、継続的な自己修正が必要になったら Terra `xhigh` へ上げる。未知の root cause、scope 外判断、高リスク判断が必要になったら Astra `xhigh` へ戻す。Claude Code の Haiku は Sonnet 5 へ戻し、Sonnet 5 でも判断が重くなったら Opus 5 へ、単一の sitting を超える長時間 investigation / architecture 判断になったら Fable 5.1 へ上げる。
- Claude Fable 5.1 は adaptive thinking が常時有効。30-day data retention が適用され、Anthropic の明示許可なしでは ZDR 対象外。組織 policy と衝突する repo / data を自動で送らず、許可された model tier を選ぶ。retention 制約下では許可された Opus 5 へ戻す。
- Fable 5.1 は Fable 5 と入力 / 出力価格が同じだが、cache read は $0.25 / MTok（Fable 5 の 1/4）。単価だけで task 全体が安くなると断定せず、retry と cache を含めて判断する。移行時の非互換変更は `host-adapters.md` を参照する。

## Mandatory Spawn-time Selection Contract

worker を起動するたび、main はまず task shape、context、失敗コスト、read-only / implementation / review role を分類し、この file の routing table から model tier と effort を選ぶ。選べる値を inherited / default に任せない。指定した pair、選択理由、fallback、selection-unavailable は assignment または handoff に短く残す。

### Codex

- applicable な `AGENTS.md` / skill instruction が delegation を要求できる。main は requirements、scope / risk / model / effort 判断、worker steering、diff / evidence acceptance、final output に集中する。
- Codex の custom agent config の field は `model` と `model_reasoning_effort` である。現在の worker spawn interface は `model` と `reasoning_effort` を受け付け、明示した値は `[agents]` defaults と parent の値を override する。明示 override は full-history fork では使えないため、`fork_turns: "none"` または bounded な recent-turn count を選び、assignment に必要な plan、scope、acceptance criteria、禁止操作、relevant evidence をコピーする。
- full history が不可欠なら、明示 pair を指定したと主張しない。inherited model / reasoning pair を `selection-unavailable` として報告し、理由と未コピー context を返却する。non-full-history fork を使える全 Codex worker spawn では、task shape を分類してから両方を明示して渡し、暗黙の inherit / default に任せない。
- Codex worker の実行前に、選んだ model と reasoning effort が current host / plan / workspace で選択可能か確認する。要求 pair が使えなければ、同じ routing role を満たす選択可能な pair を選び、requested pair、chosen fallback、理由を返却する。値を指定可能なのに省略して fallback させない。

### Claude Code

- plugin / custom agent definition の frontmatter は `model` と `effort` を持てる。bundled definition は read-only diagnostic / accepted-slice implementation の両 mode を持つ `implementation-worker` が Sonnet / `high`、`adversarial-reviewer` が Opus / `medium`、`verification-worker` が Haiku で effort なし（Haiku 4.5 は effort 非対応）である。
- 通常の Agent invocation は invocation ごとの model override を受け付けるが、通常の Agent tool には invocation ごとの effort 指定がない。effort は agent frontmatter または session から来るため、通常の Agent 呼び出しに dynamic effort を指定したと誤って報告しない。
- Agent SDK または `--agents` の runtime `AgentDefinition` が使える場合は、task shape ごとに `model` と `effort` の両方を動的に設定する。使えない場合は、task に合う frontmatter effort を持つ bundled agent definition を選び、互換性がある時だけ model を invocation ごとに override する。該当 definition / session effort がない場合は、選択不能と選んだ fallback を report する。

委任 assignment には最低限以下を含める:

- 選択した model ID / tier と effort / reasoning level、選択理由、optimization priority（`quality` / `balanced` / `throughput`）と retry cost。
- worker role と accepted slice、read / write scope、禁止操作。
- acceptance criteria、verification command、同一 tier 内で effort を上げる条件、上位 tier へ返す条件。
- escalation condition、返却形式、fallback または selection-unavailable の報告要件。

model または effort を選べない host / interface では、task を選べる tier 相当まで狭めるだけで黙って暗黙 default にしない。host 機構により dynamic selection ができないこと、実際に適用された definition / session setting、未解決の制約を返却する。

## Primary Sources

- [OpenAI GPT-6 Astra model](https://developers.openai.com/api/docs/models/gpt-6-astra)
- [OpenAI GPT-6 Astra prompting and migration](https://developers.openai.com/api/docs/guides/latest-model?model=gpt-6-astra)
- [OpenAI GPT-5.6 launch and coding evaluations](https://openai.com/index/gpt-5-6/)
- [OpenAI current model catalog](https://developers.openai.com/api/docs/models)
- [OpenAI GPT-5.6 Terra](https://developers.openai.com/api/docs/models/gpt-5.6-terra)
- [OpenAI GPT-5.6 Luna](https://developers.openai.com/api/docs/models/gpt-5.6-luna)
- [OpenAI Codex model selection](https://learn.chatgpt.com/docs/models)
- [OpenAI Codex subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents)
- [Anthropic current model overview](https://platform.claude.com/docs/en/about-claude/models/overview)
- [Anthropic Claude Fable 5.1](https://platform.claude.com/docs/en/models/fable-5-1/overview)
- [Anthropic Fable 5.1 changes and retention](https://platform.claude.com/docs/en/models/fable-5-1/whats-new-fable-5-1)
- [Anthropic Fable 5.1 migration](https://platform.claude.com/docs/en/models/fable-5-1/migration-guide)
- [Anthropic prompting Fable 5.1](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5-1)
- [Claude Code model configuration](https://code.claude.com/docs/en/model-config)
- [Anthropic model migration guide (Opus 4.8 → Opus 5)](https://platform.claude.com/docs/en/about-claude/models/migration-guide)
- [Anthropic effort parameter](https://platform.claude.com/docs/en/build-with-claude/effort)
- [Anthropic prompting Claude Opus 5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5)
- [Claude Code dynamic workflows and ultracode](https://code.claude.com/docs/en/workflows)
- [Claude data retention](https://platform.claude.com/docs/en/manage-claude/api-and-data-retention)
