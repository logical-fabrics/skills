# Model routing の根拠

確認日: 2026-10-26。対象は implementation-workflow の model / effort / 委任の指示。運用の正本は [model-routing.md](../plugins/implementation-workflow/skills/implementation-executor/references/model-routing.md)、[review-and-parallelism.md](../plugins/implementation-workflow/skills/implementation-executor/references/review-and-parallelism.md)、[host-adapters.md](../plugins/implementation-workflow/skills/implementation-executor/references/host-adapters.md)。この file は現行方針の根拠だけを置く。経緯は [CHANGELOG.md](../CHANGELOG.md) を参照。

## 結論

- coding は main 1 体で調査・実装・test・修正まで通すことを既定にする。委任は、別 context に隔離できる作業量が overhead を明確に上回る時だけにする。
- 工程（実装 / test / 確認）で agent を分けない。自分の作業の再確認を subagent に委任しない。risk 表が求める独立 review は fresh context で残す。
- worker の起点は Claude Code が Sonnet 5.5 `medium` / Haiku 5.5、reviewer が Opus 5.5 `medium`。Codex は GPT-6.1 Sol を通常 worker と main の起点にし、Luna を定型作業に使う。
- routing 表は公式推奨に沿った起点で、実測の最適値ではない。要求値と実効値を区別し、結果は diff と acceptance evidence で受理する。

## 現行の根拠

