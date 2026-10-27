import type { Locale } from "@/config/locales";

export const site = {
  /** The site name (the domain is `url`). */
  title: "unlibra",
  url: "https://unlibra.com",
  ogImage: "/ogp.png",
  links: {
    github: "https://github.com/unlibra",
    docs: "https://docs.unlibra.com/",
    /** BOOTH shop (the production shop). */
    booth: "https://unlibra.booth.pm/",
  },
  /** Donation methods offered on /donate. */
  donation: {
    githubSponsors: {
      oneTime: "https://github.com/sponsors/unlibra?frequency=one-time",
      recurring: "https://github.com/sponsors/unlibra?frequency=recurring",
    },
    email: "gift@unlibra.com",
    /**
     * Amazon eギフトカード (formerly the Eメールタイプ) on amazon.co.jp, with
     * ¥500 filled in (gpo; the amount can still be changed there).
     */
    amazonGift: "https://www.amazon.co.jp/dp/B06X1GVMW7?gpo=500",
  },
} as const;

/** First publication of the former sites: the start of the copyright notice. */
export const firstYear = 2025;

/**
 * Copyright notice for the footer: "© 2025–{year} unlibra",
 * or "© 2025 unlibra" when `year` is the first year. `year` is the build year.
 */
export const copyrightNotice = (year: number): string => {
  if (!Number.isInteger(year) || year < firstYear) {
    throw new Error(`copyright year must be ${firstYear} or later: ${year}`);
  }
  const years = year === firstYear ? `${firstYear}` : `${firstYear}–${year}`;
  return `© ${years} unlibra`;
};

/** Site-relative path, always starting with "/". */
export type SitePath = `/${string}`;

/**
 * The pages' paths in Japanese (no prefix). The English pages are the same
 * paths under /en (`localizedPath`); the privacy policy has no English page.
 */
export const paths = {
  home: "/",
  privacy: "/privacy",
  credits: "/credits",
  donate: "/donate",
  /** Where the tool pages live (there is no page here). */
  tools: "/lab",
  /** Just HEX's top page. */
  hex: "/hex",
} as const satisfies Record<string, SitePath>;

/**
 * A page's path in a language, from its Japanese path: the same path in
 * Japanese, under /en in English ("/" becomes "/en").
 */
export const localizedPath = (path: SitePath, lang: Locale): SitePath => {
  if (lang === "ja") return path;
  return path === "/" ? "/en" : `/en${path}`;
};

/**
 * Absolute URL for a site path, without a trailing slash.
 * The top page ("/") becomes the bare origin.
 */
export const absoluteUrl = (path: SitePath): string =>
  site.url + path.replace(/\/+$/, "");
