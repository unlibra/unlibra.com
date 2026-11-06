import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { latinName, romaji } from "../src/tools/color-palettes/romaji.ts";

const data = JSON.parse(
  readFileSync(new URL("../src/data/palettes/world.json", import.meta.url)),
);

test("the Japanese named-color collection is a subset of the world collection", () => {
  assert.equal(data.colors.length, 460);
  assert.equal(new Set(data.colors.map((color) => color.id)).size, 460);
  assert.equal(
    data.colors.filter((color) => color.collectionIds.includes("japanese"))
      .length,
    261,
  );
  for (const color of data.colors) {
    assert.ok(color.collectionIds.includes("world"));
    assert.match(color.hex, /^#[0-9A-F]{6}$/);
    const source = new URL(color.source);
    assert.equal(source.origin, "https://ja.wikipedia.org");
    assert.equal(source.searchParams.get("oldid"), String(color.revision));
    assert.ok(color.nameSources.length > 0);
    for (const id of color.nameSources)
      assert.ok(data.nameReferences.some((reference) => reference.id === id));
  }
});

test("a katakana name with the color suffix stays world-only and retains its aliases", () => {
  const cream = data.colors.find((color) => color.name === "クリーム色");
  assert.deepEqual(cream.collectionIds, ["world"]);
  const pink = data.colors.find((color) => color.name === "ベビーピンク");
  assert.deepEqual(pink.collectionIds, ["world"]);
  assert.ok(pink.aliases.includes("baby pink"));
  assert.ok(pink.aliases.includes("ベビーピンク"));
});

test("verified article values and provenance remain available in the expanded data", () => {
  const shinbashi = data.colors.find((color) => color.name === "新橋色");
  assert.equal(shinbashi.hex, "#59B9C6");
  assert.equal(shinbashi.revision, 110243954);
  assert.deepEqual(shinbashi.collectionIds, ["world", "japanese"]);
  assert.ok(shinbashi.listSource.includes("oldid="));
  assert.equal(
    data.colors.find((color) => color.name === "墨色").hex,
    "#343434",
  );
  assert.equal(data.license, "CC-BY-SA-4.0");
  assert.equal(data.attribution, "Japanese Wikipedia contributors");
});

test("every named color has its own URL name", () => {
  const slugs = data.colors.map((color) => color.slug);
  for (const slug of slugs) assert.match(slug, /^[a-z0-9]+(-[a-z0-9]+)*$/);
  assert.equal(new Set(slugs).size, data.colors.length);
  const slugOf = (name) =>
    data.colors
      .filter((color) => color.name === name)
      .map((color) => color.slug);
  // Readings without 色, Hepburn without long vowels, English for katakana.
  assert.deepEqual(slugOf("桜色"), ["sakura"]);
  assert.deepEqual(slugOf("新橋色"), ["shinbashi"]);
  assert.deepEqual(slugOf("黄丹"), ["oni"]);
  assert.deepEqual(slugOf("サーモンピンク"), ["salmon-pink"]);
  // Names that share a reading take the other kanji's kun reading.
  assert.deepEqual(slugOf("萌葱色"), ["moegi-negi"]);
  assert.deepEqual(slugOf("涅色"), ["kuri-kurotsuchi"]);
  assert.deepEqual(slugOf("蒲色"), ["kaba-gama"]);
});

test("different readings sharing a color name remain distinguishable", () => {
  const reds = data.colors.filter((color) => color.name === "紅色");
  assert.equal(reds.length, 2);
  assert.deepEqual(
    new Set(reds.map((color) => color.nameQualifier)),
    new Set(["べにいろ", "くれないいろ"]),
  );
});

test("Wada-only name references remain available without a separate Wada collection", () => {
  const names = data.colors
    .filter(
      (color) =>
        color.nameSources.length === 1 && color.nameSources[0] === "wada",
    )
    .map((color) => color.name);
  assert.deepEqual(
    new Set(names),
    new Set([
      "藍海松茶",
      "油色",
      "イエローグリーン",
      "京紫",
      "花色",
      "バンダイクブラウン",
      "深縹",
    ]),
  );
  assert.ok(data.nameReferences.some((reference) => reference.id === "wada"));
});

test("URL names are the readings romanized, as the Latin names show them", () => {
  // The three names that share a reading with another were written by hand.
  const manual = new Set(["萌葱色", "涅色", "蒲色"]);
  const katakana = /^[\p{Script=Katakana}ー・\s]+$/u;
  for (const color of data.colors) {
    // Katakana names, and names without a reading (クリーム色), use the
    // English name.
    if (
      manual.has(color.name) ||
      !color.kana ||
      katakana.test(color.name.normalize("NFKC"))
    )
      continue;
    const reading = color.name.endsWith("色")
      ? color.kana.replace(/いろ$/, "")
      : color.kana;
    assert.equal(color.slug, romaji(reading), color.name);
  }
  assert.equal(romaji("しんばしいろ"), "shinbashiiro");
  assert.equal(romaji("おうに"), "oni");
  assert.equal(romaji("ききょう"), "kikyo");
  assert.equal(romaji("まっちゃ"), "matcha");
  assert.equal(romaji("しょうじょうひ"), "shojohi");
  const latinOf = (name) =>
    latinName(data.colors.find((color) => color.name === name));
  assert.equal(latinOf("新橋色"), "Shinbashi");
  assert.equal(latinOf("萌葱色"), "moegi");
  assert.equal(latinOf("サーモンピンク"), "salmon pink");
});
