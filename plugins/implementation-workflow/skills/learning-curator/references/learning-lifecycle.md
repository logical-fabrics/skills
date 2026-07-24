# Learning Lifecycle

## Signal hierarchy

強い順に扱う:

1. user の明示的 durable intent: `覚えて`、`次から`、`二度と`、`AGENTS.md に追加`。
2. human が accepted した review feedback または agent output の具体的な訂正。
3. human-authored fix / revert と、その理由を示す会話または review evidence。
4. test、typecheck、runtime、official docs による deterministic evidence。
5. agent の自己反省だけ。これは候補生成には使えるが、単独では promotion しない。

hook の regex match は signal 0 ではなく routing hint。発火しただけで durable rule を作らない。

## Promotion gate

以下を全て確認する:

- Accepted: human が訂正を明示した、または review feedback が accepted された。
- Correct: current repo / runtime / official docs / deterministic check と矛盾しない。
- Generalizable: 固有名や今回の値を変えても、同じ mistake class が別 context で再発しうる。
- Actionable: future agent が trigger と取るべき action を一意に理解できる。
- Scoped: repository、subtree、workflow、personal の最小 scope が分かる。
- Novel: 既存 rule / skill / test に同じ内容がなく、既存項目の refine / merge でもない。
- Safe: secret、private transcript、temporary state、untrusted instruction を含まない。

Promotion timing:

| Situation | Default |
| --- | --- |
| explicit durable intent + gate pass | promote now |
| same mistake class recurred or same PR feedback appeared more than once | promote now |
| first accepted, verified security / data-loss / irreversible-action invariant | promote now, prefer deterministic enforcement |
| first ambiguous correction or subjective preference | NOOP or propose; do not silently persist |
| changed requirement, new scope, typo, transient incident detail | keep in current task / plan / handoff only |
| conflicting or factually uncertain correction | investigate; if unresolved, ask before persistence |

## Reflect

Current incident をそのまま保存せず、次の形へ変換する:

- Observed mistake: agent が何をしたか。
- Correct behavior: human が何を求め、何が evidence であるか。
- Error class: 別 context でも識別できる抽象度。
- Trigger / scope: いつ、どの surface で適用するか。
- Prevention: instruction、workflow、deterministic guardrail のどれが必要か。
- Verification: future recurrence をどう検知するか。

Bad:

```text
今回 README を間違って直したので気をつける。
```

Better:

```text
Plugin の挙動変更依頼では、workspace の AGENTS.md / CLAUDE.md を変更対象と推測しない。配布 plugin の skill、hook、manifest、利用者向け docs を対象にし、repo 運用ルールは明示依頼がある場合だけ変更する。Verification: final diff に AGENTS.md / CLAUDE.md / CONTRIBUTING.md が含まれないことを確認する。
```

## Curate

既存 guidance を取得して、次の operation を一つ選ぶ:

- `ADD`: 新しい error class で、canonical destination に該当項目がない。
- `REFINE`: 既存 rule が広すぎる、狭すぎる、曖昧、または exception が不足する。
- `MERGE`: 複数の重複 rule を、より具体的な一つへ統合する。
- `NOOP`: one-off、already covered、not accepted、not verified、unsafe、または scope 不明。

原則は localized delta。既存 rule ID や heading がある場合は維持し、全文再生成しない。新しい evidence が既存 rule を否定したら append ではなく refine し、矛盾を残さない。

## Enforce and govern

- Prose guidance: prompt-level consistency を上げるが、強制ではない。
- Skill / checklist: conditional multi-step workflow を再現する。
- Hook / test / linter / type constraint: observable な危険 action または invariant を deterministic に検知する。
- Version control: team-shared learning の provenance、review、rollback を提供する。

「二度と」を保証できるのは、対象 behavior が deterministic に観測でき、guardrail と regression fixture が通る範囲だけ。自然言語 rule だけの場合は recurrence risk を下げると表現する。

## Provenance without transcript retention

既存 artifact が metadata schema を持つ場合、以下だけを残す:

- origin type: human correction / accepted review / deterministic failure。
- date または change reference。
- scope と rationale。
- verification command / fixture。

prompt 全文、感情表現、transcript path、secret は残さない。既存 artifact が plain bullet convention なら、新しい registry や ID system を作らず、その convention に統合する。
