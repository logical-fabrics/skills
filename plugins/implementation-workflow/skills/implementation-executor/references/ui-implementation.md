# UI Implementation

実装時は planner の `references/ui-ux.md` を canonical rubric として扱う。この file は、その基準を実装中の判断と完了前 QA に落とすための checklist。

## Build Rules

- 既存 design system、命名、layout、component pattern を優先する。
- 未確定または greenfield の技術選定は plan / default stack に従う。
- 日本語 UI、mobile / desktop、loading / empty / error / success / disabled / permission を実装範囲に含める。
- 内部用語、DB 項目、分類名、backend 処理名を露出しない。
- AI を入れる場合は、入力負荷、言語化負荷、認知負荷、比較負荷、回復負荷のどれを下げるかを実装上説明できる状態にする。

## During Implementation

- 画面ごとに、ユーザーが何を理解し、何を判断し、操作後に何が起きるかを component / copy に反映する。
- 主要 CTA は、判断材料を読んだ直後に届く位置に置く。フッターだけ、遠い sidebar だけに逃がさない。
- 同じ意味の操作を複数ラベルで出さない。同じラベルのボタンを複数置く場合は、役割差または同一結果を明確にする。
- UI copy は、保存、分類、処理ではなく、操作後の状態、通知、共有範囲、戻せるかを中心に書く。
- 操作成功後は、対象がキューから外れる、次の対象へ進む、完了状態になる、親一覧へ戻る、通知/共有/送信の有無が分かる、undo できる、のどれかが画面上で分かるようにする。
- 「保留」など、押しても業務上何も変わらない操作は出さない。必要なら「あとで見る」「pin」「リマインド」など実質的な機能にする。
- 目的達成に必須でない入力は任意にし、「理由」ではなく「メモ」「補足」「相手に伝えたいこと」などユーザー目的に沿う label にする。
- validation は入力を失わせない。何をどう直せばよいかを field 近くに示す。
- undo、cancel、back、escape、復元、下書き保存が必要な操作では、それを UI と state に実装する。

## Completion QA

- 画面上の component、文言、アイコン、グラフ、表、状態表示を一つずつ確認し、ユーザー価値を説明できないものを削る。
- screenshot で desktop / mobile、長い日本語、狭いコンテナ、主要 CTA、フォーム、エラー、empty を確認する。
- 操作後に対象、状態、次アクションが変わって見えるかを確認する。キュー型 UI では次対象表示、一覧からの除外、完了状態、戻り先を確認する。
- desktop で関連情報と操作が離れすぎていないか、視線移動とマウス移動が過剰でないかを見る。
- mobile で主要 CTA が内容から遠すぎないか、tap target が小さすぎないか、説明ボタンが長すぎないかを見る。
- keyboard 操作、focus、label、role、contrast、target size、form error を確認する。
- browser back、reload、direct URL、URL share で期待状態に戻ることを確認する。
