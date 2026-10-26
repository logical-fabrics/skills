# Testing Verification

基本:

- 近いテストから実行する。typecheck、lint、unit、integration、E2E、build から関係するものを選ぶ。
- verification は changed behavior、touched surface、失敗時の影響に比例させる。実行できる check をすべて回すことを品質とみなさない。
- repo が明示する必須 gate、ユーザー指定の gate、accepted plan の completion gate を優先する。それ以外は下の検証レベルから最小の十分な組み合わせを選ぶ。
- Biome などの高速な format / lint は、編集後または completion 前の近い quality gate として優先して走らせる。
- Knip などの dependency / unused exports / unused files 解析は、package / exports / entrypoint / config / build graph を触った時か、複数ファイル slice の handoff 前に走らせる。every-edit hook でノイズが増えるなら CI / pre-handoff gate に寄せる。
- 失敗した verification は原因、対応、残リスクを記録する。
- mock-only の成功を本番導線の成功として扱わない。
- CLI やツールの成功メッセージ（自己申告の "Pushed N files." 等）だけを成功の根拠にしない。生成物の確認、個別再実行、実接続などで裏取りする。
- platform runtime / bindings、標準 `dev` command、またはそれに依存する feature を変えたら、API、assets、database、storage、media、AI、queue など今回関係する実際の binding contract を通す。無関係な局所変更では要求しない。
- frontend と backend/runtime の dev server 分離、proxy port、local-only binding は production 形と異なる verification として扱う。その経路を変更・評価したら限界を report に残し、統合 dev / live binding の確認を別 gate にする。
- 変更した feature が remote binding / 実接続でしか動かない外部 service に依存するなら、その接続確認なしに feature-ready と報告しない。外部 service に触れない変更に実接続を足さない。

検証レベル:

- Level 0 — docs、comment、非実行 metadata のみ: diff、リンク、構造 validation。runtime test や E2E は足さない。
- Level 1 — 局所的で低リスクな code、copy、isolated style: 対象 lint / typecheck / unit。見た目が変わる場合だけ affected route の targeted browser smoke。full E2E は実行しない。
- Level 2 — component interaction、layout、responsive、client state: affected route と changed state を browser で確認する。desktop / mobile の両方は breakpoint、responsive layout、touch interaction の変更時だけ必須。
- Level 3 — route / query、back / reload、auth / permission、persistence、frontend-backend 境界、重要導線: changed flow の targeted E2E か同等の実操作。関係する state と viewport だけを選ぶ。
- Level 4 — shared routing/runtime、複数の重要導線、migration、billing、破壊的操作、release candidate、または repo / user が full suite を要求: relevant full E2E / integration gate を closure 前に実行する。

用語:

- `targeted browser smoke`: affected route / state を一度通し、表示、主要操作、console を局所確認する。自動化済み spec がなくてもよい。
- `targeted E2E`: changed critical flow に絞った spec、project、grep、test filter を実行する。
- `full E2E`: repo の E2E suite 全体または release gate。すべての UI 変更の default にしない。
- browser tool や Playwright が使えるという理由だけで level を上げない。

調査規律:

- フレームワーク / ライブラリのバグと断定する前に、公式 docs + Context7 + web で裏取りする。
- 外部ライブラリ連携の実装・デバッグは、まず公式 CLI が生成するリファレンス実装や公式 docs の推奨形を確認する。内部ソースの深掘りや workaround は最終手段にする。
- `command not found` でも即「未インストール」と断定せず、PATH や既存のセットアップ手順を確認する。

CI 待ち:

- `sleep N && <status 確認>` のようなポーリングをしない。`gh run watch` 等の CI ツールの watch 系コマンドで待つ。

UI:

- Web UI は affected route の changed behavior を実ブラウザか既存の targeted E2E で確認する。無関係な主要導線まで毎回通さない。
- screenshot は視覚判断が必要な変更に使う。desktop / mobile の両方は responsive behavior、breakpoint、touch target、長い文言、狭い container に影響する場合だけ確認する。
- route / query、navigation、work state を変えたら、関係する browser back / forward、reload、direct URL、URL share、login 後復帰を選んで確認する。copy や isolated style の変更では要求しない。
- route-state 不具合の severity と scope の扱いは `ui-implementation.md` の During Implementation に従う。
- 認証、権限、onboarding、tenant selection の gate は、その gate か復帰導線を変えた場合に targeted E2E で確認する。
- loading、empty、error、success、disabled、permission は、変更した state か regression risk がある state だけ確認する。
- 日本語の不自然な改行、文字切れ、重なり、ボタン内テキストの窮屈さを見る。
- `ui-implementation.md` の Completion QA のうち touched surface に関係する項目を通す。UI の良し悪しの基準は planner の `ui-ux.md`。
- 判断材料と CTA、視線移動、tap target、操作後の結果 copy、内部用語露出、説明量は、今回変更した要素と viewport に絞って見る。

UI verification evidence:

- browser verification を実行したら、Completion report に route / viewport / browser or tool / screenshot or trace path（残した場合）/ 確認した state / 未確認 state / 残リスクを書く。
- screenshot や trace は、視覚差分、失敗分析、handoff に価値がある場合だけ保存する。保存しなかった弁明は不要。

再検証:

- review round 中の修正後は、finding と verification delta に最も近い check を再実行する。reviewer の再実行と full E2E suite の再実行を同義にしない。
- selected full E2E / release gate は原則 closure 前に一度実行する。その後の修正が対象導線、shared fixture、runtime、test setup に影響した場合だけ再実行する。
- full suite の一部が失敗したら、failing spec を targeted に直して確認し、最後に必要な closure gate を再実行する。

Playwright を使う場合は、失敗分析に使えるよう trace を残す設定にする。
