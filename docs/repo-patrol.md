# repo-patrol（リポジトリの巡回）

Claude Code の scheduled tasks（旧 routines）で、リポジトリを毎日 1 回巡回させる仕組み。正本は `.claude/skills/repo-patrol/`。plugin ではなく、各リポジトリへコピーして使う（クラウドのセッションは plugin を読まないため）。

## 何をするか

- Dependabot の PR（npm の minor・patch は groups で 1 本にまとまる）ごとに、CI と dependency-check の結果を見て、マージ待ち・見送り中・要判断に分ける（CI が 9 分で終わらなければ、翌日の巡回でまた見る）。取り込まないメジャー更新には理由を 1 回だけコメントする
- 30 日を過ぎた Issue と PR を、理由のコメントと `patrol-closed` ラベルを付けて閉じる（1 日 10 件まで。7 日前に予告する）。閉じるのは Actions の定期 workflow で、巡回は予告と workflow の失敗を報告する
- 既定ブランチの CI の状態を見る
- 人が見るべきもの（マージ待ち・要判断・CI の失敗・閉じる予定）がある日に、リポジトリの設定に書いた Slack チャンネルに 1 投稿する。新しく対応が要るときは @channel を付ける。何もない日は投稿しないが、月曜だけは「異常なし」を投稿する（月曜に投稿がなければ、巡回が止まっている）

しないこと: マージ、本番昇格、デプロイ、ブランチ・コミット・PR の作成、依存の更新（Dependabot が行う）、依存のコードを動かすこと、アラートの dismiss、リポジトリ設定の変更。マージは人がする。

## 仕組み

```text
logical-fabrics/skills（正本）── コピー ──> 各リポジトリの .claude/skills/repo-patrol/ と .claude/repo-patrol.md
claude.ai の scheduled task（リポジトリごとに 1 つ・毎朝・リポジトリごとの cloud environment）── clone ──> 各リポジトリ
   ├─ GitHub（Claude GitHub App 経由・REST だけ）: 読み取りと、Dependabot の PR へのコメント
   └─ Slack（Slack アプリのボット名義・プロジェクトのチャンネル）: 報告がある日と月曜に 1 投稿、新しい要対応のときだけ @channel
GitHub Actions（各リポジトリの .github/workflows/・workflow のトークン）
   ├─ repo-patrol stale（毎朝 08:17 JST）: 30 日を過ぎた Issue / PR の close・ラベル・理由のコメント
   └─ repo-patrol dependency check（Dependabot の npm 系の PR）: check-diff と、新しい版の公開者・install script・公開日の検査
Dependabot（.github/dependabot.yml）: npm の minor・patch を groups で 1 本の PR に。公開から 4 日は cooldown で待つ
```

- scheduled task はリポジトリごとに 1 つ作る。複数のリポジトリを付けたセッションでは `.claude/settings.json` の hooks が読まれず、guard が効かないため
- cloud environment もリポジトリごとに作る（Node と pnpm の版がまったく同じリポジトリどうしは共用してよい）。setup script の結果は環境ごとに 1 つのスナップショットとして使い回され、巡回は Node や pnpm を切り替えられない（setup script で変えた PATH はセッションに残らず、guard も止める）ため
- 巡回は `REPO_PATROL=1` を置いた cloud environment でだけ動く。guard もこの変数があるときだけ判定するので、人のセッションには影響しない
- クラウドの GitHub プロキシは GraphQL を拒否する。スクリプトはすべて `gh api` の REST で書いてある

## 安全の考え方

巡回は持ち主の GitHub 権限で、人の承認なしに動く。ただし巡回は読み取りと報告、Dependabot の PR へのコメントだけをし、依存のコードを動かさない。guard（`guard.mjs`）は Claude のツール呼び出しを見て、巡回が使う形のコマンドだけを通す（許可リスト）。

