# Host Adapters

この file は host 固有の機構差分だけを扱う。model / effort の選び方は `model-routing.md` を canonical policy とし、ここでは再掲しない。

Codex / Claude Code 共通:

- `SKILL.md` と `references/` を正本として読む。
- host 固有 tool 名は必要な場合だけ使う。
- 日本語を既定にする。
- 長時間・複数 slice・検証ループを前提にする実行では `/goal` を使う。目的、成功条件、制約、検証条件に絞り、詳細は active plan に置く。
- 計画が未確定、軽微な修正、通常 audit、ユーザー判断待ちでは `/goal` を作らない。
- 委任する場合の既定形は flat な main → leaf workers。host の concurrency / depth cap を優先し、plugin 独自の固定 agent 数で上書きしない。
- host-native な自動 orchestration と plugin の manual fan-out を同じ workstream に重ねない。

Codex:

- Codex app browser、MCP、tool は Codex 固有として扱う。
- Codex plugin manifest は `.codex-plugin/plugin.json`。
- applicable な `AGENTS.md` / skill instruction は delegation を要求できる。executor 自身は main context の温存を目的に Delegation Value Test を行い、context benefit が overhead を有意に上回る場合だけ worker を起動する。小さく coherent で context がすでに揃った work は main が直接実装できる。
- custom agent file は `model` / `model_reasoning_effort`。解決は各項目について spawn 指定 → `[agents]` default → parent、その後に選択した custom agent file の明示値が優先する。spawn / default が model だけを選ぶ場合はその model の既定 effort、custom file が model だけを上書きする場合は先に解決した effort が残るため、互換性を確認する。
- spawn の field 名・fork 制約は現在の tool schema を正とする。`collaboration.spawn_agent` が `model` / `reasoning_effort` / `fork_turns` を公開する host では、full-history fork に override を渡せない。別 pair が必要なら `fork_turns: "none"` または bounded な recent-turn count に必要 context をコピーする。full history と適切な継承 pair を選ぶことも許可する。この制約を全 Codex interface に一般化しない。
- pair が選択不能なら同じ role を満たす fallback を選び、差異を返す。要求値、definition、継承、確認できた実効値を区別する。API catalog、CLI bundled catalog、現在の app tool の対応値は同じとは限らない。
- Astra / GPT-5.6 の availability は rollout、client、sign-in、plan / workspace により異なる。現在の host で選択可能な model を使い、選択不能な model ID は要求しない。
- 公開 API evaluation に `max` があっても、Codex で選択できなければ routing 候補にしない。`ultra` は自動 subagents を使う multi-agent orchestration であり、単独 agent の `max` 相当として扱わない。`ultra` を選んだ workstream では manual subagent fan-out を追加せず、host が管理する depth / concurrency cap を尊重する。
- manual delegation は flat に保つ。active host / workspace / repo の concurrency、depth、rate、workflow size settings を正とし、plugin 側で固定値を仮定しない。
- subagents は親の sandbox / approval 制約を継承する。新しい承認を表示できない非対話実行では、その承認が必要な操作は失敗し得る。model の変更で権限不足を回避しない。

Claude Code:

