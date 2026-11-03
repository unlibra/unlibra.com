// The credits page (/credits, ui-revise6 4). The materials by other authors
// are those of section 2 of LICENSE, which is the source of truth: each entry
// has the name, the copyright holder, the license and the license file
// written there (tests/credits.test.js finds a source in LICENSE that is
// missing here).
import { site } from "./site.ts";
import type { Locale } from "./locales.ts";

/** One credit: the material's name, its author and its license. */
export interface Credit {
  name: string;
  author: string;
  license: string;
  /** The license's full text in this repository (LICENSES/). */
  licenseFile: `LICENSES/${string}`;
}

/**
 * The characters in the site's images, with their names in each language
 * (the English one as the user writes it).
 */
export const characters = [
  { name: { ja: "ムルル", en: "Mururu" }, rights: "©Lethal Cats" },
] as const;

/** The material by other authors listed in section 2 of LICENSE, in its order. */
export const materials: readonly Credit[] = [
  {
    name: "Tabler Icons",
    author: "Paweł Kuna",
    license: "MIT License",
    licenseFile: "LICENSES/Tabler-MIT.txt",
  },
  {
    name: 'DiceBear "Blobs" and "Planets"',
    author: "DiceBear",
    license: "CC0 1.0 Universal",
    licenseFile: "LICENSES/CC0-1.0.txt",
  },
  {
    name: "Tailwind CSS colors",
    author: "Tailwind Labs, Inc.",
    license: "MIT License",
    licenseFile: "LICENSES/Tailwind-MIT.txt",
  },
  {
    name: "Nord colors",
    author: "Sven Greb",
    license: "MIT License",
    licenseFile: "LICENSES/Nord-MIT.txt",
  },
  {
    name: "Japanese Wikipedia color references",
    author: "Japanese Wikipedia contributors",
    license: "CC BY-SA 4.0",
    licenseFile: "LICENSES/CC-BY-SA-4.0.txt",
  },
  {
    name: "Sanzo Wada digital color data",
    author: "Dain Blodorn",
    license: "MIT License",
    licenseFile: "LICENSES/Sanzo-Wada-MIT.txt",
  },
];

/**
 * Official asset names or terminology used in the owners' guidelines.
 * Use Japanese only where the owner publishes that wording; otherwise keep
 * the English name. X, YouTube and Amazon are drawn by Tabler Icons,
 * credited above.
 * These marks remain excluded from the site's license (LICENSE section 3).
 */
export const trademarks = [
  // https://brand.github.com/foundations/logo
  { name: { ja: "Invertocat", en: "Invertocat" }, owner: "GitHub, Inc." },
  // https://about.x.com/ja/who-we-are/brand-toolkit (English: /en/)
  { name: { ja: "Xロゴ", en: "X logo" }, owner: "X Corp." },
  // https://booth.pm/announcements/989 (ja), /announcements/747 (ja/en)
  {
    name: { ja: "BOOTHロゴ", en: "BOOTH logo" },
    owner: "pixiv Inc.",
  },
  // https://developers.google.com/youtube/terms/branding-guidelines?hl=ja
  // https://brand.youtube/youtube-icon/
  { name: { ja: "YouTube アイコン", en: "YouTube Icon" }, owner: "Google LLC" },
  // https://docs.npmjs.com/policies/npm-license/ ("npm Logo")
  { name: { ja: "npm Logo", en: "npm Logo" }, owner: "npm, Inc." },
  // https://www.python.org/psf/trademarks-faq/#python-package-index
  {
    name: { ja: "PyPI logo", en: "PyPI logo" },
    owner: "Python Software Foundation",
  },
  // https://advertising.amazon.com/ja-jp/resources/ad-policy/brand-usage
  // https://advertising.amazon.com/resources/ad-policy/brand-usage
  {
    name: { ja: "Smileロゴ", en: "Smile logo" },
    owner: {
      ja: "Amazon.com, Inc. またはその関連会社",
      en: "Amazon.com, Inc. or its affiliates",
    },
  },
] as const;

/** Legal entity names are shared; descriptive ownership phrases are localized. */
export const trademarkOwner = (
  mark: (typeof trademarks)[number],
  lang: Locale,
): string => (typeof mark.owner === "string" ? mark.owner : mark.owner[lang]);

/** Where a license file of this repository is shown on GitHub. */
export const licenseUrl = (file: Credit["licenseFile"]) =>
  `${site.links.github}/unlibra.com/blob/main/${file}`;

/** The list of the npm packages in the build output, with their licenses. */
export const thirdPartyLicensesPath = "/third-party-licenses.txt";
