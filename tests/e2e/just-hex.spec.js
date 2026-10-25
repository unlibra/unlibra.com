// E2E: Just HEX (/hex). The top page with its form, the color screen of the
// hash (/hex/#ffffff) without the header and the footer, its dock, and the
// share URLs (/hex/ffffff) that the Worker serves with the color's OGP.
import { expect, test } from "@playwright/test";

import { hexMessages as t } from "../../src/messages/hex.ts";
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

const expectColor = async (page, rgb) => {
  await expect(page.locator("body")).toHaveCSS("background-color", rgb);
  await expect(header(page)).toBeHidden();
  await expect(footer(page)).toBeHidden();
};

test.describe("Just HEX: the top page", () => {
  test("has the header, the footer, the title, the input and the button only", async ({
    page,
  }) => {
    await page.goto("/hex");
    await expect(page).toHaveTitle(`${t.name} - unlibra`);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(t.name);
    await expect(header(page)).toBeVisible();
    await expect(footer(page)).toBeVisible();
    await expect(input(page)).toHaveAttribute("placeholder", t.placeholder);
    await expect(showButton(page)).toBeVisible();
    await expect(dock(page)).toBeHidden();
    // No description and no breadcrumb: the main has the title and the form
    // (its label "Color code" is for screen readers only).
    const words = await page
      .locator("main")
      .evaluate((main) => main.innerText.split(/\s+/).filter(Boolean));
    expect(words).toEqual(["Just", "HEX", "Color", "code"]);
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
    await expect(input(page)).toHaveValue(/^#[0-9a-f]{6}$/);
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

  test("a code typed in the form fills the screen at /hex/#ffffff", async ({
    page,
  }) => {
    await page.goto("/hex");
    await input(page).fill("#F80");
    await showButton(page).click();
    await expect(page).toHaveURL("/hex/#ff8800");
    await expectColor(page, "rgb(255, 136, 0)");
    await expect(page).toHaveTitle("#ff8800 - Just HEX - unlibra");
    // Back to the top page, with the color in the input.
    await page.goBack();
    await expect(page).toHaveURL("/hex");
    await expect(header(page)).toBeVisible();
    await expect(input(page)).toHaveValue("#ff8800");
  });

  test("a code that is not a color stays on the form, told to screen readers only", async ({
    page,
  }) => {
    await page.goto("/hex");
    await input(page).fill("#12345");
    await input(page).press("Enter");
    await expect(page.getByRole("alert")).toHaveText(t.invalid);
    await expect(page.getByRole("alert")).toHaveClass(/\bsr-only\b/);
    await expect(input(page)).toHaveAttribute("aria-invalid", "true");
    await expect(page).toHaveURL("/hex");
    await input(page).fill("#123456");
    await expect(input(page)).not.toHaveAttribute("aria-invalid");
  });

  test("a hash that is not a color comes back to the form", async ({
    page,
  }) => {
    await page.goto("/hex#nope");
    await expect(header(page)).toBeVisible();
    await expect(input(page)).toHaveValue("nope");
    await expect(page.getByRole("alert")).toHaveText(t.invalid);
  });

  test("/hex/ without a hash is the top page at /hex", async ({ page }) => {
    await page.goto("/hex/");
    await expect(page).toHaveURL("/hex");
    await expect(header(page)).toBeVisible();
  });

  test("the glow behind the form takes the input's color, and fades without one", async ({
    page,
  }) => {
    await page.goto("/hex");
    const glow = page.locator("[data-hex-glow]");
    await expect(glow).toHaveAttribute("aria-hidden", "true");
    await expect(glow).toHaveCSS("pointer-events", "none");
    await input(page).fill("#ff5a36");
    await expect(glow).toHaveCSS(
      "background-image",
      /radial-gradient\(closest-side, rgb\(255, 90, 54\)/,
    );
    await input(page).fill("#12");
    await expect(glow).toHaveCSS(
      "background-image",
      /radial-gradient\(closest-side, rgba\(0, 0, 0, 0\)/,
    );
  });

  test("Show floods the screen with the color from the button, then the color screen", async ({
    page,
  }) => {
    await page.goto("/hex");
    await input(page).fill("#ff5a36");
    await showButton(page).click();
    const layer = page.locator("[data-hex-flood]");
    await expect(layer).toHaveAttribute("data-hex-flood", "out");
    await expect(layer).toHaveAttribute("aria-hidden", "true");
    // 400ms (the user's choice; 600ms at first).
    const duration = await layer.evaluate(
      (element) => element.getAnimations()[0]?.effect.getTiming().duration,
    );
    expect(duration).toBe(400);
    // The glow is drawn into the button at the same time.
    const glowEnd = await page
      .locator("[data-hex-glow]")
      .evaluate(
        (glow) =>
          glow.getAnimations()[0]?.effect.getKeyframes().at(-1)?.transform,
      );
    expect(glowEnd).toMatch(/^translate\(.+\) scale\(0\)$/);
    await expect(page).toHaveURL("/hex/#ff5a36");
    await expect(layer).not.toBeAttached();
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
    await expect(page).toHaveURL("/hex/#ff5a36");
    expect(await page.evaluate(() => window.flooded ?? false)).toBe(false);
  });

  test("375px: no horizontal scroll", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/hex");
    expect(await hasHorizontalScroll(page)).toBe(false);
  });
});

test.describe("Just HEX: the color screen", () => {
  test("the hash fills the screen from the first paint, without the layout", async ({
    page,
  }) => {
    await page.goto("/hex/#1a2b3c");
    await expectColor(page, "rgb(26, 43, 60)");
    // The pre-paint script has hidden the layout before the module ran.
    expect(
      await page.evaluate(() =>
        document.documentElement.hasAttribute("data-hex"),
      ),
    ).toBe(true);
  });

  test("/hex/#ffffff is served as it is, without a redirect", async ({
    page,
    request,
  }) => {
    const response = await request.get("/hex/", { maxRedirects: 0 });
    expect(response.status()).toBe(200);
    await page.goto("/hex/#ffffff");
    await expect(page).toHaveURL("/hex/#ffffff");
    await expectColor(page, "rgb(255, 255, 255)");
  });

  test("other spellings show at /hex/#ffffff", async ({ page }) => {
    await page.goto("/hex#ABC");
    await expect(page).toHaveURL("/hex/#aabbcc");
    await expectColor(page, "rgb(170, 187, 204)");
  });

  test("changing the hash changes the color; an empty hash is the top page", async ({
    page,
  }) => {
    await page.goto("/hex/#000000");
    await expectColor(page, "rgb(0, 0, 0)");
    await page.evaluate(() => (location.hash = "#00ff00"));
    await expectColor(page, "rgb(0, 255, 0)");
    await page.goBack();
    await expectColor(page, "rgb(0, 0, 0)");
    await page.evaluate(() => (location.hash = ""));
    await expect(header(page)).toBeVisible();
    await expect(page).toHaveURL("/hex");
  });

  test("the dock shows on coming to a color, then hides with the cursor", async ({
    page,
  }) => {
    await page.clock.install();
    await page.goto("/hex/#ff8800");
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
    await page.goto("/hex/#ff8800");
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
    await page.goto("/hex/#ff8800");
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
    await page.goto("/hex/#ff8800");
    await page.getByRole("button", { name: "Copy #ff8800" }).click();
    await expect(
      page.getByRole("button", { name: "Copy #ff8800" }),
    ).toBeFocused();
    // The pointer leaves the dock and stops: the dock hides all the same.
    await page.mouse.move(400, 200);
    await page.clock.runFor(2100);
    await expect(page.locator("html")).not.toHaveAttribute("data-dock");
  });

  test("Tab reaches the dock, which stays while it has the focus", async ({
    page,
  }) => {
    await page.clock.install();
    await page.goto("/hex/#ff8800");
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
      ["f4d35e", "oklab(0 0 0 / 0.6)", "rgb(255, 255, 255)"],
      // White at 60% (Tailwind's white, in oklab), its icons gray-900.
      ["1b1f3a", /^oklab\(0\.99\d* \S+ \S+ \/ 0\.6\)$/, /^oklch\(0\.21 /],
    ]) {
      await page.goto(`/hex/#${hex}`);
      await expect(dock(page)).toHaveAttribute(
        "data-tone",
        hex === "f4d35e" ? "light" : "dark",
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
    await page.goto("/hex/#ff8800");
    const items = [
      page.getByRole("link", { name: t.dock.top, exact: true }),
      page.getByRole("button", { name: "Copy #ff8800" }),
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

  test("Copy copies the code and says so", async ({
    page,
    context,
    baseURL,
  }) => {
    await grantClipboard(context, baseURL);
    await page.goto("/hex/#ff8800");
    const copy = page.getByRole("button", { name: "Copy #ff8800" });
    await copy.click();
    expect(await readClipboard(page)).toBe("#ff8800");
    await expect(page.locator("[data-hex-status]")).toHaveText(t.dock.copied);
    await expect(copy).toHaveAttribute("data-copied", "");
    await expect(copy.locator('[data-icon="check"]')).toBeVisible();
  });

  test("Share on X posts 'Just HEX | URL', in a new tab", async ({ page }) => {
    await page.goto("/hex/#ff8800");
    const share = page.getByRole("link", { name: t.dock.share });
    await expect(share).toHaveAttribute("target", "_blank");
    await expect(share).toHaveAttribute("rel", "noopener noreferrer");
    const url = new URL(await share.getAttribute("href"));
    expect(url.origin + url.pathname).toBe("https://x.com/intent/post");
    expect(url.searchParams.get("url")).toBe("https://unlibra.com/hex/ff8800");
    expect(url.searchParams.get("text")).toBe("Just HEX |");
  });

  test("Back to Just HEX goes to the top page, the color shrinking into the button", async ({
    page,
  }) => {
    await page.goto("/hex/#ff8800");
    const back = page.getByRole("link", { name: t.dock.top, exact: true });
    await expect(back).toHaveAttribute("href", "/hex");
    await back.click();
    const layer = page.locator("[data-hex-flood]");
    await expect(layer).toHaveAttribute("data-hex-flood", "in");
    // The glow comes back out of the button.
    const glowStart = await page
      .locator("[data-hex-glow]")
      .evaluate(
        (glow) => glow.getAnimations()[0]?.effect.getKeyframes()[0]?.transform,
      );
    expect(glowStart).toMatch(/^translate\(.+\) scale\(0\)$/);
    // The top page is under the shrinking color already.
    await expect(header(page)).toBeVisible();
    await expect(page).toHaveURL("/hex");
    await expect(layer).not.toBeAttached();
    // The same page: the input keeps the color.
    await expect(input(page)).toHaveValue("#ff8800");
  });

  test("after Show, Back to Just HEX is the history's back", async ({
    page,
  }) => {
    await page.goto("/hex");
    await input(page).fill("#3366ff");
    await showButton(page).click();
    await expect(page).toHaveURL("/hex/#3366ff");
    const length = await page.evaluate(() => history.length);
    await page.getByRole("link", { name: t.dock.top, exact: true }).click();
    await expect(page).toHaveURL("/hex");
    await expect(page.locator("[data-hex-flood]")).not.toBeAttached();
    await expect(input(page)).toHaveValue("#3366ff");
    expect(await page.evaluate(() => history.length)).toBe(length);
    // Forward comes back to the color.
    await page.goForward();
    await expectColor(page, "rgb(51, 102, 255)");
  });

  test("the browser's back shrinks the color too", async ({ page }) => {
    await page.goto("/hex");
    await input(page).fill("#3366ff");
    await showButton(page).click();
    await expect(page).toHaveURL("/hex/#3366ff");
    await page.goBack();
    await expect(page.locator("[data-hex-flood]")).toHaveAttribute(
      "data-hex-flood",
      "in",
    );
    await expect(page).toHaveURL("/hex");
    await expect(input(page)).toHaveValue("#3366ff");
  });

  test("with reduced motion, Back to Just HEX goes at once", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/hex/#ff8800");
    await page.getByRole("link", { name: t.dock.top, exact: true }).click();
    await expect(page).toHaveURL("/hex");
    await expect(page.locator("[data-hex-flood]")).not.toBeAttached();
    await expect(input(page)).toHaveValue("#ff8800");
  });
});

test.describe("Just HEX: the share URLs (the Worker)", () => {
  test("/hex/ffffff shows the color at /hex/#ffffff", async ({ page }) => {
    await page.goto("/hex/00aa55");
    await expect(page).toHaveURL("/hex/#00aa55");
    await expectColor(page, "rgb(0, 170, 85)");
  });

  test("/hex/ffffff has the color's title, OGP and canonical URL, and noindex", async ({
    request,
  }) => {
    const response = await request.get("/hex/ff8800");
    expect(response.status()).toBe(200);
    expect(response.headers()["x-frame-options"]).toBe("DENY");
    const html = await response.text();
    const content = (selector) =>
      html.match(new RegExp(`<meta ${selector} content="([^"]*)"`))?.[1];
    expect(html).toContain("<title>#ff8800 - Just HEX - unlibra</title>");
    expect(content('property="og:title"')).toBe("#ff8800 - Just HEX - unlibra");
    expect(content('property="og:url"')).toBe("https://unlibra.com/hex/ff8800");
    expect(content('property="og:image"')).toBe(
      "https://unlibra.com/hex/ff8800.png",
    );
    expect(content('name="twitter:image"')).toBe(
      "https://unlibra.com/hex/ff8800.png",
    );
    expect(content('property="og:description"')).toBe(
      "A screen filled with #ff8800.",
    );
    expect(html).toContain(
      '<link rel="canonical" href="https://unlibra.com/hex/ff8800">',
    );
    expect(html).toContain('<meta name="robots" content="noindex" />');
  });

  test("/hex keeps the site's OGP and is indexed", async ({ request }) => {
    const html = await (await request.get("/hex")).text();
    expect(html).toContain('content="https://unlibra.com/ogp.png"');
    expect(html).not.toContain("noindex");
  });

  test("/hex/ffffff.png is the color's image, cached for good", async ({
    request,
  }) => {
    const response = await request.get("/hex/ff8800.png");
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
      ["/hex/FFF", "/hex/ffffff"],
      ["/hex/FF8800", "/hex/ff8800"],
      ["/hex/f80.png", "/hex/ff8800.png"],
    ]) {
      const response = await request.get(from, { maxRedirects: 0 });
      expect(response.status(), from).toBe(301);
      expect(new URL(response.headers().location).pathname, from).toBe(to);
    }
  });

  test("anything else under /hex/ is not found", async ({ request }) => {
    for (const path of [
      "/hex/zzz",
      "/hex/ff88001",
      "/hex/ff8800/x",
      "/hex/x.png",
    ]) {
      const response = await request.get(path, { maxRedirects: 0 });
      expect(response.status(), path).toBe(404);
    }
  });
});
