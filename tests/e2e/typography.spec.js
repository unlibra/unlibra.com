// E2E: font sizes and line heights (ui-revise7 5, 6, 7).
//
// Every visible piece of text on the pages is checked against the rule of
// ui-revise7 6: the line height is the smallest multiple of 4px that is at
// least the size times the DADS ratio of the text's role. The role is read
// from the page: headings (h1-h6) 1.5 (1.4 from 36px), monospace 1.5, text
// in more than one line (text to read) 1.7, and one-line labels at least
// Dense 1.3 (a one-line paragraph may keep the line height of its text);
// 14px text in one line is a label, in more lines text to read.
// No text is smaller than 14px, and monospace is 14-16px (ui-revise7 5).
import { readFileSync } from "node:fs";

import { expect, test } from "@playwright/test";

import { layoutMessages } from "../../src/messages/layout.ts";
import { chooseFile, LOCALES, open, pngFile, toolUrl } from "./helpers.js";

const TOOLS = ["favicon-generator", "svg-optimizer", "password-generator"];

/** The text under `selector` that breaks the rule, as readable lines. */
const typographyErrors = (page, selector = "body") =>
  page.evaluate((selector) => {
    const minimum = (ratio, size) => Math.ceil((ratio * size) / 4 - 1e-9) * 4;
    const errors = [];
    const roots = [...document.querySelectorAll(selector)];
    for (const element of roots.flatMap((root) => [
      root,
      ...root.querySelectorAll("*"),
    ])) {
      if (element.closest("svg, script, style, template")) continue;
      const texts = [...element.childNodes].filter(
        (node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim(),
      );
      // Form fields show their value (or placeholder) without a text node
      // (review of ui-revise7): one line, checked as a label.
      const field = element.matches(
        "input:not([type=range], [type=checkbox], [type=radio], [type=file], [type=color], [type=hidden]), select, textarea",
      );
      if (texts.length === 0 && !field) continue;
      if (!element.checkVisibility({ visibilityProperty: true })) continue;
      const box = element.getBoundingClientRect();
      if (box.width <= 1 || box.height <= 1) continue; // sr-only
      const style = getComputedStyle(element);
      const size = parseFloat(style.fontSize);
      const lineHeight = parseFloat(style.lineHeight); // NaN for "normal"
      // The lines of the element's own text.
      const tops = [];
      for (const text of texts) {
        const range = document.createRange();
        range.selectNodeContents(text);
        for (const rect of range.getClientRects()) {
          if (rect.width < 1) continue;
          if (!tops.some((top) => Math.abs(top - rect.top) < size / 2)) {
            tops.push(rect.top);
          }
        }
      }
      const mono = style.fontFamily.startsWith('"DM Mono"');
      const heading = !!element.closest("h1, h2, h3, h4, h5, h6");
      const lines = field ? 1 : tops.length;
      // 14px is for supplementary text: a heading in 14px (the footer's
      // group names) is a label too.
      const [role, ratio, exact] =
        heading && size > 14
          ? ["heading", size >= 36 ? 1.4 : 1.5, true]
          : mono
            ? ["mono", 1.5, true]
            : lines > 1
              ? ["text", 1.7, true]
              : ["label", 1.3, false];
      const min = minimum(ratio, size);
      const label = `${element.tagName.toLowerCase()} "${(field
        ? element.value || element.placeholder
        : element.textContent
      )
        .trim()
        .slice(
          0,
          30,
        )}" (${role}, ${size}px/${style.lineHeight}, ${lines} lines)`;
      if (size < 14) errors.push(`${label}: smaller than 14px`);
      if (mono && (size < 14 || size > 16)) {
        errors.push(`${label}: monospace outside 14-16px`);
      }
      if (!(lineHeight % 4 === 0)) {
        errors.push(`${label}: not a multiple of 4px`);
      } else if (exact ? lineHeight !== min : lineHeight < min) {
        errors.push(`${label}: expected ${exact ? "" : "at least "}${min}px`);
      }
    }
    return errors;
  }, selector);

for (const width of [375, 1280]) {
  test.describe(`${width}px: ui-revise7 5, 6: the pages other than the top page`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
    });

    for (const locale of LOCALES) {
      for (const tool of TOOLS) {
        test(`${toolUrl(locale, tool)}`, async ({ page }) => {
          await open(page, toolUrl(locale, tool));
          expect(await typographyErrors(page)).toEqual([]);
        });
      }
    }

    test("the SVG Optimizer and the Favicon Generator with a file", async ({
      page,
    }) => {
      const [ja] = LOCALES;
      await open(page, toolUrl(ja, "svg-optimizer"));
      await chooseFile(page, {
        name: "icon.svg",
        mimeType: "image/svg+xml",
        buffer: readFileSync(
          new URL("../fixtures/svg-optimizer/icon.svg", import.meta.url),
        ),
      });
      await expect(
        page.getByText(`${ja.t.svgOptimizer.optimized}:`),
      ).toBeVisible();
      expect(await typographyErrors(page)).toEqual([]);

      await open(page, toolUrl(ja, "favicon-generator"));
      await chooseFile(page, await pngFile("logo.png", 300, 200));
      await expect(page.locator("img[alt]").first()).toBeVisible();
      expect(await typographyErrors(page)).toEqual([]);
    });

    for (const path of ["/credits", "/donate", "/privacy", "/no-such-page"]) {
      test(path, async ({ page }) => {
        await page.goto(path);
        expect(await typographyErrors(page)).toEqual([]);
      });
    }
  });

  test.describe(`${width}px: ui-revise7 6, 7: the top page, the header, the footer and the dialogs`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await open(page, "/");
    });

    test("the top page", async ({ page }) => {
      expect(await typographyErrors(page)).toEqual([]);
    });

    test("a work's dialog", async ({ page }) => {
      await page
        .getByRole("button", { name: "fosty dark 詳しく見る", exact: true })
        .click();
      const dialog = page.locator("dialog[open]");
      await expect(dialog).toBeVisible();
      expect(await typographyErrors(page, "dialog[open]")).toEqual([]);
    });

    test("the language and theme menus, and the mobile menu", async ({
      page,
    }) => {
      const t = layoutMessages.ja;
      // The theme menu (the top page has no other language).
      await page.getByRole("button", { name: t.theme.toggle }).click();
      await expect(page.locator("#theme-menu")).toBeVisible();
      expect(await typographyErrors(page, "header")).toEqual([]);
      await page.keyboard.press("Escape");
      if (width < 1024) {
        await page.getByRole("button", { name: t.header.openMenu }).click();
        await expect(page.locator("dialog[open]")).toBeVisible();
        expect(await typographyErrors(page, "dialog[open]")).toEqual([]);
      }
    });
  });
}

