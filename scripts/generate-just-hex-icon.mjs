// Draws the icon of Just HEX (src/assets/tools/just-hex.svg): a color shared
// as a share card, as in the top page's share dialog (docs/decisions/
// just-hex/ JH-16, JH-17). On the color (sora, #A0D8EF), the card in a white
// frame with the name and the URL, and the button "Share this color". A
// picture, not a screenshot: the card has no shadow, and the texts are
// abstract, a rounded block in the place of each letter (as high as the
// letter), so that they read as text but cannot be read.
//
//   npm run generate:just-hex-icon
//
// The letters' places and heights are those of LINE Seed JP (from
// @fontsource/line-seed-jp, as the logotype: scripts/generate-logotype.mjs);
// no outline of the font is in the icon. The button's icon is Tabler Icons'
// "share", with its paths as in @tabler/icons. The output is kept in the
// repository and does not follow updates of the packages.
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

/** The color, and the colors on it (Tailwind's gray-900 and gray-500). */
const COLOR = "#A0D8EF";
const INK = "#101828";
const MUTED = "#6A7282";

/** Rounds a number to at most 2 decimals, without trailing zeros. */
const num = (value) => String(Math.round(value * 100) / 100);

/**
 * The letters of a text in a font file (WOFF2), `size` px high (the em),
 * its baseline at `y` and its left at `x`: the box of each letter, across
 * its advance and as high as its outline, and the text's width.
 */
async function letters(source, text, { size, x, y }) {
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
  const scale = size / face.upem;
  const positions = buffer.getGlyphPositions();
  let pen = x;
  const boxes = [];
  for (const [i, { codepoint: glyph }] of buffer.getGlyphInfos().entries()) {
    const { xAdvance, yOffset } = positions[i];
    // A space has no outline, and no box.
    const extents = font.glyphExtents(glyph);
    if (extents && extents.width > 0) {
      // Font units, y up: scaled and flipped.
      boxes.push({
        x: pen,
        y: y - (extents.yBearing + yOffset) * scale,
        width: xAdvance * scale,
        height: -extents.height * scale,
      });
    }
    pen += xAdvance * scale;
  }
  return { boxes, width: pen - x };
}

/** Between the blocks of two letters, and their corners' radius. */
const LETTER_GAP = 1;
const LETTER_RADIUS = 2;

/** The abstract text: a rounded block in the place of each letter. */
const abstractText = ({ boxes }, fill) =>
  `<g fill="${fill}">` +
  boxes
    .map(
      (box) =>
        `<rect x="${num(box.x + LETTER_GAP / 2)}" y="${num(box.y)}" ` +
        `width="${num(box.width - LETTER_GAP)}" height="${num(box.height)}" ` +
        `rx="${LETTER_RADIUS}"/>`,
    )
    .join("") +
  "</g>";

/** A Tabler icon (24×24, stroke 2) at `x`, `y`, `size` px wide. */
const tabler = (name, { x, y, size, color }) => {
  const source = readFileSync(
    join(root, `node_modules/@tabler/icons/icons/outline/${name}.svg`),
    "utf8",
  );
  const paths = [...source.matchAll(/<path d="([^"]+)"/g)]
    .map(([, d]) => `<path d="${d}"/>`)
    .join("");
  return (
    `<g transform="translate(${num(x)} ${num(y)}) scale(${num(size / 24)})" ` +
    `fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" ` +
    `stroke-linejoin="round">${paths}</g>`
  );
};

export async function drawIcon() {
  // The card: 200 wide, a frame of 4 around the color at the OGP image's
  // ratio (1200×630), then the name and the URL; under it, the button. The
  // two together in the middle.
  const card = { x: 100, width: 200, frame: 4 };
  const colorWidth = card.width - card.frame * 2;
  const colorHeight = (colorWidth * 630) / 1200;
  const cardHeight = card.frame + colorHeight + 48;
  const pill = { height: 32, gap: 14 };
  const cardY = (300 - (cardHeight + pill.gap + pill.height)) / 2;
  const colorBottom = cardY + card.frame + colorHeight;
  const name = await letters(FONTS.bold, "Just HEX", {
    size: 14,
    x: card.x + 12,
    y: colorBottom + 22,
  });
  const url = await letters(FONTS.regular, "unlibra.com/hex/A0D8EF", {
    size: 10.5,
    x: card.x + 12,
    y: colorBottom + 38,
  });

  // "Share this color": a dark pill, its icon before the text.
  const iconSize = 14;
  const gap = 6;
  const { width: labelWidth } = await letters(FONTS.bold, "Share this color", {
    size: 12,
    x: 0,
    y: 0,
  });
  const pillWidth = iconSize + gap + labelWidth + 32;
  const pillX = 200 - pillWidth / 2;
  const pillY = cardY + cardHeight + pill.gap;
  const label = await letters(FONTS.bold, "Share this color", {
    size: 12,
    x: pillX + 16 + iconSize + gap,
    y: pillY + pill.height / 2 + 4.3,
  });
  const icon = tabler("share", {
    x: pillX + 16,
    y: pillY + (pill.height - iconSize) / 2,
    size: iconSize,
    color: "#fff",
  });

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">\n` +
    `  <!-- Just HEX: a color shared as a share card (docs/decisions/just-hex/\n` +
    `       JH-16, JH-17). Drawn by scripts/generate-just-hex-icon.mjs. The\n` +
    `       button's icon is Tabler Icons "share" from the npm package\n` +
    `       @tabler/icons (icons/outline/). MIT License,\n` +
    `       Copyright (c) 2020-2026 Paweł Kuna.\n` +
    `       The full text is in LICENSES/Tabler-MIT.txt. -->\n` +
    `  <rect width="400" height="300" fill="${COLOR}"/>\n` +
    `  <rect x="${card.x}" y="${num(cardY)}" width="${card.width}" height="${num(cardHeight)}" rx="14" fill="#fff"/>\n` +
    `  <rect x="${card.x + card.frame}" y="${num(cardY + card.frame)}" width="${colorWidth}" height="${num(colorHeight)}" rx="10" fill="${COLOR}"/>\n` +
    `  ${abstractText(name, INK)}\n` +
    `  ${abstractText(url, MUTED)}\n` +
    `  <rect x="${num(pillX)}" y="${num(pillY)}" width="${num(pillWidth)}" height="${pill.height}" rx="16" fill="#000" fill-opacity="0.45"/>\n` +
    `  ${icon}\n` +
    `  ${abstractText(label, "#fff")}\n` +
    `</svg>\n`
  );
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  writeFileSync(join(root, ICON_FILE), await drawIcon());
  console.log(`Wrote ${ICON_FILE}`);
}
