# CI Security

GitHub Actions、dependency、release、deploy、secret が関係する場合に読む。

- GitHub Actions の `permissions` は workflow または job で最小化する。
- third-party actions は信頼性、更新状況、権限、pinning 方針を確認する。
- cloud deploy では可能なら長期 secret より OIDC による短命 token を優先する。
- secret を logs、artifact、test output、PR comment、AI prompt に出さない。
- dependency review、Dependabot、security update、license / advisory の要否を確認する。
- fork PR、untrusted input、script injection、`pull_request_target` を特に厳しく見る。

