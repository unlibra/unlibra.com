// Unit tests for Just HEX: reading a color code, and the Worker's OGP image.
import { test } from "node:test";
import assert from "node:assert/strict";

import sharp from "sharp";

import {
  imagePath,
  parseHex,
  screenUrl,
  sharePath,
} from "../src/config/hex.ts";
import { hexMessages, withHex } from "../src/messages/hex.ts";
import { colorPng, HEIGHT, WIDTH } from "../worker/og-image.ts";

test("parseHex: 3 or 6 hex digits, with or without #, in one written form", () => {
  for (const [input, hex] of [
    ["ffffff", "ffffff"],
    ["#FFFFFF", "ffffff"],
    ["fff", "ffffff"],
    ["#F80", "ff8800"],
    [" #1a2B3c ", "1a2b3c"],
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

test("the share URL and its image are under /hex/", () => {
  const hex = parseHex("#ABCDEF");
  assert.equal(sharePath(hex), "/hex/abcdef");
  assert.equal(imagePath(hex), "/hex/abcdef.png");
  // The color screen shows the color after a slash (the user's choice).
  assert.equal(screenUrl(hex), "/hex/#abcdef");
});

test("withHex puts the color code into a text", () => {
  assert.equal(withHex(hexMessages.menu.copy, "ff8800"), "Copy #ff8800");
  assert.equal(
    withHex(hexMessages.colorDescription, "000000"),
    "A screen filled with #000000.",
  );
});

test("colorPng: a 1200×630 PNG of the color alone", async () => {
  for (const hex of ["ff8800", "000000", "ffffff", "1a2b3c"]) {
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
  const [a, b] = await Promise.all([colorPng("ff0000"), colorPng("00ff00")]);
  assert.equal(a.length, b.length);
  assert.ok(a.length < 1024, `${a.length} bytes`);
  const differing = a.reduce((n, byte, i) => n + (byte !== b[i] ? 1 : 0), 0);
  // At most the 3 palette bytes and the 4 bytes of its CRC.
  assert.ok(differing <= 7, `${differing} bytes differ`);
});

test("colorPng: refuses anything but 6 lowercase hex digits", async () => {
  for (const input of ["FFFFFF", "fff", "#ffffff", "zzzzzz"]) {
    await assert.rejects(colorPng(input), /not a color/);
  }
});
