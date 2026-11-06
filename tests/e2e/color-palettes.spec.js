import { expect, test } from "@playwright/test";
import {
  grantClipboard,
  hasHorizontalScroll,
  open,
  readClipboard,
} from "./helpers.js";

for (const lang of ["ja", "en"]) {
  test(`${lang}: hue sections, numeric values, references and copy`, async ({
    page,
    context,
    baseURL,
  }) => {
    await grantClipboard(context, baseURL);
    await open(
      page,
      lang === "ja" ? "/palette-preview" : "/en/palette-preview",
    );
    await expect(page.locator("input[type=search]")).toHaveCount(0);
    await expect(page.locator("[data-collection]")).toHaveCount(8);
    await expect(page.locator("[data-collection=jis]")).toHaveCount(0);
    await expect(page.locator(".palette-swatch").first()).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    const inspector = page.locator(".palette-inspector");
    for (const [id, count] of [
      ["japanese", 261],
      ["world", 460],
    ]) {
      await page.locator(`[data-collection=${id}]`).click();
      await expect(page.locator(".palette-swatch").first()).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await expect(page.locator(".palette-swatch")).toHaveCount(count);
      await expect(page.locator(".palette-hue-nav a")).toHaveCount(11);
      await expect(page.locator(".palette-group")).toHaveCount(11);
      const ids = await page
        .locator(".palette-swatch")
        .evaluateAll((items) => items.map((item) => item.dataset.colorId));
      expect(new Set(ids).size).toBe(count);
      await page.locator('.palette-hue-nav a[href$="-N"]').click();
      await expect(
        page.locator('.palette-group[id$="-N"] h3'),
      ).toBeInViewport();
      await expect(
        inspector.getByRole("textbox", { name: "HEX", exact: true }),
      ).toBeInViewport();
    }
    await page.locator("[data-collection=japanese]").click();
    await page.locator('.palette-swatch[aria-label$="#59B9C6"]').click();
    await expect(
      inspector.getByRole("textbox", { name: "HEX", exact: true }),
    ).toHaveValue("#59B9C6");
    await expect(
      inspector.getByRole("textbox", { name: "RGB", exact: true }),
    ).toHaveValue("rgb(89, 185, 198)");
    await expect(
      inspector.getByRole("textbox", { name: "CMYK", exact: true }),
    ).toHaveCount(0);
    await expect(
      inspector.locator(".palette-primary-values input"),
    ).toHaveCount(2);
    await expect(inspector.locator(".palette-more-values")).not.toHaveAttribute(
      "open",
    );
    await inspector
      .getByRole("button", { name: /^(コピー|Copy) RGB$/ })
      .click();
    expect(await readClipboard(page)).toBe("rgb(89, 185, 198)");
    await expect(
      inspector.locator(".palette-reference-badges > span"),
    ).not.toHaveCount(0);
    await expect(page.locator(".palette-color-source")).toHaveCount(0);
    await expect(
      inspector.locator(
        ".palette-reference-badges a, .palette-reference-badges button",
      ),
    ).toHaveCount(0);
    await expect(page.locator(".palette-mini")).toHaveCount(0);
    await expect(page.locator(".palette-collection-section")).toHaveCount(3);
    await expect(
      inspector
        .locator(".palette-reference-badges > span")
        .filter({ hasText: "JIS" }),
    ).toHaveCount(1);
    await inspector.locator(".palette-more-values > summary").click();
    await expect(
      inspector.getByRole("textbox", { name: "HSV", exact: true }),
    ).toHaveValue("187.2°, 55.1%, 77.6%");
    const estimateLabel =
      lang === "ja" ? "マンセル（近似換算）" : "Munsell (approx.)";
    await expect(
      inspector.getByRole("textbox", { name: estimateLabel, exact: true }),
    ).toHaveValue("2B 6.9/6.3");
    await page.locator(".palette-sources > summary").click();
    await expect(page.locator(".palette-source-body")).toContainText(
      "Wikipedia",
    );
    for (const [label, url] of [
      ["DIC", "https://www.dic-graphics.co.jp/color/search.html"],
      ["PANTONE", "https://www.pantone.com/na/en-us/color-finder"],
    ]) {
      const link = page
        .locator(".palette-official-link")
        .filter({ hasText: label });
      await expect(link).toHaveAttribute("href", url);
      await expect(link).toHaveAttribute("target", "_blank");
      await expect(link).not.toHaveAttribute("aria-pressed");
    }
    await expect(inspector.locator(".palette-open-hex")).toHaveAttribute(
      "target",
      "_blank",
    );
  });

  test(`${lang}: all palette variants visible together`, async ({
    page,
    context,
    baseURL,
  }) => {
    await grantClipboard(context, baseURL);
    await open(
      page,
      lang === "ja" ? "/palette-preview" : "/en/palette-preview",
    );
    for (const [id, count, groups] of [
      ["tailwind", 286, 26],
      ["nord", 16, 4],
      ["radix", 744, 62],
      ["catppuccin", 104, 26],
      ["dracula", 24, 2],
      ["open-color", 132, 14],
    ]) {
      await page.locator(`[data-collection=${id}]`).click();
      await expect(page.locator(".palette-swatch")).toHaveCount(count);
      await expect(page.locator(".palette-group")).toHaveCount(groups);
      await expect(page.locator(".palette-variants")).toHaveCount(0);
    }
    await page.locator("[data-collection=catppuccin]").click();
    const row = page.locator(".palette-group").filter({
      has: page.getByRole("heading", { name: "Flamingo", exact: true }),
    });
    await expect(row.locator(".palette-color-name")).toHaveText([
      "Latte",
      "Frappé",
      "Macchiato",
      "Mocha",
    ]);
    await row.getByRole("button", { name: /^Mocha/ }).click();
    await page
      .locator(".palette-inspector")
      .getByRole("button", { name: /^(コピー|Copy) HEX$/ })
      .click();
    // The swatch names its HEX at the end of its accessible name.
    expect(await readClipboard(page)).toBe(
      (
        await row
          .locator(".palette-swatch[aria-pressed=true]")
          .getAttribute("aria-label")
      )
        .split(" ")
        .at(-1),
    );
    await page.locator("[data-collection=dracula]").click();
    await expect(page.locator(".palette-group h3")).toHaveText([
      "Dracula",
      "Alucard",
    ]);
    await page.locator("[data-color-id=alucard-purple]").click();
    await expect(
      page.locator(".palette-inspector input[aria-label=HEX]"),
    ).toHaveValue("#644AC9");
    await page.locator("[data-collection=tailwind]").click();
    await page.locator("[data-color-id=blue-500]").click();
    await page
      .locator(".palette-inspector .palette-more-values > summary")
      .click();
    await expect(
      page.locator(".palette-inspector").getByRole("textbox", {
        name: lang === "ja" ? "OKLCH（元の値）" : "OKLCH (original)",
        exact: true,
      }),
    ).toHaveValue("oklch(62.3% 0.214 259.815)");
  });
}