test("ui-revise7 6, 7: the language menu of a tool page", async ({ page }) => {
  for (const width of [375, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await open(page, "/lab/password-generator");
    await page
      .getByRole("button", { name: layoutMessages.ja.language.toggle })
      .click();
    await expect(page.locator("#language-menu")).toBeVisible();
    expect(await typographyErrors(page, "header")).toEqual([]);
  }
});

test("ui-revise7 7 (review): the logotypes keep 28px lines, so the header, the footer and the mobile menu keep their heights", async ({
  page,
}) => {
  // "unlibra" in 20px is a one-line label (Dense 1.3 -> 28px), not a
  // heading: text-xl's 32px would make the footer and the mobile menu 4px
  // taller, which the user did not approve.
  const logotypes = async () =>
    page
      .locator("[data-logotype]")
      .evaluateAll((elements) =>
        elements
          .filter((e) => e.checkVisibility())
          .map((e) => [
            getComputedStyle(e).fontSize,
            getComputedStyle(e).lineHeight,
            e.getBoundingClientRect().height,
          ]),
      );
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page, "/");
  // The header's and the footer's.
  expect(await logotypes()).toEqual([
    ["20px", "28px", 28],
    ["20px", "28px", 28],
  ]);
  await page.setViewportSize({ width: 375, height: 900 });
  await page
    .getByRole("button", { name: layoutMessages.ja.header.openMenu })
    .click();
  await expect(page.locator("dialog[open]")).toBeVisible();
  expect(await logotypes()).toEqual([
    ["20px", "28px", 28],
    ["20px", "28px", 28],
    ["20px", "28px", 28],
  ]);
});

test("ui-revise7 8': the icons are Tabler Icons (outline, stroke 2), hidden from assistive technology", async ({
  page,
}) => {
  for (const path of [
    "/",
    "/lab/password-generator",
    "/lab/svg-optimizer",
    "/lab/favicon-generator",
  ]) {
    await open(page, path);
    const icons = await page.locator("svg").evaluateAll((svgs) =>
      svgs
        .filter((svg) => !svg.closest("[data-planet]"))
        .map((svg) => ({
          name:
            svg.dataset.icon ??
            [...svg.classList].find((c) => c.startsWith("tabler-icon-")),
          hidden: svg.getAttribute("aria-hidden"),
          stroke: svg.getAttribute("stroke-width"),
        })),
    );
    expect(icons.length, path).toBeGreaterThan(0);
    for (const icon of icons) {
      // The wave of the hero and the GitHub mark are not icons of a set.
      if (icon.name === undefined || icon.name === "github") continue;
      expect(icon, path).toEqual({ ...icon, hidden: "true", stroke: "2" });
    }
    expect(
      icons.filter((i) => i.name?.startsWith("tabler-icon-")).length > 0 ||
        path === "/",
      path,
    ).toBe(true);
  }
});
