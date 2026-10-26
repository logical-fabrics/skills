# Delivery

CI/CD、deploy、hosting、environment、public launch が関係する場合に読む。

Default:

- CI は GitHub Actions。
- CD は Cloudflare の GitHub repository 連携。
- GitHub Actions deploy は、Cloudflare Pages / Workers で direct upload が必要な場合だけ検討する。
- production / staging の 2 環境を原則作る。
- env vars、secrets、database、domain、analytics、AI Gateway、cache、robots は環境ごとに分ける。
- Sentry は環境ごとに project を分けず、1 project の environment を `staging` / `production` に分ける。local からは送信しない。

Local development:

- production が platform runtime、static assets、database、storage、media、AI、queue などの bindings に依存する場合、標準の `dev` command はその runtime と binding contract を通す。
- frontend と backend/runtime の dev server を分けるのは、platform 公式の統合 dev path がない、または明確な互換性制約がある場合だけ。その場合は理由、proxy port、検証の限界、統合へ戻す条件を plan に書く。
- local simulator がない外部 resource は、必要に応じて remote binding / 実接続を標準 dev に含める。つながらない状態を「local では問題なし」と扱わず、認証・権限・課金・network の前提を書く。
- local-only smoke と live verification を分ける場合も、live 側が通っていない機能を done / feature-ready にしない。

Staging:

- 検索除けを必須にする。robots、meta robots、noindex header、Cloudflare Access、Basic auth などをプロジェクトに合わせて選ぶ。
- production analytics に混ぜない。

Production:

- public site では analytics、Sentry、favicon、title、description、OGP、sitemap、robots.txt、canonical、viewport、theme color、404/500 を確認する。
- 公開前提サービスでは OGP を必ず設計する。`og:title`、`og:description`、`og:image`、`og:url`、`og:site_name`、必要に応じて Twitter/X card を確認する。
- OGP image が暗すぎる、切れすぎる、文字が小さい、対象サービスが分からない状態を避ける。
- internal / authenticated / admin では SEO checklist を軽量化してよいが、判断を残す。
