// Draws the logotype "unlibra" as an SVG: the outlines of LINE Seed JP Bold
// (from @fontsource/line-seed-jp), placed as the font sets the text (its
// advances and kerning). A drawing never waits for a font, so the logotype
// never shows in another font first (SP-16).
//
//   npm run generate:logotype
//
// The output is kept in the repository and does not follow updates of the
// package: the logotype stays as it is.
//
// The SVG is sized in em with the font's line metrics (ascender and
// descender), and sits on the baseline (vertical-align: -descender), so in
// text of the same size it covers what the text would.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import * as hb from "harfbuzzjs";
import subsetFont from "subset-font";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** The text of the logotype. */
export const LOGOTYPE_TEXT = "unlibra";

/** The source: the latin range of LINE Seed JP's bold weight. */
export const LOGOTYPE_SOURCE =
  "node_modules/@fontsource/line-seed-jp/files/line-seed-jp-latin-700-normal.woff2";

/** The drawing, imported by src/components/layout/Logotype.astro. */
export const LOGOTYPE_FILE = "src/assets/brand/logotype.svg";

/** Rounds a number to at most 3 decimals, without trailing zeros. */
const num = (value) => String(Math.round(value * 1000) / 1000);

/** The SVG of `text` in the font file `source` (WOFF2). */
export async function drawLogotype(source, text) {
  // HarfBuzz reads OpenType, not WOFF2: subset-font unpacks it.
  const sfnt = await subsetFont(source, text, { targetFormat: "sfnt" });
  const face = new hb.Face(new hb.Blob(sfnt));
  const font = new hb.Font(face);
  const buffer = new hb.Buffer();
  buffer.addText(text);
  buffer.guessSegmentProperties();
  hb.shape(font, buffer);

  const { ascender, descender } = font.hExtents();
  const upem = face.upem;
  let x = 0;
  const paths = [];
  const infos = buffer.getGlyphInfos();
  const positions = buffer.getGlyphPositions();
  for (const [i, { codepoint: glyph }] of infos.entries()) {
    const { xAdvance, xOffset, yOffset } = positions[i];
    // Font units, y up: moved to the glyph's place and flipped for SVG.
    const path = font
      .glyphToPath(glyph)
      .replace(
        /(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g,
        (_, px, py) =>
          `${num(Number(px) + x + xOffset)},${num(-(Number(py) + yOffset))}`,
      );
    paths.push(path);
    x += xAdvance;
  }
  const em = (units) => `${num(units / upem)}em`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" ` +
    `viewBox="0 ${-ascender} ${x} ${ascender - descender}" ` +
    `width="${em(x)}" height="${em(ascender - descender)}" ` +
    `style="vertical-align:${em(descender)}" fill="currentColor">` +
    `<path d="${paths.join("")}"/></svg>\n`
  );
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  const svg = await drawLogotype(
    readFileSync(join(root, LOGOTYPE_SOURCE)),
    LOGOTYPE_TEXT,
  );
  writeFileSync(join(root, LOGOTYPE_FILE), svg);
  console.log(`Wrote ${LOGOTYPE_FILE}: ${svg.length} bytes`);
}
