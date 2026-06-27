# Delivery

CI/CD、deploy、hosting、environment、public launch が関係する場合に読む。

Default:

- CI は GitHub Actions。
- CD は Cloudflare の GitHub repository 連携。
- Cloudflare Pages / Workers で direct upload が必要な場合だけ GitHub Actions deploy を検討する。
- production / staging の 2 環境を原則作る。
- env vars、secrets、database、domain、analytics、AI Gateway、cache、robots は環境ごとに分ける。
- Sentry は project を環境ごとに分けず、1 project の environment を `staging` / `production` に分ける。local からは送信しない。

Staging:

- staging は検索除け必須。
- robots、meta robots、noindex header、Cloudflare Access、Basic auth などをプロジェクトに合わせる。
- production analytics に混ぜない。

Production:

- public site では analytics、Sentry、favicon、title、description、OGP、sitemap、robots.txt、canonical、viewport、theme color、404/500 を確認する。
- 公開前提サービスでは OGP を必ず設計する。
- `og:title`、`og:description`、`og:image`、`og:url`、`og:site_name`、必要に応じて Twitter/X card を確認する。
- OGP image は暗すぎる、切れすぎる、文字が小さい、対象サービスが分からない状態を避ける。
- internal / authenticated / admin では SEO checklist を軽量化してよいが、判断を残す。
