// E2E: Just HEX (/hex). The top page with its form and its share dialog,
// the color screen (/hex/FFFFFF) without the header and the footer, its
// dock, and the Worker that serves the colors' URLs with their OGP.
import { expect, test } from "@playwright/test";

import { hexMessages as t } from "../../src/tools/just-hex/messages.ts";
import {
  grantClipboard,
  hasHorizontalScroll,
  readClipboard,
} from "./helpers.js";

const header = (page) => page.locator("header");
const footer = (page) => page.locator("footer");
const input = (page) => page.getByRole("textbox", { name: t.colorCode });
const showButton = (page) =>
  page.getByRole("button", { name: t.show, exact: true });
const dock = (page) => page.locator("[data-hex-dock]");
const shareButton = (page) =>
  page.getByRole("button", { name: t.share.open, exact: true });
const dialog = (page) => page.getByRole("dialog", { name: t.share.title });
const dockCopy = (page) =>
  page.getByRole("button", { name: t.dock.copy, exact: true });

/**
 * Records every color layer that floods or shrinks: it lasts 400ms, which a
 * busy run can miss when it looks for it on the page.
 */
const recordSweeps = (page) =>
  page.addInitScript(() => {
    window.sweeps = [];
    new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node.dataset?.hexFlood === undefined) continue;
          window.sweeps.push({
            direction: node.dataset.hexFlood,
            hidden: node.getAttribute("aria-hidden"),
            duration: node.getAnimations()[0]?.effect.getTiming().duration,
          });
        }
      }
    }).observe(document, { childList: true, subtree: true });
  });
const sweeps = (page) => page.evaluate(() => window.sweeps);

const expectColor = async (page, rgb) => {
  await expect(page.locator("body")).toHaveCSS("background-color", rgb);
  await expect(header(page)).toBeHidden();
  await expect(footer(page)).toBeHidden();
};

