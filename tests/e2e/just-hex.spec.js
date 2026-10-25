// E2E: Just HEX (/hex). The top page with its form, the color screen of the
// hash (/hex/#ffffff) without the header and the footer, its menu, and the
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
const openMenu = (page) => page.getByRole("button", { name: t.openMenu });
const menu = (page) => page.getByRole("dialog", { name: /^#[0-9a-f]{6}$/ });

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
    await expect(openMenu(page)).toBeHidden();
    // No description: the main has the breadcrumb, the title and the form
    // (its label "Color code" is for screen readers only).
    const words = await page
      .locator("main")
      .evaluate((main) => main.innerText.split(/\s+/).filter(Boolean));
    expect(words).toEqual([
      "Home",
      "Just",
      "HEX",
      "Just",
      "HEX",
      "Color",
      "code",
    ]);
    await expect(page.locator("label[for=hex-input]")).toHaveClass(
      /\bsr-only\b/,
    );
  });

  test("the breadcrumb's Home has no (Japanese)", async ({ page }) => {
    await page.goto("/hex");
    const crumb = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(crumb.getByRole("link")).toHaveText("Home");
    await expect(crumb.getByRole("link")).toHaveAttribute("href", "/");
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

  test("a click anywhere opens the menu; Esc and Close close it", async ({
    page,
  }) => {
    await page.goto("/hex/#ff8800");
    await page.mouse.click(100, 700);
    await expect(menu(page)).toBeVisible();
    await expect(menu(page)).toContainText("#ff8800");
    await page.keyboard.press("Escape");
    await expect(menu(page)).toBeHidden();
    await expect(openMenu(page)).toBeFocused();

    await openMenu(page).click();
    await page.getByRole("button", { name: t.menu.close }).click();
    await expect(menu(page)).toBeHidden();
  });

  test("the menu is reached with the keyboard", async ({ page }) => {
    await page.goto("/hex/#ff8800");
    await page.keyboard.press("Tab");
    await expect(openMenu(page)).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(menu(page)).toBeVisible();
  });

  test("Copy copies the code and says so", async ({
    page,
    context,
    baseURL,
  }) => {
    await grantClipboard(context, baseURL);
    await page.goto("/hex/#ff8800");
    await openMenu(page).click();
    const copy = page.getByRole("button", { name: "Copy #ff8800" });
    await copy.click();
    expect(await readClipboard(page)).toBe("#ff8800");
    await expect(menu(page).getByRole("status")).toHaveText(t.menu.copied);
    await expect(
      page.getByRole("button", { name: t.menu.copied }),
    ).toBeVisible();
  });

  test("Share on X posts 'Just HEX | URL', in a new tab", async ({ page }) => {
    await page.goto("/hex/#ff8800");
    await openMenu(page).click();
    const share = page.getByRole("link", { name: t.menu.share });
    await expect(share).toHaveAttribute("target", "_blank");
    await expect(share).toHaveAttribute("rel", "noopener noreferrer");
    const url = new URL(await share.getAttribute("href"));
    expect(url.origin + url.pathname).toBe("https://x.com/intent/post");
    expect(url.searchParams.get("url")).toBe("https://unlibra.com/hex/ff8800");
    expect(url.searchParams.get("text")).toBe("Just HEX |");
  });

  test("Back to Just HEX goes to the top page", async ({ page }) => {
    await page.goto("/hex/#ff8800");
    await openMenu(page).click();
    await page.getByRole("link", { name: t.menu.top }).click();
    await expect(page).toHaveURL("/hex");
    await expect(header(page)).toBeVisible();
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
