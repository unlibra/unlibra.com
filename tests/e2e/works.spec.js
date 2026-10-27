// E2E: the top page's cards and their detail dialogs, the footer's Links
// group, the brand font and the page width (ui-revise2 2, 3, 4).
import { expect, test } from "@playwright/test";

import { chooseTheme, hasHorizontalScroll, open } from "./helpers.js";

/** A work's card on the top page. */
const card = (page, id) => page.locator(`article[data-work="${id}"]`);
/** A work's detail dialog. */
const dialog = (page, name) => page.getByRole("dialog", { name, exact: true });
/** A card's title control: the details button or the link (ui-revise4 2). */
const titleControl = (item) => item.locator("[data-work-title] :is(a, button)");

/**
 * The DIY keyboards without a description, with their titles: their cards
 * open the photo alone, without 詳しく見る (the cover and prototypes).
 */
const PHOTO_ONLY = [
  ["keyboards-cover", "まっさらなエンドゲーム"],
  ["prototypes", "prototypes"],
];

test.describe("detail dialog", () => {
  test("a click anywhere on a card opens its details; Escape closes them", async ({
    page,
  }) => {
    await open(page, "/");
    const details = dialog(page, "fosty dark");
    await expect(details).toBeHidden();
    // Not on the title: on the summary (the title button's overlay covers
    // the card, so this is a click at the summary's place).
    const summaryText = card(page, "fosty-dark").locator("[data-work-summary]");
    await summaryText.scrollIntoViewIfNeeded();
    const summary = await summaryText.boundingBox();
    await page.mouse.click(summary.x + 5, summary.y + summary.height / 2);
    await expect(details).toBeVisible();
    await expect(details).toContainText("fosty naturalのアナザーカラー。");
    // The page behind does not scroll while the dialog is open.
    await expect
      .poll(() =>
        page.evaluate(
          () => getComputedStyle(document.documentElement).overflow,
        ),
      )
      .toBe("hidden");

    await page.keyboard.press("Escape");
    await expect(details).toBeHidden();
    // Focus goes back to the card's button.
    await expect(
      card(page, "fosty-dark").getByRole("button", { name: "fosty dark" }),
    ).toBeFocused();
  });

  test("Enter on the focused title opens the details; the backdrop and the close button close them", async ({
    page,
  }) => {
    await open(page, "/");
    const button = card(page, "mira-zero").getByRole("button", {
      name: "mira zero",
    });
    await expect(button).toHaveAttribute("aria-haspopup", "dialog");
    const details = dialog(page, "mira zero");

    await button.focus();
    await page.keyboard.press("Enter");
    await expect(details).toBeVisible();
    // A click inside the details keeps them open.
    await details
      .getByText("はじめて基板から自作した初号機", { exact: false })
      .click();
    await expect(details).toBeVisible();
    // A click on the backdrop (the corner of the window) closes them.
    await page.mouse.click(5, 5);
    await expect(details).toBeHidden();

    await button.focus();
    await page.keyboard.press("Enter");
    await details.getByRole("button", { name: "閉じる" }).click();
    await expect(details).toBeHidden();
  });

  test("ui-revise4 2: every card is clickable as a whole; only the DIY Keyboards with details say 詳しく見る", async ({
    page,
  }) => {
    await open(page, "/");
    const cards = page.locator("article[data-work]");
    // 13 since ui-revise8 4 (@i18n-tiny/react), 12 since remove-tw-palette,
    // 13 with Just HEX, 14 with the cover of DIY Keyboards, 16 with xoyo and
    // xoyo plus.
    await expect(cards).toHaveCount(16);
    for (const article of await cards.all()) {
      const id = await article.getAttribute("data-work");
      // The cover and prototypes open their photo alone (their own test
      // below): no 詳しく見る.
      const photoOnly = PHOTO_ONLY.some(([work]) => work === id);
      const keyboard =
        !photoOnly && (await article.locator("button").count()) > 0;
      const more = article.locator("[data-work-more]");
      if (keyboard) {
        await expect(more, id).toHaveText("詳しく見る");
        await expect(more.locator("svg"), id).toHaveCount(0);
      } else {
        await expect(more, id).toHaveCount(0);
      }
      // The title control's overlay takes clicks on the whole card.
      const hit = await article.evaluate((element) => {
        const box = element.getBoundingClientRect();
        element.scrollIntoView({ block: "center" });
        const after = element.getBoundingClientRect();
        const target = document.elementFromPoint(
          after.x + after.width / 2,
          after.y + after.height - 4,
        );
        return [
          box.width > 0,
          target?.closest("[data-work-open], [data-work-link]") !== null,
          target ? getComputedStyle(target).cursor : null,
        ];
      });
      expect(hit, id).toEqual([true, true, "pointer"]);
    }
    // Every DIY keyboard opens a dialog: the details, or the photo alone.
    await expect(page.locator("dialog[data-work-dialog]")).toHaveCount(7);
    await expect(page.locator("#keyboards button[data-work-open]")).toHaveCount(
      7,
    );
  });

  for (const [id, title] of PHOTO_ONLY) {
    test(`the ${id} card opens its photo alone, without 詳しく見る; its title names the dialog for screen readers only`, async ({
      page,
    }) => {
      await open(page, "/");
      const item = card(page, id);
      await expect(item.getByRole("link")).toHaveCount(0);
      await expect(item.locator("[data-work-more]")).toHaveCount(0);
      await expect(item).not.toContainText("詳しく見る");
      // The title is the button, named by the title alone.
      const button = item.getByRole("button", { name: title, exact: true });
      await expect(button).toHaveCount(1);

      // A click anywhere on the card opens the dialog with the photo.
      await item.scrollIntoViewIfNeeded();
      const box = await item.boundingBox();
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 4);
      const shown = dialog(page, title);
      await expect(shown).toBeVisible();
      const photo = shown.locator("img");
      await expect(photo).toBeVisible();
      await expect(photo).toHaveAttribute("alt", title);
      await expect
        .poll(() => photo.evaluate((img) => img.complete && img.naturalWidth))
        .toBeGreaterThan(0);
      // No text but the title, which is visually hidden.
      await expect(shown.locator("[data-work-description]")).toHaveCount(0);
      const heading = shown.getByRole("heading", { level: 2, name: title });
      const hidden = await heading.evaluate((h) => {
        const r = h.getBoundingClientRect();
        return r.width <= 1 && r.height <= 1;
      });
      expect(hidden).toBe(true);
      // The photo is whole (16:9) and as wide as the dialog.
      const frame = await photo.boundingBox();
      const outer = await shown.boundingBox();
      expect(Math.abs(frame.width - outer.width)).toBeLessThan(1);
      expect(Math.abs(frame.width / frame.height - 16 / 9)).toBeLessThan(0.01);

      // Escape closes it.
      await page.keyboard.press("Escape");
      await expect(shown).toBeHidden();
    });
  }

  test("the featured card spans the width; the others are in columns", async ({
    page,
  }) => {
    await open(page, "/");
    const list = page.locator("#keyboards [data-work-list]");
    const width = (await list.boundingBox()).width;
    const featured = await card(page, "keyboards-cover").boundingBox();
    expect(Math.abs(featured.width - width)).toBeLessThan(1);
    // Image and summary side by side.
    const image = await card(page, "keyboards-cover")
      .locator("img")
      .boundingBox();
    const summary = await card(page, "keyboards-cover")
      .locator("[data-work-summary]")
      .boundingBox();
    expect(summary.x).toBeGreaterThan(image.x + image.width - 1);
    // Three frame cards in a row at 1280px (two rows of three).
    const rest = await Promise.all(
      ["fosty-natural", "fosty-dark", "xoyo-plus"].map((id) =>
        card(page, id).boundingBox(),
      ),
    );
    expect(new Set(rest.map((box) => Math.round(box.y))).size).toBe(1);
    expect(rest[0].width).toBeLessThan(width / 2);
  });
});

