---
max_turns: 30
timeout_seconds: 600
allowed_tools: [Skill, Read, Write, Edit, Grep, Glob]
runs: 3
---
まず、作業ディレクトリに `AGENTS.md` を以下の内容ちょうどで作成し、続けて `src/user.ts` を以下の内容ちょうどで作成してください。

`AGENTS.md`:

```
# エージェント向け指示

## 実装ルール
- 型に `any` を使わない。

## 検証
- 変更後は `pnpm test` を実行する。

## 報告
- 変更したファイルと理由を簡潔に述べる。
```

`src/user.ts`:

```
export function pickActive(userList: User[]): User[] {
  return userList.filter((u) => u.active);
}
```

作成できたら、次の指摘に対応してください。

その変数名、`userList` じゃなくて `users` にして。
