// Unit tests for Just HEX: reading a color code, the Worker's OGP image, and
// the icon.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

import {
  imagePath,
  invalidPath,
  parseHex,
  sharePath,
  toneOf,
} from "../src/tools/just-hex/hex.ts";
import { hexMessages, withHex } from "../src/tools/just-hex/messages.ts";
import { colorPng, HEIGHT, WIDTH } from "../src/tools/just-hex/og-image.ts";

test("parseHex: 3 or 6 hex digits, with or without #, in either case, in one written form (6 uppercase digits)", () => {
  for (const [input, hex] of [
    ["ffffff", "FFFFFF"],
    ["#FFFFFF", "FFFFFF"],
    ["fff", "FFFFFF"],
    ["#F80", "FF8800"],
    ["#f80", "FF8800"],
    [" #1a2B3c ", "1A2B3C"],
    ["000", "000000"],
  ]) {
    assert.equal(parseHex(input), hex, input);
  }
});

test("parseHex: anything else is not a color", () => {
  for (const input of [
    "",
    "#",
    "ff",
    "ffff",
    "fffff",
    "fffffff",
    "ffffffff",
    "##fff",
    "ggg",
    "apps",
    "ff ff ff",
  ]) {
    assert.equal(parseHex(input), null, JSON.stringify(input));
  }
});

test("the color's URL (the color screen, to share) and its image are under /hex/", () => {
  const hex = parseHex("#abcdef");
  assert.equal(sharePath(hex), "/hex/ABCDEF");
  assert.equal(imagePath(hex), "/hex/ABCDEF.png");
});

test("a code that is no color goes to the top page's query", () => {
  assert.equal(invalidPath("zzz"), "/hex?invalid=zzz");
  assert.equal(invalidPath("a b/#"), "/hex?invalid=a+b%2F%23");
});

test("withHex puts the color code into a text", () => {
  assert.equal(withHex(hexMessages.colorTitle, "FF8800"), "#FF8800 - Just HEX");
  assert.equal(withHex(hexMessages.colorOgTitle, "FF5A36"), "#FF5A36");
});

test("the texts of the metadata (the user's)", () => {
  assert.equal(
    hexMessages.description,
    "Just one color. Enter a HEX color code to fill your entire screen with color. Explore, enjoy, and share your favorite colors with anyone.",
  );
  assert.equal(hexMessages.colorOgDescription, "Just HEX — Just one color.");
});

test("colorPng: a 1200×630 PNG of the color alone", async () => {
  for (const hex of ["FF8800", "000000", "FFFFFF", "1A2B3C"]) {
    const png = await colorPng(hex);
    const { data, info } = await sharp(png)
      .raw()
      .toBuffer({ resolveWithObject: true });
    assert.equal(info.width, WIDTH);
    assert.equal(info.height, HEIGHT);
    assert.equal(WIDTH, 1200);
    assert.equal(HEIGHT, 630);
    const expected = hex.match(/../g).map((pair) => parseInt(pair, 16));
    const channels = info.channels;
    for (let i = 0; i < data.length; i += channels) {
      if (
        data[i] !== expected[0] ||
        data[i + 1] !== expected[1] ||
        data[i + 2] !== expected[2]
      ) {
        assert.fail(
          `${hex}: pixel ${i / channels} is ${[...data.subarray(i, i + 3)]}`,
        );
      }
    }
  }
});

test("colorPng: only the palette differs between colors, and it is small", async () => {
  const [a, b] = await Promise.all([colorPng("FF0000"), colorPng("00FF00")]);
  assert.equal(a.length, b.length);
  assert.ok(a.length < 1024, `${a.length} bytes`);
  const differing = a.reduce((n, byte, i) => n + (byte !== b[i] ? 1 : 0), 0);
  // At most the 3 palette bytes and the 4 bytes of its CRC.
  assert.ok(differing <= 7, `${differing} bytes differ`);
});

test("colorPng: refuses anything but 6 uppercase hex digits", async () => {
  for (const input of ["ffffff", "FFF", "#FFFFFF", "ZZZZZZ"]) {
    await assert.rejects(colorPng(input), /not a color/);
  }
});

test("toneOf: light or dark, by whether black or white contrasts more", () => {
  for (const [hex, tone] of [
    ["ffffff", "light"],
    ["f4d35e", "light"],
    ["777777", "light"],
    ["000000", "dark"],
    ["1b1f3a", "dark"],
    ["757575", "dark"],
    ["0000ff", "dark"],
    ["00ff00", "light"],
  ]) {
    assert.equal(toneOf(parseHex(hex)), tone, hex);
  }
});

test("colorPng: a failed compression is not kept; the next call tries again", async () => {
  // A fresh copy of the module, whose pixels are not made yet.
  const { colorPng: fresh } =
    await import("../src/tools/just-hex/og-image.ts?retry");
  const original = globalThis.CompressionStream;
  globalThis.CompressionStream = class {
    constructor() {
      throw new Error("no compression");
    }
  };
  try {
    await assert.rejects(fresh("FF0000"), /no compression/);
  } finally {
    globalThis.CompressionStream = original;
  }
  const png = await fresh("FF0000");
  assert.equal(String.fromCharCode(...png.subarray(1, 4)), "PNG");
});

test("the icon is the drawing of scripts/generate-just-hex-icon.mjs", async () => {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const { ICON_FILE, drawIcon } =
    await import("../scripts/generate-just-hex-icon.mjs");
  // Drawn again from the font's metrics, it is the file in the repository.
  // A picture of shapes only (JH-17 to JH-20): no text, no icon of a set,
  // no shadow.
  const drawing = readFileSync(join(root, ICON_FILE), "utf8");
  assert.equal(await drawIcon(), drawing);
  assert.doesNotMatch(drawing, /<text[\s>]|Tabler|filter/i);
  // 4:3, as the large card's frame.
  assert.match(drawing, /viewBox="0 0 400 300"/);
});