test.describe("ui-revise4 3: the footer's grid", () => {
  /**
   * The footer's grid tracks and, for each cell (brand, Links, information),
   * its box and the left edges and text alignment of what it contains.
   */
  const layoutOf = (page) =>
    page.locator("footer [data-footer-brand]").evaluate((brand) => {
      const grid = brand.parentElement;
      const style = getComputedStyle(grid);
      const box = grid.getBoundingClientRect();
      const cells = [
        brand,
        grid.querySelector("[data-footer-links]"),
        grid.querySelector("[data-footer-information]"),
      ].map((cell) => {
        const b = cell.getBoundingClientRect();
        return {
          x: b.x,
          y: b.y,
          width: b.width,
          textAlign: getComputedStyle(cell).textAlign,
          // The left edges of the cell's children (logo, heading, list).
          lefts: [...cell.children].map((c) => c.getBoundingClientRect().x),
        };
      });
      return {
        left: box.x + parseFloat(style.paddingLeft),
        tracks: style.gridTemplateColumns.split(" ").map(parseFloat),
        gap: parseFloat(style.columnGap),
        cells,
      };
    });

  test("1280px: four equal columns; the brand takes two, Links and information one each; left-aligned", async ({
    page,
  }) => {
    await open(page, "/");
    const { left, tracks, gap, cells } = await layoutOf(page);
    expect(tracks.length).toBe(4);
    for (const track of tracks)
      expect(Math.abs(track - tracks[0])).toBeLessThan(1);
    const start = (i) => left + i * (tracks[0] + gap);
    const [brand, links, information] = cells;
    // 2:1:1: the brand spans two tracks (and the gap between them).
    expect(Math.abs(brand.x - start(0))).toBeLessThan(1);
    expect(Math.abs(brand.width - (2 * tracks[0] + gap))).toBeLessThan(1);
    expect(Math.abs(links.x - start(2))).toBeLessThan(1);
    expect(Math.abs(links.width - tracks[0])).toBeLessThan(1);
    expect(Math.abs(information.x - start(3))).toBeLessThan(1);
    expect(Math.abs(information.width - tracks[0])).toBeLessThan(1);
    expect(new Set(cells.map((cell) => Math.round(cell.y))).size).toBe(1);
    // Left-aligned in each cell.
    for (const cell of cells) {
      expect(["left", "start"]).toContain(cell.textAlign);
      for (const x of cell.lefts) expect(Math.abs(x - cell.x)).toBeLessThan(1);
    }
  });

  test("375px: one column, stacked as on the former tool site, left-aligned", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await open(page, "/");
    const { left, tracks, cells } = await layoutOf(page);
    expect(tracks.length).toBe(1);
    const [brand, links, information] = cells;
    expect(links.y).toBeGreaterThan(brand.y);
    expect(information.y).toBeGreaterThan(links.y);
    for (const cell of cells) {
      expect(Math.abs(cell.x - left)).toBeLessThan(1);
      for (const x of cell.lefts) expect(Math.abs(x - cell.x)).toBeLessThan(1);
    }
  });
});

test.describe("the logotype in LINE Seed JP", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("ui-revise2 4, ui-revise3 1, SP-16: the header and the footer show the drawing of unlibra; the hero's h1 is in the body font", async ({
    page,
  }) => {
    await open(page, "/");
    const places = {
      header: page.locator("header nav > a [data-logotype]"),
      footer: page.locator("footer [data-logotype]"),
    };
    await expect(page.locator("[data-logotype]")).toHaveCount(2);
    for (const [place, locator] of Object.entries(places)) {
      // A drawing named unlibra, 1.1em high in 20px text, and no font.
      const drawing = locator.locator('svg[role="img"]');
      await expect(drawing, place).toHaveAccessibleName("unlibra");
      await expect(drawing, place).toHaveCSS("height", "22px");
    }
    expect(
      await page.evaluate(() =>
        [...document.fonts].filter((face) => face.family.includes("LINE Seed")),
      ),
    ).toEqual([]);
    // The hero's h1 keeps the body font (ui-revise3 1).
    await expect(page.locator("[data-hero] h1")).toHaveText(
      "昼はカフェ。夜はバー。",
    );
    await expect(page.locator("[data-hero] h1")).toHaveCSS(
      "font-family",
      /^"Noto Sans JP Variable"/,
    );
  });
});