test.describe("Just HEX: the top page", () => {
  test("has the header, the footer, the title, the input, the button and Share only", async ({
    page,
  }) => {
    await page.goto("/hex");
    await expect(page).toHaveTitle(`${t.name} - unlibra`);
    // A Japanese page, with the site's Japanese header and footer; the app
    // is in English (just-hex JH-16).
    await expect(page.locator("html")).toHaveAttribute("lang", "ja");
    await expect(page.locator("main")).toHaveAttribute("lang", "en");
    await expect(page.locator("[data-hex-screen]")).toHaveAttribute(
      "lang",
      "en",
    );
    await expect(page.locator("[data-hex-dialog]")).toHaveAttribute(
      "lang",
      "en",
    );
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(t.name);
    await expect(header(page)).toBeVisible();
    await expect(footer(page)).toBeVisible();
    await expect(input(page)).toHaveAttribute("placeholder", t.placeholder);
    await expect(showButton(page)).toBeVisible();
    await expect(dock(page)).toBeHidden();
    await expect(shareButton(page)).toBeVisible();
    // No description and no breadcrumb: the main has the title, the form
    // (its label "Color code" is for screen readers only) and Share.
    const words = await page
      .locator("main")
      .evaluate((main) => main.innerText.split(/\s+/).filter(Boolean));
    expect(words).toEqual([
      "Just",
      "HEX",
      "Color",
      "code",
      "Share",
      "this",
      "color",
    ]);
    await expect(
      shareButton(page).locator('[data-icon="share"]'),
    ).toBeVisible();
    await expect(page.locator("label[for=hex-input]")).toHaveClass(
      /\bsr-only\b/,
    );
  });

  test("has no breadcrumb, visible or in the structured data", async ({
    page,
  }) => {
    await page.goto("/hex");
    await expect(
      page.getByRole("navigation", { name: "Breadcrumb" }),
    ).toHaveCount(0);
    expect(await page.content()).not.toContain("BreadcrumbList");
  });

  test("the input starts with a random color, and the button takes it", async ({
    page,
  }) => {
    await page.goto("/hex");
    await expect(input(page)).toHaveValue(/^#[0-9A-F]{6}$/);
    const value = await input(page).inputValue();
    const [r, g, b] = value
      .slice(1)
      .match(/../g)
      .map((pair) => parseInt(pair, 16));
    await expect(showButton(page)).toHaveCSS(
      "background-color",
      `rgb(${r}, ${g}, ${b})`,
    );
    // The arrow is black on a light color and white on a dark one.
    await input(page).fill("#ffffff");
    await expect(showButton(page)).toHaveAttribute("data-tone", "light");
    await input(page).fill("#000000");
    await expect(showButton(page)).toHaveAttribute("data-tone", "dark");
    await input(page).fill("#12");
    await expect(showButton(page)).toHaveAttribute("data-empty", "");
    // Never a border (the user's choice): the arrow shows the button.
    for (const code of ["#ffffff", "#000000", "#12"]) {
      await input(page).fill(code);
      await expect(showButton(page)).toHaveCSS("border-top-width", "0px");
    }
  });

  test("the arrow grows a little on hover, without changing its color (JH-17)", async ({
    page,
  }) => {
    await page.goto("/hex");
    await input(page).fill("#3366ff");
    await expect(showButton(page)).toHaveCSS("scale", "none");
    await showButton(page).hover();
    await expect(showButton(page)).toHaveCSS("scale", "1.08");
    await expect(showButton(page)).toHaveCSS(
      "background-color",
      "rgb(51, 102, 255)",
    );
  });

  test("with reduced motion, the arrow does not grow on hover", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/hex");
    await showButton(page).hover();
    await expect(showButton(page)).toHaveCSS("scale", "none");
  });

  test("a code typed in the form fills the screen at /hex/FFFFFF", async ({
    page,
  }) => {
    await page.goto("/hex");
    await input(page).fill("#f80");
    await showButton(page).click();
    await expect(page).toHaveURL("/hex/FF8800");
    await expectColor(page, "rgb(255, 136, 0)");
    await expect(page).toHaveTitle("#FF8800 - Just HEX - unlibra");
    // Back to the top page, with the color in the input.
    await page.goBack();
    await expect(page).toHaveURL("/hex");
    await expect(header(page)).toBeVisible();
    await expect(input(page)).toHaveValue("#FF8800");
  });

  test("a code that is not a color stays on the form, with the error under the input", async ({
    page,
  }) => {
    await page.goto("/hex");
    const stage = await page.locator("[data-hex-stage]").boundingBox();
    await input(page).fill("#12345");
    await input(page).press("Enter");
    await expect(page.getByRole("alert")).toHaveText(t.invalid);
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(input(page)).toHaveAttribute("aria-invalid", "true");
    await expect(page).toHaveURL("/hex");
    // Under the input, and nothing else moves.
    const inputBox = await input(page).boundingBox();
    const errorBox = await page.getByRole("alert").boundingBox();
    expect(errorBox.y).toBeGreaterThanOrEqual(inputBox.y + inputBox.height);
    expect(await page.locator("[data-hex-stage]").boundingBox()).toEqual(stage);
    await input(page).fill("#123456");
    await expect(input(page)).not.toHaveAttribute("aria-invalid");
    await expect(page.getByRole("alert")).toHaveText("");
  });

  test("a hash that is not a color comes to /hex?invalid=, the form with the error", async ({
    page,
  }) => {
    await page.goto("/hex#nope");
    await expect(page).toHaveURL("/hex?invalid=nope");
    await expect(header(page)).toBeVisible();
    await expect(input(page)).toHaveValue("nope");
    await expect(page.getByRole("alert")).toHaveText(t.invalid);
    await expect(page.getByRole("alert")).toBeVisible();
  });

  test("/hex?invalid= shows the code in the input, with the error", async ({
    page,
  }) => {
    await page.goto("/hex?invalid=%23zz");
    await expect(input(page)).toHaveValue("#zz");
    await expect(input(page)).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByRole("alert")).toHaveText(t.invalid);
    await expect(shareButton(page)).toBeDisabled();
  });

  test("/hex/ without a hash is the top page at /hex", async ({ page }) => {
    await page.goto("/hex/");
    await expect(page).toHaveURL("/hex");
    await expect(header(page)).toBeVisible();
  });

  test("Show floods the screen with the color from the button, then the color screen", async ({
    page,
  }) => {
    await recordSweeps(page);
    await page.goto("/hex");
    await input(page).fill("#ff5a36");
    await showButton(page).click();
    await expect(page).toHaveURL("/hex/FF5A36");
    // One layer, hidden from screen readers, in 400ms (the user's choice;
    // 600ms at first).
    expect(await sweeps(page)).toEqual([
      { direction: "out", hidden: "true", duration: 400 },
    ]);
    await expect(page.locator("[data-hex-flood]")).not.toBeAttached();
    await expectColor(page, "rgb(255, 90, 54)");
  });

  test("with reduced motion, Show goes to the color at once", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/hex");
    await page.evaluate(() => {
      new MutationObserver((records) => {
        for (const record of records) {
          for (const node of record.addedNodes) {
            if (node.dataset?.hexFlood !== undefined) window.flooded = true;
          }
        }
      }).observe(document.body, { childList: true });
    });
    await input(page).fill("#ff5a36");
    await showButton(page).click();
    await expect(page).toHaveURL("/hex/FF5A36");
    expect(await page.evaluate(() => window.flooded ?? false)).toBe(false);
  });

  test("the title, the input, the arrow and Share fade into view at once, in 0.5s, colored", async ({
    page,
  }) => {
    await page.goto("/hex");
    const stage = page.locator("[data-hex-stage]");
    await expect(stage).toHaveAttribute("data-ready", "");
    await expect(stage).toHaveCSS("animation-name", "hex-fade");
    await expect(stage).toHaveCSS("animation-duration", "0.5s");
    await expect(stage).toHaveCSS("animation-delay", "0s");
    // Nothing inside fades on its own (no more one after another).
    for (const element of [
      page.locator("h1"),
      input(page),
      showButton(page),
      shareButton(page),
    ]) {
      await expect(element).toHaveCSS("animation-name", "none");
    }
    // The button already has the first color when the page appears.
    await expect(showButton(page)).not.toHaveAttribute("data-empty");
    // Back from a color, the top page is in place (the color shrinks into
    // the button).
    await input(page).fill("#3366ff");
    await showButton(page).click();
    await expect(page).toHaveURL("/hex/3366FF");
    await page.goBack();
    await expect(page).toHaveURL("/hex");
    await expect(stage).toHaveCSS("animation-name", "none");
  });

  test("with reduced motion, the top page does not fade in", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/hex");
    await expect(page.locator("[data-hex-stage]")).toHaveAttribute(
      "data-ready",
      "",
    );
    await expect(page.locator("[data-hex-stage]")).toHaveCSS(
      "animation-name",
      "none",
    );
    await expect(page.locator("[data-hex-stage]")).toHaveCSS("opacity", "1");
  });

  test("375px: no horizontal scroll", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/hex");
    expect(await hasHorizontalScroll(page)).toBe(false);
  });
});

