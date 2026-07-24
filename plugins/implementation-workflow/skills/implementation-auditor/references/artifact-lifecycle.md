# Artifact Lifecycle

成果物の置き場所、active plan、archive、cleanup の正本は planner の `../../implementation-planner/references/artifact-lifecycle.md`。ここには Audit lane 固有の差分だけを書く。

## Audit Lane Delta

- audit の一時メモを repo に残さない。`audit-2026.md`、`review-final.md`、`health-check-v2.md` のようなファイルを作らない。
- 重要 findings は active plan の `Quality Review Findings` または `Improvement Backlog` に統合する。
- 軽い audit はチャットで返す。継続的に追うべき findings がある場合だけ active plan に接続する。
- 人間向け説明が必要な場合だけ `abstract-plan.html` の更新を提案する。
