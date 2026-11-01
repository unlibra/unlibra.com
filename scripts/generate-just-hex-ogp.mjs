// Generates Just HEX's service share image from its Apps artwork.
// Fits the complete artwork within 1200×630, extending the blue background
// at the sides so the original top and bottom spacing stays intact.
//
//   npm run generate:just-hex-ogp
//
// The previous public/just-hex-ogp.png remains available for cached cards.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const artwork = readFileSync(join(root, "src/assets/tools/just-hex.svg"));

await sharp(artwork, { density: 216 })
  .resize(1200, 630, {
    fit: "contain",
    position: "centre",
    background: "#277DB2",
  })
  .png()
  .toFile(join(root, "public/just-hex-apps-ogp.png"));

console.log("Wrote public/just-hex-apps-ogp.png");
