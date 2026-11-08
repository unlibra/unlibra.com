import { expect, test } from "@playwright/test";
import {
  grantClipboard,
  hasHorizontalScroll,
  open,
  readClipboard,
} from "./helpers.js";

/** Collection IDs and the slugs of their pages (/palette/<slug>). */
const PALETTES = [
  ["japanese", "japanese"],
  ["world", "world"],
  ["tailwind", "tailwindcss"],
  ["nord", "nord"],
  ["radix", "radix-colors"],
  ["catppuccin", "catppuccin"],
  ["dracula", "dracula"],
  ["open-color", "open-color"],
];
const slugOf = Object.fromEntries(PALETTES);
/** The hue marks: 5R 4/14, 5YR 6/12 … 5RP 4/12 and N 6, in sRGB. */
const MARKERS = [
  "rgb(188, 25, 51)",
  "rgb(219, 123, 22)",
  "rgb(234, 198, 0)",
  "rgb(154, 186, 40)",
  "rgb(0, 139, 98)",
  "rgb(35, 135, 129)",
  "rgb(0, 134, 166)",
  "rgb(0, 72, 152)",
  "rgb(130, 71, 155)",
  "rgb(167, 50, 111)",
  "rgb(147, 147, 147)",
];
const prefix = (lang) => (lang === "ja" ? "" : "/en");
const paletteUrl = (lang, slug) => `${prefix(lang)}/palette/${slug}`;

