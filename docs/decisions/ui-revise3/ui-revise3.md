# UI の見直し（3回目）の判断ログ（ui-revise3）

計画：`ui-revise3/plan.md`。ここには、計画とユーザーの指示に書かれていない判断を書く。作業中に親から届いたユーザーの追加の指示（VR & 3D に実際の商品を1つ追加する。2026-10-22）も、このスコープで行った（UR3-7）。

## UR3-1 ヒーロー：見出しの大きさと太さ、リンクボタンの形

- 決めたこと：
  - `h1`「昼はカフェ。夜はバー。」は本文と同じ Noto Sans JP、太さは liblab のヒーローの見出しと同じ `font-semibold`。大きさは `text-3xl`（`sm` 以上は今までどおり `text-4xl`）。シンボルは残した
  - サブテキストの `p` と `messages.profile.bio` を消した。`src/config/profile.ts` はツールのページの JSON-LD が使うので残した
  - ボタンは見出しの下に GitHub・BOOTH の順で横に並べた（`site.links.github`・`site.links.booth`、新しいタブ）。形は丸いピル（`rounded-full`、白の半透明に細い枠。ダークは `atom-one-dark-light`）。2つとも同じ見た目で、どちらかを主にしていない
- 根拠：375px で `text-4xl`（36px × 11文字）は1行に収まらず、「。」だけが2行目に落ちる。`text-3xl` なら1行に収まる（E2E の `ui-revise3 1: the hero` で幅 375px と 1280px で1行であることを確かめる）。ボタンの形は、波形のグラデーションの上で読める色を選んだ
- 他の選択肢：375px でも `text-4xl` のまま2行にする。ボタンを GitHub だけ濃い色にする
- 戻すときの作業：`index.astro` のクラスを変える

## UR3-2 フッター：Links のグループを中央の列の右端に寄せた

- 決めたこと：中央の列（`2fr`）の中にあった2列のグリッドをやめ、Links のグループを中央の列に直接置いて `md:justify-self-end` にした。Links の右端が中央の列の右端に揃い、Support との間は列の間隔（`lg:gap-12`）だけになる。`md` 未満（1列）は今までどおり左
- 根拠：計画の2の2「今よりさらに右に詰める（右端に揃える）」を、中央の列の中での右端と解釈した（UR2-4 で「他の選択肢」にしていた形）
- 他の選択肢：フッター全体の右端に Links と Support をまとめて寄せる（右の列を `justify-self-end` にする）
- 戻すときの作業：`Footer.astro` の Links を前の `sm:grid-cols-2` の枠に戻す

## UR3-3 カード：liblab のツールカードに合わせたところと、改善で変えたところ

計画の3の2「liblab のツールカードに完全に合わせる」の「そのうえで」改善する、という順なので、両方が食い違うところは改善を優先した。

