# Host Adapters

この plugin は Codex / Claude Code 共通の Agent Skills として書く。

共通:

- `SKILL.md` と `references/` を正本にする。
- 日本語を既定にする。
- host 固有の tool 名は、必要な場合だけ明記する。
- 長時間・複数 slice・複数 review rounds を前提にする Plan lane では `/goal` を使ってよい。scope は計画完成と review closure に限定し、実装開始を含めない。
- 長時間・複数 slice・検証ループを前提にする Execute handoff では `/goal` 用の短い draft を残す。

## Decision Interview (AskUser) の host 差分

`ask-user.md` の通過テスト・checkpoint・質問フォーマットは host 共通。tool だけが異なる。

| Host | Tool | 制約 |
| --- | --- | --- |
| Claude Code | AskUserQuestion | 1 呼び出し最大 4 問、各 2-4 択 + Other(自動付与)、multiSelect 可 |
| Codex | request_user_input | 1 呼び出し 1-3 問、各 2-3 択 + Other(`is_other`)+ secret 入力。ブロッキング(応答待ち)になるのは Plan Mode のみで、Default / Code / Exec mode では unavailable エラーになる。root thread 専用で subagent からは呼べない(2026-08 時点の openai/codex 実装) |

共通:

- checkpoint 1 回は原則 1 回の質問バッチ(1 呼び出しまたは 1 メッセージ)に収める。
- tool が使えない場合(mode 制約、subagent 実行、tool エラーを含む)は、同じ契約(推奨案を先頭に置く、各案の tradeoff、未回答時のデフォルト挙動)を番号付き選択肢のテキスト質問で再現し、回答を待ってから続行する。
- planner 自身が subagent として動いている場合は、ユーザーへ直接質問できない。質問 block を最終出力として親エージェントへ返し、自分では待たない。
- Codex では mode を自己判定しない。まず `request_user_input` を呼び、unavailable エラーが返ったらテキスト質問へフォールバックする。

## abstract-plan.html の共有チャネル

正本は repo の `docs/implementation/abstract-plan.html`。運用ルールは `artifact-lifecycle.md` の Human-facing Sharing に従う。

| Host | 経路 | 既定 | 主な制約 |
| --- | --- | --- | --- |
| Claude Code | artifact | Artifact tool が使えれば非公開で publish し、URL を handoff に記録 | 共有範囲の拡大は明示指示がある時だけ。Pro / Max の共有は public link のみ、組織内限定共有は Team / Enterprise |
| Codex | app の Sites | file を渡し、継続参照される plan なら共有を提案 | 人間が app 側で起動する。本番デプロイとして作られる |

- 顧客の設計や非公開の architecture を含むページは、組織内に限定できない環境では共有しない。作成者だけが見る非公開 publish は問題ない。
- 組織 policy（zero data retention、CMEK、HIPAA）、Bedrock / Vertex / Foundry 経由、API key や gateway token のセッション、CI 実行では artifact を publish できない。file だけで完結させる。

Codex:

- `.codex-plugin/plugin.json` は Codex 配布用。
- marketplace 提示用の `interface` ブロック（`displayName` / `shortDescription` / `defaultPrompt` / `brandColor` 等）は Codex 側のみに置く。Codex は `interface` を推奨フィールドとして扱う。
- Codex 固有の用語、app browser、tool、MCP は Codex 専用として分けて書く。

Claude Code:

- `.claude-plugin/plugin.json` は Claude Code 配布用。
- Claude Code に `interface` 概念はない。提示メタは top-level の `displayName` / `keywords` で表し、`interface` ブロックは入れない。Claude は未知 top-level フィールドを無視するが `claude plugin validate --strict`（release smoke で使用）が警告にするため。
- 2 manifest の version は常に揃える。`interface`（Codex）と `displayName` + `keywords`（Claude）の差は、各 host のスキーマ差による意図的な host 固有差分。
- thin slash command alias は配布しない。入口を増やすより、skill の自然文 trigger と description を整える。
- Claude Code 固有の namespace は Claude 専用として分けて書く。
