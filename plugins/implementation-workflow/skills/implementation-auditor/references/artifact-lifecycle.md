# Artifact Lifecycle

Audit は成果物を増やすために行わない。次セッションが迷わない状態を作る。

原則:

- 既存 repo に慣習がある場合はそれを優先する。
- 慣習がない場合、永続化する改善 plan は `docs/implementation/current.md` に集約する。
- audit の一時メモを repo に残さない。
- `audit-2026.md`、`review-final.md`、`health-check-v2.md` のようなファイルを乱立させない。
- 重要 findings は active plan の `Quality Review Findings` または `Improvement Backlog` に統合する。
- 完了または棄却した改善 plan は `docs/implementation/archive/` に薄く残す。

Default output:

- 軽い audit はチャットで返す。
- 継続的に追うべき findings がある場合だけ active plan に接続する。
- 人間向け説明が必要な場合だけ `abstract-plan.html` の更新を提案する。

