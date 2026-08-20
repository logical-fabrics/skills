# Release Process

配布前に、以下を確認する。

この手順は `logical-fabrics/skills` marketplace 全体の release process です。現在の例は `implementation-workflow` ですが、plugin が増えた場合は変更対象 plugin ごとに同じ checks を行います。

## 1. Static checks

```bash
pnpm install --frozen-lockfile
pnpm validate
pnpm test:hooks
pnpm lint
```

## 2. Version bump

配布済み plugin の manifest、skills、references、description、component inventory、host exposure を変えた場合は、plugin version を bump する。

`<plugin-name>` の対象:

- `plugins/<plugin-name>/.codex-plugin/plugin.json`
- `plugins/<plugin-name>/.claude-plugin/plugin.json`

両方の `version` は同じ値に揃える。version を変えないと、installed plugin が既存 version を最新と判断し、更新内容を再取得しないことがある。

現在の配布 plugin:

- `implementation-workflow`

## 3. Plugin smoke test

Codex で `implementation-workflow` を確認する例:

```bash
codex plugin marketplace add "$(pwd)"
codex plugin list --marketplace lf-skills
codex plugin add implementation-workflow --marketplace lf-skills
```

- `implementation-workflow` が marketplace から install でき、`codex plugin list` に `installed, enabled` と期待する version が出る。
- Codex CLI には component inventory を出すサブコマンドがない（`plugin list` のみ）。skill と hook の discovery は Codex セッションを開いて確認する。
- `implementation-planner`、`implementation-executor`、`implementation-auditor`、`learning-curator` が skill 一覧に出る。
- 各 skill の description が意図した trigger を持つ。

Claude Code で `implementation-workflow` を確認する例:

```bash
claude plugins validate --strict plugins/implementation-workflow
claude --plugin-dir "$(pwd)/plugins/implementation-workflow" plugins details implementation-workflow
claude --plugin-dir "$(pwd)/plugins/implementation-workflow"
```

- plugin skill が namespace 付きで見える。
- Claude Code plugin agent を追加・変更した場合、期待する agent 名、model、effort（effort parameter に対応する model の場合のみ）、tool restriction が component inventory と定義ファイルで確認できる。
- hooks がある plugin では、component inventory に hook 数が出る。
- thin slash command alias が増えておらず、Claude Code の入口が 4 skills に整理されている。
- validate が warning なしで通る。

Update smoke の例:

```bash
claude plugin marketplace update lf-skills
claude plugin update implementation-workflow@lf-skills
claude plugin details implementation-workflow
```

- update 後は Claude Code を再起動する。
- update が最新扱いなのに挙動が古い場合は、version bump 漏れを疑う。
- local 検証で version を変えない場合だけ、`claude plugin remove implementation-workflow@lf-skills` からの再 install で cache を捨てる。version が同じままだと `already at the latest version` と判定され、変更が反映されない。

## 4. Behavior smoke test

小さな fixture repo または実プロジェクトで、以下を確認する。

model routing の能力、価格、availability、retention、effort は vendor の公式一次情報を正とする。ローカル smoke は plugin の routing、lane 境界、component discovery、決定的な hook behavior の退行確認に限定し、model 間の品質・cost-performance benchmark は要求しない。

- 軽微な修正では planner が重くなりすぎない。
- 複数領域の実装では、ユーザー明示 plan または repo 慣習がなければ `docs/implementation/current.md` が active plan になる。
- audit は不要なファイルを増やさず、必要時だけ improvement backlog へ接続する。
- executor は stale plan を検出できる。
- executor は repo / docs / 実行確認で解ける recoverable stale を自己修復して、accepted slice を続行できる。
- 広い repo 探索、大量 log、長い debugging / verification loop の fixture は、main が詳細を読み込む前に `implementation-worker` の read-only `diagnostic` mode へ委任し、短い結論と evidence だけを統合する。
- 必要 context がすでに揃った小さく coherent な fixture は、複数ファイルでも handoff / coordination / integration overhead が context benefit 以上なら main が直接実装する。専用の `micro-task exception` 宣言を要求しない。
- low / medium / high risk は delegation 判断と分離され、medium / high risk では implementation owner にかかわらず必要な独立 review / verification が入る。
- worker が利用できない fixture は context 収支と scope を再評価し、安全に main で扱える場合は続行し、判断品質、権限、scope を損なう場合だけ blocked / AskUser になる。
- 独立 workstream がない fixture を agent 数のためだけに並列化しない。
- audit / plan / execute は `Next Action Contract` で次 lane、人間判断の要否、`/goal` 推奨有無、推奨 prompt を返す。
- 軽微な UI copy / style fixture では full E2E を要求せず、responsive fixture では mobile / desktop screenshot、route / auth / persistence fixture では targeted E2E、release fixture では full gate が plan に入る。

## 5. Release notes

`CHANGELOG.md` に以下を書く。

- 変更した plugin / skill。
- 社員に影響する使い方の変更。
- migration が必要な場合の手順。
- known risks。

## 6. Tagging

配布する版は tag を打つ。

```bash
git tag vX.Y.Z
git push origin vX.Y.Z
```

installed plugin の更新判定を動かすのは manifest の `version` であり、tag ではない。tag は「どのコミットがどの配布版か」を後から辿るための marker として使う。

tag 運用は `v0.3.0` から始めた。それ以前の版に tag はない。過去のコミットへ後付けすると版の境界を誤る可能性があるため、backfill はしない。0.3.0 より前を辿る場合は `CHANGELOG.md` の該当エントリと、`version` を bump したコミットを見る。

push や tag 作成は、配布担当者が明示的に行う。
