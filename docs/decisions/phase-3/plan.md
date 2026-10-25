# Phase 3 実装計画：ポートフォリオ

## 参照する文書

- 設計書とフェーズ計画：`docs/replace-plan.md`
- フェーズ全体に効く制約：3.2（URL）、3.4（WEBツール）、3.6（ポートフォリオのコンテンツ）
- このフェーズの範囲：5章の「3. ポートフォリオ」
- 前フェーズの判断と申し送り：`docs/decisions/phase-2/parent.md`（仮のデザイン方針、最終UIチェック項目、Phase 3 への申し送り）

## 前提

- 共通レイアウト（`BaseLayout`、ヘッダー、フッター、テーマ切替）は Phase 2 で完成している。このフェーズはトップページ `/` の中身を作り直す
- ユーザーは UI を最後にまとめて確認する。見た目は liblab のトップページ（`C:\Users\User\Projects\unlibra\liblab\frontend\src\app\[locale]\(default)\page.tsx` と `_components/tool-card.tsx`、`about-section.tsx`）の雰囲気に合わせた仮のデザインでよい。liblab のリポジトリは読むだけで変更しない
- 画面に出す新しい文言は、仮の文面として入れ、判断ログに一覧で残す（親が最終UIチェックの項目に加える）。既存の文面（me の作品説明、liblab のツール説明）を流用する分は仮扱いにしなくてよい

## スコープ

分割しない。スコープは `portfolio` の1つで、ブランチ `feat/site-replacement` に直接コミットする。

### portfolio

**触ってよい範囲**：`src/`、`tests/`、`public/`（不要ファイルの削除のみ）。`docs/replace-plan.md` と `docs/decisions/phase-3/parent.md` は除く。

**やること**

1. **作品データの型を作り直す**（`src/config/works.ts`）
   - カテゴリは `keyboard`（自作キーボード）、`software`（ソフトウェア）、`web`（WEBツール）、`vrchat`（VRChat）の4つ。表示順もこの順
   - `vrchat` の作品だけがサブ分類 `avatar`（アバター）、`asset`（アセット）、`unity-tool`（Unityツール）を必ず持つ。ほかのカテゴリはサブ分類を持てない。型で保証する（判別共用体など）
   - ドキュメントへのリンクは、説明文の中の URL ではなく、作品データの項目として持つ（3つとも `https://docs.unlibra.com/` に同じパスで置き換える。設計書 3.6）
   - X 風の「最初の要素をピン留め」の扱いはやめる
2. **作品の入れ替え**
   - 削除：`liblab`、`iromide`（データ、文言、画像 `liblab.webp`・`iromide.webp`）
   - 追加（`web`）：TW Palette Generator、Favicon Generator、SVG Optimizer、Password Generator。リンク先はサイト内の `/lab/{tool}`（`tw-palette-generator`、`favicon-generator`、`svg-optimizer`、`password-generator`）。名前と説明文は liblab の `src/messages/ja/tools.ts` の `name` と `description` を流用する。画像は liblab の `src/assets/icons/{tool}.svg` を `src/assets/tools/` にコピーして使う（Phase 4 のツールページでも使う）
   - 追加（`vrchat`）：アバター・アセット・Unityツールのダミー商品を1つずつ。タイトルと説明文に「ダミー」と分かる文面を入れ、画像は共通のダミー画像を1つ用意する。リンク先はショップURL
   - 既存の作品（キーボード4つ、ソフトウェア3つ）は残す
3. **BOOTH のショップURL**：`https://unlibra-vrc.booth.pm/` を定数で持つ（設計書 3.6）。VRChat カテゴリにショップへのリンクを置く
4. **トップページの作り直し**（`src/pages/index.astro`）
   - プロフィール（アバター、名前、仮のプロフィール文、GitHub と支援へのリンク）と、カテゴリごとの作品セクション。作品はカード（画像、タイトル、年、VRChat ならサブ分類、説明文、リンク）
   - カテゴリへのページ内リンク（アンカー）を置く
   - JS なしで動くこと。React を使わない
   - プロフィール文とページの meta description は、X オマージュの文面をやめて仮の文面にする
5. **X 風の残りを削除**：バナー、パロディ表記、「Updated」、ピン留め、タブ切替、シェアボタン、タイムラインの終端表示と、それにだけ使っていたアイコン・コンポーネント・CSS トークン（`base-primary`、`base-secondary`、`accent-*`、`text-x-*` など）・文言。旧アイコン `src/assets/icon.svg` も削除する（Phase 2 からの申し送り）

**受け入れ条件**

- D1：`npm run build`、`npm run lint`、`npm run format:check`、`npm test` が通る
- D2：`/` に4つのカテゴリのセクションが「自作キーボード、ソフトウェア、WEBツール、VRChat」の順にあり、それぞれへのページ内リンクがある
- D3：WEBツールのセクションに4つのツールがあり、それぞれ `/lab/{tool}` にリンクしている
- D4：VRChat のセクションに、アバター・アセット・Unityツールのサブ分類付きのダミー作品が1つずつあり、ショップURL `https://unlibra-vrc.booth.pm/` へのリンクがある
- D5：ドキュメントへのリンクが3つあり、すべて `https://docs.unlibra.com/` で始まる。`unlibra.github.io` がソースと `dist/` に残っていない
- D6：`liblab`、`Lib Lab`、`iromide`、`イロマイド`、`Xオマージュ`、`パロディ` がソース（`src/`）と `dist/` に残っていない。`/lab` へのリンクとツールの ID は除く
- D7：サブ分類を `vrchat` 以外の作品に付ける、または `vrchat` の作品から外すと型エラーになる（型テストで保証）
- D8：`/` が React のランタイムを読み込まない（Phase 2 の C7 を引き続き満たす）
- D9（手動）：ライト・ダーク両方、幅 375px と 1280px で表示が崩れない。見た目の最終確認はユーザーが行う

**モデル**：標準、推論レベルは親と同じ

**判断ログ**：`docs/decisions/phase-3/portfolio.md`

## テスト

- これまでと同じく `node:test` で `tests/` に書く。ビルド結果を検証する結合テストと、Phase 2 の C8 と同じ方式の型テスト
- 既存テストのうち、X 風の旧ページを前提にしたものがあれば、このフェーズの設計に合わせて直してよい。直した理由は判断ログに書く。それ以外の既存テストは弱めない
- ブロックごとに全体（build、lint、format:check、test）を回す
- 実行方法とログの扱いは `docs/decisions/phase-1/plan.md` の「実行方法」と同じ。サーバーを起動したら、終わったら必ずプロセス（node.exe を含む）を終了させる

## 共有ファイル

`src/styles/global.css` と `src/messages/ja.ts` は、このスコープだけが触る。

## 判断ログ

- 置き場所：`docs/decisions/phase-3/`
- 親用：`parent.md`
- スコープ `portfolio` 用：`portfolio.md`

## コミット

- コミットメッセージは英語で、既存の履歴の書き方に合わせる
- `Co-Authored-By` のフッターは付けない
