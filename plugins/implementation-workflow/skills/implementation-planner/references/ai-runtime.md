# AI Runtime

基本:

- AI calls は Cloudflare AI Gateway 経由を基本にする。
- Workers AI を使う場合も `env.AI.run(model, input, { gateway: { id, ... } })` のように gateway option を明示する。
- Gateway を observability、rate limit、cache、retry、provider switch の境界にする。
- metadata に秘密情報、認証情報、支払い情報、不要な直接識別子を入れない。

Model:

- 課題難易度に応じて Gemma 系列を優先候補にする。
- thinking が有効になり得る model は latency を計測する。
- 低難度タスクで thinking により主導線が遅くなる場合は、無効化または軽量 model を検討する。