- liblab（`tool-card.tsx`）と同じにしたもの：ホバーのアニメーション（背景が `transition-colors` で `gray-100`、ダークは `atom-one-dark-light` に変わる。150ms、`cubic-bezier(0.4, 0, 0.2, 1)`。浮き上がりと影はない）、キーボードのフォーカスでも同じ背景（liblab の `focus-visible:bg-gray-100` を、タイトルのボタンにフォーカスがあるとき `has-[button:focus-visible]` で出す）、カードの余白 `p-4`、カードの角丸（0.5rem）、タイトルの `font-semibold`、説明文の色（`gray-600` / `gray-400`）、Apps のアイコンの背景色（`bg-logo-medium/70`）
- 改善で変えたもの：
  - アイコンの背景の形：liblab の円（`rounded-full`）から、写真のカードと同じ角丸のトークン（UR3-4）の角丸の四角にした。共通化のルールの「角丸：写真のカードとアイコンの背景で、共通のトークンを使う」に従った。**ここは「アイコンの背景を含めて liblab に合わせる」と直接食い違うので、親に確認してほしい**（円に戻すなら `WorkIcon.astro` の `cardRadius` を `rounded-full` に戻し、テストの角丸の確認からアイコンを外す）
  - 並び：liblab はアイコンとタイトルを1行に並べ、説明文をその下に置く。アイコン（`size-10` → `size-12`）を左に置き、右の1列にタイトルと年、要約、操作のリンクを縦に並べた（間隔は `gap-4` と `gap-2`）。「アイコンと文章の間隔を調整して、行全体が1つの作品として見えるようにする」の解釈
  - 文字：タイトル `text-lg`（liblab は 16px）、要約 `text-base`（liblab は `text-sm`）。タイトルの色は liblab では本文の色（指定なし）だったが、写真のカードと揃えて `gray-900` / `white` にした
  - カードの間隔：`gap-3`（12px）から `gap-4`（16px）。8px を基準にした間隔のため
  - 年を出した（計画の「親の判断」）
  - キーボードのフォーカスの輪：liblab のツールカードは `outline-none` で、フォーカスは背景の色だけで示していた。共通化のルールの「フォーカス」に合わせ、リスト型にも写真のカードと同じ輪（タイトルのボタンの `::after` に `sky-500` の 2px の `outline`、外側 2px）を足した。背景の色（liblab の形）も残している
- 写真のカード（DIY Keyboards、VR & 3D）は、ホバーで浮き上がって影が付く今の形を残した。共通化のルールの「ホバーの表現を統一」は「詳細へのリンク」の行にあるので、リンクの表現だけを揃えた
- 戻すときの作業：`ToolCard.astro`・`WorkIcon.astro`・`WorkList.astro` を前のコミットの形に戻す

## UR3-4 共通化のルールの実装

- 決めたこと：
  - クラスを `src/components/works/card-classes.ts` に集めた（`cardTitle`・`cardSummary`・`cardLink`・`cardRadius`・`focusRing`）。写真のカード（`FrameCard`・`FeaturedCard`）とリスト型（`ToolCard`）の3つが同じ定数を使う
  - タイトル：太さ `font-semibold`、色 `gray-900` / `white`。大きさは揃えない（リストと写真のカードは `text-lg`、大きなカードは `text-2xl sm:text-3xl`）
  - 要約：`text-base`（16px、行の高さ 24px）、色 `gray-600` / `gray-400`。写真のカードの要約も `text-sm` から `text-base` にした
  - リンク：操作のリンクと「詳しく見る」を同じ色（`logo-dark` / `logo-light`）、同じシェブロン（›）にした。ホバーでシェブロンが右に動き、下線が付く。操作のリンクは自分のホバーで、「詳しく見る」はカードのホバーで動く（「詳しく見る」はカード全体のボタンの一部のため）
  - 角丸：テーマに `--radius-card: 0.5rem`（クラス `rounded-card`）を足し、写真のカード、リスト型の項目、アイコンの背景（カードと詳細の両方）に使った。大きなカードは `rounded-xl` から `rounded-card` にした。詳細のダイアログ（`rounded-xl`）はカードではないので変えていない
  - 余白：カードの中の余白と間隔を 8px の倍数にした（`gap-1.5`・`gap-3`・`p-5`・`pt-1` をやめた）。サブ分類のラベルの内側（`px-2.5 py-0.5`）とリンクの文字とシェブロンの間（`gap-0.5`）は部品の中なので対象外にした
  - フォーカス：カードはタイトルのボタンの `::after` の輪（`sky-500`、2px、外側 2px）、操作のリンクも同じ輪にした
- テスト：`portfolio.test.js` の `ui-revise3 3: the photo cards and the list items share ...`（クラス）と、`works.spec.js` の `ui-revise3 3: the cards › {light,dark}: the photo cards and the list items share ...`（計算後のスタイルを、大きなカード・写真のカード・VR & 3D・Libraries・Apps の5枚で比べる）、`spacing in the cards is on the 8px grid`、`the links move their chevron on hover ...`
- 戻すときの作業：`card-classes.ts` の定数と `global.css` の `--radius-card` を変える