- Fable 5.1 は Claude Code v2.1.255 以降が必要。`fable` alias は通常 Fable 5.1 に解決するが、`ANTHROPIC_DEFAULT_FABLE_MODEL` override と provider の ID を確認する。project / managed settings に固定した Fable 5 が自動更新されるとは仮定しない。
- Fable 5.1 は adaptive thinking が常時有効で、30-day retention が適用される。Anthropic の明示許可なしでは ZDR 対象外。組織 policy と衝突する場合は、許可された Opus 等の候補を使う。低 effort でもこの条件は変わらない。
- thin slash command alias は配布しない。skill の自然文 trigger と description を入口にする。
- plugin skill は namespace が付く前提で扱う。
- Claude plugin manifest は `.claude-plugin/plugin.json`。
- 通常の subagent は main が turn ごとに委任する。dynamic workflow は script が多数の subagent を orchestrate し、`ultracode` は `xhigh` effort と自動 workflow orchestration を組み合わせる。3 つを同義に扱わない。
- `ultracode` / dynamic workflow を選んだ workstream では、別の manual fan-out を重ねない。大量の独立 item、codebase-wide audit / migration、反復可能な orchestration に限って使う。通常 slice で Delegation Value Test を通った場合は flat な manual delegation に保つ。
- workflow runtime の cap と project の size guideline を尊重する。plugin 側から固定の agent 数や深さを要求しない。
- bundled definitions は `implementation-worker` が `sonnet` / `high`、`adversarial-reviewer` が `opus` / `medium`、`verification-worker` が `haiku` / effort なし。alias は provider と環境変数で世代が変わり、必ず Claude 5 になるとは限らない。Haiku 4.5 は effort 非対応。
- 通常 Agent invocation は公開 schema にある `model` override だけを使い、`effort` を追加しない。公式 TypeScript `AgentInput` の列挙は `sonnet` / `opus` / `haiku` なので、definition が受け付ける `fable` / full ID も通常 invocation で使えると推測しない。
- v2.1.251 以降の model 優先順位は invocation → frontmatter → `CLAUDE_CODE_SUBAGENT_MODEL` → main。v2.1.257 以降の `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` は通常の override を制限する。fork は main model を使う。allowlist による代替もあるため、可能なら `/tasks` の実行 model と warning を確認する。
- frontmatter effort は session より優先するが、`CLAUDE_CODE_EFFORT_LEVEL` より優先しない。未対応 level、組織上限、thinking 設定でも要求値と実効値が違い得る。Opus 5 の thinking off では `xhigh` / `max` 要求が `high` へ調整されるため、frontmatter だけを根拠にしない。
- SDK `AgentDefinition` や起動時の `--agents` JSON は `model` と `effort` を持てるが、通常 Agent 呼び出しとは別の設定面である。既存の許可された runtime がその定義を利用できる時だけ使う。
- 必要な pair がなければ、既存の適切な read-only definition / 継承設定を選ぶか、selection-unavailable を返す。高 effort review のために write-enabled worker を流用しない。必要な独立 review を満たせない場合は完了扱いにせず親へ返す。

## API harness を移行する場合だけ

この plugin は API client を実装しない。以下は独自 harness を移行する時の確認点であり、Codex / Claude Code の通常 tool invocation に API parameter を追加する指示ではない。

- Astra: API の `reasoning.effort` は `low` / `medium` / `high` / `xhigh` / `max`。`none`、独自 `temperature` / `top_p`、`logprobs` を引き継がない。tool use は Responses API を使う。
- Astra: async tool calling、mid-turn steering、cache を保つ `configuration_update` は API の機構。host が公開する interface を確認してから使い、通常の worker spawn と混同しない。
- Fable 5.1: forced `tool_choice` の `any` / `tool` は 400。`auto` と明示指示へ移し、必要なら対応環境で strict tools / structured outputs を使う。tool が実際に呼ばれたかは結果で確認する。
- Fable 5.1: thinking blocks は変更せず返し、history は append-only に保つ。過去 turn の編集や client-side compaction は公式 migration guide の手順を使う。Opus 5 / Fable 5 への切替では 5.1 の thinking が引き継がれず、再計画の cost / latency が生じ得る。
- Fable 5.1: per-message effort は cache を保てる beta 機能であり、通常 Agent tool の effort override ではない。API UI で進捗を表示する場合は `thinking.display: "updates"`（beta）または `"summarized"` の受信・描画も確認する。

確認日: 2026-09-05。根拠: [Codex subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents)、[Claude Code subagents](https://code.claude.com/docs/en/sub-agents)、[Agent SDK TypeScript](https://code.claude.com/docs/en/agent-sdk/typescript)、[Astra guide](https://developers.openai.com/api/docs/guides/latest-model?model=gpt-6-astra)、[Astra model](https://developers.openai.com/api/docs/models/gpt-6-astra)、[Fable 5.1 migration](https://platform.claude.com/docs/en/models/fable-5-1/migration-guide)、[Claude effort](https://platform.claude.com/docs/en/build-with-claude/effort)、[Claude Code model config](https://code.claude.com/docs/en/model-config)。
