# Host Adapters

この file は host 固有の機構差分だけを扱う。model / effort の選び方は `model-routing.md` を canonical policy とし、ここでは再掲しない。

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
- GPT-5.6 は Codex の対象 plan へ段階 rollout されている。旧 limited preview 前提を使わず、現在の plan / workspace で選択可能な model を使う。存在しない model ID を繰り返し要求しない。
- 公開 API evaluation に `max` があっても、Codex で選択できなければ routing 候補にしない。`ultra` は自動 subagents を使う multi-agent orchestration であり、単独 agent の `max` 相当として扱わない。`ultra` を選んだ workstream では manual subagent fan-out を追加せず、host が管理する depth / concurrency cap を尊重する。
- manual delegation を使う場合も、Codex の既定 cap（現在は `max_threads = 6`、`max_depth = 1`）を基準に flat 構成を保つ。repo / user 設定がより狭ければそちらを優先する。

Claude Code:

- thin slash command alias は配布しない。skill の自然文 trigger と description を入口にする。
- plugin skill は namespace が付く前提で扱う。
- Claude plugin manifest は `.claude-plugin/plugin.json`。
- 通常の subagent は main が turn ごとに委任する。dynamic workflow は script が多数の subagent を orchestrate し、`ultracode` は `xhigh` effort と自動 workflow orchestration を組み合わせる。3 つを同義に扱わない。
- `ultracode` / dynamic workflow を選んだ workstream では、別の manual fan-out を重ねない。大量の独立 item、codebase-wide audit / migration、反復可能な orchestration に限って使い、通常 slice は flat な manual delegation に保つ。
- workflow runtime の cap と project の size guideline を尊重する。plugin 側から固定の agent 数や深さを要求しない。
- Claude Code plugin agent の frontmatter で `effort` を指定できるのは、effort parameter に対応する model を選んだ場合だけ。Haiku 4.5 は非対応なので、agent 定義に effort を書かず task の絞り込みで制御する。
