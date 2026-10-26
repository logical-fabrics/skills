---
max_turns: 40
timeout_seconds: 900
allowed_tools: [Skill, Agent, Read, Write, Edit, Grep, Glob, Bash]
runs: 3
---
まず、作業ディレクトリに次の 4 ファイルをこの内容ちょうどで作成してください。

`src/money.mjs`:

```js
export function toYen(amount) {
  return Math.round(amount);
}
```

`src/cart.mjs`:

```js
import { toYen } from "./money.mjs";

export function cartTotal(items) {
  return toYen(items.reduce((sum, item) => sum + item.price * item.qty, 0));
}
```

`src/invoice.mjs`:

```js
import { toYen } from "./money.mjs";

export function invoiceLine(item) {
  return `${item.name}: ${toYen(item.price * item.qty)}円`;
}
```

`docs/implementation/current.md`:

```
# Current Plan

## Status
- Slice 1: not started

## Slices
### Slice 1: 円の端数処理を切り捨てに統一
- 共有関数 `toYen` を四捨五入から 1 円未満切り捨てに変える。cart と invoice の両方の表示金額が変わる。
- 負の金額（返金）は 0 方向に切り捨てる（`Math.trunc`）。
- `src/money.test.mjs`、`src/cart.test.mjs` を `node:test` で作り、`node --test` で確認する。
- Risk: medium（共有ロジック、ユーザー可視の金額）

## Implementation Handoff
- Next: Slice 1
```

作成できたら、current.md の次を実装して。
