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
- lint は `pnpm lint` で実行する。
- 変更後は `pnpm test` を実行する。

## 報告
- 変更したファイルと理由を簡潔に述べる。
```

作成できたら、次の指摘に対応してください。

さっきも `pnpm lint` を使って失敗したよね。このプロジェクトは biome なので `pnpm lint` は誤ルーティングされて落ちる。`pnpm exec biome check .` を直接叩いて。ルール化して二度と間違えないようにして。
