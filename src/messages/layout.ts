// Texts of the header and footer shared by all pages.
import type { Locale } from "@/config/locales";
import type { Category } from "@/config/works";
import type { SameStructure } from "@/messages/types";

const ja = {
  header: {
    /**
     * Work categories, linking to their sections on the top page. The names
     * are in English (Title Case) in both languages, and the Japanese ones
     * are also the section headings of the top page.
     */
    categories: {
      keyboards: "DIY Keyboards",
      libraries: "Libraries",
      apps: "Apps",
      "vr-3d": "VRChat",
    } satisfies Record<Category, string>,
  },
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
      "個人で制作したプロダクトを紹介するサイトです。昼はビルダー。夜は個人開発。自作キーボード、ライブラリ、アプリ、VRアバターや3Dアセットなど、ジャンルにとらわれず自由にものづくりしています。",
    github: "GitHub",
    links: "Links",
    docs: "Docs",
    shop: "BOOTH",
    information: "Information",
    donate: "活動を応援する",
    privacyPolicy: "プライバシーポリシー",
    credits: "クレジット",
  },
} as const;

export type LayoutMessages = SameStructure<typeof ja>;

const en: LayoutMessages = {
  header: {
    categories: {
      keyboards: "DIY Keyboards",
      libraries: "Libraries",
      apps: "Apps",
      "vr-3d": "VRChat",
    } satisfies Record<Category, string>,
  },
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
      "A site that showcases the things I make on my own. A builder by day. An indie developer by night. DIY keyboards, libraries, apps, VR avatars, 3D assets and more: I make things freely, without being tied to any one genre.",
    github: "GitHub",
    links: "Links",
    docs: "Docs",
    shop: "BOOTH",
    information: "Information",
    donate: "Support My Work",
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
