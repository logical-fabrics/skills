# Testing Verification

基本:

- 近いテストから実行する。
- typecheck、lint、unit、integration、E2E、build のうち関係するものを選ぶ。
- Biome などの高速な format / lint は編集後または completion 前の近い quality gate として優先して走らせる。
- Knip などの dependency / unused exports / unused files 解析は、package / exports / entrypoint / config / build graph を触ったとき、または複数ファイル slice の handoff 前に走らせる。every-edit hook にしてノイズが増える場合は CI / pre-handoff gate に寄せる。
- 失敗した verification は、原因、対応、残リスクを記録する。
- mock-only の成功を本番導線の成功として扱わない。

UI:

- Web UI は主要ハッピーパスを実ブラウザで通す。
- desktop / mobile screenshot を確認する。
- browser back、reload、direct URL、URL share を確認する。
- loading、empty、error、success、disabled、permission を確認する。
- 日本語の不自然な改行、文字切れ、重なり、ボタン内テキストの窮屈さを見る。
- `ui-implementation.md` の Completion QA を通す。UI の良し悪し基準は planner `ui-ux.md` を参照する。
- 判断材料と CTA、desktop の視線移動、mobile の tap target、操作後の結果 copy、内部用語露出、説明量の risk 適合を screenshot と実操作で見る。
- 操作後に対象、状態、次アクションが変わって見えるかを確認する。キュー型 UI では、一覧から外れる、次対象へ進む、完了状態になる、戻り先が分かる、undo できることを確認する。

UI verification evidence:

- Completion report には、確認した route / viewport / browser or tool / screenshot or trace path / 確認した state / 未確認 state / 残リスクを残す。
- screenshot や trace がない場合は、なぜ残せないかと、代わりに何を確認したかを書く。

Playwright:

- web-first assertion を使う。
- `getByRole`、`getByLabel`、`getByText` などユーザー視点 locator を優先する。
- trace、screenshot、video は失敗分析に使えるようにする。
