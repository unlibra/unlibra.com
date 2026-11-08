import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  colorValues,
  hueGroup,
  contrastRatio,
  lightToDark,
  hueIds,
} from "../src/tools/color-palettes/color-values.ts";

test("sRGB primary and neutral conversion vectors", () => {
  const red = colorValues("#FF0000");
  assert.equal(red.RGB, "rgb(255, 0, 0)");
  assert.equal(red.HSV, "0°, 100%, 100%");
  assert.equal(red.HSL, "hsl(0 100% 50%)");
  assert.match(red.OKLCH, /^oklch\(62\.8% 0\.2577 29\.23\)$/);
  assert.equal(colorValues("#808080").HSV, "0°, 0%, 50.2%");
  assert.equal(colorValues("#00FF00").HSV, "120°, 100%, 100%");
  assert.equal(colorValues("#0000FF").HSV, "240°, 100%, 100%");
  assert.equal(colorValues("#59B9C6").RGB, "rgb(89, 185, 198)");
  assert.throws(() => colorValues("#123"), /Invalid sRGB/);
});

test("hue sections follow the Munsell hue letter; low chroma is neutral", () => {
  assert.equal(hueGroup("2B 6.9/6.3"), "B");
  assert.equal(hueGroup("10R 2.5/11.4"), "R");
  assert.equal(hueGroup("1YR 5.7/15.0"), "YR");
  assert.equal(hueGroup("7.5RP 4.0/12.0"), "RP");
  assert.equal(hueGroup("5PB 2.1/7.2"), "PB");
  assert.equal(hueGroup("10YR 5.6/1.5"), "YR");
  assert.equal(hueGroup("2P 0.1/1.4"), "N");
  assert.equal(hueGroup("N 0.0"), "N");
  assert.equal(hueGroup("N 10.0"), "N");
  assert.throws(() => hueGroup("2X 5.0/4.0"), /Invalid Munsell/);
  assert.throws(() => hueGroup("#59B9C6"), /Invalid Munsell/);
});

test("every palette HEX has a finite, valid precomputed Munsell estimate", () => {
  const estimates = JSON.parse(
    readFileSync(
      new URL("../src/data/palettes/munsell-estimates.json", import.meta.url),
    ),
  );
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
      readFileSync(
        new URL(`../src/data/palettes/${name}.json`, import.meta.url),
      ),
    );
    for (const color of data.colors) {
      const value = estimates.values[color.hex];
      assert.match(
        value,
        /^(?:N \d+(?:\.\d+)?|\d+(?:\.\d+)?(?:RP|YR|GY|BG|PB|R|Y|G|B|P) \d+(?:\.\d+)?\/\d+(?:\.\d+)?)$/,
      );
      assert.ok(Number.isFinite(colorValues(color.hex).hue));
    }
  }
  assert.equal(estimates.values["#000000"], "N 0.0");
  assert.equal(estimates.values["#FFFFFF"], "N 10.0");
  assert.equal(estimates.values["#88C0D0"], "6B 7.4/4.5");
});

test("contrast vectors match WCAG black, white, and identical colors", () => {
  assert.equal(contrastRatio("#000000", "#FFFFFF"), 21);
  assert.equal(contrastRatio("#FFFFFF", "#000000"), 21);
  assert.equal(contrastRatio("#59B9C6", "#59B9C6"), 1);
  assert.ok(contrastRatio("#59B9C6", "#000000") > 4.5);
  assert.ok(contrastRatio("#59B9C6", "#FFFFFF") < 4.5);
});

test("every named color has a hue group, and groups run light to dark", () => {
  const estimates = JSON.parse(
    readFileSync(
      new URL("../src/data/palettes/munsell-estimates.json", import.meta.url),
    ),
  ).values;
  const data = JSON.parse(
    readFileSync(new URL("../src/data/palettes/world.json", import.meta.url)),
  );
  for (const collection of ["japanese", "world"]) {
    const colors = data.colors.filter((color) =>
      color.collectionIds.includes(collection),
    );
    const groups = new Set(
      colors.map((color) => hueGroup(estimates[color.hex])),
    );
    assert.deepEqual([...groups].sort(), [...hueIds].sort(), collection);
  }
  const sample = ["#000000", "#FFFFFF", "#59B9C6", "#808080"].map((hex) => ({
    hex,
  }));
  assert.deepEqual(
    lightToDark(sample).map((color) => color.hex),
    ["#FFFFFF", "#59B9C6", "#808080", "#000000"],
  );
  assert.deepEqual(
    lightToDark([
      { hex: "#808080", id: 1 },
      { hex: "#808080", id: 2 },
    ]).map((color) => color.id),
    [1, 2],
  );
});