## UR3-5 カードの操作のリンク

- 決めたこと：
  - カードの最後の行に、操作のリンクを並べ、その後ろに「詳しく見る」を置いた（`CardLinks.astro`）。Libraries は「ドキュメント」「npm」（または「PyPI」）の順（計画の書き順）。リンクは `relative z-10` でタイトルのボタンの覆い（`::after`）より手前にあり、クリックするとその場所へ直接飛ぶ（詳細は開かない）。外部のリンクは新しいタブ
  - 操作のリンクの名前は、ボタンの名前と同じ考えで見える文字（「npm」など）のまま。どの作品のリンクかは、タイトルの文字（ボタンの中の `span`）を `aria-describedby` で結んで伝える（`ui-revise3 3: an action goes to its place directly ...` で「ドキュメント」の説明が「tkinter-unblur」であることを確かめる）。ボタン自身を指すと、ボタンの名前（タイトルと「詳しく見る」）が説明になってしまうため、タイトルの `span` に `id`（`work-{id}-name`）を付けた
  - リンクの名前は `work-links.ts` で、リンクの種類（ツール、npm、PyPI、BOOTH）をURLから1つの関数で決め、1つの名前の表を引く。カードと詳細は同じ関数 `linksOf` を使うので、リンク・文言・並びが同じになる。今までどおり、決まっていない組み合わせはビルドを止める
  - 詳細のダイアログのリンクの文言は、親の判断（2026-10-22）でカードに揃えた。同じリンクは同じ文言（Apps「ツールを使う」、npm「npm」、PyPI「PyPI」、BOOTH「BOOTH で見る」、ドキュメント「ドキュメント」）。前の「ツールを開く」「npm で見る」「PyPI で見る」は消した。並びもレビューの任意の指摘を受けてカードに揃え、詳細でも「ドキュメント」を先にした（前は詳細だけ npm・PyPI が先）。作品のカードと詳細はトップ（日本語だけ）にしかないので、英語の文言はない。`portfolio.test.js` の `ui-revise3 (parent): the card and the details have the same links, labels and order` で、すべての作品のカードと詳細のリンク（URL と文言）が、並びまで一致することを確かめる（揃える前のビルドで落ちることを確認済み）
- 他の選択肢：操作のリンクを「詳しく見る」の後ろに置く
- 戻すときの作業：各カードから `CardLinks` を外して `MoreLabel` に戻す

## UR3-6 VR & 3D の見出しの横の BOOTH ショップのリンクを消した

- 決めたこと：計画の3の1。使わなくなった文言 `messages.links.shop`（「BOOTH ショップ」）も消した。BOOTH へはヒーローのボタンとフッターの Links から行ける
- 戻すときの作業：`index.astro` の見出しの横のリンクと文言を前のコミットから戻す

## UR3-7 VR & 3D の実際の商品（ユーザーの追加の指示）

- 決めたこと：
  - 作品 ID は `mururu-blink-lipsync`。VR & 3D の先頭（ダミーの3件の前）に置いた。サブ分類は Unityツール、リンクは `https://unlibra-vrc.booth.pm/items/9009879`（カードの操作と詳細はどちらも「BOOTH で見る」）
  - 画像は受け取ったファイル（1200×1200 の WebP）をそのまま `src/assets/works/third-party/mururu-blink-lipsync.webp` に置いた（中身が同じことを `cmp` で確かめた）。表示はほかの作品と同じく `astro:assets` の `<Image>` を通すので、出力のファイルは Astro が同じ大きさの WebP に変換したものになる（ほかの写真と同じ扱い。中身は加工していない）
  - 画像の切り抜き：カードの枠は 4:3、詳細は `sm` 以上で 16:9 なので、正方形の画像は上下が切れる。中央で切ると右上の「©Lethal Cats」が見えなくなるため、`Work` に `imagePosition?: "top"` を足し、この作品だけ上を基準に切り抜く（`object-top`）。ほかの写真は今までどおり中央（`object-center`）
  - ホバーの拡大（親の判断、レビューの推奨の指摘）：写真のカードはホバーで画像を 1.03 倍にするが、上を基準に拡大しても右上の「©Lethal Cats」の右端が枠の外に出て切れた（右の余白は約 0.7%）。`src/assets/works/third-party/` の画像（他の作者の素材）はホバーで拡大しないことにし、`Work` に `thirdPartyImage?: true` を足して、この作品に付けた。`cards.ts` の `photoHover` が、付いた作品では拡大のクラスを出さない。カードの浮き上がりと影はほかの写真のカードと同じ。前に入れていた `origin-top` は不要になったので外した