- シェルの変数展開・グロブ・サブシェルなどは使わせない
- 実行できるのは、git の fetch と読み取り、決まった形の `gh api`、pnpm・npm の audit・why・view、読み取り系のコマンド、リポジトリにコミットされた `.claude/skills/*/scripts/` のスクリプトだけ。push・commit・install・run は止める。読めるのはリポジトリと `/tmp/repo-patrol/` の中だけ
- GitHub の読み書きは設定のリポジトリだけ。書き込みは Dependabot の PR へのコメントだけ（close とラベルは Actions の workflow が行う）
- ファイルの書き込みは `/tmp/repo-patrol/` だけ
- 1 回の実行の書き込みは、コメント 20 件・Slack 投稿 1 回まで。hook の `session_id` ごとに `/tmp/repo-patrol-guard/` で数える
- Dependabot の npm 系の PR には、Actions の `dependency-check` が check-diff（既存の依存の版の更新だけか）と、新しい版の公開者・install script・公開日の検査（`publisher-check.mjs`）をかける。workflow は `pull_request_target` で base の定義が動き、検査のスクリプトと設定も base のコミットから取り出すので、PR が検査を書き換えたり外したりできない。PR のコードは実行しない（git で読み、`npm view` はチェックアウトの外で npm のレジストリに問い合わせるだけ）

ただし guard は歯止めであって境界ではない。巡回が呼べるスクリプトから起動されたプロセスは止められない。

guard が効かなかったとき（hook が読まれない、仕様が変わる）の備えとして、導入するリポジトリごとに、人が次を設定する。

| 守るもの | 設定 |
|---|---|
| 既定ブランチ・本番ブランチへの直接の書き込み | ruleset: Require a pull request・Block force pushes・Restrict deletions。bypass list は空（github-actions も入れない） |
| 巡回が ruleset を外せないこと | GitHub との接続を Claude GitHub App 方式にする（`/web-setup` で手元のトークンを渡さない）。App はリポジトリ設定の権限を read しか持たない |
| Actions のトークン | Actions の既定のトークンを read にし、「Allow GitHub Actions to create and approve pull requests」を切る。close の workflow は、自分の `permissions` で Issue と PR の書き込みだけを得る |

ruleset が使えないプラン（Free の private リポジトリなど）では、巡回を入れない。

依存パッケージの悪意ある版は、巡回の中では動かない（巡回は install も run もしない）。Dependabot の PR の CI と、マージ後の環境では動くので、公開から 4 日待つこと（cooldown）と、dependency-check で公開者・install script・公開日を確かめることで確率を下げている。さらに絞りたいリポジトリでは、次も選べる（任意）。

- デプロイ用の secrets を environment に移し、deployment branch policy で使えるブランチを絞る
- 本番ブランチなどに「承認 1 件・bypass なし」を入れる（持ち主の普段の PR にも別の人の承認が要る）

## 準備（初回だけ）

1. claude.ai の Team Owner が、Scheduled tasks と GitHub 連携（ブラウザの GitHub App 方式）を有効にしていることを確かめる（https://claude.ai/admin-settings/capabilities）
2. https://claude.ai/customize/connectors で、GitHub がブラウザの App 方式で接続されていることを確かめる。`/web-setup` で接続していたら切断し、ブラウザで接続し直す
3. Slack アプリを作る。Bot Token Scopes は `chat:write` だけにする（`chat:write.public`・`chat:write.customize`・`channels:join` は付けない）。ワークスペースにインストールする。投稿先は各プロジェクトのチャンネルで、招待はリポジトリの導入のときに行う
4. 巡回は月曜には報告がなくても投稿する。月曜の朝にプロジェクトのチャンネルへ投稿がなければ、scheduled task の持ち主が https://claude.ai/code/routines で最終実行の日時と結果を確かめる

## リポジトリへの導入

1. 「安全の考え方」の表の設定を入れる
2. フィーチャーブランチでスキルをコピーする

   ```bash
   LF=<logical-fabrics/skills の clone>
   git -C "$LF" pull --ff-only
   git -C "$LF" diff --quiet HEAD -- .claude/skills/repo-patrol || echo "lf-skills に未コミットの変更がある"
   rsync -a --delete "$LF/.claude/skills/repo-patrol/" .claude/skills/repo-patrol/
   git -C "$LF" rev-parse HEAD > .claude/skills/repo-patrol/SOURCE
   mkdir -p .github/workflows
   cp .claude/skills/repo-patrol/workflows/*.yml .github/workflows/
   ```

   リポジトリの lint（Biome・ESLint・knip など）が `.claude/` を対象にしていれば、`.claude/skills/repo-patrol/` を対象外にする。