test.describe("Just HEX: the color screen", () => {
  test("the color's URL fills the screen from the first paint, without the layout", async ({
    page,
  }) => {
    await page.goto("/hex/1A2B3C");
    await expectColor(page, "rgb(26, 43, 60)");
    // The pre-paint script has hidden the layout before the module ran.
    expect(
      await page.evaluate(() =>
        document.documentElement.hasAttribute("data-hex"),
      ),
    ).toBe(true);
  });

  test("/hex/ is the top page's (the static assets redirect it to /hex), and /hex/#fff shows at /hex/FFFFFF", async ({
    page,
    request,
  }) => {
    const response = await request.get("/hex/", { maxRedirects: 0 });
    expect(response.status()).toBe(307);
    expect(new URL(response.headers().location, "http://x").pathname).toBe(
      "/hex",
    );
    await page.goto("/hex/#fff");
    await expect(page).toHaveURL("/hex/FFFFFF");
    await expectColor(page, "rgb(255, 255, 255)");
  });

  test("a hash on the top page shows at /hex/FFFFFF", async ({ page }) => {
    await page.goto("/hex#ABC");
    await expect(page).toHaveURL("/hex/AABBCC");
    await expectColor(page, "rgb(170, 187, 204)");
  });

  test("a hash typed on the top page shows its color; back is the top page", async ({
    page,
  }) => {
    await page.goto("/hex");
    await page.evaluate(() => (location.hash = "#00ff00"));
    await expect(page).toHaveURL("/hex/00FF00");
    await expectColor(page, "rgb(0, 255, 0)");
    await page.goBack();
    await expect(page).toHaveURL("/hex");
    await expect(header(page)).toBeVisible();
  });

  test("the dock shows on coming to a color, then hides with the cursor", async ({
    page,
  }) => {
    await page.clock.install();
    await page.goto("/hex/FF8800");
    await expect(page.locator("html")).toHaveAttribute("data-dock", "");
    await expect(dock(page)).toHaveCSS("pointer-events", "auto");
    await page.clock.runFor(3100);
    await expect(page.locator("html")).not.toHaveAttribute("data-dock");
    // Hidden, it takes no clicks, and the cursor is gone too.
    await expect(dock(page)).toHaveCSS("pointer-events", "none");
    await expect(page.locator("html")).toHaveCSS("cursor", "none");
  });

  test("a mouse move shows the dock; it stays while the pointer is on it", async ({
    page,
  }) => {
    await page.clock.install();
    await page.goto("/hex/FF8800");
    await page.clock.runFor(3100);
    await page.mouse.move(400, 300);
    await expect(page.locator("html")).toHaveAttribute("data-dock", "");
    await page.clock.runFor(2100);
    await expect(page.locator("html")).not.toHaveAttribute("data-dock");
    await page.mouse.move(400, 310);
    await dock(page).hover();
    await page.clock.runFor(10000);
    await expect(page.locator("html")).toHaveAttribute("data-dock", "");
  });

  test("a tap shows the dock, and a tap while it is shown hides it", async ({
    page,
  }) => {
    await page.clock.install();
    await page.goto("/hex/FF8800");
    await page.clock.runFor(3100);
    const tap = () =>
      page.evaluate(() =>
        document.querySelector("[data-hex-screen]").dispatchEvent(
          new PointerEvent("pointerdown", {
            pointerType: "touch",
            bubbles: true,
          }),
        ),
      );
    await tap();
    await expect(page.locator("html")).toHaveAttribute("data-dock", "");
    await tap();
    await expect(page.locator("html")).not.toHaveAttribute("data-dock");
    await tap();
    await page.clock.runFor(3100);
    await expect(page.locator("html")).not.toHaveAttribute("data-dock");
  });

  test("a button pressed with the mouse does not keep the dock", async ({
    page,
    context,
    baseURL,
  }) => {
    await grantClipboard(context, baseURL);
    await page.clock.install();
    await page.goto("/hex/FF8800");
    await dockCopy(page).click();
    await expect(dockCopy(page)).toBeFocused();
    // The pointer leaves the dock and stops: the dock hides all the same.
    await page.mouse.move(400, 200);
    await page.clock.runFor(2100);
    await expect(page.locator("html")).not.toHaveAttribute("data-dock");
  });

  test("Tab reaches the dock, which stays while it has the focus", async ({
    page,
  }) => {
    await page.clock.install();
    await page.goto("/hex/FF8800");
    await page.clock.runFor(3100);
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("link", { name: t.dock.top, exact: true }),
    ).toBeFocused();
    await expect(page.locator("html")).toHaveAttribute("data-dock", "");
    await page.clock.runFor(10000);
    await expect(page.locator("html")).toHaveAttribute("data-dock", "");
  });

  test("the dock is the color's opposite, without a border, with a weak shadow", async ({
    page,
  }) => {
    for (const [hex, background, color] of [
      ["F4D35E", "oklab(0 0 0 / 0.6)", "rgb(255, 255, 255)"],
      // White at 60% (Tailwind's white, in oklab), its icons gray-900.
      ["1B1F3A", /^oklab\(0\.99\d* \S+ \S+ \/ 0\.6\)$/, /^oklch\(0\.21 /],
    ]) {
      await page.goto(`/hex/${hex}`);
      await expect(dock(page)).toHaveAttribute(
        "data-tone",
        hex === "F4D35E" ? "light" : "dark",
      );
      await expect(dock(page)).toHaveCSS("background-color", background);
      await expect(dock(page)).toHaveCSS("color", color);
      // No border (nor ring), a weak shadow, and 8px of room on every side.
      await expect(dock(page)).toHaveCSS("border-top-width", "0px");
      await expect(dock(page)).not.toHaveCSS("box-shadow", "none");
      await expect(dock(page)).not.toHaveCSS("box-shadow", /inset/);
      for (const side of ["top", "right", "bottom", "left"]) {
        await expect(dock(page)).toHaveCSS(`padding-${side}`, "8px");
      }
    }
  });

  test("the dock's icon buttons are 44px, named for screen readers", async ({
    page,
  }) => {
    await page.goto("/hex/FF8800");
    const items = [
      page.getByRole("link", { name: t.dock.top, exact: true }),
      dockCopy(page),
      page.getByRole("link", { name: t.dock.share }),
    ];
    for (const item of items) {
      const box = await item.boundingBox();
      expect(Math.round(box.width)).toBe(44);
      expect(Math.round(box.height)).toBe(44);
      for (const icon of await item.locator("svg").all()) {
        await expect(icon).toHaveAttribute("aria-hidden", "true");
      }
    }
    await expect(page.getByRole("group", { name: t.dock.label })).toBeVisible();
  });

  test("the dock's back, copy and share are in this order: palette, link, X", async ({
    page,
  }) => {
    await page.goto("/hex/FF8800");
    const icons = await dock(page)
      .locator("svg")
      .evaluateAll((svgs) =>
        svgs
          .filter((svg) => getComputedStyle(svg).display !== "none")
          .map((svg) => svg.dataset.icon),
      );
    expect(icons).toEqual(["palette", "link", "brand-x"]);
    // The color code's copy is gone (the user's request, JH-16).
    await expect(dock(page).locator('[data-icon="copy"]')).toHaveCount(0);
  });

  test("Copy link copies 'Just HEX | URL' and says so", async ({
    page,
    context,
    baseURL,
  }) => {
    await grantClipboard(context, baseURL);
    await page.goto("/hex/FF8800");
    const copy = dockCopy(page);
    await copy.click();
    expect(await readClipboard(page)).toBe(
      "Just HEX | https://unlibra.com/hex/FF8800",
    );
    await expect(page.locator("[data-hex-status]")).toHaveText(t.copied);
    await expect(copy).toHaveAttribute("data-copied", "");
    await expect(copy.locator('[data-icon="check"]')).toBeVisible();
  });

  test("Share on X posts 'Just HEX | URL', in a new tab", async ({ page }) => {
    await page.goto("/hex/FF8800");
    const share = page.getByRole("link", { name: t.dock.share });
    await expect(share).toHaveAttribute("target", "_blank");
    await expect(share).toHaveAttribute("rel", "noopener noreferrer");
    const url = new URL(await share.getAttribute("href"));
    // The intent X documents (/intent/tweet), which opens the X app on a
    // phone; not the alias /intent/post.
    expect(url.origin + url.pathname).toBe("https://x.com/intent/tweet");
    expect(url.searchParams.get("url")).toBe("https://unlibra.com/hex/FF8800");
    expect(url.searchParams.get("text")).toBe("Just HEX |");
  });

  test("Back to Just HEX goes to the top page, the color shrinking into the button", async ({
    page,
  }) => {
    await recordSweeps(page);
    await page.goto("/hex/FF8800");
    const back = page.getByRole("link", { name: t.dock.top, exact: true });
    await expect(back).toHaveAttribute("href", "/hex");
    await back.click();
    await expect(header(page)).toBeVisible();
    await expect(page).toHaveURL("/hex");
    expect(await sweeps(page)).toEqual([
      { direction: "in", hidden: "true", duration: 400 },
    ]);
    await expect(page.locator("[data-hex-flood]")).not.toBeAttached();
    // The same page: the input keeps the color.
    await expect(input(page)).toHaveValue("#FF8800");
  });

  test("after Show, Back to Just HEX is the history's back", async ({
    page,
  }) => {
    await page.goto("/hex");
    await input(page).fill("#3366ff");
    await showButton(page).click();
    await expect(page).toHaveURL("/hex/3366FF");
    const length = await page.evaluate(() => history.length);
    await page.getByRole("link", { name: t.dock.top, exact: true }).click();
    await expect(page).toHaveURL("/hex");
    await expect(page.locator("[data-hex-flood]")).not.toBeAttached();
    await expect(input(page)).toHaveValue("#3366FF");
    expect(await page.evaluate(() => history.length)).toBe(length);
    // Forward comes back to the color.
    await page.goForward();
    await expectColor(page, "rgb(51, 102, 255)");
  });

  test("after Show and a reload, Back to Just HEX is still the history's back", async ({
    page,
  }) => {
    await page.goto("/hex");
    await input(page).fill("#3366ff");
    await showButton(page).click();
    await expect(page).toHaveURL("/hex/3366FF");
    await page.reload();
    await expectColor(page, "rgb(51, 102, 255)");
    const length = await page.evaluate(() => history.length);
    await page.getByRole("link", { name: t.dock.top, exact: true }).click();
    await expect(page).toHaveURL("/hex");
    expect(await page.evaluate(() => history.length)).toBe(length);
  });

  test("from a top page with a hash that is no color, back after Show keeps the color", async ({
    page,
  }) => {
    await page.goto("/hex#nope");
    await expect(page).toHaveURL("/hex?invalid=nope");
    await expect(input(page)).toHaveValue("nope");
    await input(page).fill("#3366ff");
    await showButton(page).click();
    await expect(page).toHaveURL("/hex/3366FF");
    await page.getByRole("link", { name: t.dock.top, exact: true }).click();
    await expect(page).toHaveURL("/hex");
    await expect(input(page)).toHaveValue("#3366FF");
    await expect(input(page)).not.toHaveAttribute("aria-invalid");
  });

  test("the browser's back shrinks the color too", async ({ page }) => {
    await recordSweeps(page);
    await page.goto("/hex");
    await input(page).fill("#3366ff");
    await showButton(page).click();
    await expect(page).toHaveURL("/hex/3366FF");
    await page.goBack();
    await expect(page).toHaveURL("/hex");
    await expect
      .poll(async () => (await sweeps(page)).map(({ direction }) => direction))
      .toEqual(["out", "in"]);
    await expect(input(page)).toHaveValue("#3366FF");
  });

  test("with reduced motion, Back to Just HEX goes at once", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/hex/FF8800");
    await page.getByRole("link", { name: t.dock.top, exact: true }).click();
    await expect(page).toHaveURL("/hex");
    await expect(page.locator("[data-hex-flood]")).not.toBeAttached();
    await expect(input(page)).toHaveValue("#FF8800");
  });
});