- 根拠：作者の表示を隠さないため。画像を4:3に作り直すのは「加工しない」に反する
- 他の選択肢：この作品だけ `object-contain` で余白を付けて全体を出す。カードを正方形にする
- 確かめたこと：幅 375px と 1280px で、ホバーしていないカードの右上に「©Lethal Cats」が見えることを撮って目で確かめた。ホバー中に拡大しないことは、下の E2E で確かめる
- テスト：`portfolio.test.js` の `ui-revise3 (user): the BOOTH product: its card, details, link and image`、`D4: the VR & 3D section has the real product first, ...`、`license.test.js` の `ui-revise3 (user): the BOOTH image with other creators' material is in the third-party directory that section 3 excludes`。拡大しないことは、`portfolio.test.js` の `ui-revise3 (parent): only the images with other creators' material are not zoomed on hover`（`works.ts` で third-party/ の画像を使う作品と `thirdPartyImage` の付いた作品が一致すること、ページでその作品の画像だけに拡大のクラスがないこと）と、`works.spec.js` の `ui-revise3 (parent): an image with other creators' material is not zoomed on hover; ...`（ホバー中の計算後の `scale` と `transform` が `none`。比べる対象としてダミーの写真は 1.03 になる）
- 戻すときの作業：`works.ts` の項目と import、`ja.ts` の文言、画像を消す。`imagePosition` を消すなら `cards.ts` の `photoPosition` と3つの部品の呼び出しも消す。拡大を戻すなら `thirdPartyImage` と `photoHover` を消す

## UR3-8 `_redirects`：末尾スラッシュ付きの旧ツールURLを、ツールごとの静的なルールにした

- 原因：
  - 公式ドキュメント（`https://developers.cloudflare.com/workers/static-assets/redirects/`）には「同じ source のルールが複数あれば上のものが使われる」「順番は意味がある」「静的なルールは動的なルールより前に書く」とあるだけで、動的なルール（プレースホルダーとスプラット）どうしの評価順は書かれていない
  - wrangler 4.151.3 の `constructRedirects`（`node_modules/wrangler/wrangler-dist/cli.js`）は、`_redirects` を静的なルール（`staticRules`、source → `{ status, to, lineNumber }`）と動的なルール（`rules`、source → `{ status, to }`）の2つのオブジェクトにしてアップロードする。動的なルールには行番号がなく、順番はオブジェクトのキーの順だけで運ばれる。`wrangler dev`（miniflare の asset worker）は、そのオブジェクトを `Object.entries` の順（＝ファイルの順）に試すので、`/lab/ja/:tool/` が `/lab/ja/*` より先に当たる
  - 本番（workers.dev）では `/lab/ja/favicon-generator/` が `/lab/ja/*` に当たって `/lab/favicon-generator/` に転送された。つまり本番はファイルの順を保っていない。結果は、動的なルールを source の文字コード順（`*` は `:` より前）に並べたときと一致する。本番の内部の並べ方は公開されていないので、これは推定。静的なルールが動的なルールより先に試されることは、ドキュメント・wrangler・miniflare の実装で一致している
