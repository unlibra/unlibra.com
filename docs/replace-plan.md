# unlibra.com リプレイス計画

ポートフォリオサイト（me）とツールサイト（liblab）を、me リポジトリ1つに統合する。この文書は設計書とフェーズ計画を兼ねる。ここに書いた「確定事項」は合意済み、「未決」は未合意である。

## 1. 目的

1. liblab を廃止し、残すWEBツールをポートフォリオの一カテゴリとして統合する
2. me のデザインを X オマージュから liblab のデザインベースに変更する
3. Vercel をやめて Cloudflare に一本化する
4. BOOTH で販売している VRChat 関連アイテムを実績に追加する
5. ドキュメントへのリンクを `docs.unlibra.com` に変更する
6. フォントとロゴを変更する

## 2. 現状（2026-10-21 時点）

- `unlibra.com` は Cloudflare のプロキシ経由で Vercel から配信されている（`x-vercel-id` ヘッダーで確認）
- `/lab/*` は me の `vercel.json` から `unlibra-lab.vercel.app` へ rewrite されている
- liblab のバックエンド（FastAPI、Vercel 上）を使っているのはイロマイドだけ
- me のフレームワークは Astro 5.16 + Tailwind v4、liblab は Next.js 16 + Tailwind v3

## 3. 確定事項

### 3.1 フレームワークと配信

- Astro を継続し、ツールは `@astrojs/react` の island として載せる。Astro は Phase 2 の前に 7 系へ上げる（2026-10-21 時点の最新は 7.4.1）
- Tailwind CSS v4
- Cloudflare Workers の静的配信（Static Assets）で配信する。Worker のスクリプトは持たない
- リダイレクトは `public/_redirects`、レスポンスヘッダーは `public/_headers` で設定する
- URL の末尾スラッシュは付けない（現行 me と同じ `trailingSlash: "never"`）
- 言語の自動振り分け（Accept-Language による判定）は行わない。言語切替ボタンだけにする
- アクセス解析は Cloudflare Web Analytics に置き換える。`@vercel/analytics` は削除する
- 削除するもの：`vercel.json`、`middleware.ts`、`src/middleware.ts`、`functions/`、`public/sitemap.xml`（静的ファイル版）
- ミラーサイトの仕組みは廃止する。サイトURL・サイト名・プロフィール名などは環境変数で切り替えず、コード上の定数にする。対象は `.env.example` にある `PUBLIC_SITE_URL`、`PUBLIC_SITE_TITLE`、`PUBLIC_PROFILE_NAME`、`PUBLIC_PROFILE_USERNAME`、`DISABLE_ROBOTS` と、`site.url` と `site.canonicalUrl` の区別

### 3.2 URL

| 対象                               | URL              |
| ---------------------------------- | ---------------- |
| ポートフォリオ（日本語のみ）       | `/`              |
| プライバシーポリシー（日本語のみ） | `/privacy`       |
| ツール（日本語・既定）             | `/lab/{tool}`    |
| ツール（英語）                     | `/en/lab/{tool}` |
| Just HEX（英語のみ）               | `/hex`           |

`{tool}` は `favicon-generator`、`svg-optimizer`、`password-generator` の3つ（TW Palette Generator は 2026-10-23 にユーザーの指示で廃止。`docs/decisions/remove-tw-palette/`）。ツール一覧ページ（`/lab`、`/en/lab`）は、ユーザーの最終UIチェックの指示で廃止した（2026-10-21、`docs/decisions/ui-revise/`）。Just HEX（`/hex`、2026-10-25 に追加）はルート直下に置き、色のシェア用の `/hex/{hex}` は Worker が返す（`docs/decisions/just-hex/`）。ツールへの入口はトップの Apps のセクション（`/#apps`）とヘッダー（2026-10-22 にカテゴリ名を変更。`docs/decisions/ui-revise2/`）。

旧URLからの301リダイレクト：

| 旧URL                                                        | 新URL            |
| ------------------------------------------------------------ | ---------------- |
| `/ja`                                                        | `/`              |
| `/en`                                                        | `/`              |
| `/lab/ja`                                                    | `/#apps`         |
| `/lab/ja/*`                                                  | `/lab/:splat`    |
| `/lab/en`                                                    | `/#apps`         |
| `/lab/en/*`                                                  | `/en/lab/:splat` |
| `/lab`、`/en/lab`（Phase 4 で作った一覧。2026-10-21 に廃止） | `/#apps`         |

