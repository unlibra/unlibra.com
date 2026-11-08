import { expect, test } from "@playwright/test";
import { hasHorizontalScroll, open } from "./helpers.js";

for (const lang of ["ja", "en"]) {
  const apps = lang === "ja" ? "/apps" : "/en/apps";
  const home = lang === "ja" ? "/" : "/en";

  test(`${lang}: Apps lists each tool and the tool breadcrumb returns to Apps`, async ({
    page,
  }) => {
    await open(page, apps);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Apps");
    const cards = page.locator("main [data-work]");
    // Just HEX and the swatch book first, in a section of their own (their
    // pages are at the root), then the tools; all as list cards.
    await expect(
      page.locator("#apps-web").locator("xpath=..").locator("[data-work]"),
    ).toHaveCount(2);
    await expect(page.locator('main [data-card="featured"]')).toHaveCount(0);
    await expect(cards).toHaveCount(5);
    expect(
      await cards.evaluateAll((items) =>
        items.map((item) => item.getAttribute("data-work")),
      ),
    ).toEqual([
      "just-hex",
      "color-palettes",
      "svg-optimizer",
      "favicon-generator",
      "password-generator",
    ]);
    const prefix = lang === "ja" ? "" : "/en";
    for (const [app, path] of [
      ["just-hex", "/hex"],
      ["color-palettes", "/palette/japanese"],
    ])
      await expect(
        page.locator(`[data-work="${app}"] [data-work-link]`).first(),
      ).toHaveAttribute("href", `${prefix}${path}`);
    for (const tool of [
      "svg-optimizer",
      "favicon-generator",
      "password-generator",
    ]) {
      await expect(
        page.locator(`[data-work="${tool}"] [data-work-link]`).first(),
      ).toHaveAttribute("href", `${apps}/${tool}`);
    }
    await page
      .locator('[data-work="svg-optimizer"] [data-work-link]')
      .first()
      .click();
    await expect(page).toHaveURL(`${apps}/svg-optimizer`);
    const breadcrumb = page.getByRole("navigation", {
      name: lang === "ja" ? "パンくずリスト" : "Breadcrumb",
      exact: true,
    });
    await breadcrumb.getByRole("link", { name: "Apps", exact: true }).click();
    await expect(page).toHaveURL(apps);
  });

  test(`${lang}: mobile navigation works with keyboard and remains within 320px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await open(page, apps);
    const toggle = page.locator("[data-site-menu-toggle]");
    const menu = page.getByRole("dialog", {
      name: lang === "ja" ? "メニュー" : "Menu",
      exact: true,
    });
    await toggle.focus();
    await page.keyboard.press("Enter");
    await expect(menu.locator("[data-mobile-nav-link]")).toHaveText([
      "Works",
      "Apps",
    ]);
    await expect(
      menu.locator('[data-mobile-nav-link][aria-current="location"]'),
    ).toBeFocused();
    expect(await hasHorizontalScroll(page)).toBe(false);
    await expect
      .poll(async () => {
        const box = await menu.boundingBox();
        return Math.abs(box.x + box.width - 320);
      })
      .toBeLessThan(1);
    const box = await menu.boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(320);
    expect(Math.abs(box.x + box.width - 320)).toBeLessThan(1);
    await expect(page.locator("html")).toHaveCSS("overflow", "hidden");
    const preferences = menu.locator("[data-menu-preferences]");
    expect((await preferences.boundingBox()).y).toBeLessThan(
      (await menu.locator(".menu-links").boundingBox()).y,
    );
    await page.keyboard.press("Tab");
    await expect(menu.locator("[data-site-menu-close]")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(menu.locator("[data-language-option]").first()).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(menu.locator("[data-language-option]").nth(1)).toBeFocused();
    for (const option of await menu.locator("[data-theme-option]").all()) {
      await page.keyboard.press("Tab");
      await expect(option).toBeFocused();
    }
    await page.keyboard.press("Tab");
    await expect(menu.locator("[data-mobile-nav-link]").first()).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(home);
    await toggle.click();
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(toggle).toBeFocused();
    await toggle.click();
    await menu.locator("[data-site-menu-close]").click();
    await expect(menu).toBeHidden();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await toggle.click();
    await page.mouse.click(8, 350);
    await expect(menu).toBeHidden();
    await toggle.click();
    await page.setViewportSize({ width: 768, height: 700 });
    await expect(toggle).toBeHidden();
    await expect(page.locator("[data-desktop-navigation]")).toBeVisible();
    await page.setViewportSize({ width: 320, height: 700 });
    await expect(menu).toBeHidden();
  });
}

test("mobile drawer follows reduced motion and supports the privacy page", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 700 });
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "dark" });
  await open(page, "/privacy");
  await page.locator("[data-site-menu-toggle]").click();
  const menu = page.getByRole("dialog", { name: "メニュー", exact: true });
  await expect(menu).toBeVisible();
  await expect(menu).toHaveCSS("transition-property", "none");
  await page.mouse.click(200, 600);
  await expect(menu).toBeVisible();
  await menu.getByRole("link", { name: "Apps", exact: true }).click();
  await expect(page).toHaveURL("/apps");
});
