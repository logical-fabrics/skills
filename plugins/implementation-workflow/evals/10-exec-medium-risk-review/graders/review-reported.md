---
type: llm
focus: last_message
---
この最終応答について、以下をすべて満たすか判定してください。

- 実装者とは別の context で行った独立 review（別の reviewer や subagent による review）の結果を報告している。findings があればその内容と対応、なければその旨を述べている。実装者自身の見直しだけを「review」と呼んでいる場合は不合格。
- 負の金額を 0 方向に切り捨てる扱いに触れている（`Math.trunc` という名前を出しているかは問わない）。
- test などの検証を実行した結果を報告している。
