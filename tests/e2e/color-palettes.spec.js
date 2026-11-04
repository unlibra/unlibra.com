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
    await expect(page.locator(".palette-swatch")).toHaveCount(264);
    await expect(page.locator("[data-collection]")).toHaveCount(9);
    await expect(page.locator("[data-collection=wada]")).toHaveCount(0);
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
    const pantone = page.locator(".palette-collections .palette-official-link");
    await expect(pantone).toBeVisible();
    await expect(pantone).toHaveText("PANTONE");
    await expect(pantone).toHaveAttribute("target", "_blank");
    await expect(pantone).not.toHaveAttribute("aria-pressed");
    await expect(page.locator(".palette-pantone")).toHaveCount(0);
    await expect(pantone).toHaveAttribute(
      "href",
      "https://www.pantone.com/na/en-us/color-finder",
    );
    await expect(pantone).toHaveAttribute("rel", "noopener noreferrer");
  });
}

for (const lang of ["ja", "en"]) {
  test(`${lang}: additional palettes support variants, copy, and source attribution`, async ({
    page,
    context,
    baseURL,
  }) => {
    await grantClipboard(context, baseURL);
    await open(
      page,
      lang === "ja" ? "/palette-preview" : "/en/palette-preview",
    );
    const cases = [
      {
        id: "radix",
        count: 372,
        query: "blue-9",
        value: "#0090FF",
        variant: "Dark",
        nextValue: "#0090FF",
        path: "radix-ui/colors",
        groups: 31,
      },
      {
        id: "catppuccin",
        count: 26,
        query: "Rosewater",
        value: "#DC8A78",
        variant: "Mocha",
        nextValue: "#F5E0DC",
        path: "catppuccin/palette",
        groups: 1,
      },
      {
        id: "dracula",
        count: 12,
        query: "Purple",
        value: "#BD93F9",
        variant: "Alucard",
        nextValue: "#644AC9",
        path: "dracula/dracula-theme",
        groups: 1,
      },
      {
        id: "open-color",
        count: 132,
        query: "blue-5",
        value: "#339AF0",
        path: "yeun/open-color",
        groups: 14,
      },
    ];
    for (const item of cases) {
      await page.locator(`[data-collection="${item.id}"]`).click();
      await expect(page.locator(".palette-swatch")).toHaveCount(item.count);
      await expect(page.locator(".palette-group")).toHaveCount(item.groups);
      await page.locator(".palette-search input").fill(item.query);
      await expect(page.locator(".palette-swatch")).toHaveCount(1);
      await page.locator(".palette-swatch").click();
      await expect(
        page.locator(".palette-inspector .palette-value"),
      ).toHaveValue(item.value);
      if (item.variant) {
        await page
          .locator(".palette-variants")
          .getByRole("button", { name: item.variant, exact: true })
          .click();
        await expect(
          page.locator(".palette-swatch[aria-pressed=true]"),
        ).toHaveCount(1);
        await expect(
          page.locator(".palette-inspector .palette-value"),
        ).toHaveValue(item.nextValue);
      }
      await page.locator(".palette-copy-row button").click();
      expect(await readClipboard(page)).toBe(item.nextValue ?? item.value);
      await expect(page.locator(".palette-color-source")).toHaveAttribute(
        "href",
        new RegExp(`${item.path}/blob/[a-f0-9]{40}/`),
      );
      await page.locator(".palette-sources summary").click();
      await expect(
        page.locator(
          `.palette-source-body a[href="/palette-data/${item.id}.json"]`,
        ),
      ).toBeVisible();
      await expect(
        page.locator(
          `.palette-source-body a[href="/palette-data/licenses.txt#${item.id}"]`,
        ),
      ).toBeVisible();
    }
    // Returning to a collection resets its variant and selects a visible color.
    await page.locator("[data-collection=catppuccin]").click();
    await expect(
      page.locator(".palette-variants button[aria-pressed=true]"),
    ).toHaveText("Latte");
    await expect(
      page.locator(".palette-swatch[aria-pressed=true]"),
    ).toHaveCount(1);
  });
}

