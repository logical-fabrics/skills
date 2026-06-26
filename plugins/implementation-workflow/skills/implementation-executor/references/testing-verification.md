# Testing Verification

基本:

- 近いテストから実行する。
- typecheck、lint、unit、integration、E2E、build のうち関係するものを選ぶ。
- 失敗した verification は、原因、対応、残リスクを記録する。
- mock-only の成功を本番導線の成功として扱わない。

UI:

- Web UI は主要ハッピーパスを実ブラウザで通す。
- desktop / mobile screenshot を確認する。
- browser back、reload、direct URL、URL share を確認する。
- loading、empty、error、success、disabled、permission を確認する。
- 日本語の不自然な改行、文字切れ、重なり、ボタン内テキストの窮屈さを見る。

Playwright:

- web-first assertion を使う。
- `getByRole`、`getByLabel`、`getByText` などユーザー視点 locator を優先する。
- trace、screenshot、video は失敗分析に使えるようにする。

