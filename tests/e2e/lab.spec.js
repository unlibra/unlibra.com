import { expect, test } from "@playwright/test";
import { hasHorizontalScroll, open } from "./helpers.js";

for (const lang of ["ja", "en"]) {
  const lab = lang === "ja" ? "/lab" : "/en/lab";
  const home = lang === "ja" ? "/" : "/en";

  test(`${lang}: Lab lists each tool and the tool breadcrumb returns to Lab`, async ({
    page,
  }) => {
    await open(page, lab);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Lab");
    const cards = page.locator("main [data-work]");
    await expect(cards).toHaveCount(3);
    expect(
      await cards.evaluateAll((items) =>
        items.map((item) => item.getAttribute("data-work")),
      ),
    ).toEqual(["svg-optimizer", "favicon-generator", "password-generator"]);
    for (const tool of [
      "svg-optimizer",
      "favicon-generator",
      "password-generator",
    ]) {
      await expect(
        page.locator(`[data-work="${tool}"] [data-work-link]`).first(),
      ).toHaveAttribute("href", `${lab}/${tool}`);
    }
    await page
      .locator('[data-work="svg-optimizer"] [data-work-link]')
      .first()
      .click();
    await expect(page).toHaveURL(`${lab}/svg-optimizer`);
    const breadcrumb = page.getByRole("navigation", {
      name: lang === "ja" ? "パンくずリスト" : "Breadcrumb",
      exact: true,
    });
    await breadcrumb.getByRole("link", { name: "Lab", exact: true }).click();
    await expect(page).toHaveURL(lab);
  });

  test(`${lang}: mobile navigation works with keyboard and remains within 320px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await open(page, lab);
    const toggle = page.locator("[data-site-menu-toggle]");
    const menu = page.getByRole("dialog", {
      name: lang === "ja" ? "メニュー" : "Menu",
      exact: true,
    });
    await toggle.focus();
    await page.keyboard.press("Enter");
    await expect(menu.locator("[data-mobile-nav-link]")).toHaveText([
      "Works",
      "Lab",
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
  await menu.getByRole("link", { name: "Lab", exact: true }).click();
  await expect(page).toHaveURL("/lab");
});
