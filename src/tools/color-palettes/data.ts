export const collectionIds = [
  "japanese",
  "world",
  "wada",
  "tailwind",
  "nord",
] as const;
export type CollectionId = (typeof collectionIds)[number];
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
  originalSource?: string;
  aliases?: string[];
  nameSources?: string[];
  nameQualifier?: string;
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
  wada: {
    url: "https://github.com/dblodorn/sanzo-wada/tree/1f620807861df45f5a4e764b4e6be5e8fb9ce9eb",
    license: "MIT",
    licenseUrl: "/palette-data/licenses.txt#wada",
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
} as const;
export const wadaOriginal = {
  url: "https://ndlsearch.ndl.go.jp/books/R100000039-I1145849",
  licenseUrl: "https://creativecommons.org/publicdomain/mark/1.0/",
};
export const pantoneUrl = "https://www.pantone.com/na/en-us/color-finder";
export const groupsFor = (items: PaletteColor[]): PaletteGroup[] => {
  const groups = new Map<string, PaletteColor[]>();
  for (const color of items) {
    const group = groups.get(color.group);
    if (group) group.push(color);
    else groups.set(color.group, [color]);
  }
  return [...groups].map(([name, colors]) => ({ name, colors }));
};
export const matchesColor = (color: PaletteColor, query: string): boolean => {
  const normalized = query
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase()
    .replace(/^#/, "");
  return [
    color.name,
    color.kana,
    color.romanized,
    color.hex,
    color.group,
    ...(color.aliases ?? []),
  ].some((value) =>
    value?.normalize("NFKC").toLocaleLowerCase().includes(normalized),
  );
};

export const rgbOf = (hex: string): string =>
  hex
    .slice(1)
    .match(/../g)!
    .map((pair) => parseInt(pair, 16))
    .join(", ");
