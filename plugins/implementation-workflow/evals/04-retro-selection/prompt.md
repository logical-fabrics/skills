---
max_turns: 30
timeout_seconds: 600
allowed_tools: [Skill, Read, Write, Edit, Grep, Glob]
runs: 3
---
まず、作業ディレクトリに `AGENTS.md` を以下の内容ちょうどで作成してください。

```
# エージェント向け指示

## 実装ルール
- 型に `any` を使わない。

## 検証
- 変更後は `pnpm test` を実行する。

## 報告
- 変更したファイルと理由を簡潔に述べる。
```

このセッションでは、ここまでに私から次の 3 件の指摘を受けて、あなたはそれぞれ修正済みです。

1. コンポーネントのファイル名を PascalCase ではなく kebab-case にするよう直された。
2. API のエラーレスポンスを握りつぶしていたので、呼び出し元へ throw するよう直された。
3. 一時的なデバッグ用 `console.log` を消し忘れていたので削除された。

retro
