# UI Implementation

必ず確認:

- 既存 design system を優先する。
- 未確定なら Tailwind CSS を第一候補にする。
- 日本語 UI、mobile / desktop、loading / empty / error / success / disabled / permission。
- 内部用語を露出しない。
- AI で入力負荷、言語化負荷、認知負荷を減らせるか。

Component / copy QA:

- 画面上の component、文言、アイコン、グラフ、表、状態表示を一つずつ確認する。
- 各要素について、ユーザーの理解、判断、操作、安心、進捗把握、エラー回復のどれに効いているかを説明できる状態にする。
- 説明できない要素、なくしても UX 影響がない要素、重複している要素は削除する。
- 役割はあるが分かりにくい文言は、ユーザーの言葉に置き換える。
- 情報を削った結果、次の操作、現在状態、完了条件、失敗理由、回復方法が分からなくならないか確認する。
- empty / error / permission / disabled では、ユーザーが次に取れる行動を示す。行動できない場合は理由を簡潔に示す。

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
