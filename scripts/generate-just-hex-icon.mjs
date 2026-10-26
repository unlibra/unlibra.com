// Draws the icon of Just HEX (src/assets/tools/just-hex.svg): a color shared
// as a share card, as in the top page's share dialog (docs/decisions/
// just-hex/ JH-16 to JH-20). On the site's primary blue, the card in a white
// frame with a color (sora) and a line of text, and under it a form: a
// field and a button with an arrow. A picture, not a screenshot: shapes
// only, without icons; the card has no shadow, and the line of text is a
// skeleton, a rounded bar as long as the text, without the loaders'
// animation.
//
//   npm run generate:just-hex-icon
//
// The bars' lengths are the texts' widths in LINE Seed JP (from
// @fontsource/line-seed-jp, as the logotype: scripts/generate-logotype.mjs);
// no outline of the font is in the icon. The output is kept in the
// repository and does not follow updates of the package.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import * as hb from "harfbuzzjs";
import subsetFont from "subset-font";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** The drawing, imported by src/config/works.ts. */
export const ICON_FILE = "src/assets/tools/just-hex.svg";

const FONTS = {
  bold: "node_modules/@fontsource/line-seed-jp/files/line-seed-jp-latin-700-normal.woff2",
  regular:
    "node_modules/@fontsource/line-seed-jp/files/line-seed-jp-latin-400-normal.woff2",
};

/** The colors, and the skeleton's (Tailwind's gray-200 on the card). */
const SORA = "#A0D8EF";
const PRIMARY = "#277DB2";
const SKELETON = "#E5E7EB";

/** Rounds a number to at most 2 decimals, without trailing zeros. */
const num = (value) => String(Math.round(value * 100) / 100);

/** The width of a text in a font file (WOFF2), `size` px high (the em). */
async function textWidth(source, text, size) {
  // HarfBuzz reads OpenType, not WOFF2: subset-font unpacks it.
  const sfnt = await subsetFont(readFileSync(join(root, source)), text, {
    targetFormat: "sfnt",
  });
  const face = new hb.Face(new hb.Blob(sfnt));
  const font = new hb.Font(face);
  const buffer = new hb.Buffer();
  buffer.addText(text);
  buffer.guessSegmentProperties();
  hb.shape(font, buffer);
  const advance = buffer
    .getGlyphPositions()
    .reduce((sum, { xAdvance }) => sum + xAdvance, 0);
  return (advance * size) / face.upem;
}

/** A skeleton line: a fully rounded bar, its middle at `y`. */
const skeleton = ({ x, y, width, height }, fill) =>
  `<rect x="${num(x)}" y="${num(y - height / 2)}" width="${num(width)}" ` +
  `height="${height}" rx="${height / 2}" fill="${fill}"/>`;

/**
 * The form: a round white field, and a round button after it in the card's
 * color, with an arrow in the ground's color (two strokes and a line, drawn
 * here).
 */
const drawForm = ({ x, y, width, height, color, ground }) => {
  const r = height / 2;
  const fieldWidth = width - height - 8;
  const cx = x + width - r;
  const cy = y + r;
  return (
    `<rect x="${x}" y="${num(y)}" width="${fieldWidth}" height="${height}" rx="${r}" fill="#fff"/>` +
    `<circle cx="${cx}" cy="${num(cy)}" r="${r}" fill="${color}"/>` +
    `<path d="M${cx - 6} ${num(cy)}h12M${cx + 1} ${num(cy - 5)}l5 5l-5 5" ` +
    `fill="none" stroke="${ground}" stroke-width="2" stroke-linecap="round" ` +
    `stroke-linejoin="round"/>`
  );
};

export async function drawIcon() {
  // The ground is the site's primary blue; the card's color is sora (the
  // user's choice, JH-20).
  const ground = PRIMARY;
  const color = SORA;
  // The card: 200 wide, a frame of 4 around the color at the OGP image's
  // ratio (1200×630), then a line of text; under it, the form. The two
  // together in the middle.
  const card = { x: 100, width: 200, frame: 4 };
  const colorWidth = card.width - card.frame * 2;
  const colorHeight = (colorWidth * 630) / 1200;
  const cardHeight = card.frame + colorHeight + 30;
  const form = { height: 32, gap: 14 };
  const cardY = (300 - (cardHeight + form.gap + form.height)) / 2;
  const colorBottom = cardY + card.frame + colorHeight;
  // The name, in the card's text size (14), as a bar about as high as its
  // capitals.
  const name = {
    x: card.x + 12,
    y: colorBottom + 13,
    width: await textWidth(FONTS.bold, "Just HEX", 14),
    height: 9,
  };

  // Under the card, a form: a field and a button, as wide as the card.
  const formShapes = drawForm({
    x: card.x,
    y: cardY + cardHeight + form.gap,
    width: card.width,
    height: form.height,
    color,
    ground,
  });

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">\n` +
    `  <!-- Just HEX: a color shared as a share card (docs/decisions/just-hex/\n` +
    `       JH-16 to JH-20). Drawn by scripts/generate-just-hex-icon.mjs. -->\n` +
    `  <rect width="400" height="300" fill="${ground}"/>\n` +
    `  <rect x="${card.x}" y="${num(cardY)}" width="${card.width}" height="${num(cardHeight)}" rx="14" fill="#fff"/>\n` +
    `  <rect x="${card.x + card.frame}" y="${num(cardY + card.frame)}" width="${colorWidth}" height="${num(colorHeight)}" rx="10" fill="${color}"/>\n` +
    `  ${skeleton(name, SKELETON)}\n` +
    `  ${formShapes}\n` +
    `</svg>\n`
  );
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  writeFileSync(join(root, ICON_FILE), await drawIcon());
  console.log(`Wrote ${ICON_FILE}`);
}