test.describe("page width of the top page", () => {
  for (const width of [375, 1280]) {
    for (const scheme of ["light", "dark"]) {
      test(`${width}px, ${scheme}: no horizontal scroll, with and without a dialog`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 800 });
        await page.emulateMedia({ colorScheme: scheme });
        await open(page, "/");
        await chooseTheme(page, "ja", scheme);
        expect(await hasHorizontalScroll(page)).toBe(false);
        for (const [id, name] of [
          ["fosty-natural", "fosty natural"],
          ["mira-zero", "mira zero"],
        ]) {
          await card(page, id).getByRole("button", { name }).click();
          const details = dialog(page, name);
          await expect(details).toBeVisible();
          const box = await details.boundingBox();
          expect(box.x).toBeGreaterThanOrEqual(0);
          expect(box.x + box.width).toBeLessThanOrEqual(width);
          expect(await hasHorizontalScroll(page)).toBe(false);
          await page.keyboard.press("Escape");
          await expect(details).toBeHidden();
        }
      });
    }
  }
});

test.describe("detail dialog on a phone", () => {
  // Short enough that the long description scrolls.
  test.use({ viewport: { width: 375, height: 560 } });

  test("the close button stays in view when the details are scrolled to the end", async ({
    page,
  }) => {
    await open(page, "/");
    await card(page, "fosty-natural")
      .getByRole("button", { name: "fosty natural" })
      .click();
    const details = dialog(page, "fosty natural");
    await expect(details).toBeVisible();
    // The long description scrolls inside the dialog.
    const scrolled = await details.evaluate((element) => {
      const area = [...element.querySelectorAll("div")].find(
        (div) => getComputedStyle(div).overflowY === "auto",
      );
      area.scrollTop = area.scrollHeight;
      return area.scrollTop > 0;
    });
    expect(scrolled).toBe(true);
    const close = details.getByRole("button", { name: "閉じる" });
    await expect(close).toBeInViewport();
    await close.click();
    await expect(details).toBeHidden();
  });

  test("the close button is a 32px circle with a 44px target (DESIGN.md 5.4)", async ({
    page,
  }) => {
    await open(page, "/");
    await card(page, "mira-zero")
      .getByRole("button", { name: "mira zero" })
      .click();
    const close = dialog(page, "mira zero").getByRole("button", {
      name: "閉じる",
    });
    const box = await close.boundingBox();
    expect([box.width, box.height]).toEqual([32, 32]);
    // 21px from the middle (inside 44px, outside 32px) is still the button,
    // on every side.
    const hits = await close.evaluate((button) => {
      const r = button.getBoundingClientRect();
      const [x, y] = [r.x + r.width / 2, r.y + r.height / 2];
      return [
        [x - 21, y],
        [x + 21, y],
        [x, y - 21],
        [x, y + 21],
      ].map(([px, py]) => document.elementFromPoint(px, py) === button);
    });
    expect(hits).toEqual([true, true, true, true]);
  });
});

test("the card button's name has the visible 詳しく見る (for voice control)", async ({
  page,
}) => {
  await open(page, "/");
  const button = card(page, "fosty-dark").getByRole("button", {
    name: "fosty dark 詳しく見る",
    exact: true,
  });
  await button.click();
  await expect(dialog(page, "fosty dark")).toBeVisible();
});

/**
 * A computed CSS color as sRGB [r, g, b, a] (0-255, a 0-1): Tailwind 4
 * writes oklch(), the former tool site (Tailwind 3) wrote hex.
 */
const srgb = (locator, property, pseudo = null) =>
  locator.evaluate(
    (element, [property, pseudo]) => {
      const value = getComputedStyle(element, pseudo)[property];
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 1;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = value;
      context.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
      return [r, g, b, Math.round((a / 255) * 100) / 100];
    },
    [property, pseudo],
  );

/** Whether two sRGB colors are the same, allowing 1 for rounding. */
const sameColor = (actual, expected) =>
  actual[3] === expected[3] &&
  [0, 1, 2].every((i) => Math.abs(actual[i] - expected[i]) <= 1);

/**
 * Moves the mouse over an element of a card. The title's overlay covers the
 * card, so the pointer is on the overlay there, as for a user.
 */
const hoverOver = async (page, locator) => {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
};

/** One card of each kind: featured, frame (both photo categories), list. */
const SAMPLES = {
  // The large card that links (the cover opens nothing).
  featured: "just-hex",
  // botsu until ui-revise9 3 (now prototypes, which opens nothing).
  frame: "mira-zero",
  "frame (VR & 3D)": "mururu-blink-lipsync",
  "list (Libraries)": "i18n-tiny-astro",
  "list (Apps)": "svg-optimizer",
};

