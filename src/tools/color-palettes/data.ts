export const collectionIds = [
  "japanese",
  "world",
  "tailwind",
  "nord",
  "radix",
  "catppuccin",
  "dracula",
  "open-color",
] as const;
export type CollectionId = (typeof collectionIds)[number];
/** Each collection's page: /palette/<slug>. */
export const collectionSlugs: Record<CollectionId, string> = {
  japanese: "japanese",
  world: "world",
  tailwind: "tailwindcss",
  nord: "nord",
  radix: "radix-colors",
  catppuccin: "catppuccin",
  dracula: "dracula",
  "open-color": "open-color",
};
/** Collections of named colors; each of their colors has a page under /colors/. */
export const isNamedCollection = (id: CollectionId) =>
  id === "japanese" || id === "world";
/** A page path in the page's language (English pages are under /en). */
export const pagePath = (path: string, locale: "ja" | "en") =>
  `${locale === "en" ? "/en" : ""}${path}`;
export const paletteUrl = (id: CollectionId, locale: "ja" | "en") =>
  pagePath(`/palette/${collectionSlugs[id]}`, locale);
export const colorUrl = (slug: string, locale: "ja" | "en") =>
  pagePath(`/colors/${slug}`, locale);
export interface PaletteColor {
  id: string;
  name: string;
  hex: string;
  group: string;
  source: string;
  kana?: string;
  romanized?: string;
  shade?: string;
  css?: string;
  aliases?: string[];
  nameSources?: string[];
  nameQualifier?: string;
  /** The color's page under /colors/ (named colors only). */
  slug?: string;
  /** The Wikipedia revision of the value's source (named colors). */
  revision?: number;
  variant?: string;
  munsellEstimate?: string;
}
export interface NameReference {
  id: string;
  label: string;
  url: string;
}
export interface PaletteGroup {
  name: string;
  colors: PaletteColor[];
}

export const references = {
  japanese: {
    url: "https://ja.wikipedia.org/wiki/色名一覧",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  },
  world: {
    url: "https://ja.wikipedia.org/wiki/色名一覧",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  },
  tailwind: {
    url: "https://github.com/tailwindlabs/tailwindcss/blob/v4.3.3/packages/tailwindcss/theme.css",
    license: "MIT",
    licenseUrl: "/palette-data/licenses.txt#tailwind",
  },
  nord: {
    url: "https://www.nordtheme.com/docs/colors-and-palettes",
    license: "MIT",
    licenseUrl: "/palette-data/licenses.txt#nord",
  },
  radix: {
    url: "https://www.radix-ui.com/colors",
    license: "MIT",
    licenseUrl: "/palette-data/licenses.txt#radix",
  },
  catppuccin: {
    url: "https://catppuccin.com/palette/",
    license: "MIT",
    licenseUrl: "/palette-data/licenses.txt#catppuccin",
  },
  dracula: {
    url: "https://github.com/dracula/dracula-theme",
    license: "MIT",
    licenseUrl: "/palette-data/licenses.txt#dracula",
  },
  "open-color": {
    url: "https://yeun.github.io/open-color/",
    license: "MIT",
    licenseUrl: "/palette-data/licenses.txt#open-color",
  },
} as const;
export const pantoneUrl = "https://www.pantone.com/na/en-us/color-finder";
export const dicUrl = "https://www.dic-graphics.co.jp/color/search.html";
export const groupsFor = (items: PaletteColor[]): PaletteGroup[] => {
  const groups = new Map<string, PaletteColor[]>();
  for (const color of items) {
    const group = groups.get(color.group);
    if (group) group.push(color);
    else groups.set(color.group, [color]);
  }
  return [...groups].map(([name, colors]) => ({ name, colors }));
};