for (const lang of ["ja", "en"]) {
  test(`${lang}: named palettes link every color to its page`, async ({
    page,
  }) => {
    for (const [id, count] of [
      ["japanese", 299],
      ["world", 519],
    ]) {
      await open(page, paletteUrl(lang, id));
      await expect(page.locator("[data-collection]")).toHaveCount(8);
      for (const [other, slug] of PALETTES)
        await expect(
          page.locator(`[data-collection=${other}]`),
        ).toHaveAttribute("href", paletteUrl(lang, slug));
      await expect(
        page.locator(".palette-collections [aria-current=page]"),
      ).toHaveAttribute("data-collection", id);
      // No inspector and no dock: a named color opens its own page, and the
      // list takes the full width (6 columns at 1280px).
      await expect(page.locator(".palette-inspector")).toHaveCount(0);
      await expect(page.locator(".palette-mobile-inspector")).toHaveCount(0);
      expect(
        await page
          .locator(".palette-swatches")
          .first()
          .evaluate(
            (grid) =>
              getComputedStyle(grid).gridTemplateColumns.split(" ").length,
          ),
      ).toBe(6);
      const swatches = page.locator("a.palette-swatch");
      await expect(swatches).toHaveCount(count);
      await expect(page.locator(".palette-hue-nav a")).toHaveCount(11);
      await expect(page.locator(".palette-group")).toHaveCount(11);
      await expect(page.locator(".palette-section-intro h2")).toHaveText(
        lang === "ja"
          ? `${id === "japanese" ? "日本の色" : "世界の色"}（${count}）`
          : `${id === "japanese" ? "Japanese colors" : "World colors"} (${count})`,
      );
      // Each hue's mark is its Munsell representative, on every palette.
      expect(
        await page
          .locator(".palette-hue-dot")
          .evaluateAll((dots) => dots.map((dot) => dot.style.backgroundColor)),
      ).toEqual(MARKERS);
      const hrefs = await swatches.evaluateAll((items) =>
        items.map((item) => item.getAttribute("href")),
      );
      expect(new Set(hrefs).size).toBe(count);
      for (const href of hrefs)
        expect(href.startsWith(`${prefix(lang)}/colors/`)).toBe(true);
      await expect(
        page.locator('a.palette-swatch[aria-label$="#5BACB8"]'),
      ).toHaveAttribute("href", `${prefix(lang)}/colors/shinbashi`);
      await page.locator('.palette-hue-nav a[href$="-N"]').click();
      await expect(
        page.locator('.palette-group[id$="-N"] h3'),
      ).toBeInViewport();
    }
    await page.locator(".palette-sources > summary").click();
    await expect(page.locator(".palette-source-body")).toContainText("JIS");
    await expect(page.locator(".palette-source-body a")).toHaveCount(0);
    for (const [label, url] of [
      ["DIC", "https://www.dic-graphics.co.jp/color/search.html"],
      ["PANTONE", "https://www.pantone.com/na/en-us/color-finder"],
    ]) {
      const link = page
        .locator(".palette-official-link")
        .filter({ hasText: label });
      await expect(link).toHaveAttribute("href", url);
      await expect(link).toHaveAttribute("target", "_blank");
    }
  });

  test(`${lang}: the other palettes keep the inspector with numeric values`, async ({
    page,
    context,
    baseURL,
  }) => {
    await grantClipboard(context, baseURL);
    await open(page, paletteUrl(lang, "nord"));
    const inspector = page.locator(".palette-inspector");
    await expect(page.locator(".palette-swatch").first()).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await page.locator("[data-color-id=nord8]").click();
    await expect(
      inspector.getByRole("textbox", { name: "HEX", exact: true }),
    ).toHaveValue("#88C0D0");
    await expect(
      inspector.getByRole("textbox", { name: "RGB", exact: true }),
    ).toHaveValue("rgb(136, 192, 208)");
    await expect(
      inspector.locator(".palette-primary-values input"),
    ).toHaveCount(2);
    await expect(inspector.locator(".palette-more-values")).not.toHaveAttribute(
      "open",
    );
    await inspector
      .getByRole("button", { name: /^(コピー|Copy) RGB$/ })
      .click();
    expect(await readClipboard(page)).toBe("rgb(136, 192, 208)");
    await inspector.locator(".palette-more-values > summary").click();
    await expect(
      inspector.getByRole("textbox", { name: "HSV", exact: true }),
    ).toHaveValue("193.3°, 34.6%, 81.6%");
    const estimateLabel =
      lang === "ja" ? "マンセル（近似換算）" : "Munsell (approx.)";
    await expect(
      inspector.getByRole("textbox", { name: estimateLabel, exact: true }),
    ).toHaveValue("6B 7.4/4.5");
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
    for (const [id, count, groups] of [
      ["tailwind", 286, 26],
      ["nord", 16, 4],
      ["radix", 744, 62],
      ["catppuccin", 104, 26],
      ["dracula", 24, 2],
      ["open-color", 132, 14],
    ]) {
      await open(page, paletteUrl(lang, slugOf[id]));
      await expect(page.locator(".palette-section-intro h2")).not.toContainText(
        String(count),
      );
      await expect(page.locator(".palette-swatch")).toHaveCount(count);
      await expect(page.locator(".palette-group")).toHaveCount(groups);
      await expect(page.locator(".palette-variants")).toHaveCount(0);
    }
    await open(page, paletteUrl(lang, "catppuccin"));
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
    await open(page, paletteUrl(lang, "dracula"));
    await expect(page.locator(".palette-group h3")).toHaveText([
      "Dracula",
      "Alucard",
    ]);
    await page.locator("[data-color-id=alucard-purple]").click();
    await expect(
      page.locator(".palette-inspector input[aria-label=HEX]"),
    ).toHaveValue("#644AC9");
    await open(page, paletteUrl(lang, "tailwindcss"));
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
      for (const [, slug] of PALETTES) {
        await open(page, paletteUrl("ja", slug));
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
        expect(undersized, slug).toEqual([]);
      }
      await open(page, paletteUrl("ja", "japanese"));
      await page.screenshot({
        path: `test-results/new-palettes-${width}-${theme}.png`,
      });
    });
  }

test("mobile: dock preserves selection and opens extra values", async ({
  page,
  context,
  baseURL,
}) => {
  await grantClipboard(context, baseURL);
  await page.setViewportSize({ width: 375, height: 800 });
  await open(page, "/palette/nord");
  await page.locator("[data-color-id=nord8]").click();
  const dock = page.locator(".palette-mobile-inspector");
  await expect(dock.locator(".palette-mobile-value input")).toHaveValue(
    "#88C0D0",
  );
  await dock.getByRole("button", { name: "コピー HEX", exact: true }).click();
  expect(await readClipboard(page)).toBe("#88C0D0");
  await dock.locator(".palette-mobile-details > summary").click();
  await expect(dock.locator(".palette-mobile-expanded")).toBeVisible();
  await dock.getByRole("button", { name: "コピー RGB", exact: true }).click();
  expect(await readClipboard(page)).toBe("rgb(136, 192, 208)");
  await dock.locator(".palette-more-values > summary").click();
  await expect(
    dock.getByRole("textbox", { name: "マンセル（近似換算）", exact: true }),
  ).toHaveValue("6B 7.4/4.5");
  expect(await hasHorizontalScroll(page)).toBe(false);
  await page.screenshot({
    path: "test-results/new-palettes-mobile-values.png",
  });
  // Just HEX is in the menu, right under the UI preview button.
  const menu = dock.locator(".palette-mobile-expanded");
  const hex = menu.getByRole("link", { name: "Just HEXで開く" });
  await expect(hex).toHaveAttribute("href", "/hex/88C0D0");
  await expect(hex).toHaveAttribute("target", "_blank");
  expect(
    await menu.evaluate((element) =>
      [...element.querySelectorAll("button, a")]
        .slice(-2)
        .map((item) => item.textContent.trim()),
    ),
  ).toEqual(["UIプレビュー", "Just HEXで開く"]);
  await dock.getByRole("button", { name: "UIプレビュー", exact: true }).click();
  await expect(
    page.locator(".palette-preview-dialog .palette-demo-card"),
  ).toHaveCount(2);
  // The pointer stays where the button was: it may be over a sample
  // button, which then shows its hover color.
  await page.mouse.move(0, 0);
  await expect(
    page.locator(".palette-preview-dialog .palette-demo-button").first(),
  ).toHaveCSS("background-color", "rgb(136, 192, 208)");
  expect(await hasHorizontalScroll(page)).toBe(false);
});

