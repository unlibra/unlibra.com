// E2E: the header's navigation and brand symbol.
import { expect, test } from "@playwright/test";

import { chooseTheme, open } from "./helpers.js";

for (const width of [320, 375, 639, 640, 767, 768, 1280]) {
  test(`${width}px: the header has no external links and keeps compact controls in one row`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 800 });
    for (const path of ["/", "/en/apps/svg-optimizer"]) {
      await open(page, path);
      const header = page.locator("header");
      await expect(header.getByRole("link")).toHaveCount(width >= 768 ? 3 : 1);
      if (width >= 768) {
        await expect(header.locator("[data-desktop-navigation] a")).toHaveText([
          "Works",
          "Apps",
        ]);
      } else {
        await expect(header.locator("[data-site-menu-toggle]")).toBeVisible();
        const controls = header.locator("button:visible");
        await expect(controls).toHaveCount(1);
        await expect(controls.nth(0)).toHaveAttribute(
          "data-site-menu-toggle",
          "",
        );
        await expect(header.locator("[data-language-switch]")).toBeHidden();
        await expect(
          header.locator("[data-theme-toggle] > button"),
        ).toBeHidden();
      }
      await expect(
        header.locator('a[href="https://github.com/unlibra"]'),
      ).toHaveCount(0);
      await expect(header.locator("nav")).toHaveCSS("height", "64px");
      await expect(
        header.locator('a[href="https://unlibra.booth.pm/"]'),
      ).toHaveCount(0);
      await expect(header.locator("[data-category-nav]")).toHaveCount(0);
      await header.getByRole("link", { name: "unlibra", exact: true }).click();
      await expect(page).toHaveURL(path.startsWith("/en") ? "/en" : "/");
    }
  });
}

for (const path of ["/", "/en"]) {
  test(`${path}: language and theme popovers share keyboard and dismissal behavior`, async ({
    page,
  }) => {
    await open(page, path);
    const button = page.locator("[data-language-switch]");
    const panel = page.locator("#language-menu");
    const themeButton = page.locator("[data-theme-toggle] > button");
    await expect(button).toHaveAccessibleName(
      path === "/" ? "言語を選択" : "Select language",
    );
    await expect(button).toHaveText("");
    await expect(button).toHaveCSS("width", "44px");
    await expect(button).toHaveCSS("height", "44px");
    await button.click();
    await expect(panel.getByRole("link")).toHaveText(["日本語", "English"]);
    await expect(panel.locator('[aria-current="page"]')).toBeFocused();
    await page.keyboard.press("End");
    await expect(
      panel.getByRole("link", { name: "English", exact: true }),
    ).toBeFocused();
    await page.keyboard.press("Home");
    await expect(
      panel.getByRole("link", { name: "日本語", exact: true }),
    ).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
    await expect(button).toBeFocused();
    await button.click();
    await panel.locator('[aria-current="page"]').click();
    await expect(panel).toBeHidden();
    await expect(button).toBeFocused();
    await button.click();
    await themeButton.click();
    await expect(panel).toBeHidden();
    await expect(page.locator("#theme-menu")).toBeVisible();
    await button.click();
    await expect(panel).toBeVisible();
    await expect(page.locator("#theme-menu")).toBeHidden();
    await page.locator("h1").click();
    await expect(panel).toBeHidden();
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

  for (const path of ["/", "/en/apps/svg-optimizer"]) {
    test(`${path}: the circle and the mark swap colors in dark mode`, async ({
      page,
    }) => {
      const lang = path.startsWith("/en/") ? "en" : "ja";
      await page.emulateMedia({ colorScheme: "light" });
      await open(page, path);
      // Header and footer (the hero's was removed in ui-revise4 1, the
      // mobile menu's in i18n I18N-4). The footer is dark in both themes,
      // so its symbol keeps the dark mode's colors.
      await chooseTheme(page, lang, "light");
      await expect
        .poll(() => fills(page))
        .toEqual([
          [DARK, LIGHT],
          [LIGHT, DARK],
        ]);
      await chooseTheme(page, lang, "dark");
      await expect
        .poll(() => fills(page))
        .toEqual([
          [LIGHT, DARK],
          [LIGHT, DARK],
        ]);
    });
  }
});
