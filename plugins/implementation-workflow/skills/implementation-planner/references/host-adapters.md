# Host Adapters

この plugin は Codex / Claude Code 共通の Agent Skills として書く。

共通:

- `SKILL.md` と `references/` を正本にする。
- 日本語を既定にする。
- host 固有の tool 名は必要な場合だけ書く。
- `/goal` の使い方（Plan lane は計画完成と review closure まで、Execute handoff は短い draft）は `output-contracts.md` の Goal に従う。

## Decision Interview (AskUser) の host 差分

`ask-user.md` の通過テスト・checkpoint・質問フォーマットは host 共通。tool だけが異なる。

| Host | Tool | 制約 |
| --- | --- | --- |
| Claude Code | AskUserQuestion | 1 呼び出し最大 4 問、各 2-4 択 + Other(自動付与)、multiSelect 可 |
| Codex | request_user_input | 1 呼び出し 1-3 問、各 2-3 択 + Other(`is_other`)+ secret 入力。ブロッキング(応答待ち)になるのは Plan Mode のみで、Default / Code / Exec mode では unavailable エラーになる。root thread 専用で subagent からは呼べない(2026-08 時点の openai/codex 実装) |

共通:

- checkpoint 1 回は原則 1 回の質問バッチ（1 呼び出しまたは 1 メッセージ）に収める。
- tool が使えない場合（mode 制約、subagent 実行、tool エラーを含む）は、同じ契約（推奨案を先頭、各案の tradeoff、未回答時のデフォルト挙動）を番号付き選択肢のテキスト質問で再現し、回答を待ってから続行する。
- planner が subagent として動いている場合はユーザーへ直接質問できない。質問 block を最終出力として親エージェントへ返し、自分では待たない。
- Codex では mode を自己判定しない。まず `request_user_input` を呼び、unavailable エラーならテキスト質問へフォールバックする。

## abstract-plan.html の共有チャネル

正本は repo の `docs/implementation/abstract-plan.html`。運用ルールは `artifact-lifecycle.md` の Human-facing Sharing に従う。

| Host | 経路 | 既定 | 主な制約 |
| --- | --- | --- | --- |
| Claude Code | artifact | Artifact tool で作り、非公開で publish し、URL を handoff に記録 | 共有範囲の拡大は明示指示がある時だけ。組織内限定の共有は Team / Enterprise、Pro / Max は public link のみ |
| Codex | Sites | file を渡し、継続参照される plan なら共有を提案 | 公開範囲の選択が要る hosting なので agent からは publish しない |

- 顧客の設計や非公開の architecture を含むページは、組織内に限定できない環境では共有しない。作成者だけが見る非公開 publish は問題ない。
- 次の環境では artifact を publish できない。file だけで完結させる: 組織 policy（Zero Data Retention、CMEK、HIPAA）、Bedrock / Vertex / Foundry 経由、API key や gateway token のセッション、`-p` / Agent SDK / GitHub Action での実行、組織や設定で artifact が無効な時。
- ユーザーが計画を「チームで読んで編集する文書」として求め、Claude Docs connector が接続されている時は、`abstract-plan.html` の代わりに Claude Docs で作ってよい。repo の active plan は変えない。

Codex:

- `.codex-plugin/plugin.json` は Codex 配布用。
- marketplace 提示用の `interface` ブロック（`displayName` / `shortDescription` / `defaultPrompt` / `brandColor` 等）は Codex 側だけに置く。Codex は `interface` を推奨フィールドとして扱う。
- Codex 固有の用語、app browser、tool、MCP は Codex 専用として分けて書く。

Claude Code:

- `.claude-plugin/plugin.json` は Claude Code 配布用。
- Claude Code に `interface` 概念はない。提示メタは top-level の `displayName` / `keywords` で表し、`interface` ブロックは入れない。Claude は未知 top-level フィールドを無視するが、`claude plugin validate --strict`（release smoke で使用）が警告にするため。
- 2 manifest の version は常に揃える。`interface`（Codex）と `displayName` + `keywords`（Claude）の差は、各 host のスキーマ差による意図的な host 固有差分。
- thin slash command alias は配布しない。入口を増やさず、skill の自然文 trigger と description を整える。
- Claude Code 固有の namespace は Claude 専用として分けて書く。