- 決めたこと：`/lab/ja/:tool/`・`/lab/en/:tool/` の2つの動的なルールをやめ、ツールごとの静的なルール（`/lab/ja/favicon-generator/ /lab/favicon-generator 301` など、4ツール × 2言語の8行）にした。残る動的なルールは `/lab/ja/*`・`/lab/en/*` の2つで、互いに重ならないので、評価順に関係なく結果が決まる。消したイロメイドの末尾スラッシュ付きURLは、スプラットで `/lab/iromide/` に転送され、その先で 404 になる（前と同じく 404 で終わる。回数は気にしない）
- E2E が見逃した理由：E2E（`site.spec.js`）は `wrangler dev` に対して流しており、`wrangler dev` は動的なルールをファイルの順に試す。本番と評価順が違うことは、ローカルの実行では再現しない。単体テスト（`redirects.test.js`）の `resolve` も「動的なルールはファイルの順」という前提で書いていた
- テスト：`redirects.test.js` の `resolve` を、動的なルールをファイルの順・逆順・source の文字コード順の3通りで評価し、結果が1つでも違えば落ちるようにした（既存のすべての確認がこの3通りで行われる）。`ui-revise3 4: the result does not depend on the order of the dynamic rules, as in production` で、残った動的なルールが重ならないこと、テストのツールの一覧が `dist/` のツールのページと同じであること（静的なルールの書き漏れを防ぐ）を確かめる。前の `_redirects`（`:tool` のルールあり）の `dist/` に対して、このテストと `G2: former URLs reach the new URL in one hop ...` が落ちることを確かめた
- 他の選択肢：スプラットのルールを `/lab/ja/:tool` のプレースホルダーにして、末尾スラッシュあり・なしの2つのプレースホルダーのルールにする（重ならないが、設計書 3.2 の `/lab/ja/*` の形が変わり、2階層以上のURLが転送されなくなる）
- 戻すときの作業：`public/_redirects` の8行を前の2行に戻し、`redirects.test.js` の `DYNAMIC_ORDERS` を外す
- ツールを足すときは、`_redirects` にその2行を足す必要がある（足し忘れると上のテストが落ちる）
- `site.spec.js` の `sample` にある `:tool` の分岐は使われなくなったが、害はないので残した
- 確かめたこと（M4）：コミット `d66a2a8` のビルドを `npx wrangler deploy` で Worker `unlibra-com`（`https://unlibra-com.not-inbox.workers.dev`）に出し直した（`wrangler.jsonc` は変えていない）。`npm run check:prod -- https://unlibra-com.not-inbox.workers.dev` は失敗 0 件、警告 1 件（Web Analytics の計測タグ。想定どおり）。末尾スラッシュ付きの旧ツールURL（4ツール × 2言語）はすべて1回の 301 で新URLに届く。`/lab/ja/iromide/` は `/lab/iromide/` に転送される（その先は 404）

## 直した既存のテストと理由（M1）

