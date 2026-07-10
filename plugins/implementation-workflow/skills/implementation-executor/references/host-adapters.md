# Host Adapters

Codex / Claude Code 共通:

- `SKILL.md` と `references/` を正本として読む。
- host 固有 tool 名は必要な場合だけ使う。
- 日本語を既定にする。
- 長時間・複数 slice・検証ループを前提にする実行では `/goal` を使う。目的、成功条件、制約、検証条件に絞り、詳細は active plan に置く。
- 計画が未確定、軽微な修正、通常 audit、ユーザー判断待ちでは `/goal` を作らない。

Codex:

- Codex app browser、MCP、tool は Codex 固有として扱う。
- Codex plugin manifest は `.codex-plugin/plugin.json`。
- 外部 codex 呼び出し（codex rescue 等）では、prompt で使用モデルと effort を明示する。明示しないと backend が retired なモデルにフォールバックして失敗することがあるため。
- 2026-07-10 時点の model mapping は、orchestrator / 高難度判断に GPT-5.6 Sol (`gpt-5.6-sol`)、通常 coding に GPT-5.6 Terra (`gpt-5.6-terra`)、単純 leaf task に GPT-5.6 Luna (`gpt-5.6-luna`)。`gpt-5.6` alias は Sol を指す。
- GPT-5.6 は limited preview なので、起動前に現在の workspace access と model list を確認する。利用不能時は `references/model-routing.md` の same-tier fallback を使い、存在しない model ID を繰り返し要求しない。
- `max` reasoning effort と `ultra` multi-agent mode を混同しない。`ultra` 使用時は built-in subagents と手動 fan-out の総数を合わせて cap する。

Claude Code:

- thin slash command alias は配布しない。skill の自然文 trigger と description を入口にする。
- plugin skill は namespace が付く前提で扱う。
- Claude plugin manifest は `.claude-plugin/plugin.json`。
- 2026-07-10 時点の model mapping は、orchestrator / 高難度判断に Claude Fable 5 (`claude-fable-5`)、通常 coding に Claude Sonnet 5 (`claude-sonnet-5`)、単純 leaf task に Claude Haiku 4.5 (`claude-haiku-4-5`)。
- Fable 5 は 30-day data retention が必要なため、zero-data-retention や組織 policy に反する context へ自動適用しない。
