// Draws the icon of Just HEX (src/assets/tools/just-hex.svg): a color shared
// as a share card, as in the top page's share dialog (docs/decisions/
// just-hex/ JH-16 to JH-18). On the color (sora, #A0D8EF), the card in a white
// frame with the name and the URL, and the button "Share this color". A
// picture, not a screenshot: the card has no shadow, and each line of text
// is a skeleton, a rounded bar as long as the text, without the loaders'
// animation.
//
//   npm run generate:just-hex-icon
//
// The bars' lengths are the texts' widths in LINE Seed JP (from
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

/** The color, and the skeletons' (Tailwind's gray-200 on the card). */
const COLOR = "#A0D8EF";
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
const skeleton = ({ x, y, width, height }, fill, opacity = 1) =>
  `<rect x="${num(x)}" y="${num(y - height / 2)}" width="${num(width)}" ` +
  `height="${height}" rx="${height / 2}" fill="${fill}"` +
  (opacity < 1 ? ` fill-opacity="${opacity}"` : "") +
  "/>";

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
  // The name and the URL, in the card's text sizes (14 and 10.5), as bars
  // about as high as their capitals.
  const name = {
    x: card.x + 12,
    y: colorBottom + 17,
    width: await textWidth(FONTS.bold, "Just HEX", 14),
    height: 9,
  };
  const url = {
    x: card.x + 12,
    y: colorBottom + 34,
    width: await textWidth(FONTS.regular, "unlibra.com/hex/A0D8EF", 10.5),
    height: 7,
  };

  // "Share this color": a dark pill, its icon before the text.
  const iconSize = 14;
  const gap = 6;
  const labelWidth = await textWidth(FONTS.bold, "Share this color", 12);
  const pillWidth = iconSize + gap + labelWidth + 32;
  const pillX = 200 - pillWidth / 2;
  const pillY = cardY + cardHeight + pill.gap;
  const label = {
    x: pillX + 16 + iconSize + gap,
    y: pillY + pill.height / 2,
    width: labelWidth,
    height: 8,
  };
  const icon = tabler("share", {
    x: pillX + 16,
    y: pillY + (pill.height - iconSize) / 2,
    size: iconSize,
    color: "#fff",
  });

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">\n` +
    `  <!-- Just HEX: a color shared as a share card (docs/decisions/just-hex/\n` +
    `       JH-16 to JH-18). Drawn by scripts/generate-just-hex-icon.mjs. The\n` +
    `       button's icon is Tabler Icons "share" from the npm package\n` +
    `       @tabler/icons (icons/outline/). MIT License,\n` +
    `       Copyright (c) 2020-2026 Paweł Kuna.\n` +
    `       The full text is in LICENSES/Tabler-MIT.txt. -->\n` +
    `  <rect width="400" height="300" fill="${COLOR}"/>\n` +
    `  <rect x="${card.x}" y="${num(cardY)}" width="${card.width}" height="${num(cardHeight)}" rx="14" fill="#fff"/>\n` +
    `  <rect x="${card.x + card.frame}" y="${num(cardY + card.frame)}" width="${colorWidth}" height="${num(colorHeight)}" rx="10" fill="${COLOR}"/>\n` +
    `  ${skeleton(name, SKELETON)}\n` +
    `  ${skeleton(url, SKELETON)}\n` +
    `  <rect x="${num(pillX)}" y="${num(pillY)}" width="${num(pillWidth)}" height="${pill.height}" rx="16" fill="#000" fill-opacity="0.45"/>\n` +
    `  ${icon}\n` +
    `  ${skeleton(label, "#fff", 0.75)}\n` +
    `</svg>\n`
  );
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  writeFileSync(join(root, ICON_FILE), await drawIcon());
  console.log(`Wrote ${ICON_FILE}`);
}