test.describe("ui-revise3 3, ui-revise4 2: the cards", () => {
  for (const scheme of ["light", "dark"]) {
    test(`${scheme}: every card fades in the former tool site's background on hover and keyboard focus, without moving or zooming`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await open(page, "/");
      await chooseTheme(page, "ja", scheme);
      // tool-card.tsx: hover:bg-gray-100 (#f3f4f6 in Tailwind 3) and
      // dark:hover:bg-atom-one-dark-light (#333842), transition-colors.
      const cardColors = {
        rest: [0, 0, 0, 0],
        hover: scheme === "light" ? [243, 244, 246, 1] : [0x33, 0x38, 0x42, 1],
      };
      // The large card (ui-revise5, design 4 in light gray): gray-50
      // (#f9fafb), and gray-100 (#f3f4f6) on hover; in dark mode #333842,
      // and #2e323b on hover (halfway back to the page, for 4.5:1).
      const featuredColors =
        scheme === "light"
          ? { rest: [249, 250, 251, 1], hover: [243, 244, 246, 1] }
          : { rest: [0x33, 0x38, 0x42, 1], hover: [0x2e, 0x32, 0x3b, 1] };
      const background = (item) => srgb(item, "backgroundColor");
      const transitions = {};
      for (const [kind, id] of Object.entries(SAMPLES)) {
        const item = card(page, id);
        const { rest, hover: hoverColor } =
          kind === "featured" ? featuredColors : cardColors;
        await page.mouse.move(0, 0);
        await item.scrollIntoViewIfNeeded();
        await expect
          .poll(async () => sameColor(await background(item), rest), kind)
          .toBe(true);
        const style = await item.evaluate((element) => {
          const s = getComputedStyle(element);
          return {
            property: s.transitionProperty.split(", "),
            duration: s.transitionDuration.split(", ")[0],
            timing: s.transitionTimingFunction,
            radius: s.borderRadius,
          };
        });
        transitions[kind] = style;
        // Tailwind's transition-colors: 150ms, cubic-bezier(0.4, 0, 0.2, 1).
        expect(style.property, kind).toContain("background-color");
        expect(style.property, kind).not.toContain("translate");
        expect(style.property, kind).not.toContain("box-shadow");
        expect(style.duration, kind).toBe("0.15s");
        expect(style.timing, kind).toBe("cubic-bezier(0.4, 0, 0.2, 1)");
        expect(style.radius, kind).toBe("8px");
        const border = await item.evaluate(
          (e) => getComputedStyle(e).borderTopColor,
        );
        // The image's scale and transform (the logos have a static crop).
        const images = () =>
          item.locator("img").evaluateAll((elements) =>
            elements.map((e) => {
              const s = getComputedStyle(e);
              return [s.scale, s.transform, s.transitionDuration];
            }),
          );
        const before = await images();
        for (const [, , duration] of before) expect(duration, kind).toBe("0s");

        await hoverOver(page, item.locator("[data-work-summary]"));
        await expect
          .poll(async () => sameColor(await background(item), hoverColor), kind)
          .toBe(true);
        // Past the transition: nothing else changed.
        await page.waitForTimeout(400);
        await expect(item).toHaveCSS("translate", "none");
        await expect(item).toHaveCSS("box-shadow", "none");
        await expect(item).toHaveCSS("border-top-color", border);
        expect(await images(), kind).toEqual(before);
        await page.mouse.move(0, 0);
        await expect
          .poll(async () => sameColor(await background(item), rest), kind)
          .toBe(true);

        // Keyboard focus on the title shows the same background.
        const control = titleControl(item);
        await control.focus();
        await page.keyboard.press("Shift+Tab");
        await page.keyboard.press("Tab");
        await expect(control).toBeFocused();
        await expect
          .poll(async () => sameColor(await background(item), hoverColor), kind)
          .toBe(true);
      }
      // The same transition on every card.
      const [first, ...rest] = Object.values(transitions);
      for (const style of rest) expect(style).toEqual(first);
    });

    test(`${scheme}: the photo cards and the list items share the title, summary, link, radius and focus styles`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await open(page, "/");
      await chooseTheme(page, "ja", scheme);
      const styles = {};
      const linkStyle = async (locator) => [
        await srgb(locator, "color"),
        await locator.evaluate((e) => getComputedStyle(e).fontSize),
      ];
      for (const [kind, id] of Object.entries(SAMPLES)) {
        const item = card(page, id);
        const title = item.locator("[data-work-title]");
        const summary = item.locator("[data-work-summary]");
        const control = titleControl(item);
        styles[kind] = {
          title: [
            await title.evaluate((e) => getComputedStyle(e).fontWeight),
            await srgb(title, "color"),
          ],
          summary: [
            await summary.evaluate((e) => {
              const s = getComputedStyle(e);
              return [s.fontSize, s.lineHeight];
            }),
            await srgb(summary, "color"),
          ],
          radius: await item.evaluate((element) => {
            const icon = element.querySelector("div:has(> img)");
            const radius = parseFloat(getComputedStyle(icon).borderRadius);
            return [
              getComputedStyle(element).borderRadius,
              element.dataset.card !== "tool"
                ? "8px"
                : radius >= icon.offsetWidth / 2
                  ? "circle"
                  : getComputedStyle(icon).borderRadius,
            ];
          }),
          focus: await control.evaluate((e) => {
            const s = getComputedStyle(e, "::after");
            return [s.outlineStyle, s.outlineWidth, s.outlineOffset];
          }),
          focusColor: await srgb(control, "outlineColor", "::after"),
        };
        // "詳しく見る" and the actions: one link style.
        const links = [
          ...(await item.locator("[data-work-more]").all()),
          ...(await item.locator("[data-work-action]").all()),
        ];
        styles[kind].links = await Promise.all(links.map(linkStyle));
      }
      const [first, ...rest] = Object.values(styles);
      const linkStyles = Object.values(styles).flatMap((s) => s.links);
      expect(linkStyles.length).toBeGreaterThan(2);
      for (const style of linkStyles) expect(style).toEqual(linkStyles[0]);
      for (const [kind, style] of Object.entries(styles)) {
        expect(style.title, `${kind}: title`).toEqual(first.title);
        expect(style.summary, `${kind}: summary`).toEqual(first.summary);
        // One radius for the photo cards, the list items and the Libraries'
        // icons; the Apps' icons are circles (ui-revise5 6).
        expect(style.radius, `${kind}: radius`).toEqual([
          "8px",
          kind === "list (Apps)" ? "circle" : "8px",
        ]);
        expect(style.focus, `${kind}: focus`).toEqual(first.focus);
        expect(style.focusColor, `${kind}: focus`).toEqual(first.focusColor);
      }
      expect(rest.length).toBe(4);
      // The summaries are a little larger than the former tool cards' 14px,
      // with the line of text to read (ui-revise7 7).
      expect(first.summary[0]).toEqual(["16px", "28px"]);
    });
  }

  test("ui-revise5 5, 11: the card's hover underlines its first link only; an action's own hover underlines it; the arrows do not move", async ({
    page,
  }) => {
    await open(page, "/");
    const arrow = (locator) =>
      locator
        .locator('svg[data-icon="arrow-up-right"]')
        .evaluate((e) => [
          getComputedStyle(e).translate,
          getComputedStyle(e).transform,
        ]);
    // The underline is the text's background: 0% wide, or the whole text.
    const underline = (locator) =>
      locator
        .locator("[data-link-text]")
        .evaluate((e) =>
          getComputedStyle(e).backgroundSize === "100% 1px"
            ? "underline"
            : getComputedStyle(e).backgroundSize === "0% 1px"
              ? "none"
              : "growing",
        );
    for (const id of Object.values(SAMPLES)) {
      const item = card(page, id);
      await item.scrollIntoViewIfNeeded();
      await page.mouse.move(0, 0);
      // No arrow after the title (ui-revise5 2).
      await expect(item.locator("[data-work-title] svg")).toHaveCount(0);
      // The first link: the first action, or "詳しく見る" (DIY Keyboards).
      const actions = item.locator("[data-work-action]");
      const first =
        (await actions.count()) > 0
          ? actions.first()
          : item.locator("[data-work-more]");
      const others = await item.locator('[data-work-action="secondary"]').all();
      // No text-decoration underline any more.
      await expect(first).toHaveCSS("text-decoration-line", "none");
      await expect.poll(() => underline(first), id).toBe("none");
      await hoverOver(page, item.locator("[data-work-summary]"));
      await expect.poll(() => underline(first), id).toBe("underline");
      await expect(first).toHaveCSS("text-decoration-line", "none");
      for (const other of others) {
        expect(await underline(other), id).toBe("none");
      }
      // On another action: that one is underlined, the first is not.
      for (const other of others) {
        await other.hover();
        await expect.poll(() => underline(other), id).toBe("underline");
        await expect.poll(() => underline(first), id).toBe("none");
      }
      for (const action of await actions.all()) {
        await page.mouse.move(0, 0);
        await expect.poll(() => underline(action)).toBe("none");
        const still = await arrow(action);
        expect(still, id).toEqual(["none", "none"]);
        await action.hover();
        await expect.poll(() => underline(action), id).toBe("underline");
        // The arrow stays where it is (ui-revise5 5).
        await page.waitForTimeout(250);
        expect(await arrow(action), id).toEqual(still);
      }
    }
  });

  for (const reducedMotion of ["no-preference", "reduce"]) {
    test(`ui-revise5 5: the underline grows from the left (prefers-reduced-motion: ${reducedMotion})`, async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion });
      await open(page, "/");
      const item = card(page, "i18n-tiny-astro");
      const action = item.locator('[data-work-action="secondary"]');
      const text = action.locator("[data-link-text]");
      await action.scrollIntoViewIfNeeded();
      await page.mouse.move(0, 0);
      const style = await text.evaluate((e) => {
        const s = getComputedStyle(e);
        return {
          property: s.transitionProperty,
          duration: s.transitionDuration,
          image: s.backgroundImage,
          position: s.backgroundPosition,
          repeat: s.backgroundRepeat,
        };
      });
      // A line of the text's color, 1px, at the bottom left.
      expect(style.image).toMatch(/^linear-gradient\(/);
      expect(style.position).toBe("0px 100%");
      expect(style.repeat).toBe("no-repeat");
      if (reducedMotion === "reduce") {
        expect(style.property).toBe("none");
      } else {
        expect(style.property).toBe("background-size");
        expect(style.duration).toBe("0.2s");
      }
      // Right after the hover: growing (a transition runs), or already
      // whole without one.
      await action.hover();
      const running = await text.evaluate(
        (e) =>
          e
            .getAnimations()
            .filter((a) => a.transitionProperty === "background-size").length,
      );
      expect(running).toBe(reducedMotion === "reduce" ? 0 : 1);
      await expect
        .poll(() => text.evaluate((e) => getComputedStyle(e).backgroundSize))
        .toBe("100% 1px");
    });
  }

  test("ui-revise5 6, 8, ui-revise7 7: the actions' arrow is Tabler Icons' arrow-up-right (ui-revise7 8'), 16px, the size of the text, and centered on it", async ({
    page,
  }) => {
    await open(page, "/");
    const actions = page.locator("[data-work-action]");
    // 14 since ui-revise8 4 (@i18n-tiny/react: npm and the documentation),
    // 13 since remove-tw-palette, 14 with Just HEX.
    await expect(actions).toHaveCount(14);
    for (const action of await actions.all()) {
      await expect(action.locator("svg")).toHaveAttribute(
        "data-icon",
        "arrow-up-right",
      );
      const { size, fontSize, offset } = await action.evaluate((element) => {
        const svg = element.querySelector("svg");
        const box = svg.getBoundingClientRect();
        // The line of text: the text node's box.
        const range = document.createRange();
        range.selectNodeContents(element.querySelector("[data-link-text]"));
        const text = range.getBoundingClientRect();
        return {
          size: [box.width, box.height],
          fontSize: getComputedStyle(element).fontSize,
          offset: box.y + box.height / 2 - (text.y + text.height / 2),
        };
      });
      const label = await action.textContent();
      expect(fontSize, label).toBe("16px");
      expect(size, label).toEqual([16, 16]);
      expect(Math.abs(offset), label).toBeLessThanOrEqual(0.5);
    }
  });

  test("spacing in the cards is on the 8px grid", async ({ page }) => {
    await open(page, "/");
    const offGrid = await page.evaluate(() => {
      const found = [];
      const check = (element, what) => {
        const s = getComputedStyle(element);
        for (const property of [
          "paddingTop",
          "paddingRight",
          "paddingBottom",
          "paddingLeft",
          "rowGap",
          "columnGap",
        ]) {
          const value = s[property];
          if (value === "normal") continue;
          if (parseFloat(value) % 8 !== 0) {
            found.push(`${what}: ${property} ${value}`);
          }
        }
      };
      for (const list of document.querySelectorAll("[data-work-list]")) {
        check(list, list.dataset.workList);
      }
      for (const article of document.querySelectorAll("article[data-work]")) {
        check(article, article.dataset.work);
        for (const div of article.querySelectorAll("div")) {
          check(div, `${article.dataset.work} div`);
        }
      }
      return found;
    });
    expect(offGrid).toEqual([]);
  });

  test("ui-revise4 2, ui-revise5 11: a click on a card goes to its first link; an action goes to its own", async ({
    page,
    context,
  }) => {
    await open(page, "/");
    // Every action is in front of the title link's overlay.
    const actions = page.locator("[data-work-action]");
    // 14 since ui-revise8 4 (@i18n-tiny/react: npm and the documentation),
    // 13 since remove-tw-palette, 14 with Just HEX.
    await expect(actions).toHaveCount(14);
    await expect(page.locator("#apps [data-work-action]")).toHaveText(
      // Just HEX and the 3 tools.
      Array(4).fill("アプリを開く"),
    );
    await expect(page.locator("#vr-3d [data-work-action]")).toHaveText([
      "BOOTH で見る",
      "ドキュメント",
    ]);
    for (const action of await actions.all()) {
      await action.scrollIntoViewIfNeeded();
      const onTop = await action.evaluate((element) => {
        const box = element.getBoundingClientRect();
        const hit = document.elementFromPoint(
          box.x + box.width / 2,
          box.y + box.height / 2,
        );
        return hit === element || element.contains(hit);
      });
      expect(onTop, await action.textContent()).toBe(true);
    }

    // External places open in a new tab: the documentation action, and the
    // card of a library (npm) and of the BOOTH item.
    for (const pattern of [
      "https://www.npmjs.com/**",
      "https://docs.unlibra.com/**",
      "https://unlibra.booth.pm/**",
    ]) {
      await context.route(pattern, (route) =>
        route.fulfill({ contentType: "text/html", body: "ok" }),
      );
    }
    const newTab = async (click, url) => {
      const opened = context.waitForEvent("page");
      await click();
      const tab = await opened;
      await tab.waitForLoadState();
      expect(tab.url()).toBe(url);
      await tab.close();
      await expect(page).toHaveURL("/");
    };
    await newTab(
      () =>
        card(page, "i18n-tiny-astro")
          .getByRole("link", { name: "ドキュメント" })
          .click(),
      "https://docs.unlibra.com/i18n-tiny/astro/introduction",
    );
    // The card goes where its first action goes.
    for (const [id, url] of [
      ["i18n-tiny-astro", "https://www.npmjs.com/package/@i18n-tiny/astro"],
      ["tkinter-unblur", "https://pypi.org/project/tkinter-unblur"],
      ["mururu-blink-lipsync", "https://unlibra.booth.pm/items/9056145"],
    ]) {
      if (url.startsWith("https://pypi.org/")) {
        await context.route(url, (route) =>
          route.fulfill({ contentType: "text/html", body: "ok" }),
        );
      }
      await expect(
        card(page, id).locator('[data-work-action="primary"]'),
      ).toHaveAttribute("href", url);
      await newTab(() => hoverClick(page, card(page, id)), url);
    }
    await newTab(
      () =>
        card(page, "mururu-blink-lipsync")
          .getByRole("link", { name: "ドキュメント" })
          .click(),
      "https://docs.unlibra.com/mururu-blink-lipsync/",
    );

    // The action's name is its label, described by the work's title.
    await expect(
      card(page, "tkinter-unblur").getByRole("link", { name: "ドキュメント" }),
    ).toHaveAccessibleDescription("tkinter-unblur");
    // The card link's name is the title.
    await expect(
      card(page, "svg-optimizer").getByRole("link", {
        name: "SVGオプティマイザー",
        exact: true,
      }),
    ).toHaveAttribute("href", "/lab/svg-optimizer");

    // An app's card opens the tool page in the same tab, as its
    // "アプリを開く" does.
    await expect(
      card(page, "svg-optimizer").getByRole("link", { name: "アプリを開く" }),
    ).toHaveAttribute("href", "/lab/svg-optimizer");
    await hoverClick(page, card(page, "svg-optimizer"));
    await expect(page).toHaveURL("/lab/svg-optimizer");
  });
});