廃止したイロマイド（`/lab/{ja,en}/iromide`）と TW Palette Generator（`/lab/{ja,en}/tw-palette-generator`）は個別に扱わない。上の一括ルールで転送され、転送先が存在しないので404になる。新URL（`/lab/tw-palette-generator`、`/en/lab/tw-palette-generator`）も404になる。

### 3.3 多言語

- ポートフォリオは日本語のみ。ロケール付きのページ（`src/pages/[locale]/`）はやめる
- ツールは日本語（既定、接頭辞なし）と英語（`/en` 接頭辞）
- ヘッダーとフッターは、ツールのページで使うため日本語版と英語版を用意する
- ツールのページには hreflang（ja / en / x-default=ja）を出す

### 3.4 WEBツール

- 残す：Favicon Generator、SVG Optimizer、Password Generator
- 廃止：イロマイド、liblab のバックエンド、TW Palette Generator（2026-10-23 ユーザーの指示。移植したあとに撤去した）
- liblab の `src/components/ui/spinner.tsx` に含まれる Vercel 由来のコード（Apache-2.0）はイロマイドでしか使っていないので、移植しない

### 3.5 デザイン

- liblab のデザインをベースにする（ヘッダー、フッター、カード、色トークン `atom-one-dark`。liblab の `logo-*` の水色は 2026-10-23 に整理し、空色のテーマカラー `primary-light`・`primary` と `link` にした（`DESIGN.md` 3、`docs/decisions/ui-revise13/`）、ダークモード切替）
- 本文フォントは Noto Sans JP（`@fontsource-variable/noto-sans-jp`、自前ホスティング）
- ロゴシンボルは `unlibra.github.io` リポジトリの `brand/symbol.svg`。favicon と OGP 画像もこれをもとに作り直す
- LINE Seed JP はロゴタイプ「unlibra」に使う（ui-revise2 で決定。使う7文字だけのサブセット、OFL）

### 3.6 ポートフォリオのコンテンツ

- 作品カテゴリ：DIY Keyboards / Libraries / Apps / VR & 3D（2026-10-22 に「自作キーボード / ソフトウェア / WEBツール / VRChat」から改名。表記は先頭大文字）
- VR & 3D（旧 VRChat）の作品は BOOTH の商品。サブ分類（アバター / アセット / Unityツール）は 2026-10-23 に表示とデータから削除した（`docs/decisions/ui-revise4/`）
- 作品一覧から `liblab` と `iromide` を外し、残す3ツールを Apps（旧 WEBツール）の作品として載せる。リンク先はサイト内の `/lab/{tool}`
- ドキュメントのリンクは、パスはそのままでホストだけ `unlibra.github.io` から `docs.unlibra.com` に変える（3つとも 200 を返すことを確認済み）
- BOOTH のショップURLは `https://unlibra-vrc.booth.pm/`（本番。2026-10-23 ユーザー確認）
- BOOTH の商品画像はリポジトリに置く。ダミーの商品は 2026-10-23 に削除した。商品は今は1つ（ムルル対応ツール。2026-10-23 ユーザー確認）。他の作者の素材が写っている画像は `src/assets/works/third-party/` に置く
- プロフィール文の欄は UI の見直しでなくなった。自己紹介はフッターの説明文が担う（ui-revise6 で確定）

### 3.7 ライセンスと著作権表示

- ルートの `LICENSE`：全体は `Copyright (c) 2025 unlibra. All rights reserved.` とする（年はフッターの著作権表示と同じ 2025）
- 例外として、WEBツールの実装コードと共通UI部品は MIT とし、`LICENSES/MIT.txt` を置く。対象のディレクトリは `LICENSE` に明記する
- 他の作者の素材が写っている BOOTH 商品画像は、どちらのライセンスの対象にもならないと明記する
- `package.json` の `license` は `"SEE LICENSE IN LICENSE"`
- liblab から持ってくるツールのコードは AGPL-3.0 から MIT に変える（作者は本人のみと確認済み）
- フッターに著作権表示「© 2025–{ビルドした年} unlibra」を出す。2025 は liblab・me の公開年。終わりの年はビルド時の年（2026-10-21 ユーザーの指示で範囲の形に変更）

## 4. 未決

なし（2026-10-23 にすべて解消。LINE Seed JP・BOOTH・プロフィール文は 3.5・3.6 を参照）

## 5. フェーズ計画

