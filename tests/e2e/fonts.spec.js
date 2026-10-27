// E2E: the Fontsource rules of Noto Sans JP (scripts/noto-sans-jp-subset.mjs,
// SP-14 and SP-15): requested only after
// the page has loaded, and placed before the cut files' rules, so the cut
// files still win where both have a character.
import { expect, test } from "@playwright/test";

const FALLBACK = /\/_astro\/noto-sans-jp-fallback\.[0-9a-f]{8}\.css$/;

test("the fallback stylesheet is requested after the load event, before the cut rules", async ({
  page,
}) => {
  await page.addInitScript(() => {
    addEventListener("load", () => {
      window.__loadedAt = performance.now();
    });
  });
  const requested = page.waitForRequest(FALLBACK);
  await page.goto("/");
  const request = await requested;
  const response = await request.response();
  expect(response.status()).toBe(200);
  // The browser adds the request's Resource Timing entry once the body has
  // arrived, not with the response's headers: read it after that.
  await response.finished();

  // Requested after the load event (the request's start, page time).
  const loadedAt = await page.evaluate(() => window.__loadedAt);
  const startedAt = await page.evaluate(
    (url) => performance.getEntriesByName(url)[0]?.startTime,
    request.url(),
  );
  expect(loadedAt).toBeGreaterThan(0);
  expect(startedAt).toBeGreaterThanOrEqual(loadedAt);

  // In the document before the cut rules, and applied.
  await expect
    .poll(() =>
      page.evaluate(() => {
        const sheets = [...document.styleSheets];
        const fallback = sheets.findIndex((s) =>
          s.href?.includes("noto-sans-jp-fallback"),
        );
        const cut = sheets.findIndex((s) =>
          s.ownerNode?.hasAttribute("data-noto-sans-jp-subset"),
        );
        return (
          fallback >= 0 && fallback < cut && sheets[fallback].cssRules.length
        );
      }),
    )
    .toBeGreaterThan(100);
});

test("a character the cut files lack still gets its Fontsource file", async ({
  page,
}) => {
  // "ł" on the credits page (Paweł Kuna): latin-ext, not in Noto Sans JP's
  // cut files, so the browser tries the Fontsource file (SP-7).
  const fontsource = page.waitForRequest(
    /\/_astro\/noto-sans-jp-latin-ext-wght-normal\.[\w-]+\.woff2$/,
  );
  await page.goto("/credits");
  await fontsource;
});
