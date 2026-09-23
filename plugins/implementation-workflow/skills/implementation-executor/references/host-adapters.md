# Host Adapters

この file は host 固有の仕組みの違いだけを扱う。model / effort の選び方は `model-routing.md`、委任の判断は `review-and-parallelism.md` を正本にする。

Codex / Claude Code 共通:

- `SKILL.md` と `references/` を正本として読む。host 固有の tool 名は必要な場合だけ使う。
- 長時間・複数 slice・検証ループを前提にする実行では `/goal` を使う。goal には目的、成功条件、制約、検証条件だけを書き、詳細は active plan に置く。計画が未確定、軽微な修正、通常 audit、ユーザー判断待ちでは使わない。
- ユーザーの明示指示は skill の指示より優先する。skill の指示で止まる、確認を求める、作業を残す場合は、どの file のどの指示が理由かを示す。

Codex:

- manifest は `.codex-plugin/plugin.json`。app browser、MCP、Sites などは Codex 固有として扱う。
- `ultra` 以外では、ユーザー、`AGENTS.md`、skill が求めた時に subagent を起動する。委任してよい範囲は `review-and-parallelism.md` の Delegation Value Test で決める。risk 表が求める独立 review はこの test に関係なく起動してよい。`ultra` は host が subagents を自動で使うため、同じ workstream に manual fan-out を追加しない。
- custom agent は `.codex/agents/` または `~/.codex/agents/` の TOML で、`model` / `model_reasoning_effort` を持てる。各項目は spawn 時の指定 → `[agents]` default → 親の順に解決し、選んだ custom agent file の明示値がその後に優先する。custom agent が `model` だけを指定した場合に effort がどう決まるかは version で変わり得るため、必要な effort は明示する。
- spawn tool の field 名や fork の制約は現在の tool schema を正とする。full-history fork に model / effort の override を渡せない host では、別の pair が必要なら fork せず必要 context を assignment にコピーする。
- subagents は親の sandbox / approval 設定を継承する。承認を表示できない非対話実行では、承認が必要な操作は失敗し得る。model を変えて権限不足を回避しない。
- 選択できない model ID は要求しない。GPT-6 が使えない環境では `model-routing.md` の旧世代 fallback を使い、差異を報告する。

Claude Code:

- manifest は `.claude-plugin/plugin.json`。plugin skill は namespace 付きで扱う。thin slash command alias は配布せず、skill の自然文 trigger と description を入口にする。
- Opus 5.5 などは指示がなくても subagent を起動する。この plugin は委任を促す指示を足さず、Delegation Value Test の「main が直接やる」に当たる作業では起動しない。
- `plugins/implementation-workflow/agents/` の bundled agents は Claude Code 専用: `implementation-worker`（`sonnet` / `high`）、`adversarial-reviewer`（`opus` / `medium`）、`verification-worker`（`haiku`）。いずれも leaf で、Agent tool を持たない。
- fork（`subagent_type: "fork"`、skill の `context: fork`）は親の会話と model を引き継ぐ。探索の続きには向くが、独立 review には使わない。
- model の解決順は invocation の `model` → agent definition → `CLAUDE_CODE_SUBAGENT_MODEL` → main。effort は agent definition で設定し、通常の Agent 呼び出しに effort 引数を足さない。`CLAUDE_CODE_EFFORT_LEVEL` や組織の上限で実効値が変わり得るため、確認できない値は `unverified`（要求したが実効値を確認できない）とする。
- Workflow tool（`ultracode` を含む）は、ユーザーが multi-agent orchestration を明示した時だけ使う。使っている workstream では manual fan-out を重ねない。
- background subagent は AskUserQuestion などを使えない。ユーザー判断が要る作業は main で扱う。
- 必要な pair の agent がない場合は、既存の適切な read-only agent か継承設定を使うか、`selection-unavailable`（必要な pair を設定できない）として返す。高 effort の review のために書き込み可能な worker を流用しない。

## API harness を移行する場合だけ

この plugin は API client を実装しない。独自 harness を移行する時は、通常の tool 呼び出しに API parameter を持ち込まず、各 vendor の migration guide を確認する。

- Opus 5.5: `thinking: {"type": "disabled"}`、`budget_tokens`、forced `tool_choice`（`any` / `tool`）、sampling parameter、prefill は 400。effort で推論量を調整する。
- GPT-6: tool use は Responses API を使う。Astra は reasoning effort `none` 非対応。

確認日: 2026-09-24。根拠: [Codex subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents)、[Codex models](https://learn.chatgpt.com/docs/models)、[Claude Code subagents](https://code.claude.com/docs/en/sub-agents)、[Opus 5.5 migration](https://platform.claude.com/docs/en/models/opus-5-5/migration-guide)、[OpenAI latest model guide](https://developers.openai.com/api/docs/guides/latest-model)。
