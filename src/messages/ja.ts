// Japanese texts of the pages (the header and the footer are in ./layout.ts).
// The Japanese texts are the source: the English ones in ./en.ts say the
// same, with the same keys (checked by the `Messages` type).
import { layoutMessages } from "@/messages/layout";

export default {
  site: {
    /** The top page's meta description: the footer's description. */
    description: layoutMessages.ja.footer.description,
  },
  hero: {
    /** The top page's h1. */
    title: "昼はカフェ。夜はバー。",
    /**
     * The words of the title that take the colors of the day and the night
     * (ui-revise13), each found once in the title, the day's first.
     */
    day: "昼",
    night: "夜",
    /** The link buttons below the title (provisional wording). */
    github: "GitHub",
    booth: "BOOTH",
  },
  categories: layoutMessages.ja.header.categories,
  links: {
    docs: "ドキュメント",
  },
  /** The cards and their detail dialogs (provisional wording). */
  workDetails: {
    /** On the cards that open their details (DIY Keyboards). */
    more: "詳しく見る",
    close: "閉じる",
    /** The links of a work, on its card and in its details. */
    openApp: "アプリを開く",
    viewOnBooth: "BOOTH で見る",
    npm: "npm",
    pypi: "PyPI",
    /** Above the title of a large card (ui-revise5 13). */
    spotlight: "SPOTLIGHT",
  },
  /**
   * Each work's title and the summary for its card (provisional). The
   * summaries of Libraries and Apps are about two lines on a 1280px wide
   * page (ui-revise6 2). The works whose cards open their details (DIY
   * Keyboards) have the description shown there; a DIY keyboard without a
   * description opens its photo alone (the cover, prototypes, xoyo plus and
   * xoyo; until 2026-10-28 such a card opened nothing, ui-revise9 3).
   */
  works: {
    "tkinter-unblur": {
      title: "tkinter-unblur",
      summary:
        "Windows で Tkinter のアプリがぼやけて表示される問題をシンプルに解決する Python ライブラリです。",
    },
    "keyboards-cover": {
      title: "まっさらなエンドゲーム",
      summary:
        "キーボードは、毎日使う道具。だからこそ、キーの数や配列、打鍵感、そして見た目まで、自分の理想を追求したくなる。そんな試行錯誤から生まれた自作キーボードたち。",
    },
    "mira-zero": {
      title: "mira zero",
      summary: "はじめて基板・ケースともに自作した思い出の分割キーボード。",
      description: `40%サイズの左右分割ロープロファイル（Choc V1）キーボード。
はじめて基板から自作した初号機で、さまざまな技術を試す“プロトタイプ”として制作。`,
    },
    prototypes: {
      title: "prototypes",
      summary:
        "エンドゲームに行き着くまでに生まれた、数々のプロトタイプキーボードたち...。",
    },
    "fosty-natural": {
      title: "fosty natural",
      summary:
        "HHKB配列を40%キーボードに落とし込み、美しいデザインと打鍵感を両立したエンドゲームキーボード。",
      description: `HHKBの特徴的な配列を40%キーボードに落とし込んだ、ロープロファイル（Choc V2）キーボード。
HHKBのJust60キーに対してJust40キーとなるようにしたのもこだわりポイント。
アルミ削り出しの筐体と無駄のない薄型設計による美しいデザイン、ガスケットマウントによる心地よい打鍵感、そして一体型レイアウトによる携帯性と安定性を追求。
白いデスクに映える白×シルバーの配色で、キースイッチまで統一したキメラスイッチを採用。
打鍵感・携帯性・配列・デザインのバランスが理想形となり、自分の“エンドゲーム”と呼べる一台に仕上がっています。`,
    },
    "fosty-dark": {
      title: "fosty dark",
      summary: "fosty naturalのアナザーカラー。もうひとつのエンドゲーム。",
      description: `fosty naturalのアナザーカラー。40%ロープロキーボード。
fosty naturalの持っている打鍵感・携帯性・配列・デザインはそのままに、黒いデスクに映えるブラック×オレンジという配色に合わせた特別な構成のキースイッチでカスタム。
「黒も欲しくなった」ことをきっかけに制作した、もうひとつのエンドゲーム。`,
    },
    // xoyo and xoyo plus have no description: their cards open the photo
    // alone (the user's texts, 2026-10-28).
    "xoyo-plus": {
      title: "xoyo plus",
      summary:
        "xoyoをベースに、最高の打鍵感を求めてノーマルプロファイル化。アルミ削り出し筐体に真鍮ウェイトの豪華仕様。",
    },
    xoyo: {
      title: "xoyo",
      summary:
        "原点であるHHKBの配列をそのまま、ロープロで組んだガスケットマウントキーボード。",
    },
    "i18n-tiny-next": {
      title: "@i18n-tiny/next",
      summary:
        "依存ゼロ・型安全・最小構成で、Next.js のアプリを多言語化できる1KB未満のi18nライブラリです。",
    },
    "i18n-tiny-react": {
      title: "@i18n-tiny/react",
      summary:
        "依存ゼロ・型安全・最小構成で、React のアプリを多言語化できる1KB未満のi18nライブラリです。",
    },
    "i18n-tiny-astro": {
      title: "@i18n-tiny/astro",
      summary:
        "依存ゼロ・型安全・最小構成で、Astro のサイトを多言語化できる1KB未満のi18nライブラリです。",
    },
    // The Apps: the former tool site's names; the summaries are shortened
    // from its cards' texts (ui-revise6 2).
    "just-hex": {
      title: "Just HEX",
      summary:
        "ただ、一色に。カラーコードを入力すると、画面いっぱいにその色が広がる小さなWebアプリ。好きな色を、シェアカードで誰かに届けられます。",
    },
    "favicon-generator": {
      title: "Faviconジェネレーター",
      summary:
        "画像からファビコンとApple Touch Iconを一括生成。角丸や背景色も設定できます。",
    },
    "svg-optimizer": {
      title: "SVGオプティマイザー",
      summary:
        "品質を保ったままSVGのファイルサイズを削減し、Webサイトの読み込みを速くします。",
    },
    "password-generator": {
      title: "パスワードジェネレーター",
      summary:
        "文字数や文字の種類を選んで、強力なパスワードを生成。紛らわしい文字の除外にも対応しています。",
    },
    "mururu-blink-lipsync": {
      title: "【ムルル対応】まばたき＆リップシンク追加ツール",
      summary:
        "ムルルに、ユーザーの声に合わせて自然に口が動くリップシンク機能とまばたき機能を追加するUnityツールです。",
    },
  },
  /** The donate page (/donate). */
  donate: {
    title: "活動を応援する",
    description:
      "unlibra の活動を応援する方法をご案内します。GitHub SponsorsとAmazonギフトカードで支援できます。",
    intro: "サイトの運営や制作活動を応援していただける方へ。",
    note: "応援の気持ちを伝えるためのものです。返礼や特典はございません。",
    github: {
      name: "GitHub Sponsors",
      /** After the name: the language of the site it goes to, if not the page's. */
      language: "（英語サイト）",
      description: "単発の投げ銭、または毎月のサブスクで支援できます。",
      requirement: "GitHubアカウントが必要です。",
      oneTime: "投げ銭で支援する",
      monthly: "サブスクで支援する",
    },
    amazon: {
      name: "Amazonギフトカード",
      language: "",
      description: "Eメールタイプのギフトカードをお送りください。",
      copyStep: "送付先メールアドレスをコピー",
      /** The copy button's name (it contains the visible "コピー"). */
      copyLabel: "メールアドレスをクリップボードにコピー",
      copyFailed: "コピーに失敗しました",
      buyStep: "Amazonでギフトカードを購入",
      buyDescription:
        "受取人欄にコピーしたアドレスを入力してください。金額は自由です。",
      buy: "Amazonでギフトカードを選ぶ",
    },
  },
  /** The credits page (/credits). "{name}" and "{owner}" are filled in. */
  credits: {
    title: "クレジット",
    description:
      "unlibra のクレジットです。当サイトで使用しているキャラクターや素材等の権利表記を掲載しています。",
    intro:
      "当サイトで使用しているキャラクターや素材等の権利表記を掲載しています。",
    characters: "キャラクター",
    materials: "グラフィック素材",
    author: "著作者：",
    license: "ライセンス：",
    logos: "ロゴ",
    trademark: "{name}：{owner} の商標です",
    openSource: "オープンソースライセンス",
    thirdPartyLicenses: "サードパーティライセンス一覧",
  },
} as const;