3. `.claude/settings.json` に guard を登録する（既存の hooks と並べる）

   ```json
   {
     "hooks": {
       "PreToolUse": [
         {
           "matcher": "^(Bash|Monitor|Edit|Write|MultiEdit|NotebookEdit|mcp__.*)$",
           "hooks": [
             {
               "type": "command",
               "command": "[ \"$REPO_PATROL\" = 1 ] || exit 0; node \"$CLAUDE_PROJECT_DIR/.claude/skills/repo-patrol/guard.mjs\" || exit 2",
               "timeout": 30,
               "onFailure": "block"
             }
           ]
         }
       ]
     }
   }
   ```

   - `|| exit 2` は、guard が起動できなかったときにも止める側に倒すため（`onFailure` に対応していない版の CLI でも効く）
   - matcher に `mcp__.*` を入れているのは、コネクタを外し忘れても GitHub などへの書き込みツールを使わせないため（guard は、規則のないツールを止める）。完全一致にしているのは、名前の一部が重なるほかのツールを巻き込まないため

4. `.claude/repo-patrol.md` を書く（下の「設定ファイル」）。Slack アプリをそのプロジェクトのチャンネルに招待する（`/invite @アプリ名`）
5. ラベル `keep` と `patrol-closed` を作る（`gh label create keep`、`gh label create patrol-closed`）
6. `.claude/skills/repo-patrol/scripts/stale.sh <owner/repo> list` で閉じる候補を出し、残したいものに `keep` を付ける。初回にまとめて閉じるものを人が確かめるため
7. `.github/dependabot.yml` の npm の更新に、cooldown 4 日と groups（minor・patch を 1 本）を入れる（下の例）。Dependabot アラートとセキュリティ更新を有効にする（推移依存の脆弱性は、巡回ではなく Dependabot のセキュリティ更新と人が直す）

   ```yaml
   - package-ecosystem: npm
     directory: /
     schedule:
       interval: weekly
     cooldown:
       default-days: 4
     groups:
       npm-minor-patch:
         patterns: ["*"]
         update-types: ["minor", "patch"]
   ```

8. PR を作り、CI が通ってからマージする。マージ後、Dependabot の npm 系の PR に `dependency-check` が付くことを確かめる。2 週間ほど誤検知がなければ、ruleset の required status checks に `dependency-check` を足す（人の PR では skip され、skip は required check を満たす）
9. https://claude.ai/code で、このリポジトリ用の cloud environment（例: `repo-patrol-<リポジトリ名>`）を作る。Personal のまま共有せず、巡回のほかには使わない
   - Network access: Trusted のまま（network secret のホストは許可リストなしで届く）。npm のレジストリ以外から取る依存（`package.json` に tarball の URL を書いたものなど）があれば、Custom にして「Also include default list of common package managers」にチェックを入れ、そのホストだけを Allowed domains に足す。ジョブのログの転送先（`*.blob.core.windows.net`）のような広いワイルドカードは足さない（誰でも作れる保存先へ書き出せる通り道になる）
   - Network secret: host `slack.com`、値は Slack のボットトークン。環境ごとに入れるので、トークンを替えたら全部の環境を直す
   - Environment variables: 下のように 1 行に 1 つずつ書く（読点・空白・引用符を入れない）。`REPO_PATROL=1` は手順 10 の確認のあとで足す（先に置くと、guard が確認のコマンドを止める）。`GH_TOKEN` や `GITHUB_TOKEN` は置かない

     ```text
     TZ=Asia/Tokyo
     BASH_DEFAULT_TIMEOUT_MS=600000
     ```

   - Setup script: 下の型を欄にまるごと貼り、先頭の 2 つの値だけを、このリポジトリの Node のメジャー（engines や CI と同じ）と、`packageManager` の pnpm の版に書き換える。pnpm を `packageManager` と同じ版にしておくと、pnpm の版の自動切り替えが起きない（古い pnpm から切り替わると lockfile が書き換わることがある）。Java などほかに要るものは後ろに足す。5 分を超えるとスナップショットされない

     ```bash
     #!/bin/bash
     set -euo pipefail
     NODE_MAJOR=26        # リポジトリの engines・CI と同じメジャー
     PNPM_VERSION=12.6.0  # packageManager と同じ版。pnpm を使わないなら空にする
     dir=/opt/patrol-node
     v=$(curl -fsSL https://nodejs.org/dist/index.json | jq -r --arg m "v$NODE_MAJOR." 'map(select(.version | startswith($m)))[0].version')
     f="node-$v-linux-x64.tar.xz"
     cd /tmp
     curl -fsSLO "https://nodejs.org/dist/$v/$f"
     curl -fsSL "https://nodejs.org/dist/$v/SHASUMS256.txt" | grep " $f\$" | sha256sum -c -
     mkdir -p "$dir"
     tar -xJf "$f" -C "$dir" --strip-components=1
     rm "$f"
     if [ -n "$PNPM_VERSION" ]; then
       "$dir/bin/npm" install -g --prefix "$dir" "pnpm@$PNPM_VERSION"
     fi
     # setup script で変えた PATH はセッションに残らないので、いま各コマンドが見つかる場所を差し替える
     default_bin=$(dirname "$(command -v node)")
     for tool in node npm npx pnpm; do
       [ -e "$dir/bin/$tool" ] || continue
       current=$(command -v "$tool" || true)
       ln -sf "$dir/bin/$tool" "$(dirname "${current:-$default_bin/$tool}")/$tool"
     done
     node -v
     if [ -n "$PNPM_VERSION" ]; then pnpm -v; fi
     ```

