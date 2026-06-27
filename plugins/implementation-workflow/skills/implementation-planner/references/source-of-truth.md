# Source of Truth

判断の優先順位:

1. ユーザーの最新依頼。
2. ユーザーが明示した plan file、scope、attached artifact。明示 plan も現在の repo 実態と照合して使う。
3. 現在の repo、docs、schema、tests、UI、config。
4. 既存 repo の計画置き場、active plan、運用慣習。
5. `docs/implementation/current.md`。repo 慣習がない場合の既定 anchor として扱う。
6. 現在の公式 docs、Context7、一次情報。
7. ライブシステム。ただし必要な場合のみ。
8. 過去の plan、memory、historical notes。必ず検証対象として扱う。

古い plan、古い docs、既存 skill の文言は source of truth ではない。現在の repo とユーザーの最新意図に照合してから使う。

`docs/implementation/current.md` は便利な既定 anchor だが、ユーザー明示 plan、現在の repo、既存 repo 慣習を上書きしない。
