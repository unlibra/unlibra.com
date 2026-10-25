// The credits page (/credits, ui-revise6 4). The materials by other authors
// are those of section 2 of LICENSE, which is the source of truth: each entry
// has the name, the copyright holder, the license and the license file
// written there (tests/credits.test.js finds a source in LICENSE that is
// missing here).
import { site } from "./site.ts";

/** One credit: the material's name, its author and its license. */
export interface Credit {
  name: string;
  author: string;
  license: string;
  /** The license's full text in this repository (LICENSES/). */
  licenseFile: `LICENSES/${string}`;
}

/** The characters in the site's images. */
export const characters = [{ name: "ムルル", rights: "©Lethal Cats" }] as const;

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
 * Logos of other services on the site, by the names their owners use:
 * trademarks of their owners, not licensed (section 3 of LICENSE). The
 * Invertocat is the hero's GitHub logo; the X logo is Just HEX's share
 * button (drawn by Tabler Icons, credited above), listed too so that both
 * logos read alike (the user's choice).
 */
export const trademarks = [
  { name: "Invertocat", owner: "GitHub, Inc." },
  { name: "X logo", owner: "X Corp." },
] as const;

/** Where a license file of this repository is shown on GitHub. */
export const licenseUrl = (file: Credit["licenseFile"]) =>
  `${site.links.github}/unlibra.com/blob/main/${file}`;

/** The list of the npm packages in the build output, with their licenses. */
export const thirdPartyLicensesPath = "/third-party-licenses.txt";
