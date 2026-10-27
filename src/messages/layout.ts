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
      "vr-3d": "VR & 3D",
    } satisfies Record<Category, string>,
    menu: "メニュー",
    openMenu: "メニューを開く",
    closeMenu: "メニューを閉じる",
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
  language: {
    toggle: "言語を切り替え",
    label: "Language",
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
      "vr-3d": "VR & 3D",
    } satisfies Record<Category, string>,
    menu: "Menu",
    openMenu: "Open menu",
    closeMenu: "Close menu",
  },
  breadcrumb: {
    label: "Breadcrumb",
    // The top page is in Japanese only.
    home: "Home (Japanese)",
  },
  theme: {
    toggle: "Toggle theme",
    light: "Light",
    dark: "Dark",
    system: "System",
  },
  language: {
    toggle: "Change language",
    label: "Language",
  },
  footer: {
    description:
      "A personal site showcasing my projects. A builder by day. An indie maker by night. From DIY keyboards and software libraries to apps, VR avatars, and 3D assets, I create whatever sparks my curiosity.",
    github: "GitHub",
    links: "Links",
    docs: "Docs",
    shop: "BOOTH",
    information: "Information",
    // The donate and credits pages are in Japanese only, like the privacy
    // policy.
    donate: "Donate & Support (Japanese)",
    privacyPolicy: "Privacy Policy (Japanese)",
    credits: "Credits (Japanese)",
  },
};

export const layoutMessages: Record<Locale, LayoutMessages> = { ja, en };

/** Language names, each written in its own language. */
export const localeNames = {
  ja: "日本語",
  en: "English",
} as const satisfies Record<Locale, string>;
