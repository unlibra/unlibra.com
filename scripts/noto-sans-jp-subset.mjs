// Serves Noto Sans JP cut down to the characters the site uses
// (SP-7).
//
// @fontsource-variable/noto-sans-jp splits the font into 124 files by
// unicode-range, and a page loads every file that holds one of its
// characters: the top page loaded 24 files (508 KB). After the build, this
// integration:
//
// 1. collects every character of the HTML and JavaScript files in dist/ (the
//    pages, and the texts the islands show later), plus printable ASCII
//    (what a visitor may type into a tool),
// 2. cuts each Fontsource file down to the collected characters it holds, and
//    writes it to dist/_astro/ with a content hash (immutable cache,
//    public/_headers),
// 3. adds @font-face rules for these files to the end of each page's <head>,
//    with the same descriptors and metric overrides as the Fontsource rules,
//    and a unicode-range of exactly the characters each file holds.
//
// 4. moves the Fontsource rules out of the stylesheets into their own file
//    (dist/_astro/noto-sans-jp-fallback.<hash>.css), linked before the
//    added rules once the page has loaded (SP-14, SP-15): it neither blocks
//    the first render nor shares the network with the page's own requests,
//    such as the LCP image.
//
// The Fontsource rules stay as a fallback. For a character, the browser
// checks the faces of a family from the last defined (CSS Fonts 4, 4.5; the
// order of the style sheets in the document, not the order they load in),
// so the cut files win for the collected characters, and any other
// character (a file name a visitor drops, for example) still loads its
// Fontsource file. A file is downloaded only when the page shows one of its
// characters.
//
// The cut files keep the font's name table, copyright and license URL (SIL
// Open Font License 1.1, as the Fontsource files; LICENSES and
// /third-party-licenses.txt list the package).
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import subsetFont from "subset-font";

/** The family of the Fontsource rules, which the cut files join. */
export const FAMILY = "Noto Sans JP Variable";

/**
 * Metric overrides of Noto Sans JP (DESIGN.md 6.1): the vertical middle of the
 * capitals and the kanji at the middle of the line. astro.config.mjs adds
 * them to the Fontsource rules, and the cut files get the same.
 */
export const METRIC_OVERRIDES = {
  "ascent-override": "109.4%",
  "descent-override": "35.4%",
};

/** Marks the added rules in each page (tests/noto-sans-jp-subset.test.js). */
export const STYLE_ATTRIBUTE = "data-noto-sans-jp-subset";

/** Marks the link to the Fontsource rules in each page. */
export const FALLBACK_ATTRIBUTE = "data-noto-sans-jp-fallback";

/** The Fontsource rules in a built stylesheet (the family is not quoted). */
const BUILT_RULE = new RegExp(
  `@font-face\\{[^}]*font-family:\\s*["']?${FAMILY}["']?[;}][^}]*\\}`,
  "g",
);

/**
 * Moves the Fontsource rules out of the built stylesheets: returns each
 * stylesheet without them, and the rules.
 */
export const splitFallbackRules = (stylesheets) => {
  const rules = [];
  const rest = stylesheets.map((css) =>
    css.replace(BUILT_RULE, (rule) => {
      rules.push(rule);
      return "";
    }),
  );
  return { rest, rules };
};

/**
 * The link to the Fontsource rules, added by a script once the page has
 * loaded, in the script's place (so before the added rules, in document
 * order). Without JavaScript, a plain link.
 */
export const fallbackLink = (href) =>
  `<script ${FALLBACK_ATTRIBUTE}>{const s=document.currentScript;` +
  `addEventListener("load",()=>{const l=document.createElement("link");` +
  `l.rel="stylesheet";l.href="${href}";s.before(l)},{once:true})}</script>` +
  `<noscript><link rel="stylesheet" href="${href}"></noscript>`;

/** Printable ASCII: always kept, for what a visitor types. */
const ASCII = Array.from({ length: 0x7f - 0x20 }, (_, i) =>
  String.fromCodePoint(0x20 + i),
).join("");

/** Parses `U+3042,U+3044-3046` into [first, last] code point pairs. */
export const parseUnicodeRange = (value) =>
  value.split(",").map((part) => {
    const [first, last = first] = part.trim().replace(/^U\+/i, "").split("-");
    if (first.includes("?")) {
      throw new Error(`unicode-range wildcards are not supported: ${part}`);
    }
    return [parseInt(first, 16), parseInt(last, 16)];
  });

/** Writes sorted code points as a unicode-range value, joining runs. */
export const formatUnicodeRange = (codePoints) => {
  const sorted = [...new Set(codePoints)].sort((a, b) => a - b);
  const parts = [];
  for (let i = 0; i < sorted.length; i++) {
    let j = i;
    while (j + 1 < sorted.length && sorted[j + 1] === sorted[j] + 1) j++;
    const hex = (cp) => cp.toString(16);
    parts.push(
      i === j ? `U+${hex(sorted[i])}` : `U+${hex(sorted[i])}-${hex(sorted[j])}`,
    );
    i = j;
  }
  return parts.join(",");
};