test("palette data is not offered for download, its licenses are, and the palettes stay out of search", async ({
  request,
}) => {
  // The datasets are not downloads (decided 2026-11-07). The license texts
  // of the MIT palettes stay at /palette-data/licenses.txt.
  for (const id of ["japanese", "world", "tailwind", "nord"])
    expect((await request.get(`/palette-data/${id}.json`)).status()).toBe(404);
  expect((await request.get("/palette-data/licenses.txt")).ok()).toBe(true);
  const sitemap = await (await request.get("/sitemap-0.xml")).text();
  expect(sitemap).not.toMatch(/\/(palette|colors)\//);
  for (const lang of ["ja", "en"])
    for (const [, slug] of PALETTES) {
      const html = await (await request.get(paletteUrl(lang, slug))).text();
      expect(html).toContain('name="robots" content="noindex, follow"');
    }
  for (const [from, to] of [
    ["/palette", "/palette/japanese"],
    ["/colors/", "/palette/japanese"],
    ["/palette-preview", "/palette/japanese"],
    ["/en/palette-preview", "/en/palette/japanese"],
  ]) {
    const response = await request.get(from, { maxRedirects: 0 });
    expect(response.status(), from).toBe(301);
    expect(new URL(response.headers().location, "http://x").pathname).toBe(to);
  }
});

for (const lang of ["ja", "en"])
  test(
    lang + ": selected colors preview as light and dark UI",
    async ({ page }) => {
      await open(page, paletteUrl(lang, "nord"));
      await page.locator("[data-color-id=nord8]").click();
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
      ).toHaveCSS("background-color", "rgb(136, 192, 208)");
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
        "rgb(136, 192, 208)",
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
  await open(page, "/palette/japanese");
  const red = page.locator("#palette-japanese-R");
  await expect(red.locator(".palette-swatch")).toHaveCount(60);
  const swatches = red.locator(".palette-swatch");
  await expect(swatches.first()).toHaveAttribute("aria-label", /#F4DEDF$/);
  await expect(swatches.last()).toHaveAttribute("aria-label", /#640125$/);
  // Named colors show their reading, not their HEX, under the name.
  await expect(swatches.first().locator(".palette-color-reading")).toHaveText(
    "さくらいろ",
  );
  await expect(swatches.first()).toHaveAttribute("href", "/colors/sakura");
  await red.evaluate((element) => element.scrollIntoView({ block: "start" }));
  await page.screenshot({ path: "test-results/hue-order.png" });
});

for (const lang of ["ja", "en"])
  test(`${lang}: a named color's page shows its name, values and source`, async ({
    page,
    context,
    baseURL,
  }) => {
    await grantClipboard(context, baseURL);
    await open(page, `${prefix(lang)}/colors/shinbashi`);
    // The color fills the top of the page; the site's header is hidden.
    await expect(page.locator("header")).toBeHidden();
    const hero = page.locator(".palette-color-hero");
    await expect(hero).toHaveCSS("background-color", "rgb(91, 172, 184)");
    // SHINBASHI / 新橋色 / しんばしいろ in both languages.
    await expect(page.locator("h1")).toHaveText("新橋色");
    await expect(hero.locator(".palette-color-latin")).toHaveText("Shinbashi");
    await expect(hero.locator(".palette-color-latin")).toHaveCSS(
      "text-transform",
      "uppercase",
    );
    await expect(hero.locator(".palette-color-kana")).toHaveText(
      "しんばしいろ",
    );
    const back = hero.locator(".palette-color-back");
    await expect(back).toHaveAttribute("href", paletteUrl(lang, "japanese"));
    for (const [label, value] of [
      ["HEX", "#5BACB8"],
      ["RGB", "rgb(91, 172, 184)"],
      ["HSV", "187.7°, 50.5%, 72.2%"],
      [
        lang === "ja" ? "マンセル（近似換算）" : "Munsell (approx.)",
        "3B 6.5/5.5",
      ],
    ])
      await expect(
        page.getByRole("textbox", { name: label, exact: true }),
      ).toHaveValue(value);
    await page.getByRole("button", { name: /^(コピー|Copy) RGB$/ }).click();
    expect(await readClipboard(page)).toBe("rgb(91, 172, 184)");
    await expect(
      page
        .locator(".palette-reference-badges > span")
        .filter({ hasText: "JIS" }),
    ).toHaveCount(1);
    await expect(page.locator(".palette-demo-card")).toHaveCount(2);
    await expect(page.locator("#palette-color-about")).toHaveText(
      lang === "ja" ? "この色について" : "About this color",
    );
    const hex = page.locator(".palette-color-body .palette-open-hex");
    await expect(hex).toHaveText(
      lang === "ja" ? "Just HEXで開く" : "Open in Just HEX",
    );
    await expect(hex).toHaveAttribute("href", `${prefix(lang)}/hex/5BACB8`);
    await expect(hex).toHaveAttribute("target", "_blank");
    const html = await (
      await page.request.get(`${prefix(lang)}/colors/shinbashi`)
    ).text();
    expect(html).toContain('name="robots" content="noindex, follow"');
    expect(html).toContain(
      `rel="canonical" href="https://unlibra.com${prefix(lang)}/colors/shinbashi"`,
    );
    expect(html).toContain('"@type":"BreadcrumbList"');
    expect(await hasHorizontalScroll(page)).toBe(false);
    await back.click();
    await expect(page).toHaveURL(
      new RegExp(`${paletteUrl(lang, "japanese")}$`),
    );
  });

test("a world-only color goes back to world colors", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await open(page, "/colors/salmon-pink");
  await expect(page.locator("h1")).toHaveText("サーモンピンク");
  await expect(page.locator(".palette-color-latin")).toHaveText("salmon pink");
  // A katakana name is its own reading.
  await expect(page.locator(".palette-color-kana")).toHaveCount(0);
  await expect(page.locator(".palette-color-back")).toHaveAttribute(
    "href",
    "/palette/world",
  );
  expect(await hasHorizontalScroll(page)).toBe(false);
  await page.screenshot({
    path: "test-results/color-page-mobile.png",
    fullPage: true,
  });
});

test("a named color opens in place with a flood and goes back into its swatch", async ({
  page,
}) => {
  await open(page, "/palette/japanese");
  const swatch = page.locator('a.palette-swatch[data-slug="shinbashi"]');
  await swatch.scrollIntoViewIfNeeded();
  const listScroll = await page.evaluate(() => scrollY);
  // The flood: a layer of the color grows from the swatch.
  const flood = page.waitForSelector('[data-palette-flood="out"]', {
    state: "attached",
  });
  await swatch.click();
  expect(await (await flood).evaluate((layer) => layer.style.background)).toBe(
    "rgb(91, 172, 184)",
  );
  // The color's page comes in place, at its own address.
  await expect(page).toHaveURL(/\/colors\/shinbashi$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("新橋色");
  await expect(page.locator(".palette-color-hero")).toHaveCSS(
    "background-color",
    "rgb(91, 172, 184)",
  );
  await expect(page.locator("header")).toBeHidden();
  await expect(page.locator("[data-palette-intro]").first()).toBeHidden();
  await expect(page).toHaveTitle(/^新橋色のカラーコード #5BACB8 - 色見本帳 - /);
  await expect(page.locator("[data-palette-flood]")).toHaveCount(0);
  // Back: the color shrinks into its swatch, the list is where it was.
  await page.locator(".palette-color-back").click();
  await expect(page).toHaveURL(/\/palette\/japanese$/);
  await expect(page.locator(".palette-color-page")).toHaveCount(0);
  await expect(swatch).toBeVisible();
  await expect(page.locator("[data-palette-flood]")).toHaveCount(0);
  expect(await page.evaluate(() => scrollY)).toBe(listScroll);
  // Forward again shows the color without a flood.
  await page.goForward();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("新橋色");
  await page.goBack();
  await expect(page.locator(".palette-color-page")).toHaveCount(0);
});

test("with reduced motion, a named color opens without the flood", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page, "/en/palette/world");
  await page.locator('a.palette-swatch[data-slug="salmon-pink"]').click();
  await expect(page).toHaveURL(/\/en\/colors\/salmon-pink$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "サーモンピンク",
  );
  await expect(page.locator("[data-palette-flood]")).toHaveCount(0);
  await expect(page.locator(".palette-color-back")).toHaveText(
    "Back to World colors",
  );
});

test("a modified click opens the color's own page", async ({
  page,
  context,
}) => {
  await open(page, "/palette/japanese");
  const [tab] = await Promise.all([
    context.waitForEvent("page"),
    page
      .locator('a.palette-swatch[data-slug="sakura"]')
      .click({ modifiers: ["Control"] }),
  ]);
  // The new tab starts at about:blank: wait for its own page.
  await tab.waitForURL("**/colors/sakura");
  await expect(page.locator(".palette-color-page")).toHaveCount(0);
});

test("every screen shows the color and just the first heading below it", async ({
  page,
}) => {
  for (const [width, height] of [
    [375, 667],
    [1280, 800],
    [1920, 960],
  ]) {
    await page.setViewportSize({ width, height });
    await open(page, "/colors/shinbashi");
    const box = (locator) =>
      locator.evaluate((element) => {
        const { top, bottom } = element.getBoundingClientRect();
        return { top, bottom };
      });
    const hero = await box(page.locator(".palette-color-hero"));
    expect(hero.bottom, `${width}x${height}`).toBe(height - 80);
    const heading = await box(page.locator("#palette-color-values"));
    expect(heading.bottom, `${width}x${height}`).toBeLessThanOrEqual(height);
    const values = await box(page.locator(".palette-color-values"));
    expect(values.top, `${width}x${height}`).toBeGreaterThan(height);
  }
});

test("a palette's link switches the palette in place, with history", async ({
  page,
}) => {
  await open(page, "/palette/japanese");
  // The page does not load again: a mark on the window stays.
  await page.evaluate(() => (window.__samePage = true));
  await page.locator("[data-collection=world]").click();
  await expect(page).toHaveURL(/\/palette\/world$/);
  await expect(page.locator(".palette-section-intro h2")).toHaveText(
    "世界の色（519）",
  );
  await expect(page.locator("a.palette-swatch")).toHaveCount(519);
  await expect(
    page.locator(".palette-collections [aria-current=page]"),
  ).toHaveAttribute("data-collection", "world");
  await expect(page).toHaveTitle(/^世界の色 - 色見本帳 - /);
  await expect(
    page.locator('[data-palette-intro] nav [aria-current="page"]'),
  ).toHaveText("世界の色");
  // A palette with the inspector, then back and forward.
  await page.locator("[data-collection=nord]").click();
  await expect(page).toHaveURL(/\/palette\/nord$/);
  await expect(page.locator(".palette-inspector")).toBeVisible();
  await expect(page.locator(".palette-swatch")).toHaveCount(16);
  await page.goBack();
  await expect(page).toHaveURL(/\/palette\/world$/);
  await expect(page.locator("a.palette-swatch")).toHaveCount(519);
  await page.goBack();
  await expect(page).toHaveURL(/\/palette\/japanese$/);
  await expect(page.locator("a.palette-swatch")).toHaveCount(299);
  await page.goForward();
  await expect(page.locator("a.palette-swatch")).toHaveCount(519);
  expect(await page.evaluate(() => window.__samePage)).toBe(true);
  // A color opened on the switched palette comes back to it.
  await page.locator('a.palette-swatch[data-slug="salmon-pink"]').click();
  await expect(page).toHaveURL(/\/colors\/salmon-pink$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/palette\/world$/);
  await expect(page.locator(".palette-color-page")).toHaveCount(0);
  await expect(page.locator("a.palette-swatch")).toHaveCount(519);
  // The language switch leads to the palette shown now.
  const english = page.locator("[data-language-option][hreflang=en]");
  await expect(english).toHaveAttribute("href", "/en/palette/world");
});

test("a hue link on a switched palette stays on that palette", async ({
  page,
}) => {
  await open(page, "/palette/japanese");
  await page.locator("[data-collection=world]").click();
  await expect(page.locator("a.palette-swatch")).toHaveCount(519);
  // The link adds an entry with no state; it must not bring back the page's
  // own palette (Japanese colors).
  await page.locator('.palette-hue-nav a[href$="-B"]').click();
  await expect(page).toHaveURL(/\/palette\/world#palette-world-B$/);
  await expect(page.locator("a.palette-swatch")).toHaveCount(519);
  await expect(page.locator("#palette-world-B h3")).toBeInViewport();
  await expect(page).toHaveTitle(/^世界の色 - 色見本帳 - /);
  // Back and forward through the hue entry keep the world colors.
  await page.goBack();
  await expect(page.locator("a.palette-swatch")).toHaveCount(519);
  await page.goForward();
  await expect(page.locator("a.palette-swatch")).toHaveCount(519);
});

test("a Japanese color opened from the world colors goes back to them on its own page too", async ({
  page,
}) => {
  const back = page.locator(".palette-color-back");
  // Opened in place, then reloaded: the history entry knows the palette.
  await open(page, "/palette/world");
  await page.locator('a.palette-swatch[data-slug="shinbashi"]').click();
  await expect(page).toHaveURL(/\/colors\/shinbashi$/);
  await expect(back).toHaveText("世界の色に戻る");
  await page.reload();
  await expect(back).toHaveText("世界の色に戻る");
  await expect(back).toHaveAttribute("href", "/palette/world");
  // Opened in a new tab from the world colors: the referrer tells.
  await page.goto("/colors/shinbashi", {
    referer: new URL("/palette/world", page.url()).href,
  });
  await expect(back).toHaveText("世界の色に戻る");
  // Opened by itself (a new page, no history or referrer): a Japanese color
  // goes back to the Japanese colors.
  const alone = await page.context().newPage();
  await alone.goto("/colors/shinbashi");
  const aloneBack = alone.locator(".palette-color-back");
  await expect(aloneBack).toHaveText("日本の色に戻る");
  await expect(aloneBack).toHaveAttribute("href", "/palette/japanese");
});

test("a rail of hue dots beside the named colors goes to each hue and marks the current one", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page, "/palette/japanese");
  const rail = page.locator(".palette-hue-rail");
  const groups = page.locator(".palette-grid-japanese .palette-group");
  // One link per hue group; hidden until the groups fill the middle of the
  // screen.
  await expect(rail.locator("a")).toHaveCount(await groups.count());
  await expect(rail).not.toHaveAttribute("data-shown");
  await page.locator("#palette-japanese-Y").scrollIntoViewIfNeeded();
  await page.evaluate(() => scrollBy(0, 200));
  await expect(rail).toHaveAttribute("data-shown");
  await expect(rail).toBeVisible();
  // The hue at the middle of the screen is the one current link, a capsule.
  const yellow = rail.locator('a[href="#palette-japanese-Y"]');
  await expect(yellow).toHaveAttribute("aria-current", "location");
  await expect(rail.locator("a[aria-current]")).toHaveCount(1);
  const dot = (link) => link.evaluate((e) => [e.offsetWidth, e.offsetHeight]);
  await expect.poll(() => dot(yellow)).toEqual([12, 28]);
  expect(await dot(rail.locator('a[href="#palette-japanese-R"]'))).toEqual([
    12, 12,
  ]);
  // A click goes to that hue; its name shows on hover.
  const blue = rail.locator('a[href="#palette-japanese-B"]');
  await expect(blue).toHaveAttribute("aria-label", /^青（\d+）$/);
  await blue.hover();
  await expect(blue.locator(".palette-hue-rail-name")).toBeVisible();
  // The tooltip names the hue only; the count is read out.
  await expect(blue.locator(".palette-hue-rail-name")).toHaveText("青");
  // Each dot is a 24x24px target (DESIGN.md 5.4).
  expect(
    await blue.evaluate((e) => {
      const s = getComputedStyle(e, "::before");
      return [
        e.offsetWidth - parseFloat(s.left) - parseFloat(s.right),
        e.offsetHeight - parseFloat(s.top) - parseFloat(s.bottom),
      ];
    }),
  ).toEqual([24, 24]);
  await blue.click();
  await expect(page.locator("#palette-japanese-B h3")).toBeInViewport();
  await expect(blue).toHaveAttribute("aria-current", "location");
});
