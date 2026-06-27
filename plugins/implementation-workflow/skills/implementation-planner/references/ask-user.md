# AskUser

AskUserTool または host equivalent を使う条件:

- scope、UX、cost、security、data model、production behavior、long-term maintenance、compatibility に影響する。
- repo、公式 docs、一次情報、実行確認では解決できない。
- 現実的な選択肢を 2-3 個まで絞れる。
- 未回答のまま進めると、後戻りの大きい product / business / rollout 判断を勝手に決めることになる。

聞く前に提示する:

- 推奨案。
- 代替案。
- 各案の tradeoff。
- 未回答時に進められない理由。

聞かない:

- 現在の repo を読めば分かること。
- テスト、lint、実ブラウザ、公式 docs で確認できること。
- reversible な局所実装で、後から安全に直せること。

特段指示がない限り、個人情報や EU/GDPR を過剰に重く扱わない。ただし秘密情報、認証情報、支払い情報、不要な直接識別子を保存しない基本線は維持する。
