# Methodology and Prior Art

この workflow は単一の先行実装をコピーせず、human correction の品質、永続化、差分更新、enforcement、host portability を分けて設計する。

## Adopted evidence

### Codex customization and hooks

Codex の公式 customization guidance は、同じ mistake や PR feedback が繰り返された時に `AGENTS.md` へ codify することを勧める。Hooks は `UserPromptSubmit` で developer context を注入し、`Stop` で continuation を要求できる。一方、command hooks は並行実行され、transcript format は stable interface ではない。Codex memories は background-generated state で、手編集を primary control surface にしない。

- [Codex customization overview](https://learn.chatgpt.com/docs/customization/overview)
- [Codex hooks](https://learn.chatgpt.com/docs/hooks)
- [Codex memories](https://learn.chatgpt.com/docs/customization/memories)

Adoption: cross-host command hook、prompt / last-message input、one-shot Stop gate、generated memory state 非依存。

### Claude Code memory and Hookify

Claude Code 公式 docs は、同じ mistake の二度目、code review で判明した repo knowledge、前 session と同じ correction を `CLAUDE.md` の候補にし、multi-step / path-specific content は skill / scoped rule へ移す。Auto memory は correction を保持できるが enforcement ではない。Anthropic の公式 Hookify plugin は conversation の frustration / correction を分析し、regex-based warn / block rules を作る。ただし one-time accident と hypothetical discussion は分け、rule 作成前に user selection を入れる。

- [Claude Code memory](https://code.claude.com/docs/en/memory)
- [Claude Code hooks](https://code.claude.com/docs/en/hooks)
- [Anthropic Hookify](https://github.com/anthropics/claude-code/tree/main/plugins/hookify)

Adoption: correction trigger、false-positive examples、warn/context と block の分離、mandatory behavior は hook / test へ。

### On-demand retrospective capture

Hookify の `/hookify` は引数なしで起動すると conversation-analyzer agent が直近の会話を遡り、correction / frustration / 繰り返しを候補として構造化し、severity と regex 案を返す。作成するかどうかは user が選ぶ。Cursor の `/Generate Cursor Rules` も同様に、会話からルールを生成する入口を user 起動の command として持つ。いずれも prompt 時点の pattern match を主 trigger にしていない。

- [Hookify README](https://github.com/anthropics/claude-code/blob/main/plugins/hookify/README.md)
- [Cursor changelog 0.49 - Rules generation](https://cursor.com/changelog/0-49)
- [Cursor docs - Rules](https://cursor.com/docs/context/rules)

Adoption: user 起動の retrospective sweep を第一の入口にし、候補の提示と選択を書き込みの前提にする。prompt regex hook は主 trigger ではなく低精度の routing hint として残す。Difference: 候補生成に会話を使う場合も transcript file は読まず、context に残る会話と deterministic state に限定する。

### OpenHands agent-memory

OpenHands の `agent-memory` skill は repository-specific knowledge を `AGENTS.md` に保存し、issue-specific information を避け、保存項目を user に確認する。

- [OpenHands agent-memory](https://github.com/OpenHands/extensions/tree/main/skills/agent-memory)

Adoption: general knowledge only、human-approved durable intent、既存 AGENTS.md への統合。Difference: この skill は user が明示的に durable learning を依頼した場合、再確認を必須にせず同じ authorized task 内で適用できる。曖昧な first correction は自動保存しない。

### Accumulated behavioral rules

2026 年の observational report は、accepted human review feedback を version-controlled instruction rule と self-review checklist へ変換し、rule origin、scope、constraint、rationale、verification を持たせる closed loop を示す。9 error classes / 74 post-rule exposures で recurrence 0 を観測したが、single-team、4週間、control 無しであり永久保証ではない。

- [Self-Improving AI Coding Agents Through Accumulated Behavioral Rules](https://arxiv.org/abs/2607.13091)

Adoption: class-level rule、version control、provenance、validation、dedupe / conflict governance。Modification: `every accepted comment` を無条件 append せず、explicit intent、recurrence、risk、generalizability の promotion gate を置く。

### Reflexion, ExpeL, and ACE

Reflexion は feedback を verbal reflection と episodic memory に保持する。ExpeL は経験から natural-language knowledge を抽出し、future task で recall する。ACE は Generator / Reflector / Curator を分け、monolithic rewrite ではなく structured delta update と grow-and-refine で context collapse と重複を抑える。ACE 自身も、reliable feedback がない online adaptation は spurious signal で context を汚染しうると報告する。

- [Reflexion](https://arxiv.org/abs/2303.11366)
- [ExpeL](https://arxiv.org/abs/2308.10144)
- [Agentic Context Engineering](https://arxiv.org/abs/2510.04618)

Adoption: current execution、reflection、curation の分離、atomic delta、retrieve-before-write、refine / merge、reliable feedback gate。

## Rejected defaults

- Every correction is appended immediately: poisoning、contradiction、one-off requirement、context bloat を招く。
- Whole-file LLM rewrite: existing detail を失う context collapse と unrelated diff を招く。
- Raw transcript as durable memory: privacy、format instability、irrelevant context を招く。
- External file change alone as human correction: editor、formatter、別 agent を区別できず attribution が弱い。
- Native memory only: host ごとの availability / timing / sharing が異なり、mandatory behavior を enforce できない。
- Prose-only guarantee: deterministic に観測できる mistake は hook / test / linter の方が再発防止 evidence を作れる。

## Resulting architecture

```text
Human correction
  -> deterministic candidate detection
  -> current-task recovery
  -> reflection and promotion gate
  -> retrieve existing guidance
  -> ADD / REFINE / MERGE / NOOP
  -> instruction / skill / deterministic guardrail / optional native memory
  -> structure check + behavior replay
```

この architecture は model weights を更新しない。version-controlled context と deterministic enforcement を改善する feedback loop である。
