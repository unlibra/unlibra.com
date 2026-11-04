// Extract a fixed Wikipedia revision supplied as a MediaWiki API JSON file.
// The source includes reference HEX values; these are not official JIS RGB.
import { readFile, writeFile } from "node:fs/promises";

if (!process.argv[2])
  throw new Error(
    "Usage: node scripts/generate-jis-palette.mjs <MediaWiki API JSON>",
  );
const response = JSON.parse(await readFile(process.argv[2], "utf8"));
const page = response.query.pages.find((page) => page.title === "JIS慣用色名");
const revision = page.revisions[0];
if (revision.revid !== 111583927)
  throw new Error("Review the source revision before updating the dataset");
const source = `https://ja.wikipedia.org/w/index.php?title=${encodeURIComponent(page.title)}&oldid=${revision.revid}`;
const rows = revision.slots.main.content
  .split(/^\|-.*$/m)
  .filter((row) => /^\|\s*style="background-color:/m.test(row));
if (rows.length !== 269)
  throw new Error(`Expected 269 named colors, got ${rows.length}`);
const colors = [],
  excluded = [];
for (const [index, row] of rows.entries()) {
  const nameCell = row.match(/^!\s*(.+)$/m)?.[1];
  if (!nameCell) throw new Error(`Missing name in row ${index}`);
  const links = [...nameCell.matchAll(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g)];
  const visible = nameCell
    .replace(
      /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,
      (_, target, label) => label ?? target,
    )
    .trim();
  const name = visible.replace(/（[^）]*）/g, "");
  const munsell = row.match(
    /^\|\s*((?:\d+(?:\.\d+)?(?:RP|YR|GY|BG|PB|R|Y|G|B|P)\s+\d+(?:\.\d+)?\/\d+(?:\.\d+)?|N\d+(?:\.\d+)?))\s*$/m,
  )?.[1];
  if (!munsell) {
    if (!["金色", "銀色"].includes(name))
      throw new Error(`Missing Munsell value: ${name}`);
    excluded.push({
      name,
      reason:
        "Metallic appearance; no representative Munsell notation in the source table. No substitute RGB assigned.",
    });
    continue;
  }
  const hex = row.match(/^\|[^\n]*\|(#[0-9a-f]{6})\s*$/im)?.[1];
  if (!hex) throw new Error(`Missing reference HEX: ${name}`);
  colors.push({
    id: `jis-${String(index + 1).padStart(3, "0")}`,
    name,
    hex: hex.toUpperCase(),
    munsell,
    aliases: [...new Set([visible, ...links.map((link) => link[1])])].filter(
      (alias) => alias !== name,
    ),
    source,
  });
}
if (colors.length !== 267 || excluded.length !== 2)
  throw new Error("Unexpected color coverage");
const data = {
  license: "CC-BY-SA-4.0",
  attribution: "Japanese Wikipedia contributors",
  licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  source,
  revision: revision.revid,
  standard: "JIS Z 8102:2001",
  standardReference:
    "https://webdesk.jsa.or.jp/books/W11M0090/index/?bunsyo_id=JIS+Z+8102%3A2001",
  changes:
    "Names, aliases, representative Munsell notation and reference HEX extracted from the linked Wikipedia revision; HEX normalized to uppercase. HEX/RGB are Wikipedia screen approximations, not official JIS RGB values. Gold and silver excluded because the source provides no representative Munsell notation. No article prose or images copied.",
  excluded,
  colors,
};
await writeFile(
  new URL("../src/data/palettes/jis.json", import.meta.url),
  JSON.stringify(data, null, 2) + "\n",
);
console.log(
  `JIS named-color examples: ${colors.length}; metallic names excluded: ${excluded.length}`,
);
