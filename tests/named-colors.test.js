import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { matchesColor } from "../src/tools/color-palettes/data.ts";

const data = JSON.parse(
  readFileSync(new URL("../src/data/palettes/world.json", import.meta.url)),
);

test("the Japanese named-color collection is a subset of the world collection", () => {
  assert.equal(data.colors.length, 463);
  assert.equal(new Set(data.colors.map((color) => color.id)).size, 463);
  assert.equal(
    data.colors.filter((color) => color.collectionIds.includes("japanese"))
      .length,
    264,
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

test("a katakana name with the color suffix stays world-only and its aliases are searchable", () => {
  const cream = data.colors.find((color) => color.name === "クリーム色");
  assert.deepEqual(cream.collectionIds, ["world"]);
  const pink = data.colors.find((color) => color.name === "ベビーピンク");
  assert.deepEqual(pink.collectionIds, ["world"]);
  assert.ok(matchesColor({ ...pink, group: "" }, "baby pink"));
  assert.ok(matchesColor({ ...pink, group: "" }, "ﾍﾞﾋﾞｰﾋﾟﾝｸ"));
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
