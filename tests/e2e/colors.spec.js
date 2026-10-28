// E2E: the site's colors (ui-revise13): the catch copy's "昼" and "夜" and
// the links, measured in the browser.
import { expect, test } from "@playwright/test";
import sharp from "sharp";

import { chooseTheme, open } from "./helpers.js";

/** The relative luminance (WCAG 2) of an sRGB color [r, g, b]. */
const luminance = (rgb) => {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** The contrast ratio (WCAG 2) of two sRGB colors. */
const contrast = (a, b) => {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

/**
 * A CSS color (any syntax the browser knows, var() too) as sRGB
 * [r, g, b, a], painted on a canvas: Tailwind's colors are oklch().
 */
const toRgb = (page, css) =>
  page.evaluate((value) => {
    const probe = document.createElement("div");
    probe.style.color = value;
    document.body.append(probe);
    const computed = getComputedStyle(probe).color;
    probe.remove();
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const context = canvas.getContext("2d");
    context.fillStyle = computed;
    context.fillRect(0, 0, 1, 1);
    return [...context.getImageData(0, 0, 1, 1).data];
  }, css);

/** The computed color of an element, as sRGB [r, g, b, a]. */
const colorOf = async (locator) =>
  toRgb(
    locator.page(),
    await locator.evaluate((e) => getComputedStyle(e).color),
  );

const CATCH = {
  light: { part: "day", other: "night", color: [0xee, 0x78, 0x00] },
  dark: { part: "night", other: "day", color: [0xe7, 0xd9, 0xa8] },
};

test.describe("ui-revise13 3: the catch copy's colors", () => {
  for (const width of [375, 1280]) {
    for (const scheme of ["light", "dark"]) {
      test(`${width}px, ${scheme}: only "${scheme === "light" ? "昼" : "夜"}" takes its color${scheme === "dark" ? ", at least 3:1 with the hero's background behind it" : ""}`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 800 });
        await page.emulateMedia({
          colorScheme: scheme,
          reducedMotion: "reduce",
        });
        await open(page, "/");
        await chooseTheme(page, "ja", scheme);
        await page.mouse.move(0, 0);
        const { part, other, color } = CATCH[scheme];
        const h1 = page.locator("[data-hero] h1");
        const colored = h1.locator(`[data-catch-copy="${part}"]`);
        const plain = h1.locator(`[data-catch-copy="${other}"]`);
        await expect(h1).toHaveText("昼はカフェ。夜はバー。");
        await expect(colored).toHaveText(part === "day" ? "昼" : "夜");

        // Only the one character takes the color; the other one is the
        // heading's own color.
        const heading = await colorOf(h1);
        expect(await colorOf(colored)).toEqual([...color, 255]);
        expect(await colorOf(plain)).toEqual(heading);
        expect(heading.slice(0, 3)).not.toEqual(color);
        // The 0.5em on the left is kept (ui-revise11): 14px at 28px.
        await expect(h1).toHaveCSS("padding-left", "14px");
        // One line at both widths.
        expect((await h1.boundingBox()).height).toBe(44);

        // The background where the character is: the page painted without
        // the heading's text, every pixel of the character's box measured.
        const box = await colored.boundingBox();
        await page.addStyleTag({
          content:
            "[data-hero] h1, [data-hero] h1 * { color: transparent !important; }",
        });
        const shot = await page.screenshot({ clip: box });
        const { data, info } = await sharp(shot)
          .removeAlpha()
          .raw()
          .toBuffer({ resolveWithObject: true });
        let worst = Infinity;
        for (let i = 0; i < info.width * info.height; i++) {
          const pixel = [...data.subarray(i * 3, i * 3 + 3)];
          worst = Math.min(worst, contrast(color, pixel));
        }
        // "昼" is 黄丹 itself, below 3:1 for the design (DESIGN.md 7.1).
        if (part === "night") expect(worst).toBeGreaterThanOrEqual(3);
      });
    }
  }
});

/** The backgrounds the links are on, at rest and on the cards' hover. */
const BACKGROUNDS = {
  light: ["white", "var(--color-gray-50)", "var(--color-gray-100)"],
  dark: ["#282c34", "#333842", "#3d4148"],
};

test.describe("ui-revise13 2: the links' contrast", () => {
  for (const scheme of ["light", "dark"]) {
    test(`${scheme}: the cards' and the Markdown pages' links are at least 4.5:1 on every background, at rest and on hover`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
      const colors = {};

      // The cards' links: at rest and on the card's hover.
      await open(page, "/");
      await chooseTheme(page, "ja", scheme);
      // The first card with a link (the cover above it has none).
      const card = page
        .locator("article[data-work]:has([data-link-text])")
        .first();
      const cardLink = card.locator("[data-link-text]").first();
      await card.scrollIntoViewIfNeeded();
      await page.mouse.move(0, 0);
      colors["card at rest"] = await colorOf(cardLink);
      // The pointer on the card (its summary): the card fades in its hover
      // background in 150ms.
      const summary = await card.locator("[data-work-summary]").boundingBox();
      await page.mouse.move(
        summary.x + summary.width / 2,
        summary.y + summary.height / 2,
      );
      await page.waitForTimeout(300);
      colors["card on hover"] = await colorOf(cardLink);

      // The Markdown pages' links: at rest and on hover.
      await open(page, "/privacy");
      await chooseTheme(page, "ja", scheme);
      const link = page.locator("main.prose a").first();
      await page.mouse.move(0, 0);
      colors["Markdown at rest"] = await colorOf(link);
      await link.hover();
      colors["Markdown on hover"] = await colorOf(link);
      expect(colors["Markdown on hover"]).not.toEqual(
        colors["Markdown at rest"],
      );

      const expected = {
        light: {
          rest: "var(--color-link)",
          hover: "var(--color-link-hover)",
        },
        dark: {
          rest: "var(--color-link-dark)",
          hover: "var(--color-link-dark-hover)",
        },
      }[scheme];
      expect(colors["card at rest"]).toEqual(await toRgb(page, expected.rest));
      expect(colors["Markdown at rest"]).toEqual(
        await toRgb(page, expected.rest),
      );
      expect(colors["Markdown on hover"]).toEqual(
        await toRgb(page, expected.hover),
      );

      for (const background of BACKGROUNDS[scheme]) {
        const back = await toRgb(page, background);
        for (const [what, color] of Object.entries(colors)) {
          expect(color[3], what).toBe(255);
          expect(
            contrast(color, back),
            `${what} on ${background}`,
          ).toBeGreaterThanOrEqual(4.5);
        }
      }
    });
  }
});