| テスト                                                                                                               | 直した内容と理由                                                                                                                                |
| -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `portfolio.test.js` の `ui-revise 1, ui-revise2 4, 5: the hero has the symbol, the name and the subtitle`            | `ui-revise3 1: the hero has the symbol, the h1 in the body font and the GitHub and BOOTH buttons` に置き換えた（指示1）                         |
| `portfolio.test.js` の `ui-revise 5: the profile has no GitHub button`                                               | main の GitHub へのリンクはヒーローのボタンの1つだけ、にした（指示1の3）                                                                        |
| `portfolio.test.js` の `D4: the VR & 3D section has one dummy work per subcategory and the shop link`                | 見出しの横のショップのリンクがないことを見るようにした（指示3の1）。実際の商品を先頭に足し、ダミーの確認はダミーだけにした（UR3-7）             |
| `portfolio.test.js` の `ui-revise2 3: Apps and Libraries use the tool card, ...`                                     | アイコンの背景の `rounded-full` を `rounded-card` にした（UR3-3・UR3-4）                                                                        |
| `portfolio.test.js` の `ui-revise2 3: every card shows its one-line summary and opens its details`                   | 浮き上がりと影の確認を写真のカードだけにし、リスト型にはないことを見る（指示3の2、liblab のホバー）。作品の数を 14 から 15 にした（UR3-7）      |
| `portfolio.test.js` の `D5: the three documentation links point to docs.unlibra.com`                                 | ドキュメントのリンクがカード（操作）と詳細に1つずつあることを見るようにした（指示3の操作）                                                      |
| `portfolio.test.js` の `ui-revise2 (parent): the top page's description is the footer's description`                 | 新しい説明文にした（指示2の1）                                                                                                                  |
| `redirects.test.js` の `resolve`（`G2` の各テストが使う）                                                            | 動的なルールを3通りの順で評価し、結果が一致することも見るようにした（強める変更。指示4、UR3-8）                                                 |
| `portfolio.test.js` の `ui-revise2 3: the details link to where each work is published`                              | 詳細のリンクの文言を「npm」「PyPI」「ツールを使う」にし、Libraries の並びを「ドキュメント」が先にした（親の判断とレビューの任意の指摘。UR3-5）  |
| `works.spec.js` の `Enter on the focused title opens the details; ...`                                               | 詳細のリンクの名前を「ツールを使う」にした（親の判断。UR3-5）                                                                                   |
| `tools.test.js` の `E8: the tools are linked from the top page in Japanese, not from the header`                     | トップから日本語のツールのページへのリンクを1つから2つ（カードの「ツールを使う」と詳細）にした（指示3の操作）                                   |
| `layout.test.js` の `ui-revise2 2: the footer's Links group sits in the right half of the center column`             | `ui-revise3 2: ... at the right end of the center column`（`md:justify-self-end`）にした（指示2の2）                                            |
| `layout.test.js` の `ui-revise2 7, 8: the footer's description and link labels`                                      | 日英の説明文を新しい文面にした（指示2の1）                                                                                                      |
| `layout.test.js` の `ui-revise2 4: the logotype is in LINE Seed JP everywhere it is shown, and only there`           | ヒーローをロゴタイプの場所から外し（3か所）、`h1` に `font-brand` と `data-logotype` がないことを見るようにした（指示1の1）                     |
| `works.spec.js` の `ui-revise2 2: the footer's Links group is in the right half of the center column`                | `ui-revise3 2: ... at the right end of the center column`（Links の右端が中央の列の右端に揃う）にした（指示2の2）                               |
| `works.spec.js` の `ui-revise2 4: the header, the mobile menu, the footer and the hero show unlibra in LINE Seed JP` | ロゴタイプを3か所にし、ヒーローの `h1` が本文のフォントであることを見るようにした（指示1の1）                                                   |
| `works.spec.js` の `every card says it opens details, and lifts on hover`                                            | 名前を `... the photo cards lift on hover` にした（浮き上がりの確認は前から写真のカードの botsu だけ）。カードの数を 14 から 15 にした（UR3-7） |

## 新しい文言（すべて仮の文面、M5）

| 場所                                           | 文言                                                                                                                                     |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| ヒーローのボタン                               | GitHub / BOOTH                                                                                                                           |
| フッターの説明文（英語のページ）               | A site that collects my personal products. By day a builder at my job; by night I make DIY keyboards, libraries, apps, VR & 3D and more. |
| カードと詳細のリンク（Apps）                   | ツールを使う                                                                                                                             |
| カードと詳細のリンク（Libraries）              | ドキュメント / npm / PyPI                                                                                                                |
| カードと詳細のリンク（VR & 3D）                | BOOTH で見る                                                                                                                             |
| 実際の商品のカードの一行の要約（親の仮の文面） | ムルルにまばたきとリップシンクを追加する Unity ツール                                                                                    |
| 実際の商品の年（親の仮。ユーザーに確認中）     | 2026                                                                                                                                     |

ヒーローの見出し、日本語のフッターの説明文、実際の商品のタイトルと説明は、ユーザーの文面どおり。トップの meta description は日本語のフッターの説明文と同じ（`messages.site.description` がフッターの文言を参照する）。「ドキュメント」「BOOTH で見る」は既存の文言を使った。
