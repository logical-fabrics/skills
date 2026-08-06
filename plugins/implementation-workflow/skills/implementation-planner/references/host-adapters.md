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

正本は repo の `docs/implementation/abstract-plan.html`。以下は publish できる環境でだけ使う追加経路で、file を置き換えない。publish は外部サービスへの送信なので既定行動にせず、ユーザーの依頼か明示的な合意がある場合だけ行う。

| Host | 経路 | 起動 | 主な制約 |
| --- | --- | --- | --- |
| Claude Code | artifact | skill から publish できる | publish 直後は作成者のみ。共有時、Pro / Max は public link しか選べず、組織内限定共有は Team / Enterprise（Enterprise は Owner が有効化） |
| Codex | app の Sites | 人間が ChatGPT app 側で起動する。agent の tool ではない | public beta。plan / region / workspace 設定に依存し、本番デプロイとして作られる |

共通の注意:

- artifact は publish しただけでは作成者しか見られない。危険なのは共有操作の方。Claude Pro / Max では共有手段が public link だけなので、顧客の設計、非公開の architecture、社外に出せない情報を含むページを共有しない。自分だけが見る用途の publish は差し支えない。
- 組織 policy（zero data retention、CMEK、HIPAA）、Bedrock / Vertex / Foundry 経由、API key や gateway token のセッション、CI 実行では artifact を publish できない。file だけで完結させる。
- Codex Sites は本番デプロイを作る。使い捨ての合意形成資料を毎回 site 化せず、継続的に参照される plan に限る。
- publish した場合は URL を active plan の `## Implementation Handoff` に記録する。次セッションが URL から更新できる。

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