10. この環境で手動のクラウドセッションを開き（リポジトリはこの 1 つだけ）、次を確かめて記録する
   - `node -v`・`pnpm -v` が setup script で入れた版になっている（`java -version` は必要なリポジトリだけ）
   - `pnpm audit --json`（npm なら `npm audit --json`）が設定の「lockfile の場所」ごとに通る。失敗したら、手順 9 の Allowed domains を見直す
   - `gh api -i user` の応答の `X-OAuth-Scopes` の値が空である（App 経由。ヘッダーそのものは付く）。`repo` などの権限の名前が並べば `/web-setup` の個人トークンなので、「準備」の手順 2 に戻る
   - `curl -s https://slack.com/api/auth.test` が `"ok":true`
   - Dependabot アラートの API（`gh api repos/<owner>/<repo>/dependabot/alerts`）が使えるか
   - ジョブのログ（`gh api repos/<owner>/<repo>/actions/jobs/<id>/logs`）が取れるか
   - Claude Code の版（hook の `onFailure` は v2.1.295 以降）と、Bash 以外に GitHub に書き込めるツールがあるか
   - 終わったら Environment variables に `REPO_PATROL=1` を足し、新しいセッションで `git push --dry-run origin HEAD:refs/heads/develop` が guard に止められることを確かめる（値がちょうど `1` でないと guard は動かない）
11. scheduled task を作る（https://claude.ai/code/routines）
    - project からは作らない（project のスレッドはリポジトリの hooks を読まない）
    - リポジトリはこの 1 つだけ。環境は手順 9 で作ったもの。コネクタはすべて外す
    - スケジュール: 毎日、始業ごろ。ほかのリポジトリと 20 分ずつずらす（例: 09:00、09:20、09:40）。早朝にすると、@channel の通知が寝ている時間に届く
    - プロンプト:

      ```text
      .claude/skills/repo-patrol/SKILL.md を読んで、そのとおりに巡回する。設定は .claude/repo-patrol.md。
      これは無人の定期実行。マージ、本番昇格、リポジトリ設定の変更はしない。
      ```

    - 作ったら、CLI の `/schedule update` で、このタスクの使えるツールから WebFetch と WebSearch を外す（既定で入っていることがある。guard の対象外で、巡回では使わない）

12. Run now で実行し、トランスクリプトで次を確かめる
    - SKILL.md の手順 1 の guard の確認で、push が guard に止められている
    - 報告することがあれば、プロジェクトのチャンネルにボット名義で 1 回投稿される（新しい要対応があれば @channel が付く）。なければ、実行ログの最後に投稿しなかったことが書かれている（月曜なら「異常なし」が投稿される）
    - GitHub への書き込みが、Dependabot の PR へのコメントの範囲に収まっている
    - Actions の repo-patrol stale を `workflow_dispatch` で 1 回動かし、成功する（閉じる候補がなくても summary が出る）