test.describe("Just HEX: the dock on a touch screen", () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });

  test("a tapped dock button does not keep the dock (its :hover stays after a tap)", async ({
    page,
    context,
    baseURL,
  }) => {
    await grantClipboard(context, baseURL);
    await page.clock.install();
    await page.goto("/hex/FF8800");
    const copy = dockCopy(page);
    await copy.tap();
    expect(await readClipboard(page)).toBe(
      "Just HEX | https://unlibra.com/hex/FF8800",
    );
    // The tapped button keeps :hover, as on a phone.
    expect(
      await dock(page).evaluate((element) => element.matches(":hover")),
    ).toBe(true);
    await page.clock.runFor(3100);
    await expect(page.locator("html")).not.toHaveAttribute("data-dock");
  });
});

test.describe("Just HEX: the colors' URLs (the Worker)", () => {
  test("another spelling of a color redirects to /hex/FFFFFF, which shows it", async ({
    page,
  }) => {
    await page.goto("/hex/00aa55");
    await expect(page).toHaveURL("/hex/00AA55");
    await expectColor(page, "rgb(0, 170, 85)");
  });

  test("/hex/FFFFFF has the color's title, OGP and canonical URL, and noindex", async ({
    request,
  }) => {
    const response = await request.get("/hex/FF8800");
    expect(response.status()).toBe(200);
    expect(response.headers()["x-frame-options"]).toBe("DENY");
    const html = await response.text();
    const content = (selector) =>
      html.match(new RegExp(`<meta ${selector} content="([^"]*)"`))?.[1];
    expect(html).toContain("<title>#FF8800 - Just HEX - unlibra</title>");
    // The titles and descriptions the user wrote (JH-16).
    expect(content('property="og:title"')).toBe("#FF8800");
    expect(content('name="twitter:title"')).toBe("#FF8800");
    expect(content('property="og:description"')).toBe(
      "Just HEX — Just one color.",
    );
    expect(content('name="twitter:description"')).toBe(
      "Just HEX — Just one color.",
    );
    expect(content('name="description"')).toBe(t.description);
    expect(content('name="twitter:card"')).toBe("summary_large_image");
    expect(content('property="og:url"')).toBe("https://unlibra.com/hex/FF8800");
    expect(content('property="og:image"')).toBe(
      "https://unlibra.com/hex/FF8800.png",
    );
    expect(content('name="twitter:image"')).toBe(
      "https://unlibra.com/hex/FF8800.png",
    );
    expect(html).toContain(
      '<link rel="canonical" href="https://unlibra.com/hex/FF8800">',
    );
    expect(html).toContain('<meta name="robots" content="noindex" />');
  });

  test("/hex keeps the site's OGP image, has the description, and is indexed", async ({
    request,
  }) => {
    const html = await (await request.get("/hex")).text();
    expect(html).toContain('content="https://unlibra.com/ogp.png"');
    for (const selector of [
      'name="description"',
      'property="og:description"',
      'name="twitter:description"',
    ]) {
      expect(html).toContain(`<meta ${selector} content="${t.description}">`);
    }
    expect(html).not.toContain("noindex");
  });

  test("/hex/FFFFFF.png is the color's image, cached for good", async ({
    request,
  }) => {
    const response = await request.get("/hex/FF8800.png");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toBe("image/png");
    expect(response.headers()["cache-control"]).toBe(
      "public, max-age=31536000, immutable",
    );
    const png = await response.body();
    expect(png.subarray(1, 4).toString()).toBe("PNG");
  });

  test("other spellings redirect to the one written form", async ({
    request,
  }) => {
    for (const [from, to] of [
      ["/hex/fff", "/hex/FFFFFF"],
      ["/hex/FFF", "/hex/FFFFFF"],
      ["/hex/ff8800", "/hex/FF8800"],
      ["/hex/f80.png", "/hex/FF8800.png"],
    ]) {
      const response = await request.get(from, { maxRedirects: 0 });
      expect(response.status(), from).toBe(301);
      expect(new URL(response.headers().location).pathname, from).toBe(to);
    }
  });

  test("a path that is no color goes to /hex?invalid=, the top page with the error", async ({
    page,
    request,
  }) => {
    for (const [path, code] of [
      ["/hex/zzz", "zzz"],
      ["/hex/ff88001", "ff88001"],
      ["/hex/ff8800/x", "ff8800/x"],
    ]) {
      const response = await request.get(path, { maxRedirects: 0 });
      expect(response.status(), path).toBe(302);
      const location = new URL(response.headers().location);
      expect(location.pathname, path).toBe("/hex");
      expect(location.searchParams.get("invalid"), path).toBe(code);
    }
    await page.goto("/hex/zzz");
    await expect(page).toHaveURL("/hex?invalid=zzz");
    await expect(header(page)).toBeVisible();
    await expect(input(page)).toHaveValue("zzz");
    await expect(page.getByRole("alert")).toHaveText(t.invalid);
    await expect(page.getByRole("alert")).toBeVisible();
  });

  test("an image that is no color is not found", async ({ request }) => {
    const response = await request.get("/hex/x.png", { maxRedirects: 0 });
    expect(response.status()).toBe(404);
  });
});

