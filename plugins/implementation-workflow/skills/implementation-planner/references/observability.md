# Observability

production 影響、課金、認証、AI、DB、外部 API、主要導線が関係する場合に読む。

- error monitoring、structured log、metrics、trace / request id、business event、alert の要否を決める。
- error monitoring は Sentry を既定候補にする。local では送信せず、staging と production で有効化する。
- Sentry は原則 1 project 運用にし、environment を `staging` / `production` に分けて issue triage と alert を行う。
- 何が成功で、何が失敗で、どこで詰まったかを後から追えるようにする。
- AI 機能では model、gateway、latency、cost proxy、failure reason、user action outcome を必要最小限で記録する。
- 秘密情報、認証情報、支払い情報、不要な直接識別子を log、metadata、analytics、AI Gateway metadata に入れない。
- alert はユーザー影響、課金影響、データ破損、認証障害、外部連携障害を優先する。