/** Clicks a card at its summary (on the title's overlay), as a user would. */
const hoverClick = async (page, item) => {
  const summary = item.locator("[data-work-summary]");
  await summary.scrollIntoViewIfNeeded();
  const box = await summary.boundingBox();
  await page.mouse.click(box.x + 5, box.y + box.height / 2);
};

test.describe("ui-revise3 1, ui-revise4 1, ui-revise5 1, ui-revise7 4: the hero", () => {
  for (const width of [375, 1280]) {
    test(`${width}px: the h1 is one line in 28px, with the GitHub and BOOTH text buttons side by side below it`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 800 });
      await open(page, "/");
      // No brand symbol (ui-revise4 1): the wave and the two logos.
      await expect(page.locator("[data-hero] svg")).toHaveCount(3);
      await expect(
        page.locator('[data-hero] svg[data-icon="arrow-up-right"]'),
      ).toHaveCount(0);
      const heading = page.locator("[data-hero] h1");
      // 28px at every width (ui-revise5; 24px, text-2xl, since ui-revise4).
      await expect(heading).toHaveCSS("font-size", "28px");
      // Half a character on the left, for the closing "。" (ui-revise11 2).
      await expect(heading).toHaveCSS("padding-left", "14px");
      const h1 = await heading.boundingBox();
      const lineHeight = await heading.evaluate((e) =>
        parseFloat(getComputedStyle(e).lineHeight),
      );
      expect(h1.height).toBeLessThan(lineHeight * 1.5);
      const links = page.locator("[data-hero-links] a");
      await expect(links).toHaveText(["GitHub", "BOOTH"]);
      const github = await links.nth(0).boundingBox();
      const booth = await links.nth(1).boundingBox();
      expect(github.y).toBeGreaterThan(h1.y + h1.height);
      expect(Math.round(booth.y)).toBe(Math.round(github.y));
      expect(booth.x).toBeGreaterThan(github.x + github.width);
      // Text buttons: no background or ring; the logo (the GitHub mark and
      // the box), then the text (ui-revise5 1). The text is 16px and
      // the logo 18px, centered on the text (ui-revise7 4).
      for (const [i, link] of (await links.all()).entries()) {
        await expect(link).toHaveCSS("font-size", "16px");
        await expect(link).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
        await expect(link).toHaveCSS("box-shadow", "none");
        const icon = link.locator("svg");
        await expect(icon).toHaveAttribute("data-icon", ["github", "box"][i]);
        await expect(icon).toBeVisible();
        const box = await icon.boundingBox();
        // Both 18px high, their widths from their viewBoxes: the GitHub mark
        // (98 x 96) and the box cropped to its strokes (18 x 20).
        expect(box.height).toBe(18);
        expect(box.width).toBeCloseTo([18 * (98 / 96), 18 * (18 / 20)][i], 1);
        const range = await link.evaluate((element) => {
          const r = document.createRange();
          r.selectNodeContents(element);
          r.setStartAfter(element.querySelector("svg"));
          const { x, y, height } = r.getBoundingClientRect();
          return { x, y, height };
        });
        expect(range.x).toBeGreaterThanOrEqual(box.x + box.width);
        expect(
          Math.abs(box.y + box.height / 2 - (range.y + range.height / 2)),
        ).toBeLessThanOrEqual(1);
        // One line: the button does not wrap.
        expect(range.height).toBeLessThan(16 * 2);
      }
    });
  }
});

