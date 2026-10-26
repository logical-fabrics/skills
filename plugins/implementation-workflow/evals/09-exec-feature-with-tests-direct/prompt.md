---
max_turns: 30
timeout_seconds: 600
allowed_tools: [Skill, Agent, Read, Write, Edit, Grep, Glob, Bash]
runs: 3
---
まず、作業ディレクトリに次の 2 ファイルをこの内容ちょうどで作成してください。

`src/slug.mjs`:

```js
export function slugify(text) {
  return text.trim().toLowerCase().replace(/\s+/g, "-");
}
```

`docs/implementation/current.md`:

```
# Current Plan

## Status
- Slice 1: not started

## Slices
### Slice 1: slug の記号除去と test
- `slugify` は英数字とハイフン以外の文字を取り除き、連続するハイフンを 1 つにまとめる。
- `src/slug.test.mjs` を `node:test` で新規作成し、空白、記号、連続ハイフンのケースを確認する。
- `node --test` で確認する。
- Risk: low

## Implementation Handoff
- Next: Slice 1
```

作成できたら、この plan を実装して、test と検証までやって。
