# エージェント向け指示

このリポジトリは、Logical Fabrics の Codex / Claude Code 共通プラグインの正本です。

- plugin、skill、marketplace の挙動を変える前に `CONTRIBUTING.md` を読む。
- plugin manifest、skill discovery、command 露出、配布挙動を変える前に `docs/release-process.md` を読む。
- この repo の運用ルールは外部 memory に頼らず、この repo 内に残す。
- Codex と Claude Code の挙動は、意図した host 固有差分を docs に明記する場合を除き揃える。
- 長時間・複数 slice・検証ループを前提にする実行作業では、Codex / Claude Code の `/goal` を使う。Goal は短く、目的・成功条件・制約・検証条件に絞る。
- 配布済み plugin の内容を変えたら plugin version を bump し、`docs/release-process.md` の release checks を実行する。
- この repo は public。ファイルだけでなく、コミットメッセージ、PR・Issue の本文とコメントにも、非公開リポジトリの名前と PR 番号、取引先名、Slack の ID、他リポジトリの脆弱性の状況（パッケージの版・advisory ID）、ディレクトリ構成やリポジトリ設定を書かない。他リポジトリでの事例は「導入先 A」のように伏せ、版や ID は一般化して書く。
