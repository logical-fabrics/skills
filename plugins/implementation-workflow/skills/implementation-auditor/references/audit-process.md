# Audit Process

1. Scope を決める。
   - 全体 health check。
   - UI/UX。
   - architecture / refactoring。
   - data model。
   - tests / verification。
   - delivery / observability。
   - AI feature。
2. Source of truth を読む。
   - 現在の repo。
   - active plan。
   - docs。
   - schema。
   - routes。
   - UI。
   - tests。
   - deployment / CI config。
3. 実際の挙動を確認する。
   - Web UI は可能なら実ブラウザで主要導線を見る。
   - test / lint / typecheck / build は scope に応じて実行する。
4. 問題を evidence と impact で整理する。
5. 自動修正候補、plan 化候補、要ユーザー判断に分ける。
6. すぐに実装しない場合も、次に再開できるよう `Next review action` を明示する。

Audit の目的は責めることではない。現在の実装をより良くするため、実害と改善順序を明確にする。