for (const width of [375, 1280])
  for (const theme of ["light", "dark"]) {
    test(`${width}px ${theme}: no page overflow and usable touch targets`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      await open(page, "/palette-preview");
      for (const id of [
        "japanese",
        "world",
        "tailwind",
        "nord",
        "radix",
        "catppuccin",
        "dracula",
        "open-color",
      ]) {
        await page.locator(`[data-collection=${id}]`).click();
        expect(await hasHorizontalScroll(page)).toBe(false);
        const undersized = await page
          .locator(
            ".palette-app button:visible, .palette-collections a, .palette-mobile-details > summary:visible",
          )
          .evaluateAll((items) =>
            items
              .filter(
                (item) =>
                  !item.closest("details:not([open])") ||
                  item.matches("summary"),
              )
              .map((item) => ({
                name: item.getAttribute("aria-label") || item.textContent,
                width: item.getBoundingClientRect().width,
                height: item.getBoundingClientRect().height,
              }))
              .filter(({ width, height }) => width < 43.9 || height < 43.9),
          );
        expect(undersized).toEqual([]);
      }
      await page.locator("[data-collection=catppuccin]").click();
      await page.screenshot({
        path: `test-results/new-palettes-${width}-${theme}.png`,
      });
    });
  }

test("mobile: dock preserves selection and opens extra values with reference badges", async ({
  page,
  context,
  baseURL,
}) => {
  await grantClipboard(context, baseURL);
  await page.setViewportSize({ width: 375, height: 800 });
  await open(page, "/palette-preview");
  await page.locator('.palette-swatch[aria-label$="#59B9C6"]').click();
  const dock = page.locator(".palette-mobile-inspector");
  await expect(dock.locator(".palette-mobile-value input")).toHaveValue(
    "#59B9C6",
  );
  await dock.getByRole("button", { name: "コピー HEX", exact: true }).click();
  expect(await readClipboard(page)).toBe("#59B9C6");
  await dock.locator(".palette-mobile-details > summary").click();
  await expect(dock.locator(".palette-mobile-expanded")).toBeVisible();
  await expect(
    dock.locator(".palette-reference-badges > span"),
  ).not.toHaveCount(0);
  await dock.getByRole("button", { name: "コピー RGB", exact: true }).click();
  expect(await readClipboard(page)).toBe("rgb(89, 185, 198)");
  await dock.locator(".palette-more-values > summary").click();
  await expect(
    dock.getByRole("textbox", { name: "マンセル（近似換算）", exact: true }),
  ).toHaveValue("2B 6.9/6.3");
  expect(await hasHorizontalScroll(page)).toBe(false);
  await page.screenshot({
    path: "test-results/new-palettes-mobile-values.png",
  });
  await dock.getByRole("button", { name: "UIプレビュー", exact: true }).click();
  await expect(
    page.locator(".palette-preview-dialog .palette-demo-card"),
  ).toHaveCount(2);
  await expect(
    page.locator(".palette-preview-dialog .palette-demo-button").first(),
  ).toHaveCSS("background-color", "rgb(89, 185, 198)");
  expect(await hasHorizontalScroll(page)).toBe(false);
});
test("palette data retains attribution and the preview is excluded from the sitemap", async ({
  request,
}) => {
  for (const [id, count, license] of [
    ["japanese", 261, "CC-BY-SA-4.0"],
    ["world", 460, "CC-BY-SA-4.0"],
    ["tailwind", 286, "MIT"],
    ["nord", 16, "MIT"],
    ["radix", 744, "MIT"],
    ["catppuccin", 104, "MIT"],
    ["dracula", 24, "MIT"],
    ["open-color", 132, "MIT"],
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
  expect((await request.get("/palette-data/wada.json")).status()).toBe(404);
  expect((await request.get("/palette-data/jis.json")).status()).toBe(404);
  const sitemap = await (await request.get("/sitemap-0.xml")).text();
  expect(sitemap).not.toContain("palette-preview");
  const page = await (await request.get("/palette-preview")).text();
  expect(page).toContain('name="robots" content="noindex, follow"');
});

for (const lang of ["ja", "en"])
  test(
    lang + ": selected colors preview as light and dark UI",
    async ({ page }) => {
      await open(
        page,
        lang === "ja" ? "/palette-preview" : "/en/palette-preview",
      );
      await page.locator('.palette-swatch[aria-label$="#59B9C6"]').click();
      const panel = page.locator(".palette-inspector");
      await panel
        .getByRole("button", {
          name: lang === "ja" ? "UIプレビュー" : "UI preview",
          exact: true,
        })
        .click();
      const modal = page.getByRole("dialog");
      await expect(modal).toBeVisible();
      await expect(modal.locator(".palette-demo-card")).toHaveCount(2);
      await expect(
        page.locator(".palette-preview-dialog .palette-demo-button").first(),
      ).toHaveCSS("background-color", "rgb(89, 185, 198)");
      await expect(
        page.locator(".palette-preview-dialog .palette-demo-button").first(),
      ).toHaveCSS("color", "rgb(0, 0, 0)");
      const demo = modal.locator('.palette-demo-card[data-mode="light"]');
      const button = demo.locator(".palette-demo-button");
      await button.hover();
      await expect(button).toHaveCSS("transform", "none");
      await expect(button).toHaveCSS("box-shadow", "none");
      await expect(button).not.toHaveCSS(
        "background-color",
        "rgb(89, 185, 198)",
      );
      const field = demo.getByRole("textbox");
      await field.fill("Preview");
      await expect(field).toHaveValue("Preview");
      const toggle = demo.getByRole("switch");
      await demo.locator(".palette-demo-toggle").click();
      await expect(toggle).not.toBeChecked();
      await expect(demo.locator(".palette-demo-toggle-track")).toHaveCSS(
        "background-color",
        "rgb(119, 128, 143)",
      );
      await page.emulateMedia({ reducedMotion: "reduce" });
      await expect(button).toHaveCSS("transition-duration", "0s");
      const close = modal.getByRole("button", {
        name: lang === "ja" ? "閉じる" : "Close",
        exact: true,
      });
      await expect(close.locator("svg")).toHaveCount(1);
      await close.click();
      await expect(modal).not.toBeVisible();
    },
  );
test("named colors run light to dark within a Munsell hue", async ({
  page,
}) => {
  await open(page, "/palette-preview");
  const red = page.locator("#palette-japanese-R");
  await expect(red.locator(".palette-swatch")).toHaveCount(52);
  const swatches = red.locator(".palette-swatch");
  await expect(swatches.first()).toHaveAttribute("aria-label", /#FEEEED$/);
  await expect(swatches.last()).toHaveAttribute("aria-label", /#691C2A$/);
  // Named colors show their reading, not their HEX, under the name.
  await expect(swatches.first().locator(".palette-color-reading")).toHaveText(
    "さくらいろ",
  );
  await red.evaluate((element) => element.scrollIntoView({ block: "start" }));
  await page.screenshot({ path: "test-results/hue-order.png" });
});
