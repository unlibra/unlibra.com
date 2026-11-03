import { expect, test } from "@playwright/test";
import { site } from "../../src/config/site.ts";

for (const path of [
  "/",
  "/en",
  "/donate",
  "/en/donate",
  "/privacy",
  "/hex/FFFFFF",
  "/en/hex/FFFFFF",
]) {
  test(`${path}: encoded response restores the contact text and mailto`, async ({
    page,
  }) => {
    const response = await page.goto(path);
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).not.toContain(site.contact.email);
    expect(html).not.toContain(site.donation.email);
    const contact = page.locator("[data-contact-email]");
    await expect(contact).toHaveText(site.contact.email);
    await expect(contact).toHaveAttribute(
      "href",
      `mailto:${site.contact.email}`,
    );
    if (path === "/privacy") {
      await expect(
        page
          .locator("main")
          .getByRole("link", { name: site.contact.email, exact: true }),
      ).toHaveAttribute("href", `mailto:${site.contact.email}`);
    }
  });
}

test("without the decoder, encoded addresses stay hidden and explain the requirement", async ({
  page,
}) => {
  await page.route("**/email-decode.js", (route) => route.abort());
  await page.goto("/donate");
  await expect(page.locator("[data-donate-email]")).toContainText(
    "[email protected]",
  );
  await expect(page.locator("[data-contact-email]")).not.toHaveAttribute(
    "href",
  );
});

test("without JavaScript, the privacy page explains how to view the contact", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${baseURL}/privacy`);
  await expect(page.locator("main noscript")).toBeVisible();
  // Playwright's text matcher intentionally omits noscript elements.
  expect(await page.locator("main noscript").textContent()).toContain(
    "JavaScript",
  );
  await context.close();
});