| Phase                    | 内容                                                                                                                                                                                                                                                      | 完了条件                                                                  |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| 1. 基盤                  | `@astrojs/react` の追加。Vercel 関連ファイルと `@vercel/analytics` の削除。ロケール付きページの廃止。ミラーサイトの仕組みの廃止。`wrangler.jsonc`（静的配信のみ）の追加。セキュリティヘッダーを `public/_headers` に移す。Cloudflare Web Analytics の導入 | `npm run build` と lint が通り、`wrangler dev` でトップページが表示される |
| 2. デザイン              | liblab の色トークンを Tailwind v4 に移す。ヘッダー・フッター（日英）、ダークモード切替、Noto Sans JP、ロゴ・favicon・OGP 画像                                                                                                                             | 全ページ共通のレイアウトがライト・ダーク両方で表示される                  |
| 3. ポートフォリオ        | カテゴリ構成、作品データの拡張、liblab・イロマイドの除外、ドキュメントリンクの修正、BOOTH の仮URLとダミー商品、著作権表示                                                                                                                                 | トップページに4カテゴリの作品が表示され、旧ドキュメントURLが残っていない  |
| 4. ツール移植            | 4ツールを React island として `/lab` と `/en/lab` に移す。Tailwind v4 への書き換え、`next/image` の置き換え。ツール一覧ページ、サイトマップ、hreflang                                                                                                     | 4ツールが日英両方でブラウザ上で動作する                                   |
| 5. ライセンス            | `LICENSE`、`LICENSES/MIT.txt`、`package.json`、README の更新                                                                                                                                                                                              | 3.7 のとおりになっている                                                  |
| 6. 切替                  | `_redirects` の作成。プレビュー環境での確認。独自ドメインを Vercel から Workers に付け替える                                                                                                                                                              | 3.2 の旧URLがすべて301で新URLに転送される                                 |
| 追加. テスト拡充         | 完了（仕様テスト、E2E、本番確認スクリプト、GitHub Actions、main のブランチ保護）                                                                                                                                                                          | `docs/decisions/tests/`                                                   |
| 追加. UI の見直し（2回） | 完了（liblab の見た目に寄せ直し、カードの組み合わせ、カテゴリ名とサイト名の変更、ロゴタイプの LINE Seed JP）                                                                                                                                              | `docs/decisions/ui-revise/`、`docs/decisions/ui-revise2/`                 |
| 7. 廃止                  | Vercel の3プロジェクト（me / liblab frontend / backend）の削除。liblab リポジトリの README 更新とアーカイブ                                                                                                                                               | —                                                                         |

Phase 6・7 の外部サービスの操作（ドメイン付け替え、Vercel プロジェクト削除、リポジトリのアーカイブ）は、1つずつユーザーに確認してから行う。Cloudflare のダッシュボード操作（Workers Builds の接続、Web Analytics の有効化）はユーザーが行う。

### 進捗

| Phase             | 状況                                                                                                                                                                                  | 計画・判断ログ                              |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| 1. 基盤           | 完了                                                                                                                                                                                  | `docs/decisions/phase-1/`                   |
| 2. デザイン       | 完了（仮のデザイン）                                                                                                                                                                  | `docs/decisions/phase-2/`                   |
| 3. ポートフォリオ | 完了（仮のデザイン、BOOTH はダミー）                                                                                                                                                  | `docs/decisions/phase-3/`                   |
| 4. ツール移植     | 完了                                                                                                                                                                                  | `docs/decisions/phase-4/`                   |
| 5. ライセンス     | 完了（LICENSE と README の文面は仮）                                                                                                                                                  | `docs/decisions/phase-5/`                   |
| 6. 切替           | 完了（2026-10-24。main にマージし、Workers Builds と Custom Domain で本番を Workers に切り替えた。`www` は 301、http は https に転送。`check:prod` は失敗 0）                         | `docs/decisions/phase-6/`、`docs/deploy.md` |
| 7. 廃止           | 完了（2026-10-24、ユーザーが実施。Vercel の3プロジェクトと Vercel を指す DNS を削除。liblab は `unlibra-archive/liblab` に移してアーカイブ。workers.dev とプレビューの URL は閉じた） | —                                           |

## 6. リリース前チェックリスト

2026-10-23 にユーザーの指示ですべて完了とした。最終UIチェックは workers.dev のプレビューでユーザーが行う。

- [x] BOOTH のショップURLを本番のものに差し替える（今のURLが本番）
- [x] BOOTH の残りの商品を追加する（商品は今は1つ）
- [x] プロフィール文を確定する（欄はなくなり、フッターの説明文で確定）
- [x] LINE Seed JP の扱いを決めて反映する（ロゴタイプに使用）
- [x] 最終UIチェックを行う（確認項目は `docs/decisions/phase-2/parent.md` の「最終UIチェックで確認してもらう項目」）