/** The @font-face rules of a Fontsource stylesheet: file and code points. */
export const parseFontsourceCss = (css) => {
  const faces = [...css.matchAll(/@font-face\s*{([^}]*)}/g)].map((match) => {
    const body = match[1];
    const descriptor = (name) =>
      body.match(new RegExp(`${name}:\\s*([^;]+);`))?.[1].trim();
    const file = descriptor("src")?.match(/url\(\.\/files\/([^)]+)\)/)?.[1];
    const range = descriptor("unicode-range");
    if (
      descriptor("font-family") !== `'${FAMILY}'` ||
      descriptor("font-style") !== "normal" ||
      descriptor("font-weight") !== "100 900" ||
      !file ||
      !range
    ) {
      throw new Error(`unexpected Fontsource rule: ${body.trim()}`);
    }
    return { file, ranges: parseUnicodeRange(range) };
  });
  if (faces.length === 0) throw new Error("no Fontsource rules found");
  return faces;
};

const listFiles = (dir) =>
  readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name));

/** The characters of the site: every HTML and JavaScript file, and ASCII. */
export const collectCodePoints = (files) => {
  const codePoints = new Set();
  for (const file of files) {
    for (const char of readFileSync(file, "utf8")) {
      codePoints.add(char.codePointAt(0));
    }
  }
  for (const char of ASCII) codePoints.add(char.codePointAt(0));
  return codePoints;
};

/** The @font-face rule of one cut file. */
const fontFaceRule = (url, codePoints) =>
  [
    "@font-face{",
    `font-family:'${FAMILY}';`,
    "font-style:normal;",
    "font-display:swap;",
    "font-weight:100 900;",
    ...Object.entries(METRIC_OVERRIDES).map(
      ([name, value]) => `${name}:${value};`,
    ),
    `src:url(${url}) format('woff2-variations');`,
    `unicode-range:${formatUnicodeRange(codePoints)};`,
    "}",
  ].join("");

export default function notoSansJpSubset() {
  let projectRoot;

  return {
    name: "noto-sans-jp-subset",
    hooks: {
      "astro:config:setup": ({ config }) => {
        projectRoot = fileURLToPath(config.root);
      },
      "astro:build:done": async ({ dir, logger }) => {
        const distDir = fileURLToPath(dir);
        const require = createRequire(join(projectRoot, "package.json"));
        const packageDir = dirname(
          require.resolve("@fontsource-variable/noto-sans-jp/package.json"),
        );
        const faces = parseFontsourceCss(
          readFileSync(join(packageDir, "index.css"), "utf8"),
        );

        const files = listFiles(distDir);
        const pages = files.filter((file) => file.endsWith(".html"));
        const codePoints = collectCodePoints(
          files.filter((file) => /\.(html|js)$/.test(file)),
        );

        const rules = [];
        let before = 0;
        let after = 0;
        for (const { file, ranges } of faces) {
          const held = [...codePoints].filter((cp) =>
            ranges.some(([first, last]) => cp >= first && cp <= last),
          );
          if (held.length === 0) continue;
          const source = readFileSync(join(packageDir, "files", file));
          const cut = await subsetFont(source, String.fromCodePoint(...held), {
            targetFormat: "woff2",
            // The license description and URL (OFL condition 2), besides
            // the default names (IDs 0-6: copyright, family and so on).
            preserveNameIds: [13, 14],
          });
          const hash = createHash("sha256")
            .update(cut)
            .digest("hex")
            .slice(0, 8);
          const name = `${file.replace(/\.woff2$/, "")}-subset.${hash}.woff2`;
          writeFileSync(join(distDir, "_astro", name), cut);
          rules.push(fontFaceRule(`/_astro/${name}`, held));
          before += source.length;
          after += cut.length;
        }

        const stylesheets = files.filter((file) =>
          /[\\/]_astro[\\/][^\\/]+\.css$/.test(file),
        );
        const split = splitFallbackRules(
          stylesheets.map((file) => readFileSync(file, "utf8")),
        );
        if (split.rules.length !== faces.length) {
          throw new Error(
            `expected ${faces.length} Fontsource rules in the stylesheets, found ${split.rules.length}`,
          );
        }
        stylesheets.forEach((file, i) => writeFileSync(file, split.rest[i]));
        const fallback = split.rules.join("");
        const fallbackName = `noto-sans-jp-fallback.${createHash("sha256")
          .update(fallback)
          .digest("hex")
          .slice(0, 8)}.css`;
        writeFileSync(join(distDir, "_astro", fallbackName), fallback);

        const style =
          fallbackLink(`/_astro/${fallbackName}`) +
          `<style ${STYLE_ATTRIBUTE}>${rules.join("")}</style>`;
        for (const page of pages) {
          const html = readFileSync(page, "utf8");
          if (!html.includes("</head>")) {
            throw new Error(`${relative(distDir, page)}: no </head>`);
          }
          writeFileSync(page, html.replace("</head>", `${style}</head>`));
        }
        logger.info(
          `${rules.length} Noto Sans JP files cut to ${codePoints.size} characters: ` +
            `${Math.round(before / 1024)} KB -> ${Math.round(after / 1024)} KB`,
        );
      },
    },
  };
}
