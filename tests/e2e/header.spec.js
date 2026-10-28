// E2E: the header's category links (ui-revise 1 and 4, ui-revise2 1 and 6;
// phones have no menu since i18n I18N-4).
import { expect, test } from "@playwright/test";

import { chooseTheme, open } from "./helpers.js";

const SECTIONS = [
  ["keyboards", "DIY Keyboards"],
  ["libraries", "Libraries"],
  ["apps", "Apps"],
  ["vr-3d", "VRChat"],
];

test.describe("desktop", () => {
  test("the category links scroll to their sections of the top page", async ({
    page,
  }) => {
    await open(page, "/lab/svg-optimizer");
    const header = page.locator("header");
    for (const [id, name] of SECTIONS) {
      await header.getByRole("link", { name, exact: true }).click();
      await expect(page).toHaveURL(`/#${id}`);
      await expect(
        page.getByRole("heading", { level: 2, name, exact: true }),
      ).toBeInViewport();
    }
  });

  test("the categories are links only, with no menu to open", async ({
    page,
  }) => {
    for (const path of ["/", "/en/lab/favicon-generator"]) {
      await open(page, path);
      const nav = page.locator("header [data-category-nav]");
      await expect(nav.getByRole("link")).toHaveText(
        SECTIONS.map(([, name]) => name),
      );
      await expect(nav.getByRole("button")).toHaveCount(0);
      await expect(page.locator("#category-web-menu")).toHaveCount(0);
    }
  });
});

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