test.describe("ui-revise5: the cards and the sections", () => {
  for (const width of [375, 1280]) {
    for (const scheme of ["light", "dark"]) {
      test(`${width}px, ${scheme}: no border on the cards and the icons; round app icons; the large card's SPOTLIGHT and title (36px from 768px, 24px below: ui-revise12 1); the works 24px lower`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 800 });
        await page.emulateMedia({ colorScheme: scheme });
        await open(page, "/");
        await chooseTheme(page, "ja", scheme);

        // 12, 7: no border, ring or outline on any card or icon.
        const lines = await page
          .locator("article[data-work]")
          .evaluateAll((articles) =>
            articles.flatMap((article) =>
              [article, article.querySelector("div:has(> img)")].map((e) => {
                const s = getComputedStyle(e);
                return {
                  work: article.dataset.work,
                  border: [
                    s.borderTopWidth,
                    s.borderRightWidth,
                    s.borderBottomWidth,
                    s.borderLeftWidth,
                  ],
                  shadow: s.boxShadow,
                  outline: s.outlineStyle,
                };
              }),
            ),
          );
        // 16 cards and their images (13 since ui-revise8 4, 12 since
        // remove-tw-palette, 13 with Just HEX, 14 with the cover of DIY
        // Keyboards, 16 with xoyo and xoyo plus).
        expect(lines.length).toBe(32);
        for (const { work, border, shadow, outline } of lines) {
          expect(border, work).toEqual(["0px", "0px", "0px", "0px"]);
          expect(shadow, work).toBe("none");
          expect(outline, work).toBe("none");
        }

        // 6: the Apps' icons are circles.
        for (const icon of await page
          // The list cards (the large card fills its frame: just-hex JH-14).
          .locator("#apps article:not([data-card=featured]) div:has(> img)")
          .all()) {
          const round = await icon.evaluate(
            (e) =>
              parseFloat(getComputedStyle(e).borderRadius) >= e.offsetWidth / 2,
          );
          expect(round).toBe(true);
        }

        // 13: SPOTLIGHT above the large card's title, which is 36px from
        // 768px wide and 24px below (ui-revise12 1).
        const featured = card(page, "keyboards-cover");
        const spotlight = featured.locator("[data-work-spotlight]");
        await expect(spotlight).toHaveText("SPOTLIGHT");
        const title = featured.locator("[data-work-title]");
        await expect(title).toHaveCSS(
          "font-size",
          width < 768 ? "24px" : "36px",
        );
        const above = await spotlight.boundingBox();
        const below = await title.boundingBox();
        expect(above.y + above.height).toBeLessThanOrEqual(below.y);
        expect(Math.abs(above.x - below.x)).toBeLessThan(1);

        // 3: the DIY Keyboards section is the hero's margin and 24px below
        // the hero (48px below 640px wide, 64px from there).
        const hero = await page.locator("[data-hero]").boundingBox();
        const section = await page.locator("#keyboards").boundingBox();
        const margin = width < 640 ? 48 : 64;
        expect(Math.round(section.y - (hero.y + hero.height))).toBe(
          margin + 24,
        );

        expect(await hasHorizontalScroll(page)).toBe(false);
      });
    }
  }
});

