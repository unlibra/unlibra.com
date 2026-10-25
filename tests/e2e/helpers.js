// Shared helpers of the E2E tests.
import { readFile } from "node:fs/promises";

import { expect } from "@playwright/test";
import sharp from "sharp";

import { layoutMessages } from "../../src/messages/layout.ts";
import en from "../../src/tools/messages/en.ts";
import ja from "../../src/tools/messages/ja.ts";

/** The two languages of the tool pages, with their texts. */
export const LOCALES = [
  { lang: "ja", prefix: "", t: ja },
  { lang: "en", prefix: "/en", t: en },
];

export const toolUrl = (locale, tool) => `${locale.prefix}/lab/${tool}`;

/** The browser's clipboard text (the context is granted clipboard access). */
export const readClipboard = (page) =>
  page.evaluate(() => navigator.clipboard.readText());

export const grantClipboard = (context, baseURL) =>
  context.grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: baseURL,
  });

/** A toast with this text. */
export const toast = (page, text) =>
  page.locator("div.pointer-events-none.fixed").getByText(text, {
    exact: true,
  });

/** Sets a range input as a user dragging it would. */
export const setRange = async (locator, value) => {
  await locator.evaluate((input, v) => {
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    ).set;
    setter.call(input, String(v));
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, value);
  await expect(locator).toHaveValue(String(value));
};

/** Selects a file with the page's (hidden) file input. */
export const chooseFile = (page, file) =>
  page.locator('input[type="file"]').setInputFiles(file);

/**
 * Waits until the page's drop zone listens for drags on the window. It adds
 * its listeners in a React effect, which can run a moment after `open` sees
 * the island hydrated; a drag event before that is lost.
 */
export const waitForDropZone = (page) =>
  expect(page.locator('[data-drop-zone="ready"]')).toBeAttached();

/**
 * Drags a file over the page and drops it on the overlay, as a browser does:
 * `dragenter` on the window shows the overlay, `drop` lands on it.
 */
export const dropFile = async (page, file, overlayText) => {
  await waitForDropZone(page);
  const dataTransfer = await page.evaluateHandle(
    ({ name, mimeType, data }) => {
      const transfer = new DataTransfer();
      const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
      transfer.items.add(new File([bytes], name, { type: mimeType }));
      return transfer;
    },
    {
      name: file.name,
      mimeType: file.mimeType,
      data: file.buffer.toString("base64"),
    },
  );
  await page.dispatchEvent("body", "dragenter", { dataTransfer });
  const overlay = page.getByText(overlayText, { exact: true });
  await expect(overlay).toBeVisible();
  await overlay.dispatchEvent("drop", { dataTransfer });
  await expect(overlay).toBeHidden();
};

/** Clicks the button and returns the downloaded file's name and content. */
export const download = async (page, button) => {
  const [file] = await Promise.all([
    page.waitForEvent("download"),
    button.click(),
  ]);
  return {
    name: file.suggestedFilename(),
    buffer: await readFile(await file.path()),
  };
};

/**
 * A PNG with a transparent background and an opaque red square in the
 * middle (half the shorter side).
 */
export const pngFile = async (name, width, height) => {
  const side = Math.floor(Math.min(width, height) / 2);
  const square = await sharp({
    create: {
      width: side,
      height: side,
      channels: 4,
      background: { r: 255, g: 0, b: 0, alpha: 1 },
    },
  })
    .png()
    .toBuffer();
  const buffer = await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: square,
        left: Math.floor((width - side) / 2),
        top: Math.floor((height - side) / 2),
      },
    ])
    .png()
    .toBuffer();
  return { name, mimeType: "image/png", buffer };
};

export const svgFile = (name, text) => ({
  name,
  mimeType: "image/svg+xml",
  buffer: Buffer.from(text),
});

/** Width, height and the RGBA of a pixel of a PNG. */
export const readPng = async (buffer, x = 0, y = 0) => {
  const image = sharp(buffer);
  const { width, height, format } = await image.metadata();
  const { data, info } = await image
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const offset = (y * info.width + x) * 4;
  return {
    format,
    width,
    height,
    pixel: [...data.subarray(offset, offset + 4)],
  };
};

/** The PNG images of an ICO file, with the size each entry declares. */
export const readIco = (buffer) => {
  expect(buffer.readUInt16LE(0)).toBe(0);
  expect(buffer.readUInt16LE(2)).toBe(1);
  const count = buffer.readUInt16LE(4);
  return Array.from({ length: count }, (_, i) => {
    const entry = 6 + 16 * i;
    const length = buffer.readUInt32LE(entry + 8);
    const offset = buffer.readUInt32LE(entry + 12);
    return {
      size: buffer.readUInt8(entry) || 256,
      png: buffer.subarray(offset, offset + length),
    };
  });
};

/**
 * Whether the page is wider than the window: it scrolls sideways, or content
 * sticks out of the layout's wrapper (which clips it with overflow-x: hidden).
 */
export const hasHorizontalScroll = (page) =>
  page.evaluate(() =>
    [
      document.documentElement,
      // The layout's wrapper (Just HEX's color screen comes before it).
      document.querySelector("[data-layout]") ??
        document.body.firstElementChild,
    ].some((element) => element.scrollWidth > element.clientWidth),
  );

/**
 * Opens a page and waits until its React islands are hydrated: clicks before
 * that land on the server-rendered HTML and do nothing. Astro removes the
 * `ssr` attribute of <astro-island> when it hydrates.
 */
export const open = async (page, path) => {
  await page.goto(path);
  await page.waitForFunction(() =>
    [...document.querySelectorAll("astro-island")].every(
      (island) => !island.hasAttribute("ssr"),
    ),
  );
};

/** Chooses a theme with the header's theme button, as a user does. */
export const chooseTheme = async (page, lang, preference) => {
  const t = layoutMessages[lang].theme;
  await page.getByRole("button", { name: t.toggle }).click();
  await page.getByRole("button", { name: t[preference], exact: true }).click();
};

/**
 * The relative luminance (0 black to 1 white) of a computed color of the
 * element: Tailwind's colors are oklch(), so the browser turns the color
 * into RGB by painting it on a canvas.
 */
export const luminance = (locator, property) =>
  locator.evaluate((element, name) => {
    const color = getComputedStyle(element)[name];
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const context = canvas.getContext("2d");
    context.fillStyle = color;
    context.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
    if (a === 0) throw new Error(`${name} is transparent`);
    const linear = (v) => {
      const c = v / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
  }, property);
