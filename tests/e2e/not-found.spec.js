// E2E: the 404 page (not-found): the planet in a screen of stars, the
// heading and the capsule button to the top, without the header and the
// footer, dark in either theme.
import { expect, test } from "@playwright/test";

import { hasHorizontalScroll } from "./helpers.js";

const MISSING = "/no-such-page";
/** The stars' tile: one size on every screen (16rem). */
const TILE = 256;

/** Whether two boxes overlap. */
const overlap = (a, b) =>
  a.x < b.x + b.width &&
  b.x < a.x + a.width &&
  a.y < b.y + b.height &&
  b.y < a.y + a.height;

for (const [width, height, layout] of [
  [375, 667, "stacked"],
  [1280, 800, "stacked"],
  // Low and wide landscape screens (phones turned sideways): side by side.
  [667, 375, "side"],
  [844, 390, "side"],
  [568, 320, "side"],
  // Low but not wide enough for side by side: stacked.
  [480, 400, "stacked"],
  [360, 340, "stacked"],
]) {
  const schemes = width === 844 ? ["light"] : ["light", "dark"];
  for (const scheme of schemes) {
    test(`${width}×${height}, ${scheme}: a missing path returns 404 with the full-screen page`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await page.emulateMedia({ colorScheme: scheme });
      const response = await page.goto(MISSING);
      expect(response.status()).toBe(404);
      await page.evaluate(() => document.fonts.ready);

      const heading = page.getByRole("heading", { level: 1 });
      await expect(heading).toHaveText("Page not found");
      const back = page.getByRole("link", { name: "Back to top" });
      await expect(back).toHaveAttribute("href", "/");
      // A capsule: the radius is at least half the height.
      const capsule = await back.evaluate((e) => {
        const s = getComputedStyle(e);
        return parseFloat(s.borderTopLeftRadius) >= e.offsetHeight / 2;
      });
      expect(capsule).toBe(true);

      // No header and no footer.
      await expect(page.locator("header, footer")).toHaveCount(0);

      // The background: #282c34 over the whole screen, in either theme (the
      // root and the body too, for overscrolling), with the stars over all
      // of it.
      const main = page.locator("[data-not-found]");
      await expect(main).toHaveCSS("background-color", "rgb(40, 44, 52)");
      for (const selector of ["html", "body"]) {
        await expect(page.locator(selector)).toHaveCSS(
          "background-color",
          "rgb(40, 44, 52)",
        );
      }
      const box = await main.boundingBox();
      expect(box.x).toBe(0);
      expect(box.y).toBe(0);
      expect(Math.round(box.width)).toBe(width);
      expect(Math.round(box.height)).toBe(height);
      // The stars: one tile size on every screen, repeated, centered.
      const tile = await main.evaluate((e) => {
        const s = getComputedStyle(e);
        return [
          s.backgroundImage,
          s.backgroundRepeat,
          s.backgroundSize,
          s.backgroundPosition,
        ];
      });
      expect(tile[0]).toMatch(/stars\.[\w-]+\.svg/);
      expect(tile[1]).toBe("repeat");
      expect(tile[2]).toBe(`${TILE}px ${TILE}px`);
      expect(tile[3]).toBe("50% 50%");

      // The planet: visible (at least a quarter of the short side, at most
      // half), on the screen, not overlapping the heading and the button.
      const planet = await page.locator("[data-planet]").boundingBox();
      const short = Math.min(width, height);
      expect(planet.width).toBeGreaterThanOrEqual(short * 0.25);
      expect(planet.width).toBeLessThanOrEqual(short * 0.6 + 1);
      const h1 = await heading.boundingBox();
      const button = await back.boundingBox();
      for (const b of [planet, h1, button]) {
        expect(b.x).toBeGreaterThanOrEqual(0);
        expect(b.y).toBeGreaterThanOrEqual(0);
        expect(b.x + b.width).toBeLessThanOrEqual(width);
        expect(b.y + b.height).toBeLessThanOrEqual(height);
      }
      expect(overlap(planet, h1)).toBe(false);
      expect(overlap(planet, button)).toBe(false);
      expect(button.y).toBeGreaterThanOrEqual(h1.y + h1.height);
      if (layout === "stacked") {
        // The planet, the heading and the button below it; 40-50% of the
        // short side when the screen is tall enough.
        if (height >= 480) {
          expect(planet.width).toBeGreaterThanOrEqual(short * 0.4);
          expect(planet.width).toBeLessThanOrEqual(short * 0.5 + 1);
        }
        expect(
          Math.abs(planet.x + planet.width / 2 - width / 2),
        ).toBeLessThanOrEqual(1);
        expect(h1.y).toBeGreaterThanOrEqual(planet.y + planet.height);
        // ui-revise5 4: the group of the planet, the heading and the button
        // is in the middle or a little above it, not below. Until then the
        // planet alone was in the middle: now it is higher by at least half
        // of the text below it.
        const top = planet.y;
        const bottom = button.y + button.height;
        const middle = (top + bottom) / 2;
        expect(middle).toBeLessThanOrEqual(height / 2 + 1);
        expect(middle).toBeGreaterThanOrEqual(height * 0.4);
        const caption = bottom - (planet.y + planet.height);
        expect(planet.y + planet.height / 2).toBeLessThanOrEqual(
          height / 2 - caption / 2 + 1,
        );
        // A margin above and below the group.
        expect(top).toBeGreaterThanOrEqual(16);
        expect(bottom).toBeLessThanOrEqual(height - 16);
      } else {
        // Low landscape: the planet beside the text, both centered
        // vertically.
        expect(h1.x).toBeGreaterThanOrEqual(planet.x + planet.width);
        expect(
          Math.abs(planet.y + planet.height / 2 - height / 2),
        ).toBeLessThanOrEqual(1);
      }
      // One screen: no scroll either way.
      expect(await hasHorizontalScroll(page)).toBe(false);
      const scroll = await page.evaluate(() => {
        window.scrollTo(100, 100);
        return [scrollX, scrollY];
      });
      expect(scroll).toEqual([0, 0]);
    });
  }
}

test("the planet turns, and stops under prefers-reduced-motion: reduce", async ({
  page,
}) => {
  const animations = () =>
    page
      .locator("[data-planet] .dbpa-surface, [data-planet] .dbpa-moons")
      .evaluateAll((elements) =>
        elements.map((e) => getComputedStyle(e).animationName),
      );
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(MISSING);
  expect(await animations()).toEqual(["dbpaSpin", "dbpaSpin"]);
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(await animations()).toEqual(["none", "none"]);
});

test("the button goes back to the top page", async ({ page }) => {
  await page.goto(MISSING);
  await page.getByRole("link", { name: "Back to top" }).click();
  await expect(page).toHaveURL("/");
});