test.describe("ui-revise5 (parent): text contrast on the cards", () => {
  for (const scheme of ["light", "dark"]) {
    test(`${scheme}: every card's text is at least 4.5:1, at rest and on hover`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
      await open(page, "/");
      await chooseTheme(page, "ja", scheme);
      /**
       * For each text of a card (the title, the summary, SPOTLIGHT and the
       * links), its color and the color behind it, as computed (sRGB), and
       * the ratio (WCAG 2).
       */
      const ratios = (item) =>
        item.evaluate((article) => {
          const canvas = document.createElement("canvas");
          canvas.width = canvas.height = 1;
          const context = canvas.getContext("2d", { willReadFrequently: true });
          const rgba = (value) => {
            context.clearRect(0, 0, 1, 1);
            context.fillStyle = value;
            context.fillRect(0, 0, 1, 1);
            const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
            return [r, g, b, a / 255];
          };
          const luminance = ([r, g, b]) => {
            const [R, G, B] = [r, g, b].map((v) => {
              const c = v / 255;
              return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
            });
            return 0.2126 * R + 0.7152 * G + 0.0722 * B;
          };
          /** The first opaque background behind an element. */
          const behind = (element) => {
            for (let e = element; e; e = e.parentElement) {
              const color = rgba(getComputedStyle(e).backgroundColor);
              if (color[3] === 0) continue;
              if (color[3] < 1) return null;
              return color;
            }
            return [255, 255, 255, 1];
          };
          return [
            ...article.querySelectorAll(
              "[data-work-title], [data-work-summary], [data-work-spotlight], [data-link-text]",
            ),
          ].map((element) => {
            const text = rgba(getComputedStyle(element).color);
            const back = behind(element);
            const [a, b] = [luminance(text), luminance(back)].sort(
              (x, y) => y - x,
            );
            return {
              what: `${article.dataset.work} ${element.textContent.trim().slice(0, 12)}`,
              opaque: text[3] === 1 && back !== null,
              ratio: (a + 0.05) / (b + 0.05),
            };
          });
        });
      const cards = await page.locator("article[data-work]").all();
      // 13 since ui-revise8 4 (@i18n-tiny/react), 12 since remove-tw-palette,
      // 13 with Just HEX, 14 with the cover of DIY Keyboards, 16 with xoyo and
      // xoyo plus.
      expect(cards.length).toBe(16);
      for (const item of cards) {
        await page.mouse.move(0, 0);
        await item.scrollIntoViewIfNeeded();
        const states = { rest: await ratios(item) };
        await hoverOver(page, item.locator("[data-work-summary]"));
        // No transition under reduced motion for the links; the card's own
        // background fades in 150ms.
        await page.waitForTimeout(300);
        states.hover = await ratios(item);
        // The title, the summary and the links; prototypes has no links
        // (ui-revise9 3).
        const texts =
          (await item.getAttribute("data-work")) === "prototypes" ? 2 : 3;
        for (const [state, list] of Object.entries(states)) {
          expect(list.length).toBeGreaterThanOrEqual(texts);
          for (const { what, opaque, ratio } of list) {
            expect(opaque, `${state}: ${what}`).toBe(true);
            expect(ratio, `${state}: ${what}`).toBeGreaterThanOrEqual(4.5);
          }
        }
      }
    });
  }
});

