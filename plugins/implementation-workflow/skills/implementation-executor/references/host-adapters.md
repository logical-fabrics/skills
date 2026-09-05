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
- custom agent config では `model` と `model_reasoning_effort` を使う。現在の worker spawn interface では `model` と `reasoning_effort` を渡す。明示した spawn values は `[agents]` defaults と parent settings より優先し、値を省略した時だけ inherit / default される。
- 明示的な model / reasoning override は full-history fork では使えない。`fork_turns: "none"` または bounded な recent-turn count を選び、assignment に必要な plan、scope、acceptance criteria、禁止操作、relevant evidence をコピーする。full history が不可欠なら inherited pair を `selection-unavailable` として報告し、明示選択済みとは扱わない。
- requested model / effort pair が current plan / workspace で選択不能なら、routing role を保つ選択可能な pair を選び、requested pair、chosen fallback、理由を handoff に残す。non-full-history fork を使える時に選択可能な pair を implicit fallback へ任せない。
- Astra / GPT-5.6 の availability は rollout、client、sign-in、plan / workspace により異なる。現在の host で選択可能な model を使い、選択不能な model ID は要求しない。
- 公開 API evaluation に `max` があっても、Codex で選択できなければ routing 候補にしない。`ultra` は自動 subagents を使う multi-agent orchestration であり、単独 agent の `max` 相当として扱わない。`ultra` を選んだ workstream では manual subagent fan-out を追加せず、host が管理する depth / concurrency cap を尊重する。
- manual delegation は flat に保つ。active host / workspace / repo の concurrency、depth、rate、workflow size settings を正とし、plugin 側で固定値を仮定しない。

Claude Code:

- Fable 5.1 は Claude Code v2.1.255 以降が必要。`fable` alias は通常 Fable 5.1 に解決するが、`ANTHROPIC_DEFAULT_FABLE_MODEL` override と provider の ID を確認する。project / managed settings に固定した Fable 5 が自動更新されるとは仮定しない。
- thin slash command alias は配布しない。skill の自然文 trigger と description を入口にする。
- plugin skill は namespace が付く前提で扱う。
- Claude plugin manifest は `.claude-plugin/plugin.json`。
- 通常の subagent は main が turn ごとに委任する。dynamic workflow は script が多数の subagent を orchestrate し、`ultracode` は `xhigh` effort と自動 workflow orchestration を組み合わせる。3 つを同義に扱わない。
- `ultracode` / dynamic workflow を選んだ workstream では、別の manual fan-out を重ねない。大量の独立 item、codebase-wide audit / migration、反復可能な orchestration に限って使う。通常 slice で Delegation Value Test を通った場合は flat な manual delegation に保つ。
- workflow runtime の cap と project の size guideline を尊重する。plugin 側から固定の agent 数や深さを要求しない。
- plugin / custom agent definition の frontmatter は `model` と `effort` を持てる。bundled definitions は read-only `diagnostic` と accepted-slice `implementation` の両 mode を持つ `implementation-worker` が Sonnet / `high`、`adversarial-reviewer` が Opus / `medium`、`verification-worker` が Haiku で effort なしである。Haiku 4.5 は effort 非対応なので、agent definition に effort を書かず task の絞り込みで制御する。
- 通常の Agent invocation は model を invocation ごとに override でき、その override が definition の model より優先する。一方、通常の Agent tool は invocation ごとの effort parameter を公開していない。effort は definition frontmatter または session に残るため、通常 invocation で dynamic effort を設定したとは報告しない。
- Agent SDK または `--agents` の runtime `AgentDefinition` が使える時だけ、task shape に応じて model と effort の両方を動的に設定する。使えない時は、frontmatter effort が task に合う bundled definition を選び、互換性がある時だけ model override を使う。必要な effort の definition / session setting を選べない場合は、selection-unavailable と actual setting を handoff に残す。

## API harness を移行する場合だけ

この plugin は API client を実装しない。以下は独自 harness を移行する時の確認点であり、Codex / Claude Code の通常 tool invocation に API parameter を追加する指示ではない。

- Astra: API の `reasoning.effort` は `low` / `medium` / `high` / `xhigh` / `max`。`none`、独自 `temperature` / `top_p`、`logprobs` を引き継がない。tool use は Responses API を使う。
- Astra: async tool calling、mid-turn steering、cache を保つ `configuration_update` は API の機構。host が公開する interface を確認してから使い、通常の worker spawn と混同しない。
- Fable 5.1: forced `tool_choice` の `any` / `tool` は 400。`auto` と明示指示へ移し、必要なら対応環境で strict tools / structured outputs を使う。tool が実際に呼ばれたかは結果で確認する。
- Fable 5.1: thinking blocks は変更せず返し、history は append-only に保つ。過去 turn の編集や client-side compaction は公式 migration guide の手順を使う。Opus 5 / Fable 5 への切替では 5.1 の thinking が引き継がれず、再計画の cost / latency が生じ得る。
- Fable 5.1: per-message effort は cache を保てる beta 機能であり、通常 Agent tool の effort override ではない。API UI で進捗を表示する場合は `thinking.display: "updates"`（beta）または `"summarized"` の受信・描画も確認する。

確認日: 2026-09-05。根拠: [Astra guide](https://developers.openai.com/api/docs/guides/latest-model?model=gpt-6-astra)、[Astra model](https://developers.openai.com/api/docs/models/gpt-6-astra)、[Fable 5.1 migration](https://platform.claude.com/docs/en/models/fable-5-1/migration-guide)、[Claude effort](https://platform.claude.com/docs/en/build-with-claude/effort)、[Claude Code model config](https://code.claude.com/docs/en/model-config)。
