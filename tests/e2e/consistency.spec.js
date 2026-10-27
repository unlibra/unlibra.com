// E2E: the same sizes, weights and margins across the pages (ui-revise12):
// the large card on a phone, the pages' h1, the weight 700 for the
// logotype only, the tools' headings and the margins of the credits and the
// privacy policy.
import { expect, test } from "@playwright/test";

import {
  chooseTheme,
  hasHorizontalScroll,
  LOCALES,
  open,
  toolUrl,
} from "./helpers.js";

const TOOLS = ["favicon-generator", "svg-optimizer", "password-generator"];
const TOOL_PAGES = LOCALES.flatMap((locale) =>
  TOOLS.map((tool) => toolUrl(locale, tool)),
);
const MARKDOWN_PAGES = ["/credits", "/donate", "/privacy"];
const PAGES = ["/", ...TOOL_PAGES, "/hex", ...MARKDOWN_PAGES];
// Just HEX is an art piece, not a tool: its title is larger (the user's
// choice, docs/decisions/just-hex/ JH-7).
const H1_PAGES = PAGES.filter((path) => path !== "/hex");

const box = (locator) =>
  locator.evaluate((e) => {
    const { x, y, width, height } = e.getBoundingClientRect();
    return { x, y, width, height, right: x + width, bottom: y + height };
  });

test.describe("ui-revise12 1, 2: the large card", () => {
  for (const width of [375, 1280]) {
    test(`${width}px: the title's size and line height; the text's left edge and its distance from the photo`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await open(page, "/");
      // fosty natural and Just HEX (just-hex JH-11).
      const cards = await page.locator('article[data-card="featured"]').all();
      expect(cards.length).toBe(2);
      for (const featured of cards) {
        const title = featured.locator("[data-work-title]");
        const [size, lineHeight] =
          width < 768 ? ["24px", "36px"] : ["36px", "52px"];
        await expect(title).toHaveCSS("font-size", size);
        await expect(title).toHaveCSS("line-height", lineHeight);
        await expect(title).toHaveCSS("font-weight", "600");

        const photo = await box(featured.locator(":scope > div").nth(0));
        const text = featured.locator(":scope > div").nth(1);
        const textBox = await box(text);
        const spotlight = await box(featured.locator("[data-work-spotlight]"));
        const titleBox = await box(title);
        if (width < 768) {
          // Stacked: the text starts at the photo's left edge, 16px below it.
          expect(Math.abs(spotlight.x - photo.x)).toBeLessThan(0.5);
          expect(Math.abs(titleBox.x - photo.x)).toBeLessThan(0.5);
          expect(Math.round(spotlight.y - photo.bottom)).toBe(16);
        } else {
          // Side by side, as before: 24px between the columns, 16px inside
          // the text's column.
          expect(Math.round(textBox.x - photo.right)).toBe(24);
          expect(Math.round(spotlight.x - textBox.x)).toBe(16);
        }
      }
    });
  }
});

