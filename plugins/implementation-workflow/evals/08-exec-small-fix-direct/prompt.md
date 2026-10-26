---
max_turns: 30
timeout_seconds: 600
allowed_tools: [Skill, Agent, Read, Write, Edit, Grep, Glob, Bash]
runs: 3
---
まず、作業ディレクトリに次の 3 ファイルをこの内容ちょうどで作成してください。

`src/price.mjs`:

```js
export function withTax(amount, rate) {
  return Math.floor(amount * rate);
}
```

`src/price.test.mjs`:

```js
import assert from "node:assert/strict";
import { test } from "node:test";
import { withTax } from "./price.mjs";

test("withTax", () => {
  assert.equal(withTax(1000, 0.1), 100);
});
```

`docs/implementation/current.md`:

```
# Current Plan

## Status
- Slice 1: not started

## Slices
### Slice 1: 税込金額を返す
- `withTax(amount, rate)` は税額ではなく税込金額（amount + 税額、1 円未満切り捨て）を返す。
- `src/price.test.mjs` の期待値を税込金額に直し、`node --test` で確認する。
- Risk: low

## Implementation Handoff
- Next: Slice 1
```

作成できたら、current.md の次を実装して。
