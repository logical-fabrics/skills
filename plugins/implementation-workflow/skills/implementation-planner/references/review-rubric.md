# Review Rubric

## Severity

- P0: 安全に使えない。残っていれば停止。
- P1: 高確率で失敗、手戻り、UX 劣化、保守不能を起こす。修正または blocked。
- P2: 改善点。修正、受け入れ、延期のいずれかを記録する。

## Risk-based Reviewers

reviewer を subagent / worker に委任し model を選択できる場合は、`../../implementation-executor/references/model-routing.md` を canonical policy とする。通常 review は balanced tier、security、cross-slice architecture、収束しない P0/P1 の判断は high-complexity tier、定型確認だけなら fast tier を使う。

| Risk | 目安 | Review |
| --- | --- | --- |
| Low | docs、copy、限定設定、局所的で可逆な plan | implementation 観点で、実装手順と acceptance criteria が揃っているかを確認する。独立 reviewer は任意 |
| Medium | 通常の複数ファイル、共有ロジック、ユーザー可視 behavior、局所 API / state | implementation と独立 adversarial review を分け、変更領域に関係する reviewer を追加 |
| High | auth、billing、migration、data loss、security、production / infra、cross-slice architecture、広い UX / persistence | implementation、adversarial、必要な domain reviewer を分ける。高難度統合の model / effort は canonical routing の高難度 role と host の実効設定に従う |

reviewer role は agent 数と同義ではない。medium / high risk では独立 review を確保するが、関係のない role を形式的に全て起動しない。

- Implementation reviewer: 実装手順、scope、検証可能性。medium / high risk で使う。
- Adversarial reviewer: 隠れた失敗、矛盾、曖昧さ。medium / high risk で使う。
- UX reviewer: UI / user flow / copy / accessibility を変える場合、`ui-ux.md` の canonical rubric に従う。
- Simplicity reviewer: 新しい abstraction、基盤、state management、広い refactor を計画する場合。

Domain reviewers:

- Schema reviewer: DB schema / migration / validation。
- Security reviewer: auth、secret、permission、CI、external input。
- Delivery reviewer: CI/CD、staging、production、OGP、monitoring。
- AI reviewer: AI UX、AI Gateway、latency、cost、fallback。特に、ユーザーの入力、本人素材、ライブ生成、AI 生成結果などの主成果物を、別素材、seed、sample、mock、demo asset で置き換えて成功扱いしていないかを確認する。

## Stop Conditions

- accepted scope、touched surface、changed behavior に関する未解決 P0/P1 がゼロになるまで改善する。
- ユーザーが期待する成果物を別素材で代替して success / preview / published / sent / paid / deleted などの状態に進める設計は P1 以上とし、本人入力と切り離された seed / sample 用途へ分離するまで closure しない。
- scope 外の P0/P1 は隠さず、blocked または backlog として記録する。
- P2 は ledger に残す。
- closure には、risk 上必要な reviewer が確認済みであること、未解決 P0/P1 がないこと、実装手順・acceptance criteria・verification evidence・未確認範囲が揃っていることの全てが必要。
- finding 修正後は、その finding と変更した section に関係する reviewer だけを再実行する。無関係な role を全て再実行しない。
- 同じ原因で 2 回進展がない、evidence が相反する、または risk が上がった場合は model / role / scope を escalation する。checkpoint で扱える判断は `ask-user.md` に従いそこで解消し、`Next Action Contract` の Ask user は blocked(その場で安全に進められない判断)だけに使う。
- reviewer 間で P1 以上の判断が割れ、repo 慣習・一次情報で決着しない場合は、多数決や再試行で黙って上書きせず、`ask-user.md` の Divergence test 通過とみなす。Ownership / Materiality も満たす場合だけ checkpoint 行きの質問候補にし、満たさない場合は Decision Log に落とす。
- reviewer が新規 finding を出さなかったことだけでも、validation が通ったことだけでも closure にしない。model 品質を測る独自反復 fixture eval は要求しない。

## Review Round

1 round は次の 3 点を含む:

1. Findings list。
2. 各 finding の fix / accept / defer / blocked 判断。
3. 変更後の verification delta。

「レビューした」とだけ書いて終わらせない。「指摘なし」は、選択した reviewer 観点を実際に通した結果としてのみ書く。確認していない観点を省略して「問題なし」と書かず、未確認範囲として残す。
