// Regenerate with munsell@1.1.7 (MPL-2.0). The optional module path permits
// running against an isolated package without changing installed dependencies.
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
const { rgbToMunsell } = await import(
  process.argv[2] ? pathToFileURL(resolve(process.argv[2])).href : "munsell"
);
const hexes = new Set();
for (const name of [
  "world",
  "tailwind",
  "nord",
  "radix",
  "catppuccin",
  "dracula",
  "open-color",
]) {
  const data = JSON.parse(
    await readFile(
      new URL(`../src/data/palettes/${name}.json`, import.meta.url),
      "utf8",
    ),
  );
  for (const color of data.colors) hexes.add(color.hex);
}
const values = {};
for (const hex of [...hexes].sort()) {
  const rgb = hex
    .slice(1)
    .match(/../g)
    .map((pair) => parseInt(pair, 16) / 255);
  values[hex] = rgbToMunsell(...rgb);
}
await writeFile(
  new URL("../src/data/palettes/munsell-estimates.json", import.meta.url),
  JSON.stringify(
    {
      attribution:
        "Derived numeric lookup, also based on the MIT palette datasets of Tailwind Labs; Sven Greb / Nord; Modulz / WorkOS; Catppuccin; Dracula Theme; heeyeun / Open Color.",
      method:
        "munsell@1.1.7; sRGB (D65), Bradford adaptation to Illuminant C; RIT renotation interpolation/extrapolation; one decimal place. Estimates, not measured or official standard values.",
      reference: "https://github.com/privet-kitty/munsell.js",
      values,
    },
    null,
    2,
  ) + "\n",
);
console.log(`Generated ${hexes.size} Munsell estimates`);
