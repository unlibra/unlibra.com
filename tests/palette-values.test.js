import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  colorValues,
  hueGroup,
  contrastRatio,
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

test("hue sections wrap reds across zero and include near-neutral colors", () => {
  assert.equal(hueGroup("#FF0000"), "red");
  assert.equal(hueGroup("#FF0010"), "red");
  assert.equal(hueGroup("#FF1000"), "red");
  assert.equal(hueGroup("#FFFF00"), "yellow");
  assert.equal(hueGroup("#00FFFF"), "blue");
  assert.equal(hueGroup("#80FF00"), "green");
  assert.equal(hueGroup("#00FF80"), "green");
  assert.equal(hueGroup("#FF00FF"), "purple");
  assert.equal(hueGroup("#000000"), "neutral");
  assert.equal(hueGroup("#FFFFFF"), "neutral");
  assert.equal(hueGroup("#343434"), "neutral");
  assert.equal(hueGroup("#ECEDED"), "neutral");
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
  assert.equal(estimates.values["#59B9C6"], "2B 6.9/6.3");
});

test("contrast vectors match WCAG black, white, and identical colors", () => {
  assert.equal(contrastRatio("#000000", "#FFFFFF"), 21);
  assert.equal(contrastRatio("#FFFFFF", "#000000"), 21);
  assert.equal(contrastRatio("#59B9C6", "#59B9C6"), 1);
  assert.ok(contrastRatio("#59B9C6", "#000000") > 4.5);
  assert.ok(contrastRatio("#59B9C6", "#FFFFFF") < 4.5);
});