| 根拠 | 確認内容 | この repo の判断 |
| --- | --- | --- |
| [When to fold subagents into your main agent loop](https://claude.com/resources/articles/building-agents-when-to-fold-subagents-into-your-main-agent-loop)（2026-10-22） | skill と tool を持つ単一 agent は、多くの場合 subagent 構成と同等以上の品質を低い cost と latency で出す。subagent が残る条件は、context 肥大による測定可能な劣化、fresh context での並列作業、tool 選択や指示の衝突。互いの出力に連鎖する、同じ data を触る、一緒に呼ばれる specialist は統合する | main 1 体を既定にし、委任は Delegation Value Test を通った時だけにする |
| [Building multi-agent systems](https://claude.com/blog/building-multi-agent-systems-when-and-how-to-use-them) | multi-agent は同じ task で 3〜10 倍の token を使う。問題の種類ではなく context で分ける。feature を扱う agent がその test も扱う。verification は context の受け渡しが少なく分けやすい | 工程での分割を禁止する。独立 review は risk 表に残す |
| [Prompting Claude Opus 5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5) | 数回の tool call で終わる作業や、自分の作業の検証・再確認に subagent を使わない。1 体で足りるなら 1 体。明示的な検証指示は over-verification を招く | 自己確認の委任を禁止する（contract の `self_check_delegation: none`）。短い check は main が実行する |
| [Claude prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices) | 最新 model は指示なしで subagent を起動し、直接の grep で足りる場面でも起動し得る。抑制例は「単純な task、順番に依存する作業、1 ファイル編集、context を維持する作業は直接やる」 | Claude Code では委任を促す文言を書かず、main が直接やる条件を明記する |
| [Prompting Claude Opus 5.5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5-5) | 既定 effort は `medium` で、Opus 5 の `high` と同等以上。code review は Opus 5 より多くの bug を少ない誤検知で見つける。「think carefully」系の指示は削除を推奨 | reviewer は Opus 5.5 `medium`。推論の代替指示を skill に書かない |
| [Claude models overview](https://platform.claude.com/docs/en/about-claude/models/overview) / [Claude effort](https://platform.claude.com/docs/en/build-with-claude/effort) | Sonnet 5.5 は既定 `high`、明確な agentic coding は `medium`、難しい・長い task は `high`。Haiku 5.5 は既定 `medium`。Fable 5.1 は既定 `high`。`xhigh` / `max` は測定できる品質差がある時。effort は厳密な token budget ではない | worker は Sonnet 5.5 `medium`、軽量 worker は Haiku 5.5。一律の最大化や同名 level の model 間比較をしない |
| [Fable 5.1 prompting](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5-1#consider-all-effort-levels) | low の task cost と品質が Opus / Sonnet に競争力を持つ場合がある。低 effort では検索を減らす傾向がある | Fable 5.1 の低 effort を通常実装の候補に残す。常に安いとは扱わない |
| [Claude Code subagents](https://code.claude.com/docs/en/sub-agents) | 計画・実装・test が context を共有する時、素早い局所変更、latency が重要な時は main で行う。fork は親の context と model を引き継ぎ、fork mode は既定で有効。subagent は既定で background。AskUserQuestion はどの subagent も使えない。fork でない subagent は invocation で `effort` を指定でき、`CLAUDE_CODE_EFFORT_LEVEL` が優先する。深さ・同時数は環境変数で制限できる | 独立 review に fork を使わない。ユーザー判断が要る作業は main で扱う。上限設定はユーザーに委ねる |
| [Claude Code artifacts](https://code.claude.com/docs/en/artifacts) | artifact は組み込み design skill で配色・タイポグラフィ・レイアウトを決め、repo の design system を優先する。既定は非公開で、同じ URL に version を重ねる。API key、Bedrock / Vertex / Foundry、ZDR、`-p` / Agent SDK / GitHub Action では publish できない。人に読ませ編集させる文書は Claude Docs connector が受け持つ | plan を Markdown の artifact にし、概要を先頭に置く（Markdown は skill が指示した時だけ publish でき、Mermaid を描画する）。publish できない環境は local file にする |
| [Claude Code model config](https://code.claude.com/docs/en/model-config) | version、provider alias、環境変数、allowlist、thinking 設定が実効値に影響する | frontmatter や指定だけで選択成功としない。確認できない値は `unverified` とする |
| [Codex models](https://learn.chatgpt.com/docs/models) | Astra は長い複合 workflow、Sol は難しい coding や判断、Luna は良い結果が明確な定型作業。既定 effort は client の既定から始める。`ultra` は subagents による並列化で、多くの task には不要 | 書き込みの有無だけで effort を決めない。`ultra` を失敗時の次の effort にしない |
| [GPT-6.1 Sol](https://developers.openai.com/api/docs/models/gpt-6.1-sol) | `gpt-6.1-sol` は Astra に近い性能を低い cost で出す。GPT-6 Sol は前世代。API 既定は `medium` で `none` 非対応。Enterprise / Edu は admin が有効化するまで使えない | Codex の通常 worker と main を GPT-6.1 Sol にし、GPT-6 Sol → GPT-5.6 の順で fallback する |
| [OpenAI latest model guide](https://developers.openai.com/api/docs/guides/latest-model?model=gpt-6-astra) | Astra は複数評価で出力 token と推定 task cost が下がる場合がある | Astra の低 effort を最難関作業の候補に残す |
| [Codex subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents) | ユーザー、`AGENTS.md`、skill が求めた時に subagent を起動する。read-heavy な並列を推奨し、write-heavy な並列は衝突しやすい。worker ごとに model / effort を設定でき、継承も正式な経路。custom agent file の明示値が優先する。`agents.enabled` は既定 true、同時数は `agents.max_concurrent_threads_per_session` | skill が起動を許可するのは Delegation Value Test を通った作業だけ。明示・definition・継承と実効値を区別する。上限設定はユーザーに委ねる |

「GPT-Sol 6.1」という名称は公式資料にない。公式名は GPT-6.1 Sol。

OpenAI の資料に「coding は単一 agent を既定にする」と明言した箇所は見つからなかった。write-heavy な並列への注意と「多くの task に Ultra は不要」は同じ方向を示す。

## 採用しない指示

- 「全 coding worker を `xhigh`」: task 別の effort 推奨と合わず、必要性の evidence がない。
- 「毎回 override し、継承は選択失敗とする」: 適切な既存設定を捨て、fork の context 引き渡しを増やす。
- 「実装・test・確認を別 agent に分ける」: 同じ context を複製し、token と統合の手間が増える。
- 「自分の作業を subagent にもう一度確認させる」: over-verification を招き、独立 review の代わりにもならない。
- 「Opus 5 時代の `high` 設定を Opus 5.5 に持ち込む」: Opus 5.5 は `medium` で同等以上の品質を出す。
- 「think carefully / step by step と書く」: 推論量は effort で調整する。
- 「Fable low は常に安い」: task 全体の cost、検索不足、再試行、host の適用制限を無視する。
- 「API / SDK で指定できる parameter を通常の tool 呼び出しにも渡す」: interface が異なる。現在の tool schema を優先する。
- 「profile を使ったので model と effort は保証済み」: override、provider、allowlist で変わる。
- 「高 effort reviewer がないので編集用 worker を流用する」: review の権限境界を崩す。

## 検証の範囲と限界

- 確認したのは構造 validation、lint、hook test、Claude strict validation と inventory。
- installed session での behavior smoke は未実施。
- model 間の性能・時間・task 全体の費用比較は未実施。
- 全 provider の alias 解決と全 account の model 利用可否は未確認。
- 資料の更新が揃わない場合は、能力の推奨は最新の model page を、指定方法は該当 host の docs と実際の tool schema を優先する。
