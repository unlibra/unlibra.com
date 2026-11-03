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
];

/**
 * Logos of other services on the site, by the names their owners use, in
 * each language (the X logo has no name of its own: X's Japanese pages call
 * it Xロゴ, its English ones the X logo):
 * trademarks of their owners, not licensed (section 3 of LICENSE). The
 * Invertocat appears in the footer and on the support page. X is drawn by Tabler Icons,
 * credited above; BOOTH and YouTube use their official logos.
 */
export const trademarks = [
  { name: { ja: "Invertocat", en: "Invertocat" }, owner: "GitHub, Inc." },
  { name: { ja: "Xロゴ", en: "X logo" }, owner: "X Corp." },
  {
    name: { ja: "BOOTHロゴ", en: "BOOTH logo" },
    owner: "pixiv Inc.",
  },
  { name: { ja: "YouTubeアイコン", en: "YouTube icon" }, owner: "Google LLC" },
  { name: { ja: "npmロゴ", en: "npm logo" }, owner: "npm, Inc." },
  {
    name: { ja: "PyPIロゴ", en: "PyPI logo" },
    owner: "Python Software Foundation",
  },
  {
    name: { ja: "Amazonロゴ", en: "Amazon logo" },
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
