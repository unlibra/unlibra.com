// Texts of the header and footer shared by all pages.
import type { Locale } from "@/config/locales";
import type { SameStructure } from "@/messages/types";

const ja = {
  navigation: {
    label: "メインナビゲーション",
    toggle: "メニューを開く",
    menu: "メニュー",
    close: "メニューを閉じる",
    settings: "表示設定",
    works: "Works",
    lab: "Lab",
  },
  breadcrumb: {
    /** The name of the breadcrumb navigation (its aria-label). */
    label: "パンくずリスト",
    /** The first item: the top page. */
    home: "ホーム",
  },
  language: {
    label: "言語",
    toggle: "言語を選択",
  },
  theme: {
    label: "テーマ",
    toggle: "テーマを切り替え",
    light: "ライト",
    dark: "ダーク",
    system: "システム",
  },
  footer: {
    description:
      "個人で制作したプロダクトを紹介するサイトです。昼はビルダー。夜は個人開発。自作キーボード、アプリ、ライブラリ、VRアバターや3Dアセットなど、ジャンルにとらわれず自由にものづくりしています。",
    github: "GitHub",
    links: "Links",
    docs: "Docs",
    shop: "BOOTH",
    youtube: "YouTube",
    channels: "外部リンク",
    contact: "Contact",
    email: "メールを送る",
    information: "Information",
    donate: "支援・寄付",
    privacyPolicy: "プライバシーポリシー",
    credits: "クレジット",
  },
} as const;

export type LayoutMessages = SameStructure<typeof ja>;

const en: LayoutMessages = {
  navigation: {
    label: "Main navigation",
    toggle: "Open menu",
    menu: "Menu",
    close: "Close menu",
    settings: "Preferences",
    works: "Works",
    lab: "Lab",
  },
  breadcrumb: {
    label: "Breadcrumb",
    home: "Home",
  },
  language: {
    label: "Language",
    toggle: "Select language",
  },
  theme: {
    label: "Theme",
    toggle: "Toggle theme",
    light: "Light",
    dark: "Dark",
    system: "System",
  },
  footer: {
    description:
      "A site that showcases the things I make on my own. A builder by day. An indie developer by night. DIY keyboards, apps, libraries, VR avatars, 3D assets and more: I make things freely, without being tied to any one genre.",
    github: "GitHub",
    links: "Links",
    docs: "Docs",
    shop: "BOOTH",
    youtube: "YouTube",
    channels: "Elsewhere",
    contact: "Contact",
    email: "Send email",
    information: "Information",
    donate: "Support & Donate",
    // The privacy policy is in Japanese only (to keep its exact wording).
    privacyPolicy: "Privacy Policy (Japanese)",
    credits: "Credits",
  },
};

export const layoutMessages: Record<Locale, LayoutMessages> = { ja, en };

/** Language names, each written in its own language. */
export const localeNames = {
  ja: "日本語",
  en: "English",
} as const satisfies Record<Locale, string>;
