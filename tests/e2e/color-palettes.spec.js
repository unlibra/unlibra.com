import { expect, test } from "@playwright/test";
import {
  grantClipboard,
  hasHorizontalScroll,
  open,
  readClipboard,
} from "./helpers.js";

for (const lang of ["ja", "en"]) {
  const path = lang === "ja" ? "/palette-preview" : "/en/palette-preview";
  test(`${lang}: palette search, copy, attribution and Just HEX handoff`, async ({
    page,
    context,
    baseURL,
  }) => {
    await grantClipboard(context, baseURL);
    await open(page, path);
    await expect(page.locator("[data-palette-app]")).toBeVisible();
    const search = page.locator(".palette-search input");
    await search.fill("しんばし");
    await expect(page.locator(".palette-swatch")).toHaveCount(1);
    await page.locator(".palette-swatch").click();
    await expect(page.locator(".palette-inspector .palette-value")).toHaveValue(
      "#59B9C6",
    );
    await page.locator(".palette-copy-row button").click();
    expect(await readClipboard(page)).toBe("#59B9C6");
    await page
      .locator(".palette-format button")
      .filter({ hasText: /^RGB$/ })
      .click();
    await page.locator(".palette-copy-row button").click();
    expect(await readClipboard(page)).toBe("rgb(89, 185, 198)");
    await expect(page.locator(".palette-color-source")).toHaveAttribute(
      "href",
      /oldid=110243954$/,
    );
    await page.locator(".palette-open-hex").click();
    await expect(page).toHaveURL(`${lang === "en" ? "/en" : ""}/hex/59B9C6`);
    await expect(page.locator("[data-hex-screen]")).toBeVisible();
    await page.goto(path);
    await expect(
      page.locator("astro-island[component-export='default'][ssr]"),
    ).toHaveCount(0);
    await page.locator("[data-collection=tailwind]").click();
    await expect(page.locator(".palette-swatch")).toHaveCount(286);
    await page.locator(".palette-search input").fill("blue-500");
    await expect(page.locator(".palette-swatch")).toHaveCount(1);
    await page.locator(".palette-swatch").click();
    await page
      .locator(".palette-format button")
      .filter({ hasText: /^OKLCH$/ })
      .click();
    await expect(page.locator(".palette-inspector .palette-value")).toHaveValue(
      "oklch(62.3% 0.214 259.815)",
    );
    await page.locator("[data-collection=nord]").click();
    await expect(page.locator(".palette-swatch")).toHaveCount(16);
    await expect(page.locator(".palette-format")).not.toContainText("OKLCH");
    await expect(page.locator(".palette-inspector .palette-value")).toHaveValue(
      "#2E3440",
    );
    await page.locator(".palette-search input").fill("no-matching-color");
    await expect(page.locator(".palette-empty")).toBeVisible();
    await page.locator(".palette-empty button").click();
    await expect(page.locator(".palette-swatch")).toHaveCount(16);
    await expect(page.locator(".palette-pantone a")).toHaveAttribute(
      "href",
      "https://www.pantone.com/na/en-us/color-finder",
    );
    await expect(page.locator(".palette-pantone a")).toHaveAttribute(
      "rel",
      "noopener noreferrer",
    );
  });
}

for (const width of [375, 1280]) {
  for (const theme of ["light", "dark"]) {
    test(`${width}px ${theme}: responsive palettes and touch targets`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      await open(page, "/palette-preview");
      for (const collection of ["japanese", "tailwind", "nord"]) {
        await page.locator(`[data-collection=${collection}]`).click();
        expect(await hasHorizontalScroll(page)).toBe(false);
        const targets = await page
          .locator(".palette-app button:visible")
          .evaluateAll((items) =>
            items
              .filter((item) => !item.closest("details:not([open])"))
              .map((item) => {
                const { width, height } = item.getBoundingClientRect();
                return {
                  name: item.getAttribute("aria-label") || item.textContent,
                  width,
                  height,
                };
              }),
          );
        expect(
          targets.filter(({ width, height }) => width < 43.9 || height < 43.9),
        ).toEqual([]);
      }
      await page.locator("[data-collection=japanese]").click();
      await page.screenshot({
        path: `test-results/palettes-${width}-${theme}.png`,
        fullPage: true,
      });
      await page.screenshot({
        path: `test-results/palettes-${width}-${theme}-viewport.png`,
      });
    });
  }
}

test("mobile: selected color stays available while browsing, with copy and format selection", async ({
  page,
  context,
  baseURL,
}) => {
  await grantClipboard(context, baseURL);
  await page.setViewportSize({ width: 375, height: 800 });
  await open(page, "/palette-preview");
  await page.getByRole("button", { name: "墨色 #343434", exact: true }).click();
  const dock = page.locator(".palette-mobile-inspector");
  await expect(dock).toBeVisible();
  await expect(dock.locator("input")).toHaveValue("#343434");
  await dock.getByRole("button").click();
  expect(await readClipboard(page)).toBe("#343434");
  await dock.getByRole("combobox").selectOption("RGB");
  await dock.getByRole("button").click();
  expect(await readClipboard(page)).toBe("rgb(52, 52, 52)");
  await expect(
    dock.getByRole("link", { name: "Just HEXで見る" }),
  ).toHaveAttribute("href", "/hex/343434");
});

test("palette data retains attribution and the preview is excluded from the sitemap", async ({
  request,
}) => {
  for (const [id, count, license] of [
    ["japanese", 23, "CC-BY-SA-4.0"],
    ["tailwind", 286, "MIT"],
    ["nord", 16, "MIT"],
  ]) {
    const response = await request.get(`/palette-data/${id}.json`);
    expect(response.ok()).toBe(true);
    const data = await response.json();
    expect(data.colors).toHaveLength(count);
    expect(data.license).toBe(license);
    expect(data.attribution.length).toBeGreaterThan(0);
    for (const color of data.colors)
      expect(color.hex).toMatch(/^#[0-9A-F]{6}$/);
  }
  const sitemap = await (await request.get("/sitemap-0.xml")).text();
  expect(sitemap).not.toContain("palette-preview");
  const page = await (await request.get("/palette-preview")).text();
  expect(page).toContain('name="robots" content="noindex, follow"');
});
