# Decision Interview (AskUser)

計画作成では、人間が所有する判断を勝手に確定しない。質問の量は回数制限では制御せず、通過テストと checkpoint で制御する。

## 3 つの通過テスト

質問候補にするのは、次の 3 テストを全て通過した判断だけ:

1. Ownership test: その判断は人間のもの(product 方針、business、UX の方向性、コスト受容、リスク受容、rollout)か。repo と一次情報から導出できるエンジニアリング判断なら聞かない。
2. Divergence test: 有能なエンジニアまたは LLM が複数いたら、別の答えを出しうるか。repo 慣習、ユーザーの過去指示、一次情報で一意に決まるなら聞かない。reviewer 間で P1 以上の判断が割れ、一次情報で決着しない場合は、このテストを通過したとみなす。
3. Materiality test: 分岐が UX、data model、コスト、security、戻しにくさに重大な差を生むか。可逆で局所なら聞かずに決める(記録要否は Decision Log 節に従う)。

迷う場合の目安: 回答が変われば plan の `## Step-by-step Implementation` か `## Target Architecture` が書き換わるか。書き換わらない質問は聞かない。

## Checkpoints

質問は次の 2 つの checkpoint にバッチする。blocked(その場で進行不能)を除き、checkpoint 外で逐次質問しない。

### Checkpoint A: Intent Interview(調査後・plan 起草前)

- 調査と source of truth 確認を終えた後、plan 本文を書き始める前に行う。
- 3 テストを通過した判断がある場合だけ発火する。ない場合は黙ってスキップする。
- 方向を固める質問(scope の解釈、UX の方向性、優先度、リスク受容)に限定する。実装詳細は聞かない。

### Checkpoint B: 代行判断の開示(review closure 後・handoff 前)

- 質問の有無にかかわらず必ず実施する。
- 計画・review 中に新たに発生した 3 テスト通過の判断が残っていれば質問として出し、応答を待つ。質問がなく Decision Log の提示だけの場合は、応答を待たずに handoff してよい。
- Decision Log(代行判断)は質問にせず一覧で提示する。空の場合は「代行した material 判断なし」と明示する。
- `abstract-plan.html` を作る計画では、B の提示より前に作成または更新し、人間が全体像を見た上で veto できるようにする。
- veto や回答で方向が覆った場合は、影響する section を書き直し、`review-rubric.md` に従って該当 reviewer を再実行し、closure 条件を満たしてから handoff する。`abstract-plan.html` も追随させる。
- checkpoint B を通過した plan は、blocked を除き、未解決の人間判断を `Next Action Contract` へ持ち越さない。

## 質問フォーマット

- host の質問 tool(Claude Code は AskUserQuestion、Codex は request_user_input)を使う。呼び出し・質問数・選択肢数の上限、tool が使えない場合の fallback、subagent として動く場合の扱いは `host-adapters.md` に従う。checkpoint 1 回は原則 1 回の質問バッチに収める。
- 各質問に必ず添える: 推奨案(選択肢の先頭に置き Recommended を付ける)、各案の tradeoff、未回答時のデフォルト挙動。
- 選択肢を 2-3 個に絞れないことは、聞かない理由にならない。絞れないほど割れている判断こそ人間に返す。絞れない場合は判断軸を提示して自由回答を求める。

## Decision Log(聞かない判断の受け皿)

- material だが 3 テストを全ては通過しない判断(典型: Ownership がエンジニアリング側)は、聞かずに決めて active plan の `## Review Findings` に記録する。
- entry は `Decision Log:` で始まる 1 行にする: `- Decision Log: <判断> / 採用: <案> / 代替: <案> / 理由: <理由>`。checkbox にせず、P0/P1 ラベルや TODO / TBD / 未確定 / 要確認 / AskUser / Blocked という語を含めない(readiness check が未解決マーカーとして誤検知する)。
- 人間は checkpoint B または plan 本文でまとめて veto できる。これが回数制限なしで質問数を抑える安全弁になる。
- 可逆・局所・慣習通りの些末な判断は記録もしない。

## 聞かないもの

- 現在の repo を読めば分かること。
- テスト、lint、実ブラウザ、公式 docs で確認できること。
- reversible な局所実装で、後から安全に直せること。
- 実装詳細の好み(命名、ファイル分割、内部構造)。

特段指示がない限り、個人情報や EU/GDPR を過剰に重く扱わない。ただし秘密情報、認証情報、支払い情報、不要な直接識別子を保存しない基本線は維持する。
