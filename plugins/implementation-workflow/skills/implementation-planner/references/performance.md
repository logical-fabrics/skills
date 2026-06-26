# Performance

公開 Web、日常利用 UI、AI UI、データ量が増える画面、モバイル利用が想定される画面で読む。

- Core Web Vitals は LCP、INP、CLS を中心に見る。
- 主要導線の操作 latency を測る。
- AI 生成、検索、保存、画面遷移などユーザーが待つ箇所は loading / skeleton / progress を設計する。
- bundle size、画像、font、third-party script、client-side rendering 量を確認する。
- large list、table、chart は pagination、virtualization、server filtering、progressive loading を検討する。
- performance 改善は計測前後の差分を残す。体感だけで成功扱いしない。