## 設定ファイル（`.claude/repo-patrol.md`）

散文で、次の見出しを書く。巡回はこの内容に従う。guard は「リポジトリ」（`gh api` で読み書きできるリポジトリ）を、dependency-check は「差分に含めてよい追加のパス」（`- \`パス\`` の形の行）をこのファイルから読む。

```markdown
# repo-patrol の設定

## リポジトリ

owner/name

## Slack チャンネル

`C0XXXXXXXXX` か `#チャンネル名`（投稿先。ID はチャンネルの詳細画面の一番下にある）

## CI で待つワークフロー

testing, E2E Tests（ワークフローの `name:`。CI がなければ「なし」）

## lockfile の場所

- `pnpm-lock.yaml`
- `functions/pnpm-lock.yaml`（独立したプロジェクト）

## 差分に含めてよい追加のパス

- `biome.json`（biome を上げる PR に人が `$schema` を足したとき、dependency-check が通すように）

## 判断基準

見送り中の依存とその理由、止めて報告する条件、参照する既存の文書。なければ `references/dependency-triage.md` に従う。

## 巡回で許す操作

AGENTS.md などにある「既存コードの変更は指示がある場合のみ」は、巡回では次の操作について満たされたものとして扱う: Dependabot の PR への見送り理由のコメント。
```

Slack の宛先は「Slack チャンネル」に書いたものだけで、`slack-post.sh` がこのファイルから読む（巡回は `.claude` を書き換えられないので、宛先を変えられない）。チャンネル名はチャンネルの名前を変えると投稿が失敗するので、ID のほうが確実。ID も名前も秘密情報ではないが、public リポジトリでは公開されることに注意する。

## コピーの更新

正本を変えたら、`pnpm test:hooks` を通してから main に入れ、導入済みのリポジトリで「リポジトリへの導入」の 2（スキルと workflow のコピー）をやり直して PR を出す。`SOURCE` を見ると、どのリポジトリが古いかが分かる。

## 止める・戻す

止める（上から順に効く）:

1. 実行中のセッションを https://claude.ai/code で開いて止める
2. https://claude.ai/customize/connectors で GitHub を切断する（持ち主のほかのクラウドセッションも止まる）
3. Org Owner が、Claude GitHub App のインストール対象からリポジトリを外す
4. Slack アプリのトークンを revoke する
5. https://claude.ai/code/routines でタスクをオフにする（実行中のセッションは止まらない）
6. close や依存の検査を止めるときは、Actions の workflow を無効にする（`gh workflow disable "repo-patrol stale"`、`gh workflow disable "repo-patrol dependency check"`。required check に足していれば、先に ruleset から外す）

戻す:

- 閉じたものは `is:closed label:patrol-closed` で探して reopen する
- 巡回をやめるときは、`.claude/skills/repo-patrol/`・`.claude/repo-patrol.md`・`settings.json` の guard・`.github/workflows/repo-patrol-*.yml` を消す PR を出す

## 制約

- scheduled task は持ち主の claude.ai アカウントに属し、チームでは共有できない。持ち主が退職・休止すると止まる。この手順書で誰でも作り直せる
- 持ち主のサブスクリプションの利用枠を消費する
- scheduled tasks は research preview で、挙動が変わることがある。毎回の guard の確認と GitHub 側の設定で、変わっても安全側に倒れるようにしている
- Claude GitHub App には Dependabot アラートの権限がないので、アラートの API は 403 になる。巡回はアラートが読めるときも audit を取り、`audit-summary.mjs` で版ごとに直接依存か推移依存かを見る
- Actions のジョブログはクラウドから取れないことがある。その場合は失敗したステップ名とリンクを報告する
- Dependabot のセキュリティ更新は cooldown を待たずに来るので、公開から 4 日未満なら `dependency-check` が落ちる。4 日たってから人が re-run する（巡回は workflow を再実行しない）
- `dependency-check` は前の版と同じ install script を通す（毎回止めないため）。巡回は `references/dependency-triage.md` のとおり、install script のある版を要判断にする
