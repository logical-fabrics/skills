# Destination Routing

## Selection order

保存先は「future agent が必要な時に読むか」「team 共有か」「deterministic に強制できるか」で決める。複数箇所へ同じ本文を複製しない。

| Learning type | Primary destination | Notes |
| --- | --- | --- |
| repository 全体で常に必要な短い invariant / command / convention | repo の canonical `AGENTS.md` または `CLAUDE.md` | concise。両方が symlink / import 関係なら source 一つだけを編集 |
| subtree / language / path だけに必要 | nearest path-scoped instruction / rule | global context を膨らませない |
| conditional multi-step workflow | existing skill と reference | trigger を frontmatter description に書き、手順は body / reference に置く |
| dangerous action / machine-checkable invariant | hook、test、linter、type/schema constraint | prose guidance を rationale として併用してよい |
| current feature の一時 decision / unfinished work | active plan / handoff | durable behavioral rule にしない |
| personal preference / machine-local fact | host-native personal memory, user rule, local file | explicit request が必要。team repo へ勝手に commit しない |
| broadly reusable cross-repository workflow | shared plugin skill | current repo だけの事実を混ぜない。shared plugin 自体の変更依頼がある場合だけ |

## AGENTS.md and CLAUDE.md

1. repository root と current path から上位へ既存ファイルを探す。
2. symlink と import (`@path`) を確認する。
3. repo が canonical source を宣言していれば従う。
4. 両方が独立して存在し方針が不明なら、同じ rule を二重追加しない。既存 cross-host convention を調べ、material な選択差が残る時だけ user に確認する。
5. rule は常時読む価値があるものだけにする。multi-step / path-specific content は skill / scoped rule へ移す。

## Skills

Skill に昇格する条件:

- task type を識別できる trigger がある。
- 二つ以上の step、routing、verification、または failure recovery がある。
- future task で同じ workflow を再利用できる。
- always-on instruction に置くと長すぎる、または不要な session にも読み込まれる。

既存 skill を `REFINE` できるなら新しい skill を作らない。新しい skill を作る場合、description に positive triggers と exclusions を書き、body に capability boundary、rules、workflow、references を持たせる。

## Hooks and deterministic guardrails

Hook を選ぶ条件:

- action または output を lifecycle event で観測できる。
- false positive を fixture 化できる。
- block / warn / context injection の意味が明確。
- fail-open / fail-closed と timeout が risk に合う。
- Stop hook は `stop_hook_active` を扱い、無限 continuation を作らない。

Prompt correction detection は semantic truth ではないため、既定では context injection に使う。明示的 durable intent のような high-precision signal だけを一度の Stop gate に使い、通常の曖昧な correction で turn を強制継続しない。

## Native memory

- Codex memories は background-generated state であり、即時・deterministic な control surface ではない。plugin は `~/.codex/memories/` を直接編集しない。
- Claude Code auto memory は corrections / preferences を保持できるが context であり enforcement ではない。mandatory behavior は instruction または hook に置く。
- host-native memory が無効、非共有、遅延する場合でも、team-shared invariant が失われない設計にする。
- secret、credential、raw transcript は保存しない。

## Scope examples

- 「この repo では `pnpm validate` が release gate」→ root instruction。
- 「migration 作成時は rollback fixture まで実行」→ database skill/reference。CLI で確実に判定できるなら CI test も追加。
- 「この一件だけ deadline を明日に変更」→ current plan。durable rule ではない。
- 「個人環境の local port は 4317」→ explicit request がある場合だけ personal/local memory。
- 「危険な recursive delete は exact target を検証してから」→ shared instruction + destructive command hook が利用可能なら hook。
