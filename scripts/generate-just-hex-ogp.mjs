// Generates Just HEX's service share image from its Apps artwork.
// Crops only the empty top and bottom background to fit 1200×630.
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
  .resize(1200, 630, { fit: "cover", position: "centre" })
  .png()
  .toFile(join(root, "public/just-hex-apps-ogp.png"));

console.log("Wrote public/just-hex-apps-ogp.png");
