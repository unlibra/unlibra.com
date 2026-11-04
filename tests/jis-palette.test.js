import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const data = JSON.parse(
  readFileSync(new URL("../src/data/palettes/jis.json", import.meta.url)),
);

test("JIS examples retain Munsell notation and a fixed Wikipedia source", () => {
  assert.equal(data.license, "CC-BY-SA-4.0");
  assert.equal(data.attribution, "Japanese Wikipedia contributors");
  assert.equal(data.revision, 111583927);
  assert.equal(data.colors.length, 267);
  assert.equal(new Set(data.colors.map((color) => color.id)).size, 267);
  for (const color of data.colors) {
    assert.match(color.hex, /^#[0-9A-F]{6}$/);
    assert.match(
      color.munsell,
      /^(?:\d+(?:\.\d+)?(?:RP|YR|GY|BG|PB|R|Y|G|B|P) \d+(?:\.\d+)?\/\d+(?:\.\d+)?|N\d+(?:\.\d+)?)$/,
    );
    assert.equal(new URL(color.source).searchParams.get("oldid"), "111583927");
  }
  const shinbashi = data.colors.find((color) => color.name === "新橋色");
  assert.equal(shinbashi.munsell, "2.5B 6.5/5.5");
  assert.equal(shinbashi.hex, "#69AAC6");
});

test("metallic names without representative notation receive no substitute values", () => {
  assert.deepEqual(
    data.excluded.map((color) => color.name),
    ["金色", "銀色"],
  );
  assert.ok(
    data.excluded.every((color) => !("hex" in color) && !("munsell" in color)),
  );
  assert.ok(
    !data.colors.some((color) => ["金色", "銀色"].includes(color.name)),
  );
  assert.match(data.changes, /not official JIS RGB/);
});
