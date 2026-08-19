# Learning Evaluation

## Detection fixtures

UserPromptSubmit hook には少なくとも以下を fixture 化する:

True positives:

- direct correction: `それは違う。対象は plugin 側です。`
- human repair: `私が修正して戻した。`
- explicit persistence: `次からは必ず target repo を確認して。`
- short durable trigger: `今の訂正、再発防止して。`
- explicit destination: `この訂正を AGENTS.md に追記して。`
- English equivalents: `That's not what I asked. Remember this next time.`

False positives:

- ordinary first-time fix: `ログインのバグを修正して。`
- changed requirement: `やっぱりボタンは青にする。`
- current-task constraint: `DB は変更しないで。`
- research question: `AI はどうやって訂正を記録すべき？`
- future-plan request: `今後の計画を確認して。`
- permission question: `AGENTS.md に追記してもいい？`
- quotation / pasted prompt: `例: "Don't use rm -rf"`
- comparison text: `A ではなく B という方式を解説して。`

Regex detector が false positive を完全には除けないため、hook output は candidate context とし、curator の promotion gate を第二の防壁にする。explicit persistence だけは high-precision pattern で Stop outcome gate を有効にする。

## Persistence fixtures

最低限、以下を確認する:

- session / repository identity がない場合は state を共有せず fail open。
- state に prompt 本文、secret、transcript content が残らない。
- ordinary correction は Stop を block しない。
- explicit persistence で `Learning outcome:` がない場合だけ一度 block する。
- `Learning outcome:` がある場合は block しない。
- `stop_hook_active=true` の continuation は再 block せず state を消す。
- Knip など別 Stop handler と並行しても互いの state を消さない。

## Artifact checks

Guidance delta では:

- canonical file / symlink target を一度だけ変更したか。
- duplicate または contradictory rule を作っていないか。
- trigger / scope / constraint / verification が具体的か。
- current incident の固有情報だけになっていないか。
- raw transcript、secret、personal data を含まないか。
- 新しい skill / hook / test の discovery と構造 validation が通るか。

## Retrospective sweep checks

Retrospective mode では追加で確認する:

- 各候補が in-session の human correction、accepted feedback、deterministic failure のいずれかに紐づくか。agent の自己反省だけの候補が混ざっていないか。
- transcript file / session log を path から読んでいないか。
- 候補提示 → user 選択 → 書き込み、の順序を守っているか。
- 上限で切り捨てた候補の件数を報告しているか。
- 一度の sweep で deterministic guardrail を 2 件以上新設していないか。
- context 圧縮で失われた範囲を、推測で候補化していないか。

## Behavior replay

重要な learning は、可能なら二つの fixture で検証する:

1. Recurrence fixture: 過去と同じ mistake class を誘発する新しい context を与え、rule / skill / hook が適用される。
2. Counterexample fixture: 類似しているが正当な action を与え、過剰に block / route しない。

instruction-only learning は host behavior smoke で確認し、deterministic guardrail は unit / integration test で確認する。小標本で「永久に再発しない」と結論せず、観測した scope と未検証条件を報告する。

## Closure evidence

最終報告は以下を持つ:

- signal source と promotion / NOOP 理由。
- operation: ADD / REFINE / MERGE / NOOP。
- destination と scope。
- validation / behavior replay の結果。
- prose-only か deterministic enforcement か。
- residual false-positive / recurrence risk。
- Retrospective mode では、提示した候補数、選択された数、切り捨てた数。