test("ui-revise5 (review): in forced colors, the links are underlined with text-decoration on hover", async ({
  page,
}) => {
  await page.emulateMedia({ forcedColors: "active" });
  await open(page, "/");
  const decoration = (locator) =>
    locator
      .locator("[data-link-text]")
      .evaluate((e) => getComputedStyle(e).textDecorationLine);
  for (const id of ["i18n-tiny-astro", "fosty-dark"]) {
    const item = card(page, id);
    await item.scrollIntoViewIfNeeded();
    await page.mouse.move(0, 0);
    const actions = item.locator("[data-work-action]");
    const first =
      (await actions.count()) > 0
        ? actions.first()
        : item.locator("[data-work-more]");
    // The background line is not drawn in forced colors.
    expect(
      await first
        .locator("[data-link-text]")
        .evaluate((e) => getComputedStyle(e).backgroundImage),
    ).toBe("none");
    expect(await decoration(first), id).toBe("none");
    // The card's hover underlines the first link.
    await hoverOver(page, item.locator("[data-work-summary]"));
    await expect.poll(() => decoration(first), id).toBe("underline");
    // A link's own hover underlines it, and not the first.
    for (const other of await item
      .locator('[data-work-action="secondary"]')
      .all()) {
      await other.hover();
      await expect.poll(() => decoration(other), id).toBe("underline");
      await expect.poll(() => decoration(first), id).toBe("none");
    }
    if ((await actions.count()) > 0) {
      await first.hover();
      await expect.poll(() => decoration(first), id).toBe("underline");
    }
  }
});

test.describe("ui-revise6 2: the summaries of Libraries and Apps", () => {
  test("1280px: each summary takes two or three lines", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await open(page, "/");
    await page.evaluate(() => document.fonts.ready);
    const summaries = await page
      .locator(
        ":is(#libraries, #apps) article[data-work]:not([data-card=featured]) [data-work-summary]",
      )
      .evaluateAll((elements) =>
        elements.map((element) => {
          const { lineHeight } = getComputedStyle(element);
          return {
            id: element.closest("[data-work]").dataset.work,
            lines: Math.round(
              element.getBoundingClientRect().height / parseFloat(lineHeight),
            ),
          };
        }),
      );
    // 4 Libraries (ui-revise8 4) and 3 Apps (remove-tw-palette). The large
    // card of Just HEX has a short catch copy instead (just-hex JH-14).
    expect(summaries.length).toBe(7);
    for (const { id, lines } of summaries) {
      expect(lines, id).toBeGreaterThanOrEqual(2);
      expect(lines, id).toBeLessThanOrEqual(3);
    }
  });

  test("ui-revise8 3: 1280px: every card's summary takes three lines at most", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await open(page, "/");
    await page.evaluate(() => document.fonts.ready);
    const summaries = await page
      .locator("article[data-work] [data-work-summary]")
      .evaluateAll((elements) =>
        elements.map((element) => ({
          id: element.closest("[data-work]").dataset.work,
          lines: Math.round(
            element.getBoundingClientRect().height /
              parseFloat(getComputedStyle(element).lineHeight),
          ),
        })),
      );
    expect(summaries.map(({ id }) => id)).toContain("mururu-blink-lipsync");
    for (const { id, lines } of summaries) {
      expect(lines, id).toBeGreaterThanOrEqual(1);
      expect(lines, id).toBeLessThanOrEqual(3);
    }
  });
});
