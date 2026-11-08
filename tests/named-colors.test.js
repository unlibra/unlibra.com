import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { latinName, romaji } from "../src/tools/color-palettes/romaji.ts";

const data = JSON.parse(
  readFileSync(new URL("../src/data/palettes/world.json", import.meta.url)),
);

test("the Japanese named-color collection is a subset of the world collection", () => {
  assert.equal(data.colors.length, 519);
  assert.equal(new Set(data.colors.map((color) => color.id)).size, 519);
  assert.equal(
    data.colors.filter((color) => color.collectionIds.includes("japanese"))
      .length,
    299,
  );
  for (const color of data.colors) {
    assert.ok(color.collectionIds.includes("world"));
    assert.match(color.hex, /^#[0-9A-F]{6}$/);
    for (const id of color.nameSources)
      assert.ok(data.nameReferences.some((reference) => reference.id === id));
  }
});

test("the named colors carry names, readings and values only, with JIS as the one name badge", () => {
  // Sources are not published (decided 2026-11-07): the dataset has no
  // fields for them, and JIS conventional color names are the one badge.
  assert.deepEqual(Object.keys(data), ["nameReferences", "colors"]);
  assert.deepEqual(data.nameReferences, [{ id: "jis", label: "JIS Z 8102" }]);
  const fields = new Set([
    "id",
    "name",
    "kana",
    "romanized",
    "aliases",
    "collectionIds",
    "hex",
    "nameSources",
    "nameQualifier",
    "slug",
  ]);
  for (const color of data.colors)
    for (const key of Object.keys(color)) assert.ok(fields.has(key), key);
  const jis = (name) =>
    data.colors.find((color) => color.name === name).nameSources;
  assert.deepEqual(jis("新橋色"), ["jis"]);
  assert.deepEqual(jis("天色"), []);
});

test("a katakana name with the color suffix stays world-only and retains its aliases", () => {
  const cream = data.colors.find((color) => color.name === "クリーム色");
  assert.deepEqual(cream.collectionIds, ["world"]);
  const pink = data.colors.find((color) => color.name === "ベビーピンク");
  assert.deepEqual(pink.collectionIds, ["world"]);
  assert.ok(pink.aliases.includes("baby pink"));
  assert.ok(pink.aliases.includes("ベビーピンク"));
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
  assert.deepEqual(slugOf("天色"), ["ama-ten"]);
});

test("different readings sharing a color name remain distinguishable", () => {
  const reds = data.colors.filter((color) => color.name === "紅色");
  assert.equal(reds.length, 2);
  assert.deepEqual(
    new Set(reds.map((color) => color.nameQualifier)),
    new Set(["べにいろ", "くれないいろ"]),
  );
});

test("URL names are the readings romanized, as the Latin names show them", () => {
  // The three names that share a reading with another were written by hand.
  const manual = new Set(["萌葱色", "涅色", "天色"]);
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
