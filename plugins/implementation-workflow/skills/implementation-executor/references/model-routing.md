# Model Routing

マルチエージェント実行では、agent の深さや肩書きではなく、その agent が担う判断の難度、scope、失敗コストで model tier を決める。メインエージェントと中間 orchestrator は統合判断に十分な frontier tier を使い、境界の明確な実作業は balanced / fast tier の leaf worker へ渡す。

## Current Routing Baseline

2026-07-10 時点の推奨 mapping:

| Tier | Claude Code | Codex / OpenAI | 主な責務 |
| --- | --- | --- | --- |
| Frontier orchestrator | Claude Fable 5 (`claude-fable-5`) | GPT-5.6 Sol (`gpt-5.6-sol`; `gpt-5.6` alias も Sol) | 全体 orchestration、曖昧な要件、architecture、複数 slice の統合、高難度 debugging、security / adversarial review、P0/P1 の最終判断 |
| Balanced worker | Claude Sonnet 5 (`claude-sonnet-5`) | GPT-5.6 Terra (`gpt-5.6-terra`) | 通常の coding、複数ファイルの coherent slice、test 作成、局所 debugging、標準的な review / verification |
| Fast worker | Claude Haiku 4.5 (`claude-haiku-4-5`) | GPT-5.6 Luna (`gpt-5.6-luna`) | typo / copy、機械的 rename、限定 grep、定型的な test 実行、log 整理、境界と期待出力が明確な単純 task |

これは固定的な vendor lock ではなく、能力 tier の baseline である。正確な model ID、利用可否、effort control は変わり得るため、外部 agent を起動する前に host の model picker / model list と公式 docs を確認する。リリース直後は Context7 や検索 index が遅れることがあるので、vendor の公式 model catalog、release note、help / availability page を優先する。

## Assignment Rules

- plan 分割、worker 間の競合解消、複数 workstream の synthesis、最終 acceptance は frontier orchestrator に残す。
- 通常の implementation worker は balanced tier を既定にする。複数ファイルであっても、accepted slice と acceptance criteria が明確なら frontier tier を消費しない。
- fast tier は、入力、編集範囲、期待出力、検証 command が明確な leaf task に限る。architecture 判断、未知の root cause、auth / billing / migration / production / security 判断を渡さない。
- review は作業量ではなく失敗コストで選ぶ。通常の touched-surface review は balanced tier、security、data loss、cross-slice architecture、収束しない P0/P1 は frontier tier を使う。定型 test / log 確認だけなら fast tier でよい。
- 同じ task を複数 model に無差別 fan-out しない。独立 workstream、異なる reviewer role、または不確実性を減らす明確な目的がある時だけ並列化する。
- worker が 2 回同じ原因で失敗する、scope 外判断を要求する、相反する evidence を返す、または P0/P1 を発見した場合は 1 tier 上へ escalation し、prompt に試行内容、diff、log、未解決判断を渡す。
- frontier worker の結果でも自己申告だけで受理しない。メインエージェントが diff と verification evidence を確認する。

## Availability And Effort

- GPT-5.6 Sol / Terra / Luna は 2026-07-10 時点で limited preview であり、組織ごとの access が必要。選択不能なら task を止めず、host で実際に利用可能な最新 model を公式 docs で確認し、同じ tier の役割を満たす model を選ぶ。fallback した model と理由を handoff に残す。
- GPT-5.6 の `max` は reasoning effort、Codex の `ultra` は subagent を使う multi-agent mode であり、同じものではない。`max` は最難関の quality-first task に限定し、まず `medium`、必要なら `high` / `xhigh` と比較する。`ultra` を使う時は built-in fan-out を既存の手動 fan-out に重ねて同時 agent 数を倍増させない。
- Terra / Sonnet 5 は通常 coding の既定。effort を上げ続けるより、task が architecture / integration 判断へ変わった時点で frontier tier に戻す。
- Luna / Haiku 4.5 は単純 task の既定。長い探索や複数回の自己修正が必要になったら balanced tier に上げる。
- Claude Fable 5 は adaptive thinking が常時有効で、30-day data retention が必要。zero-data-retention や組織 policy と衝突する repo / data を自動で送らず、許可された model tier を選ぶ。

## Delegation Prompt Contract

外部 agent / subagent の model を指定できる host では、委任 prompt または agent config に最低限以下を含める:

- model ID または model tier。
- effort / reasoning level（host が対応する場合）。
- worker role と accepted slice。
- read / write scope と禁止操作。
- acceptance criteria と verification command。
- escalation condition と返却形式。

model を指定できない host では、task を tier 相当の難度まで狭め、選択不能だったことを報告する。retired model や暗黙 default への fallback を避けるため、指定可能なのに model / effort を省略しない。

## Primary Sources

- [OpenAI model guidance for GPT-5.6](https://developers.openai.com/api/docs/guides/latest-model)
- [OpenAI GPT-5.6 preview availability](https://help.openai.com/en/articles/20001325-a-preview-of-gpt-5-6-sol-terra-and-luna)
- [Anthropic Claude Fable 5](https://www.anthropic.com/claude/fable)
- [Anthropic current model overview](https://platform.claude.com/docs/en/about-claude/models/overview)
- [Anthropic Claude Sonnet 5 announcement](https://www.anthropic.com/news/claude-sonnet-5)