test.describe("ui-revise12 3: every page's h1 is 28px with a 44px line, in 600", () => {
  for (const width of [375, 1280]) {
    for (const path of H1_PAGES) {
      test(`${width}px: ${path}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(path);
        const h1 = page.locator("h1");
        await expect(h1).toHaveCount(1);
        await expect(h1).toHaveCSS("font-size", "28px");
        await expect(h1).toHaveCSS("line-height", "44px");
        await expect(h1).toHaveCSS("font-weight", "600");
      });
    }
  }
});

/** The text of the page in 700 or bolder that is not the logotype. */
const boldTexts = (page) =>
  page.evaluate(() =>
    [...document.querySelectorAll("body *")]
      .filter(
        (e) =>
          !e.closest("svg, script, style, template, [data-logotype]") &&
          [...e.childNodes].some(
            (n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim(),
          ) &&
          parseFloat(getComputedStyle(e).fontWeight) >= 700,
      )
      .map(
        (e) =>
          `${e.tagName.toLowerCase()} "${e.textContent.trim().slice(0, 30)}"`,
      ),
  );

test.describe("ui-revise12 4: the weight 700 is the logotype's only", () => {
  for (const path of [...PAGES, "/no-such-page"]) {
    test(path, async ({ page }) => {
      await open(page, path);
      expect(await boldTexts(page)).toEqual([]);
    });
  }

  test("the descriptions of the Favicon formats are in 600, on a phone too", async ({
    page,
  }) => {
    const [ja] = LOCALES;
    for (const width of [1280, 375]) {
      await page.setViewportSize({ width, height: 900 });
      await open(page, toolUrl(ja, "favicon-generator"));
      if (width < 1024) {
        await page
          .getByRole("button", { name: ja.t.faviconGenerator.outputOptions })
          .click();
      }
      const strong = page.locator("strong:visible");
      expect(await strong.count()).toBeGreaterThan(0);
      for (const element of await strong.all()) {
        await expect(element).toHaveCSS("font-weight", "600");
      }
      expect(await boldTexts(page)).toEqual([]);
    }
  });

  test("the logotypes are LINE Seed JP Bold's drawing, not text in a weight (SP-16)", async ({
    page,
  }) => {
    await open(page, "/");
    for (const logotype of await page.locator("[data-logotype]").all()) {
      await expect(logotype).toHaveText("");
      await expect(logotype.locator('svg[role="img"]')).toHaveAttribute(
        "aria-label",
        "unlibra",
      );
    }
  });
});

test.describe("ui-revise12 5: the tools' headings are h2 under the h1", () => {
  for (const width of [375, 1280]) {
    for (const path of TOOL_PAGES) {
      test(`${width}px: ${path}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await open(page, path);
        await expect(page.locator("h6")).toHaveCount(0);
        // The levels in the order of the page: h1 first, none skipped.
        const levels = await page
          .locator("h1, h2, h3, h4, h5, h6")
          .evaluateAll((hs) => hs.map((h) => Number(h.tagName[1])));
        expect(levels[0]).toBe(1);
        for (let i = 1; i < levels.length; i++) {
          expect(levels[i], `${levels}`).toBeLessThanOrEqual(levels[i - 1] + 1);
        }
        // The tools' headings look as before: 16px, 24px lines, 600.
        const looks = await page.locator("main h2:visible").evaluateAll((hs) =>
          hs.map((h) => {
            const text = h.querySelector("button span") ?? h;
            const s = getComputedStyle(text);
            return [s.fontSize, s.lineHeight, s.fontWeight];
          }),
        );
        if (!path.endsWith("password-generator")) {
          expect(looks.length).toBeGreaterThan(0);
        }
        for (const look of looks) expect(look).toEqual(["16px", "24px", "600"]);
      });
    }
  }

  test("375px: the headings of the folding panels are exposed as h2", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 900 });
    for (const locale of LOCALES) {
      for (const [tool, name] of [
        ["favicon-generator", locale.t.faviconGenerator.outputOptions],
        ["svg-optimizer", locale.t.svgOptimizer.options],
      ]) {
        await open(page, toolUrl(locale, tool));
        const heading = page.getByRole("heading", {
          level: 2,
          name,
          exact: true,
        });
        await expect(heading).toBeVisible();
        await expect(heading.getByRole("button", { name })).toBeVisible();
      }
    }
  });
});

test.describe("ui-revise12 6: the credits and the privacy policy have the other pages' margins", () => {
  /** The padding of the box around the page's content, under the header. */
  const padding = (locator) =>
    locator.evaluate((e) => {
      const s = getComputedStyle(e);
      return [s.paddingTop, s.paddingRight, s.paddingBottom, s.paddingLeft];
    });

  for (const width of [375, 700, 1280]) {
    test(`${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(toolUrl(LOCALES[0], "password-generator"));
      const expected = await padding(page.locator("main"));
      const side = { 375: "16px", 700: "24px", 1280: "32px" }[width];
      expect(expected).toEqual(["32px", side, "48px", side]);
      for (const path of MARKDOWN_PAGES) {
        await page.goto(path);
        const main = page.locator("main");
        const isDonate = path === "/donate";
        expect(await padding(main.locator(".."))).toEqual(
          isDonate ? ["32px", side, "96px", side] : expected,
        );
        // The donation cards use 1024px; reading pages keep 768px.
        const text = await box(main);
        const pad = parseFloat(side);
        expect(Math.round(text.width)).toBe(
          Math.min(isDonate ? 1024 : 768, width - 2 * pad),
        );
        expect(Math.round(text.x)).toBe(
          Math.round((width - Math.round(text.width)) / 2),
        );
      }
    });
  }

  for (const width of [375, 1280]) {
    for (const scheme of ["light", "dark"]) {
      test(`${width}px, ${scheme}: no horizontal scroll`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ colorScheme: scheme });
        for (const path of ["/", ...MARKDOWN_PAGES]) {
          await open(page, path);
          await chooseTheme(page, "ja", scheme);
          expect(await hasHorizontalScroll(page), path).toBe(false);
        }
      });
    }
  }
});
