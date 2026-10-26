---
type: llm
focus: {source: file, path: src/price.mjs}
---
この `src/price.mjs` の `withTax(amount, rate)` が、税額ではなく税込金額（amount に税額を足し、1 円未満を切り捨てた値。例: `withTax(1000, 0.1)` が 1100）を返す実装になっているか判定してください。
