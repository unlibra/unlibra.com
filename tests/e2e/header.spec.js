// E2E: the header's navigation and brand symbol.
import { expect, test } from "@playwright/test";

import { chooseTheme, open } from "./helpers.js";

for (const width of [320, 1280]) {
  test(`${width}px: the header only links to home and the other language`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 800 });
    for (const path of ["/", "/en/lab/svg-optimizer"]) {
      await open(page, path);
      const header = page.locator("header");
      await expect(header.getByRole("link")).toHaveCount(2);
      await expect(header.locator("[data-category-nav]")).toHaveCount(0);
      await header.getByRole("link", { name: "unlibra", exact: true }).click();
      await expect(page).toHaveURL(path.startsWith("/en") ? "/en" : "/");
    }
  });
}

test.describe("brand symbol", () => {
  const DARK = "rgb(39, 39, 42)"; // #27272a
  const LIGHT = "rgb(245, 245, 244)"; // #f5f5f4

  /** [circle fill, mark fill] of every brand symbol on the page. */
  const fills = (page) =>
    page
      .locator("[data-brand-symbol]")
      .evaluateAll((symbols) =>
        symbols.map((svg) => [
          getComputedStyle(svg.querySelector("circle")).fill,
          getComputedStyle(svg.querySelector("path")).fill,
        ]),
      );

  for (const path of ["/", "/en/lab/svg-optimizer"]) {
    test(`${path}: the circle and the mark swap colors in dark mode`, async ({
      page,
    }) => {
      const lang = path.startsWith("/en/") ? "en" : "ja";
      await page.emulateMedia({ colorScheme: "light" });
      await open(page, path);
      // Header and footer (the hero's was removed in ui-revise4 1, the
      // mobile menu's in i18n I18N-4).
      const count = 2;
      await chooseTheme(page, lang, "light");
      await expect
        .poll(() => fills(page))
        .toEqual(Array(count).fill([DARK, LIGHT]));
      await chooseTheme(page, lang, "dark");
      await expect
        .poll(() => fills(page))
        .toEqual(Array(count).fill([LIGHT, DARK]));
    });
  }
});
