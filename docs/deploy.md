# 本番切替の手順書

`unlibra.com` の配信を Vercel から Cloudflare Workers（静的配信）に切り替え、Vercel と liblab を閉じるまでの手順。ダッシュボードの操作はユーザーが行う。リポジトリの操作（マージなど）は、ユーザーの確認を受けてから行う。

- 手順は Cloudflare の公式ドキュメント（2026-10-21、10-23 に参照）で確かめた内容だけを書いた。確かめられなかった箇所は「要確認」と書いた
- 「戻せる」「戻せない」は各手順の見出しに書いた
- 「案」と書いたものは未決で、実行前にユーザーが選ぶ

参照した公式ドキュメント：

- Workers Builds：<https://developers.cloudflare.com/workers/ci-cd/builds/>、[Configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)、[Build image](https://developers.cloudflare.com/workers/ci-cd/builds/build-image/)
- [workers.dev](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/)、[Previews](https://developers.cloudflare.com/workers/configuration/previews/)
- [Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)、[Routes](https://developers.cloudflare.com/workers/configuration/routing/routes/)
- [Rollbacks](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/)
- Static Assets の [Redirects](https://developers.cloudflare.com/workers/static-assets/redirects/)、[HTML handling](https://developers.cloudflare.com/workers/static-assets/routing/advanced/html-handling/)
- Web Analytics の [Get started](https://developers.cloudflare.com/web-analytics/get-started/)、[FAQ](https://developers.cloudflare.com/web-analytics/faq/)

## 全体の流れ

| #   | 手順                                           | 誰が                   | 戻せるか                           |
| --- | ---------------------------------------------- | ---------------------- | ---------------------------------- |
| 0   | 控えを取る、決めることを決める                 | ユーザー               | —                                  |
| 1   | 切替前の確認（ローカル）                       | 親                     | —                                  |
| 2   | main へのマージと、Vercel の自動デプロイの扱い | 親（マージ）、ユーザー | 戻せる                             |
| 3   | Workers Builds を既存の Worker につなぐ        | ユーザー               | 戻せる                             |
| 4   | ゾーンの設定を確かめる                         | ユーザー               | —                                  |
| 5   | DNS を Vercel から Workers に付け替える        | ユーザー               | 戻せる（つながらない時間がある）   |
| 6   | 切替後の確認                                   | 親、ユーザー           | —                                  |
| 7   | 検索エンジンへの通知                           | ユーザー               | 戻せない（インデックスは戻らない） |
| 8   | 様子を見る期間                                 | —                      | —                                  |
| 9   | Vercel と liblab を閉じる                      | ユーザー               | 戻せない                           |
| 10  | 後片付け（ブランチ、プレビュー用の作業コピー） | 親                     | —                                  |

## 結果（2026-10-24）

切替は完了した。本番は Workers Builds（`main` への push でデプロイ）と Custom Domain `unlibra.com` で配信している。`npm run check:prod -- https://unlibra.com` は失敗 0。Vercel の3プロジェクトは削除し、liblab は `unlibra-archive/liblab` に移してアーカイブした。IndexNow で unlibra.com と docs.unlibra.com の URL を送った（どちらも 202）。Web Analytics は、ダッシュボードでサイトを設定し直したあと、自動挿入が効いている（ブラウザのように `Accept: text/html` を付けたリクエストにだけ挿入される。`check:prod` もそのヘッダーを付けるようにした）。以下は切替前に書いた手順で、記録として残す。

2026-10-25 から、Just HEX のシェア用の URL（`/hex/*`）だけ Worker のスクリプト（`worker/index.ts`）が動く。ほかのパスは今までどおり静的アセットとして配信する（`wrangler.jsonc` の `run_worker_first`。`docs/decisions/just-hex/` の JH-3）。Workers Builds の設定（Build command `npm run build`、Deploy command `npx wrangler deploy`）は変えなくてよい想定（要確認：デプロイ後に本番の `/hex/ffffff` と `/hex/ffffff.png` を確かめる）。

## 現状（2026-10-23 時点）

- `unlibra.com` は Cloudflare のプロキシ経由で Vercel から配信されている（レスポンスに `x-vercel-id` が付く）
- `/lab/*` は me の main ブランチの `vercel.json` から liblab の Vercel プロジェクトへ rewrite されている
- me の main ブランチはまだ旧サイト。新サイトはブランチ `feat/site-replacement` にある
- Worker `unlibra-com` は Cloudflare のアカウントにもうある（`wrangler deploy` で作った）。`wrangler.jsonc` に `"workers_dev": false` と `"preview_urls": false` を書いてあるので、`workers.dev` の URL とプレビューの URL では公開していない（2026-10-23 に閉じた。アクセスするとエラー 1042）。Worker はどの URL にもつながっていない
- Vercel のプロジェクトは3つ：me、liblab のフロントエンド、liblab のバックエンド

## 0. 控えを取る、決めることを決める

### 0.1 控えておくもの（戻すときに使う）

- Cloudflare の DNS（ゾーン `unlibra.com` の **DNS** > **Records**）：`unlibra.com` と `www.unlibra.com` のレコードの種類・名前・内容・プロキシの状態。スクリーンショットで残す
- 同じ画面で、Vercel を指しているほかのレコード（内容が `cname.vercel-dns.com` や Vercel の IP アドレスのもの。liblab のバックエンドの API 用のサブドメインなど）があるかを見て、一覧にしておく。9章で消す
- Vercel の me プロジェクトの **Domains** の設定（`unlibra.com`、`www.unlibra.com` の扱い。`www` を `unlibra.com` に転送しているかなど）
- Vercel の me プロジェクトで、今本番になっているデプロイ（戻すときに本番に戻す対象）

### 0.2 決めること

**決定（2026-10-23、ユーザー）：** サイトは数時間までなら止まってよく、安全よりスピードを優先する。そのため次のとおりにする。以下の (1)〜(4) の案の比較は、記録として残す。

- マージの順序は気にしない：Workers Builds を main につないでから main にマージする（Vercel の自動デプロイは止めない）
- 付け替えは案C（Custom Domain）
- `www.unlibra.com` は `unlibra.com` に 301 で転送する
- Vercel の3プロジェクトは、切替後の確認が済んだその日に消す（8章の様子を見る期間は設けない）。Vercel を指すほかの DNS レコードも消す
- AI のクローラーは拒否しない（Cloudflare の管理された robots.txt と AI ボットのブロックは無効にする）
- Google Search Console と Bing Webmaster Tools は登録済み。サイトマップを `/sitemap-index.xml` に替える

**(1) main へのマージと Vercel の自動デプロイの順序（案）**

Vercel の me プロジェクトは main への push で本番にデプロイしている（と考えられる。要確認）。新サイトを main にマージすると、Vercel が新サイトを本番にデプロイし、`vercel.json` が消えるので `/lab/*` の rewrite もなくなる。DNS を付け替える前にこれが起きると、本番の `/lab/*` が壊れる。

- 案A：Workers Builds の本番ブランチを最初は `feat/site-replacement` にする。DNS を付け替えて確認が済んでから main にマージし、本番ブランチを `main` に変える。main へのマージが Vercel に届いても、そのときには DNS が Workers を向いているので、訪問者には影響しない
- 案B（親のおすすめ）：先に Vercel の me プロジェクトの Git 連携の自動デプロイを止め、main にマージしてから、Workers Builds の本番ブランチを `main` にする。本番ブランチを途中で変える手間がない。Vercel 側の止め方は Vercel のダッシュボードで確かめる（**Settings** > **Git** の Git 連携の切断か、ビルドを止める設定。画面上の名前は要確認）

**(2) DNS の付け替えの方式（案）**

| 項目             | 案C：Custom Domain（親のおすすめ）                                     | 案R：Route                                                                                                           |
| ---------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| 公式の位置づけ   | Worker がサイトの配信元のときに公式が勧める方式                        | 配信元の前に Worker を置く用途の方式                                                                                 |
| DNS レコード     | Vercel を指すレコードを消してから足す（既存の CNAME があると作れない） | Vercel を指すプロキシ済みのレコードを残したまま、Worker のルートを足す                                               |
| つながらない時間 | ある（レコードを消してから Custom Domain が働くまで）                  | 公式の記述からはないと考えられる（要確認）                                                                           |
| 戻し方           | Custom Domain を外し、控えたレコードを作り直す。その間つながらない     | ルートを消す。DNS レコードは残っているので Vercel に戻る（要確認）                                                   |
| 未確認の点       | A レコードの場合に作れるか、証明書の発行にかかる時間                   | 静的配信だけの Worker がルートで動くか。9章で Vercel を消すとき、結局レコードを消して Custom Domain に移る必要がある |

**(3) `www.unlibra.com` の扱い（案）**

今の扱いを 0.1 で確かめてから決める。案：`www` は `unlibra.com` に 301 で転送する（公式の「Redirect between www and root domain」の手順。転送ルールと、プロキシした DNS レコードが要る。要確認）。

**(4) 様子を見る期間（8章、案）**：1〜2週間。この間は Vercel を消さない（戻せるようにしておく）

## 1. 切替前の確認（ローカル、親）

`workers.dev` は閉じたので、切替前の確認は、同じビルドをローカルの `wrangler dev`（本番の Workers と同じ配信の仕組み）で行う。

1. ブランチの最新で `npm test` と `npm run test:e2e`（ローカルの `wrangler dev` に対する E2E）が通る
2. `npm run preview:cf` で立てたサーバーに対して `npm run check:prod -- http://localhost:8787` を行う（ポートは起動時の表示に合わせる）。6.1 の `check:prod` の項目を、ゾーンの設定が重なる前の状態で確かめられる
3. GitHub Actions の `test` が通っている

## 2. main へのマージと、Vercel の自動デプロイの扱い（戻せる）

0.2 (1) で選んだ案に従う。

- 案B：
  1. ユーザーが Vercel の me プロジェクトの自動デプロイを止める
  2. 親が `feat/site-replacement` を main にマージする（プルリクエストを作り、`test` が通ってからマージ。マージはユーザーの確認を受けてから行う）
  3. Vercel の me プロジェクトで、本番のデプロイが旧サイトのままであることを確かめる（`https://unlibra.com/` に `x-vercel-id` が付き、旧サイトが出る）
- 案A：この章は 6章のあとに行う。3章では本番ブランチを `feat/site-replacement` にする

戻すとき：main をマージ前のコミットに戻すのは force-push になるので、ユーザーの確認を受ける。Vercel の自動デプロイは設定を元に戻す。

## 3. Workers Builds を既存の Worker につなぐ（戻せる）

公式 [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/) の「Connect an existing Worker」の手順。

1. Cloudflare のダッシュボードで **Workers & Pages** を開く
2. Worker `unlibra-com` を選ぶ
3. **Settings** > **Builds** を選ぶ
4. **Connect** を選び、画面の指示に従ってリポジトリ `unlibra/unlibra.com`（2026-10-23 に `me` から改名）をつなぎ、次のように設定する

| 設定                       | 値                                                                                               |
| -------------------------- | ------------------------------------------------------------------------------------------------ |
| Git branch（本番ブランチ） | 案B：`main`、案A：`feat/site-replacement`                                                        |
| Build command              | `npm run build`                                                                                  |
| Deploy command             | `npx wrangler deploy`（既定値。`package.json` で指定した Wrangler の版が使われる）               |
| Root directory             | 空（リポジトリの直下に `wrangler.jsonc` がある）                                                 |
| Build variables            | なし（Node の版は `.node-version` で指定している）                                               |
| 本番以外のブランチのビルド | 使わない（`preview_urls` を無効にしているので、プレビューのビルドを作っても URL では見られない） |

- Worker の名前（`unlibra-com`）は `wrangler.jsonc` の `name` と一致しないとビルドが失敗する
- つないだら、本番ブランチに push してビルドとデプロイを走らせる（公式の手順の最後）。案B では 2章のマージで走る
- 最初のビルドのログで、Node の版が 24 系であること（`.node-version` は `24`。既定の版は 24.18.0）、ビルドとデプロイが成功したことを確かめる
- この時点では Worker はどの URL にもつながっていないので、訪問者には見えない

戻すとき：Worker の **Settings** > **Builds** で接続を外す。接続のときに自動で作られる API トークンは、不要なら **My Profile** > **API Tokens** で消す。

## 4. ゾーンの設定を確かめる

付け替えの後は、`unlibra.com` のゾーンの設定が Worker のレスポンスに重なる。`_headers` と `robots.txt` の内容と食い違わないか、ダッシュボードで次を見ておく。6章の確認で食い違いが出たら、ここに戻る。

- 管理された robots.txt（公式 [Managed robots.txt](https://developers.cloudflare.com/bots/additional-configurations/managed-robots-txt/)）：有効にすると、Cloudflare が AI クローラー向けの `Disallow` をサイトの `robots.txt` の前に足して返す。このサイトの `robots.txt` をそのまま返すなら、無効になっていることを確かめる
- HSTS と No-Sniff（公式 [HTTP Strict Transport Security](https://developers.cloudflare.com/ssl/edge-certificates/additional-options/http-strict-transport-security/)）：**Edge Certificates** の **HTTP Strict Transport Security (HSTS)** と **No-Sniff Header**。`_headers` も同じヘッダーを付けている（`max-age=63072000; includeSubDomains; preload`、`nosniff`）。有効なら、値が `_headers` と同じであることを確かめる（両方が付けたときの扱いは要確認）
- ブラウザキャッシュの TTL（公式 [Browser Cache TTL](https://developers.cloudflare.com/cache/how-to/edge-browser-cache-ttl/)）：**Caching** > **Configuration** の **Browser Cache TTL** が **Respect Existing Headers** になっていること（`_headers` の `max-age=0` が書き換えられないように）
- ボット対策（公式 [Bot Fight Mode](https://developers.cloudflare.com/bots/get-started/bot-fight-mode/)）：有効だと `check:prod` の検査が 403 などで失敗しうる。そのときは一時的に無効にして検査するか、ブラウザで確かめる

## 5. DNS を Vercel から Workers に付け替える

0.2 (2) で選んだ案に従う。

### 5.1 案C：Custom Domain

**5.1.1 DNS レコードを消す（戻せる。ただし消してから 5.1.2 が済むまでサイトにつながらない）**

1. 0.1 で `unlibra.com` の DNS レコードを控えたことを確かめる
2. ゾーン `unlibra.com` の **DNS** > **Records** で、`unlibra.com` を Vercel に向けているレコードを消す

5.1.1 と 5.1.2 は続けて行う。

**5.1.2 Custom Domain を足す（戻せる）**

1. **Workers & Pages** で Worker `unlibra-com` を選ぶ
2. **Settings** > **Domains & Routes** > **Add** > **Custom Domain** を選ぶ
3. `unlibra.com` を入れて **Add Custom Domain** を選ぶ

Cloudflare が DNS レコードと証明書を作る。証明書が発行されて HTTPS でつながるまでの時間は要確認。

**5.1.3 `www.unlibra.com`**

0.2 (3) で決めた扱いにする。転送する場合は、公式の「Redirect between www and root domain」の手順に従う（要確認）。

**5.1.4 戻すとき（つながらない時間がある）**

1. Worker の **Settings** > **Domains & Routes** で Custom Domain `unlibra.com` を外す
2. 0.1 で控えた DNS レコードを、同じ種類・内容・プロキシの状態で作り直す
3. Vercel の me プロジェクトで、旧サイトのデプロイが本番になっていることを確かめる（2章で main をマージしたあとは、旧サイトのデプロイを本番に戻す操作が要る。Vercel 側の手順は要確認）
4. Custom Domain のときに作られた証明書は自動では消えない。不要なら **SSL/TLS** > **Edge Certificates** で消す（残っていても動作には影響しない）

### 5.2 案R：Route

1. **Workers & Pages** で Worker `unlibra-com` を選ぶ
2. **Settings** > **Domains & Routes** > **Add** > **Route** を選ぶ
3. ゾーン `unlibra.com` を選び、パターンに `unlibra.com/*` を入れて **Add route** を選ぶ

静的配信だけの Worker がルートで全パスを配信できるかは、公式で確かめられなかった（要確認）。足した直後に 6章の確認を行い、期待どおりでなければすぐルートを消して戻す。9章で Vercel を消すときは、DNS レコードを消して 5.1 の Custom Domain に移る（その時点でつながらない時間が生じる）。

### 5.3 付け替えに関わる要確認の点（両案に共通）

- Cloudflare のキャッシュに Vercel からのレスポンスが残っていて、付け替えのあとも返される可能性があるか、パージが要るか
- ダッシュボードで足した Custom Domain やルートが、そのあとの Workers Builds の `wrangler deploy`（`wrangler.jsonc` に `routes` がない）で外されないか。付け替えの直後にデプロイが走ったら、Custom Domain やルートが残っていることを確かめる。外される場合は、`wrangler.jsonc` に `routes`（Custom Domain は `custom_domain: true`）を書く作業をリポジトリで行う

## 6. 切替後の確認

### 6.1 自動の確認（親）

`npm run check:prod -- https://unlibra.com` を行う。全ページの 200、旧 URL の 301、`_headers` のヘッダーなどを確かめる。失敗したら、表示されるヒントと4章を見る。

`check:prod` が確かめること：

- `robots.txt`、`sitemap-index.xml` とその中のサイトマップが返る
- サイトマップに載っている全ページ（トップ、クレジット、プライバシーポリシー、3つのツールの日英）が 200
- `public/_redirects` の旧 URL が 301 で決まった行き先に転送される
- `public/_headers` のヘッダーが付く

`check:prod` が見ないので、手で確かめるもの（`curl -sI` で 200 を見る）：

- `/third-party-licenses.txt`
- IndexNow のキーのファイル `/67426e8c4c044cef96ebc2f901da0154.txt`（中身がキーの文字列だけ）

旧 URL の転送の一覧（`check:prod` が `_redirects` から読んで確かめる）：

| 旧URL                                                        | `location`                                  |
| ------------------------------------------------------------ | ------------------------------------------- |
| `/ja`、`/ja/`、`/en`、`/en/`                                 | `/`                                         |
| `/lab`、`/lab/`、`/en/lab`、`/en/lab/`（ツールの一覧はない） | `/#apps`                                    |
| `/lab/ja`、`/lab/ja/`、`/lab/en`、`/lab/en/`                 | `/#apps`                                    |
| `/lab/ja/svg-optimizer`（3ツールとも、末尾スラッシュも）     | `/lab/svg-optimizer`                        |
| `/lab/en/favicon-generator`（3ツールとも）                   | `/en/lab/favicon-generator`                 |
| `/lab/en/iromide`                                            | `/en/lab/iromide`（その先は 404）           |
| `/lab/ja/tw-palette-generator`                               | `/lab/tw-palette-generator`（その先は 404） |
| `/sitemap.xml`                                               | `/sitemap-index.xml`                        |

- 存在しないパス（例：`/nope`）は 404 で、自前の 404 ページが出る
- `/privacy/` のような末尾スラッシュ付きは 307 で末尾スラッシュなしに転送される（Workers の `html_handling` の仕様で想定どおり）

### 6.2 目で見る確認（ユーザー）

- トップ、3つのツール（日英）、クレジット、プライバシーポリシーが、新サイトとして表示される
- ライト・ダークの切替、キャッチコピーの色、ツールの動作（ファイルの読み込み、ダウンロード、コピー）
- スマホでも見る

### 6.3 Web Analytics（ユーザー）

- このサイトは計測タグをコードに書かず、Cloudflare のプロキシによる自動挿入に任せている（Phase 1 の判断 P1-1）
- `/` の HTML に `static.cloudflareinsights.com/beacon.min.js` の `<script>` が入っていることを確かめる。入っていなければ、**Web Analytics** で `unlibra.com` のサイトの設定を見る。自動挿入が効かない場合は、計測用のスニペットをレイアウトに埋め込む作業をリポジトリで行う
- **Web Analytics** の画面で計測が始まっていることを確かめる（データが出るまでの時間は要確認）

### 6.4 失敗したら

- サイトの中身だけを前の版に戻す：**Workers & Pages** > `unlibra-com` > **Deployments** で、戻したい版の「…」から **Rollback**（公式 [Rollbacks](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/)）
- 旧サイトに戻す：5.1.4（案C）か、ルートを消す（案R）

## 7. 検索エンジンへの通知（戻せない）

- Google Search Console：サイトマップを `https://unlibra.com/sitemap-index.xml` で登録する（旧サイトの `/sitemap.xml` を登録していれば、新しいものに替える。旧 URL は 301 で新しいものに転送される）
- Bing Webmaster Tools / IndexNow：キーのファイルは `https://unlibra.com/67426e8c4c044cef96ebc2f901da0154.txt` に置いてある。Bing Webmaster Tools でサイトマップを登録するか、IndexNow で URL を送る（送り方は Bing Webmaster Tools の IndexNow の案内で確かめる。要確認）
- 301 と検索エンジンのインデックスの更新は、こちらから元に戻せない

## 8. 様子を見る期間

0.2 (4) で決めた期間、次を見る。この間は Vercel のプロジェクトを消さない（5.1.4 で戻せるようにしておく）。

- Web Analytics のアクセス、404 の多い URL
- Search Console のエラー（カバレッジ、404）
- Workers Builds のビルドが main への push で成功している

## 9. Vercel と liblab を閉じる（戻せない）

8章が済んでから、ユーザーが1つずつ行う。親は各手順の前に確認を受ける。

1. **DNS の残り：** 0.1 で一覧にした、Vercel を指すほかのレコード（liblab のバックエンドの API 用など）を、使っていないことを確かめてから消す
2. **Vercel の me プロジェクト：** **Domains** から `unlibra.com`（と `www`）を外してから、プロジェクトを削除する
3. **Vercel の liblab のフロントエンドとバックエンド：** 削除する。バックエンドが外部のサービス（データベース、ストレージ、API キーなど）を使っていれば、そちらも止めるかを確かめる（要確認）
4. **Vercel のアカウント：** ほかに使っていなければ、GitHub との連携（Vercel の GitHub App）を外すかを決める（案）。チームやプランの解約は Vercel 側で確かめる（要確認）
5. **liblab のリポジトリ：** README に「unlibra.com に統合した」旨とリンクを書いてから、GitHub でアーカイブする（Settings > Archive this repository）。README の文面は親が案を出す

## 10. 後片付け（親）

- 案A なら、本番ブランチを `main` に変えたことを確かめる
- マージ済みのブランチ `feat/site-replacement` を消す（GitHub とローカル。消す前にユーザーの確認を受ける）
- プレビュー用の作業コピー（`%TEMP%\claude\me-preview`）を `git worktree remove` で消す
- `docs/replace-plan.md` の進み具合の表（Phase 6、Phase 7）を「完了」にする
