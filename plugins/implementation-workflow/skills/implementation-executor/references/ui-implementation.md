# UI Implementation

必ず確認:

- 既存 design system を優先する。
- 未確定なら Tailwind CSS を第一候補にする。
- 日本語 UI、mobile / desktop、loading / empty / error / success / disabled / permission。
- 内部用語を露出しない。
- AI で入力負荷、言語化負荷、認知負荷を減らせるか。

Visual QA:

- screenshot で desktop / mobile を確認する。
- 見出し、CTA、ボタン、カード、フォーム、ナビゲーション、表ラベルの改行を確認する。
- 不自然な単語分断、助詞だけの行、句読点だけの行、文字切れ、重なりを修正する。
- アイコン、グラフ、表、Mermaid は意味、単位、凡例、tooltip、モバイル表示を確認する。

Web routing:

- browser back、reload、direct URL、URL share で期待状態に戻ること。
- React query state は既存方針がなければ `nuqs` を優先候補にする。

Accessibility:

- keyboard 操作、focus、label、role、contrast、target size、form error を確認する。

