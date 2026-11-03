// Extract the installed, lockfile-pinned Tailwind palette. HEX is an sRGB
// approximation: convert OKLCH via OKLab and clip out-of-gamut channels.
// The original OKLCH is retained and offered for copying as well.
import { readFile, writeFile, mkdir } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const theme = await readFile(
  new URL("node_modules/tailwindcss/theme.css", root),
  "utf8",
);
const { version } = JSON.parse(
  await readFile(
    new URL("node_modules/tailwindcss/package.json", root),
    "utf8",
  ),
);

function toHex(lightness, chroma, hue) {
  const angle = (hue * Math.PI) / 180;
  const a = chroma * Math.cos(angle);
  const b = chroma * Math.sin(angle);
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const channels = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  return (
    "#" +
    channels
      .map((v) => {
        const c = Math.min(1, Math.max(0, v));
        return Math.round(
          255 * (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055),
        )
          .toString(16)
          .padStart(2, "0");
      })
      .join("")
      .toUpperCase()
  );
}

const colors = [
  ...theme.matchAll(
    /--color-([a-z]+)-(\d+):\s*(oklch\(([\d.]+)% ([\d.]+) ([\d.]+|none)\));/g,
  ),
].map(([, family, shade, css, l, c, h]) => {
  if (h === "none" && Number(c) !== 0)
    throw new Error(`Undefined hue with chroma: ${family}-${shade}`);
  return {
    id: `${family}-${shade}`,
    family,
    shade,
    css,
    hex: toHex(Number(l) / 100, Number(c), h === "none" ? 0 : Number(h)),
  };
});
if (colors.length !== 286)
  throw new Error(`Review changed Tailwind palette: ${colors.length} colors`);
await mkdir(new URL("src/data/palettes/", root), { recursive: true });
await writeFile(
  new URL("src/data/palettes/tailwind.json", root),
  JSON.stringify(
    {
      version,
      license: "MIT",
      attribution: "Copyright (c) Tailwind Labs, Inc.",
      colors,
    },
    null,
    2,
  ) + "\n",
);
await writeFile(
  new URL("LICENSES/Tailwind-MIT.txt", root),
  await readFile(new URL("node_modules/tailwindcss/LICENSE", root)),
);
console.log(`Tailwind ${version}: ${colors.length} colors`);
