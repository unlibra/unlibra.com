// E2E: the donate page: the copy button (the password generator's) puts the
// address on the clipboard and then reads "完了" at the same width (no
// toast), and all donation buttons' text is at least 4.5:1 with their
// background in both themes, at rest and on hover.
import { expect, test } from "@playwright/test";

import { site } from "../../src/config/site.ts";
import ja from "../../src/tools/messages/ja.ts";
import {
  chooseTheme,
  grantClipboard,
  luminance,
  open,
  readClipboard,
} from "./helpers.js";

const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
const copyButton = (page) =>
  page.getByRole("button", { name: "メールアドレスをクリップボードにコピー" });

test("the copy button copies the address and reads copied, at the same width", async ({
  page,
  context,
  baseURL,
}) => {
  await grantClipboard(context, baseURL);
  await open(page, "/donate");
  await expect(
    page.getByText(site.donation.email, { exact: true }),
  ).toBeVisible();
  const button = copyButton(page);
  const width = (await button.boundingBox()).width;
  await button.click();
  await expect(
    button.getByText(ja.common.copied, { exact: true }),
  ).toBeVisible();
  expect((await button.boundingBox()).width).toBe(width);
  await expect(
    page.getByRole("status").filter({ hasText: ja.common.copied }),
  ).toHaveCount(1);
  // Back to "コピー" after 2 seconds.
  await expect(button.getByText(ja.common.copy, { exact: true })).toBeVisible({
    timeout: 4000,
  });
  expect(await readClipboard(page)).toBe(site.donation.email);
});

test("before the address is decoded, the button copies nothing and says so", async ({
  page,
  context,
  baseURL,
}) => {
  await grantClipboard(context, baseURL);
  await open(page, "/donate");
  // What Cloudflare's Email Address Obfuscation leaves until its script runs.
  await page
    .locator("[data-donate-email]")
    .evaluate((e) => (e.textContent = "[email protected]"));
  await page.evaluate(() => navigator.clipboard.writeText("before"));
  await copyButton(page).click();
  await expect(
    page.getByRole("status").filter({ hasText: "コピーに失敗しました" }),
  ).toHaveCount(1);
  await expect(
    copyButton(page).getByText(ja.common.copied, { exact: true }),
  ).toBeHidden();
  expect(await readClipboard(page)).toBe("before");
});

test("the Amazon link opens the gift card in a new tab", async ({ page }) => {
  await open(page, "/donate");
  const link = page.getByRole("link", { name: "Amazonでギフトカードを選ぶ" });
  await expect(link).toHaveAttribute("href", site.donation.amazonGift);
  await expect(link).toHaveAttribute("target", "_blank");
});

for (const [name, href] of [
  ["投げ銭で支援する", site.donation.githubSponsors.oneTime],
  ["サブスクで支援する", site.donation.githubSponsors.recurring],
]) {
  test(`${name}: opens GitHub Sponsors with the selected frequency in a new tab`, async ({
    page,
  }) => {
    await open(page, "/donate");
    const link = page.getByRole("link", { name });
    await expect(link).toHaveAttribute("href", href);
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
}

for (const width of [375, 1280]) {
  test(`${width}px: leaves 96px between the last donation button and the footer`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await open(page, "/donate");
    const button = await page
      .getByRole("link", { name: "Amazonでギフトカードを選ぶ" })
      .boundingBox();
    const footer = await page.locator("footer").boundingBox();
    expect(footer.y - (button.y + button.height)).toBe(96);
  });
}

for (const scheme of ["light", "dark"]) {
  test(`${scheme}: the donation buttons' text is at least 4.5:1, at rest and on hover`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
    await open(page, "/donate");
    await chooseTheme(page, "ja", scheme);
    for (const name of [
      "投げ銭で支援する",
      "サブスクで支援する",
      "Amazonでギフトカードを選ぶ",
    ]) {
      const button = page.getByRole("link", { name });
      for (const state of ["rest", "hover"]) {
        if (state === "hover") await button.hover();
        else await page.mouse.move(0, 0);
        const text = await luminance(button, "color");
        const back = await luminance(button, "backgroundColor");
        expect(ratio(text, back), `${name}: ${state}`).toBeGreaterThanOrEqual(
          4.5,
        );
      }
    }
  });
}
