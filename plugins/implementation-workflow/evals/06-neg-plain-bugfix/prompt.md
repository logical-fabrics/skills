---
max_turns: 5
timeout_seconds: 420
allowed_tools: [Skill, Read, Grep, Glob]
runs: 3
---
次の関数に off-by-one があります。修正したコードを示してください。

```ts
export function lastN<T>(items: T[], n: number): T[] {
  const out: T[] = [];
  for (let i = items.length - n - 1; i < items.length; i++) {
    out.push(items[i]);
  }
  return out;
}
```
