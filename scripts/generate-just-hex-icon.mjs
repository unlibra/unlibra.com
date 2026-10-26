// Draws the icon of Just HEX (src/assets/tools/just-hex.svg): a color shared
// as a share card, as in the top page's share dialog (docs/decisions/
// just-hex/ JH-16). On the color (sora, #A0D8EF), the card in a white frame
// with the name and the URL, the dialog's buttons (close, copy the link,
// share) and "Share this color".
//
//   npm run generate:just-hex-icon
//
// The texts are the outlines of LINE Seed JP (from @fontsource/line-seed-jp,
// as the logotype: scripts/generate-logotype.mjs), so the icon never shows
// in another font. The buttons' icons are Tabler Icons (x, link, share-2),
// with their paths as in @tabler/icons. The output is kept in the
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
 * A text as one path: its outlines in a font file (WOFF2), `size` px high
 * (the em), its baseline at `y`; `x` is its left, or its middle with
 * `center`.
 */
async function textPath(source, text, { size, x, y, center = false }) {
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
  const width = positions.reduce((sum, p) => sum + p.xAdvance, 0) * scale;
  let pen = center ? x - width / 2 : x;
  const parts = [];
  for (const [i, { codepoint: glyph }] of buffer.getGlyphInfos().entries()) {
    const { xAdvance, xOffset, yOffset } = positions[i];
    // Font units, y up: scaled, moved to the glyph's place and flipped.
    parts.push(
      font
        .glyphToPath(glyph)
        .replace(
          /(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g,
          (_, px, py) =>
            `${num(pen + (Number(px) + xOffset) * scale)},${num(y - (Number(py) + yOffset) * scale)}`,
        ),
    );
    pen += xAdvance * scale;
  }
  return { d: parts.join(""), width };
}

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

/** A white round button with a Tabler icon in it. */
const button = (name, cx, cy) =>
  `<circle cx="${cx}" cy="${cy}" r="17" fill="#fff"/>` +
  tabler(name, { x: cx - 9, y: cy - 9, size: 18, color: INK });

export async function drawIcon() {
  // The card: 200 wide, a frame of 4 around the color at the OGP image's
  // ratio (1200×630), then the name and the URL.
  const card = { x: 100, y: 66, width: 200, frame: 4 };
  const colorWidth = card.width - card.frame * 2;
  const colorHeight = (colorWidth * 630) / 1200;
  const colorBottom = card.y + card.frame + colorHeight;
  const name = await textPath(FONTS.bold, "Just HEX", {
    size: 14,
    x: card.x + 12,
    y: colorBottom + 22,
  });
  const url = await textPath(FONTS.regular, "unlibra.com/hex/A0D8EF", {
    size: 10.5,
    x: card.x + 12,
    y: colorBottom + 38,
  });
  const cardHeight = colorBottom + 48 - card.y;

  // "Share this color": a dark pill under the card, its icon before the text.
  const label = await textPath(FONTS.bold, "Share this color", {
    size: 12,
    x: 0,
    y: 0,
  });
  const iconSize = 14;
  const gap = 6;
  const pill = {
    width: iconSize + gap + label.width + 32,
    height: 32,
    y: card.y + cardHeight + 14,
  };
  const pillX = 200 - pill.width / 2;
  const text = await textPath(FONTS.bold, "Share this color", {
    size: 12,
    x: pillX + 16 + iconSize + gap,
    y: pill.y + pill.height / 2 + 4.3,
  });

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">\n` +
    `  <!-- Just HEX: a color shared as a share card (docs/decisions/just-hex/\n` +
    `       JH-16). Drawn by scripts/generate-just-hex-icon.mjs. The texts are\n` +
    `       the outlines of LINE Seed JP (SIL Open Font License 1.1,\n` +
    `       LICENSES/OFL-1.1.txt). The buttons' icons are Tabler Icons "x",\n` +
    `       "link" and "share-2" from the npm package @tabler/icons\n` +
    `       (icons/outline/). MIT License, Copyright (c) 2020-2026 Paweł Kuna.\n` +
    `       The full text is in LICENSES/Tabler-MIT.txt. -->\n` +
    `  <defs><filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">` +
    `<feDropShadow dx="0" dy="3" stdDeviation="5" flood-color="#000" flood-opacity="0.12"/>` +
    `</filter></defs>\n` +
    `  <rect width="400" height="300" fill="${COLOR}"/>\n` +
    `  ${button("x", 34, 34)}\n` +
    `  ${button("link", 320, 34)}\n` +
    `  ${button("share-2", 366, 34)}\n` +
    `  <rect x="${card.x}" y="${card.y}" width="${card.width}" height="${num(cardHeight)}" rx="14" fill="#fff" filter="url(#shadow)"/>\n` +
    `  <rect x="${card.x + card.frame}" y="${card.y + card.frame}" width="${colorWidth}" height="${num(colorHeight)}" rx="10" fill="${COLOR}"/>\n` +
    `  <path fill="${INK}" d="${name.d}"/>\n` +
    `  <path fill="${MUTED}" d="${url.d}"/>\n` +
    `  <rect x="${num(pillX)}" y="${num(pill.y)}" width="${num(pill.width)}" height="${pill.height}" rx="16" fill="#000" fill-opacity="0.45"/>\n` +
    `  ${tabler("share-2", { x: pillX + 16, y: pill.y + (pill.height - iconSize) / 2, size: iconSize, color: "#fff" })}\n` +
    `  <path fill="#fff" d="${text.d}"/>\n` +
    `</svg>\n`
  );
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  writeFileSync(join(root, ICON_FILE), await drawIcon());
  console.log(`Wrote ${ICON_FILE}`);
}
