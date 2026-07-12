# Host Adapters

Codex / Claude Code 共通:

- `SKILL.md` と `references/` を正本として読む。
- host 固有 tool 名は必要な場合だけ使う。
- 日本語を既定にする。
- 長時間・複数 slice・検証ループを前提にする実行では `/goal` を使う。目的、成功条件、制約、検証条件に絞り、詳細は active plan に置く。
- 計画が未確定、軽微な修正、通常 audit、ユーザー判断待ちでは `/goal` を作らない。
- orchestration の既定形は flat な main → leaf workers。host の concurrency / depth cap を優先し、plugin 独自の固定 agent 数で上書きしない。
- host-native な自動 orchestration と plugin の manual fan-out を同じ workstream に重ねない。

Codex:

- Codex app browser、MCP、tool は Codex 固有として扱う。
- Codex plugin manifest は `.codex-plugin/plugin.json`。
- 外部 codex 呼び出し（codex rescue 等）では、prompt で使用モデルと effort を明示する。明示しないと backend が retired なモデルにフォールバックして失敗することがあるため。
- 2026-07-13 時点では、model 選択に迷う一般 main は GPT-5.6 Sol (`gpt-5.6-sol`; `gpt-5.6` alias も Sol) の `medium` から始める。明確な bounded coding worker は GPT-5.6 Luna (`gpt-5.6-luna`) の `xhigh`、長い context / 複雑 debugging を含む coding worker は GPT-5.6 Terra (`gpt-5.6-terra`) の `xhigh`、単独の高難度判断は Sol `xhigh` を使う。`low` / `medium` は決定的な verification に限定する。
- GPT-5.6 は Codex の対象 plan へ段階 rollout されている。旧 limited preview 前提を使わず、現在の plan / workspace で選択可能な model を使う。存在しない model ID を繰り返し要求しない。
- 公開 API evaluation に `max` があっても、Codex で選択できなければ routing 候補にしない。`ultra` は自動 subagents を使う multi-agent orchestration であり、単独 agent の `max` 相当として扱わない。`ultra` を選んだ workstream では manual subagent fan-out を追加せず、host が管理する depth / concurrency cap を尊重する。
- manual delegation を使う場合も、Codex の既定 cap（現在は `max_threads = 6`、`max_depth = 1`）を基準に flat 構成を保つ。repo / user 設定がより狭ければそちらを優先する。

Claude Code:

- thin slash command alias は配布しない。skill の自然文 trigger と description を入口にする。
- plugin skill は namespace が付く前提で扱う。
- Claude plugin manifest は `.claude-plugin/plugin.json`。
- 2026-07-10 時点では、通常の main / daily coding に Claude Sonnet 5 (`claude-sonnet-5`) の既定 `high`、単純 leaf task に Claude Haiku 4.5 (`claude-haiku-4-5`) を使う。Claude Fable 5 (`claude-fable-5`) は default にせず、単一の sitting を超える長時間作業、曖昧な investigation、outage debugging、architecture 判断へ明示的に上げる。
- 通常の subagent は main が turn ごとに委任する。dynamic workflow は script が多数の subagent を orchestrate し、`ultracode` は `xhigh` effort と自動 workflow orchestration を組み合わせる。3 つを同義に扱わない。
- `ultracode` / dynamic workflow を選んだ workstream では、別の manual fan-out を重ねない。大量の独立 item、codebase-wide audit / migration、反復可能な orchestration に限って使い、通常 slice は flat な manual delegation に保つ。
- workflow runtime の cap と project の size guideline を尊重する。plugin 側から固定の agent 数や深さを要求しない。
- Fable 5 は 30-day data retention が必要なため、zero-data-retention や組織 policy に反する context へ自動適用しない。
