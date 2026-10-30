// Texts of the header and footer shared by all pages.
import type { Locale } from "@/config/locales";
import type { SameStructure } from "@/messages/types";

const ja = {
  breadcrumb: {
    /** The name of the breadcrumb navigation (its aria-label). */
    label: "パンくずリスト",
    /** The first item: the top page. */
    home: "ホーム",
  },
  theme: {
    toggle: "テーマを切り替え",
    light: "ライト",
    dark: "ダーク",
    system: "システム",
  },
  footer: {
    description:
      "個人で制作したプロダクトを紹介するサイトです。昼はビルダー。夜は個人開発。アプリ、ライブラリ、自作キーボード、VRアバターや3Dアセットなど、ジャンルにとらわれず自由にものづくりしています。",
    github: "GitHub",
    links: "Links",
    docs: "Docs",
    shop: "BOOTH",
    information: "Information",
    donate: "支援",
    privacyPolicy: "プライバシーポリシー",
    credits: "クレジット",
  },
} as const;

export type LayoutMessages = SameStructure<typeof ja>;

const en: LayoutMessages = {
  breadcrumb: {
    label: "Breadcrumb",
    home: "Home",
  },
  theme: {
    toggle: "Toggle theme",
    light: "Light",
    dark: "Dark",
    system: "System",
  },
  footer: {
    description:
      "A site that showcases the things I make on my own. A builder by day. An indie developer by night. Apps, libraries, DIY keyboards, VR avatars, 3D assets and more: I make things freely, without being tied to any one genre.",
    github: "GitHub",
    links: "Links",
    docs: "Docs",
    shop: "BOOTH",
    information: "Information",
    donate: "Support",
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
