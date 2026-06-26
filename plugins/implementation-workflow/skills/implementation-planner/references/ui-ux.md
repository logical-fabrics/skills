# UI / UX

UI/UX は最上位価値。

基本:

- 初見ユーザー、日常利用ユーザー、一般知識ユーザーの視点を入れる。
- UI は特段指示がない限り日本語。
- モバイル / デスクトップ両対応。
- loading、skeleton、empty、error、success、disabled、permission、long-running progress を設計する。
- 内部都合、実装用語、専門用語を露出しない。
- 情報量は多すぎても少なすぎても UX を損なう。大画面で余白を広げすぎない。

Component and copy audit:

- すべての component、label、button、heading、helper text、badge、icon、chart、empty message、toast、tooltip について「ユーザーにとって何の役に立つか」を確認する。
- なくしてもユーザーの理解、判断、操作、安心、進捗把握、エラー回復に影響がない要素は削除する。
- 意味がある要素でも、初見ユーザーが理解できず、行動や判断に役立たない表現なら書き換える。
- ユーザーが受け取ってもプラスにならない説明、装飾、重複情報、内部事情、曖昧な励まし、機能説明のためだけの文言は削除する。
- 情報を削りすぎて、次に何をすればよいか、現在どういう状態か、何が起きたか、どう回復すればよいかが分からない状態にしない。
- 主要画面では「この画面でユーザーが判断すること」「必要な情報」「不要な情報」「不足している情報」を明示してから設計する。

Visual design:

- 既存 design system を優先する。
- 未確定または greenfield では Tailwind CSS を第一候補にする。
- アイコン、グラフ、表、Mermaid、図表は、理解、比較、操作、状態把握、進捗把握に効く場合に積極的に使う。
- 視覚要素を装飾だけで追加しない。

Verification:

- Web UI はハッピーパスを実ブラウザで操作する。
- 画面上の主要 component と文言を一つずつ見て、存在理由、理解可能性、ユーザー価値、削除可否を確認する。
- screenshot で desktop / mobile、長い日本語、狭いコンテナを確認する。
- 不自然な改行、単語分断、助詞だけの行、句読点だけの行、文字切れ、重なり、ボタン内テキストの窮屈さを見る。
- URL と画面状態を合わせる。browser back、reload、direct URL、URL share を確認する。
- React の URL query state は、既存方針がなければ `nuqs` を優先候補にする。