test.describe("Just HEX: the share dialog of the top page", () => {
  for (const scheme of ["light", "dark"]) {
    test(`${scheme}: Share opens the dialog in the site's theme, with the share card in the input's color (JH-20)`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto("/hex");
      await input(page).fill("#a0d8ef");
      await shareButton(page).click();
      await expect(dialog(page)).toBeVisible();
      // The theme's ground, whatever the color: gray-100, or the dark.
      await expect(dialog(page)).toHaveCSS(
        "background-color",
        scheme === "light" ? /^oklch\(0\.967 / : "rgb(40, 44, 52)",
      );
      await expect(dialog(page)).toContainText(t.name);
      await expect(dialog(page)).toContainText("unlibra.com/hex/A0D8EF");
      // The card: white or a lighter dark, with a thin border and a
      // shadow; the color edge to edge on top (no bezel).
      const card = dialog(page).locator("[data-hex-dialog-card]");
      await expect(card).toHaveCSS(
        "background-color",
        scheme === "light" ? "rgb(255, 255, 255)" : "rgb(61, 65, 72)",
      );
      await expect(card).toHaveCSS("border-top-width", "1px");
      await expect(card).not.toHaveCSS("box-shadow", "none");
      await expect(card).toHaveCSS("padding-top", "0px");
      const color = dialog(page).locator("[data-hex-dialog-color]");
      await expect(color).toHaveCSS("background-color", "rgb(160, 216, 239)");
      const cardBox = await card.boundingBox();
      const colorBox = await color.boundingBox();
      expect(Math.round(colorBox.width)).toBe(Math.round(cardBox.width - 2));
      // Another color: the ground stays, the card's color changes.
      await page.keyboard.press("Escape");
      await input(page).fill("#1b1f3a");
      await shareButton(page).click();
      await expect(color).toHaveCSS("background-color", "rgb(27, 31, 58)");
      await expect(dialog(page)).toContainText("unlibra.com/hex/1B1F3A");
    });
  }

  test("the dialog has no title; its close button is as far from the top as from the right", async ({
    page,
  }) => {
    await page.goto("/hex");
    await shareButton(page).click();
    // Named for screen readers only.
    await expect(dialog(page).getByRole("heading")).toHaveCount(0);
    await expect(dialog(page)).toHaveAttribute("aria-label", t.share.title);
    const box = await dialog(page).boundingBox();
    const icon = await dialog(page)
      .getByRole("button", { name: t.share.close })
      .locator("svg")
      .boundingBox();
    const top = icon.y - box.y;
    const right = box.x + box.width - (icon.x + icon.width);
    expect(Math.abs(top - right)).toBeLessThan(1);
  });

  test("the card is small in the middle of the dialog", async ({ page }) => {
    await page.goto("/hex");
    await shareButton(page).click();
    const box = await dialog(page).boundingBox();
    const card = await dialog(page)
      .locator("[data-hex-dialog-card]")
      .boundingBox();
    expect(card.width).toBeLessThan(box.width * 0.65);
    expect(
      Math.abs(card.x - box.x - (box.x + box.width - card.x - card.width)),
    ).toBeLessThan(1);
  });

  test("Share on X changes its color on hover, in either theme", async ({
    page,
  }) => {
    for (const scheme of ["light", "dark"]) {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto("/hex");
      await shareButton(page).click();
      const share = dialog(page).getByRole("link", { name: t.share.x });
      await page.mouse.move(0, 0);
      const rest = await share.evaluate(
        (element) => getComputedStyle(element).backgroundColor,
      );
      await share.hover();
      await expect(share).not.toHaveCSS("background-color", rest);
      await page.keyboard.press("Escape");
    }
  });

  test("Share cannot be pressed while the input is no color", async ({
    page,
  }) => {
    await page.goto("/hex");
    await input(page).fill("#12");
    await expect(shareButton(page)).toBeDisabled();
    await input(page).fill("#123");
    await expect(shareButton(page)).toBeEnabled();
  });

  test("Copy link copies 'Just HEX | URL' and says so in the dialog", async ({
    page,
    context,
    baseURL,
  }) => {
    await grantClipboard(context, baseURL);
    await page.goto("/hex");
    await input(page).fill("#ff5a36");
    await shareButton(page).click();
    const copy = dialog(page).getByRole("button", { name: t.share.copy });
    await copy.click();
    // Its name is now what it shows ("Copied!"), for 2 seconds.
    await expect(copy).toHaveCount(0);
    const copied = dialog(page).getByRole("button", { name: t.copied });
    expect(await readClipboard(page)).toBe(
      "Just HEX | https://unlibra.com/hex/FF5A36",
    );
    await expect(copied).toHaveAttribute("data-copied", "");
    await expect(copied.locator('[data-icon="check"]')).toBeVisible();
    await expect(page.locator("[data-hex-dialog-status]")).toHaveText(t.copied);
  });

  test("Share on X posts 'Just HEX | URL', in a new tab", async ({ page }) => {
    await page.goto("/hex");
    await input(page).fill("#ff5a36");
    await shareButton(page).click();
    const share = dialog(page).getByRole("link", { name: t.share.x });
    await expect(share).toHaveText(t.share.xLabel);
    await expect(share.locator('[data-icon="brand-x"]')).toBeVisible();
    await expect(share).toHaveAttribute("target", "_blank");
    await expect(share).toHaveAttribute("rel", "noopener noreferrer");
    const url = new URL(await share.getAttribute("href"));
    expect(url.origin + url.pathname).toBe("https://x.com/intent/tweet");
    expect(url.searchParams.get("url")).toBe("https://unlibra.com/hex/FF5A36");
    expect(url.searchParams.get("text")).toBe("Just HEX |");
  });

  test("the close button, Esc and a click on the backdrop close the dialog", async ({
    page,
  }) => {
    await page.goto("/hex");
    for (const close of [
      () => dialog(page).getByRole("button", { name: t.share.close }).click(),
      () => page.keyboard.press("Escape"),
      () => page.mouse.click(5, 5),
    ]) {
      await shareButton(page).click();
      await expect(dialog(page)).toBeVisible();
      await close();
      await expect(dialog(page)).toBeHidden();
    }
    // A click in the dialog does not close it.
    await shareButton(page).click();
    await dialog(page).getByText(t.name, { exact: true }).click();
    await expect(dialog(page)).toBeVisible();
  });

  test("375px: the dialog fits, without a horizontal scroll", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/hex");
    await shareButton(page).click();
    const box = await dialog(page).boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(16);
    expect(box.x + box.width).toBeLessThanOrEqual(375 - 16);
    expect(await hasHorizontalScroll(page)).toBe(false);
  });
});