for (const lang of ["ja", "en"]) {
  test(`${lang}: JIS examples distinguish reference HEX and Munsell notation`, async ({
    page,
    context,
    baseURL,
  }) => {
    await grantClipboard(context, baseURL);
    await open(
      page,
      lang === "ja" ? "/palette-preview" : "/en/palette-preview",
    );
    await page.locator("[data-collection=jis]").click();
    await expect(page.locator(".palette-swatch")).toHaveCount(267);
    await expect(
      page
        .locator(".palette-browser > .palette-help")
        .filter({ hasText: "Wikipedia" }),
    ).toContainText("Wikipedia");
    await page.locator(".palette-search input").fill("2.5B 6.5/5.5");
    await expect(page.locator(".palette-swatch")).toHaveCount(1);
    await page.locator(".palette-swatch").click();
    await expect(page.locator(".palette-inspector .palette-value")).toHaveValue(
      "#69AAC6",
    );
    await page
      .locator(".palette-format")
      .getByRole("button", {
        name: lang === "ja" ? "マンセル" : "Munsell",
        exact: true,
      })
      .click();
    await expect(page.locator(".palette-inspector .palette-value")).toHaveValue(
      "2.5B 6.5/5.5",
    );
    await page.locator(".palette-copy-row button").click();
    expect(await readClipboard(page)).toBe("2.5B 6.5/5.5");
    await expect(page.locator(".palette-open-hex")).toHaveAttribute(
      "href",
      `${lang === "en" ? "/en" : ""}/hex/69AAC6`,
    );
    await page.locator("[data-collection=nord]").click();
    await expect(page.locator(".palette-inspector .palette-value")).toHaveValue(
      "#2E3440",
    );
    await expect(page.locator(".palette-format button")).toHaveCount(2);
  });
}

test("mobile: JIS Munsell notation can be copied from the dock", async ({
  page,
  context,
  baseURL,
}) => {
  await grantClipboard(context, baseURL);
  await page.setViewportSize({ width: 375, height: 800 });
  await open(page, "/palette-preview");
  await page.locator("[data-collection=jis]").click();
  await page.locator(".palette-search input").fill("新橋");
  await page.locator(".palette-swatch").click();
  const dock = page.locator(".palette-mobile-inspector");
  await dock.getByRole("combobox").selectOption("Munsell");
  await expect(dock.locator("input")).toHaveValue("2.5B 6.5/5.5");
  await dock.getByRole("button").click();
  expect(await readClipboard(page)).toBe("2.5B 6.5/5.5");
});

for (const width of [375, 1280]) {
  for (const theme of ["light", "dark"]) {
    test(`${width}px ${theme}: responsive palettes and touch targets`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      await open(page, "/palette-preview");
      for (const collection of [
        "japanese",
        "world",
        "jis",
        "tailwind",
        "nord",
        "radix",
        "catppuccin",
        "dracula",
        "open-color",
      ]) {
        await page.locator(`[data-collection=${collection}]`).click();
        expect(await hasHorizontalScroll(page)).toBe(false);
        const targets = await page
          .locator(".palette-app button:visible, .palette-collections a")
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
        for (const variant of await page
          .locator(".palette-variants button")
          .all()) {
          await variant.click();
          expect(await hasHorizontalScroll(page)).toBe(false);
          await expect(
            page.locator(".palette-swatch[aria-pressed=true]"),
          ).toHaveCount(1);
        }
        if (["catppuccin", "dracula", "jis"].includes(collection)) {
          await page.screenshot({
            path: `test-results/${collection}-${width}-${theme}.png`,
          });
        }
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
    ["japanese", 264, "CC-BY-SA-4.0"],
    ["world", 463, "CC-BY-SA-4.0"],
    ["jis", 267, "CC-BY-SA-4.0"],
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
  const sitemap = await (await request.get("/sitemap-0.xml")).text();
  expect(sitemap).not.toContain("palette-preview");
  const page = await (await request.get("/palette-preview")).text();
  expect(page).toContain('name="robots" content="noindex, follow"');
});

test("world colors include every Japanese color and preserve the selected color", async ({
  page,
}) => {
  await open(page, "/palette-preview");
  const swatches = page.locator(".palette-swatch");
  const japaneseIds = await swatches.evaluateAll((items) =>
    items.map((item) => item.dataset.colorId),
  );
  await page.locator(".palette-search input").fill("しんばし");
  await swatches.click();
  await page.locator("[data-collection=world]").click();
  await expect(swatches).toHaveCount(463);
  await expect(page.locator(".palette-inspector .palette-value")).toHaveValue(
    "#59B9C6",
  );
  const worldIds = new Set(
    await swatches.evaluateAll((items) =>
      items.map((item) => item.dataset.colorId),
    ),
  );
  expect(japaneseIds.every((id) => worldIds.has(id))).toBe(true);
  await page.locator(".palette-search input").fill("baby pink");
  await expect(swatches).toHaveCount(1);
  await swatches.click();
  await expect(page.locator(".palette-inspector .palette-value")).toHaveValue(
    "#FEE3D7",
  );
  await expect(page.locator(".palette-name-references")).toContainText("JIS");
  await expect(page.locator(".palette-name-references")).toContainText("DIC");
  await page.locator("[data-collection=japanese]").click();
  await page.locator(".palette-search input").fill("baby pink");
  await expect(swatches).toHaveCount(0);
  await page.locator(".palette-search input").fill("藍海松茶");
  await expect(swatches).toHaveCount(1);
  await swatches.click();
  await expect(page.locator(".palette-name-references a")).toHaveCount(1);
  await expect(page.locator(".palette-name-references a")).toContainText(
    "和田三造",
  );
  await expect(page.locator(".palette-name-references a")).toHaveAttribute(
    "href",
    /ndlsearch\.ndl\.go\.jp/,
  );
});
