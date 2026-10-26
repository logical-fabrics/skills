# Destination Routing

## Selection order

保存先は、future agent が必要な時に読むか、team 共有か、deterministic に強制できるかで決める。同じ本文を複数箇所に複製しない。

| Learning type | Primary destination | Notes |
| --- | --- | --- |
| repository 全体で常に必要な短い invariant / command / convention | repo の canonical `AGENTS.md` または `CLAUDE.md` | 短く書く。symlink / import 関係なら source 一つだけを編集 |
| subtree / language / path だけに必要 | nearest path-scoped instruction / rule | global context を膨らませない |
| conditional multi-step workflow | existing skill と reference | trigger は frontmatter description、手順は body / reference |
| dangerous action / machine-checkable invariant | hook、test、linter、type/schema constraint | prose guidance は rationale として併用可 |
| current feature の一時 decision / unfinished work | active plan / handoff | durable behavioral rule にしない |
| personal preference / machine-local fact | host-native memory（Claude Code は auto memory、`/memory` で確認） | repo には書かない。team repo へ勝手に commit しない |
| 複数 repository で再利用する workflow | shared plugin skill | shared plugin 自体の変更依頼がある場合だけ。current repo だけの事実を混ぜない |

## AGENTS.md and CLAUDE.md

- Claude Code は `CLAUDE.md` が無い時だけ `AGENTS.md` を直接読む。両方ある repo は `CLAUDE.md` に `@AGENTS.md` を import するか、documented setting で読ませる。repo が canonical source を宣言していれば従う。
- symlink 越しの Edit / Write は拒否される。symlink の target を編集する。
- 同じ rule を二重追加しない。常時読む価値がある rule だけを置き、multi-step / path-specific content は skill / scoped rule（`.claude/rules/*.md` の `paths:`）へ移す。

## Skills

次をすべて満たす場合に skill へ昇格する:

- task type を識別できる trigger がある。
- 二つ以上の step、routing、verification、または failure recovery がある。
- future task で同じ workflow を再利用できる。
- always-on instruction に置くと長すぎる、または不要な session にも読み込まれる。

既存 skill を `REFINE` できるなら新しい skill を作らない。新規作成時は、description に positive triggers と exclusions、body に capability boundary、rules、workflow、references を書く。

## Hooks and deterministic guardrails

次を満たす場合に hook を選ぶ:

- action または output を lifecycle event で観測できる。
- false positive を fixture 化できる。
- block / warn / context injection の意味が明確。
- fail-open / fail-closed と timeout が risk に合う。
- Stop hook は `stop_hook_active` を扱い、無限 continuation を作らない。

Prompt correction detection は semantic truth ではないので、既定では context injection に使う。Stop gate に使うのは、明示的 durable intent のような high-precision signal で一度だけ。曖昧な correction で turn を強制継続しない。

## Native memory

- Codex memories は background-generated state で、即時・deterministic な control surface ではない。plugin は `~/.codex/memories/` を直接編集しない。
- Claude Code auto memory は既定で有効で、`~/.claude/projects/<repo>/memory/` に machine-local に保存される。他の machine とは共有されない。「覚えて」は、user が `CLAUDE.md` 等を指名しない限りここへ入る。`/memory` で閲覧・編集できる。context であり enforcement ではないので、mandatory behavior は instruction または hook に置く。
- host-native memory が無効、非共有、遅延していても team-shared invariant が失われないようにする。
- secret、credential、raw transcript は保存しない。

## Scope examples

- 「この repo では `pnpm validate` が release gate」→ root instruction。
- 「migration 作成時は rollback fixture まで実行」→ database skill/reference。CLI で確実に判定できるなら CI test も追加。
- 「この一件だけ deadline を明日に変更」→ current plan。durable rule ではない。
- 「個人環境の local port は 4317」→ explicit request がある場合だけ personal/local memory。
- 「危険な recursive delete は exact target を検証してから」→ shared instruction。destructive command hook が使えるなら hook。
