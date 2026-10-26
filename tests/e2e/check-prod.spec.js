// I4: `npm run check:prod` passes against the local wrangler dev server
// (the same serving as production), with only the Web Analytics warning:
// the beacon is inserted by Cloudflare's proxy, which wrangler dev is not.
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { expect, test } from "@playwright/test";

const script = fileURLToPath(
  new URL("../../scripts/check-prod.mjs", import.meta.url),
);

test("check:prod passes against wrangler dev, warning only about the beacon", async ({
  baseURL,
}) => {
  const { stdout } = await promisify(execFile)(process.execPath, [
    script,
    baseURL,
  ]);
  const lines = stdout.trim().split(/\r?\n/);
  expect(lines.filter((line) => line.startsWith("FAIL"))).toEqual([]);
  expect(lines.filter((line) => line.startsWith("WARN"))).toEqual([
    expect.stringMatching(/^WARN Web Analytics beacon in \//),
  ]);
  expect(lines.at(-1)).toBe("0 failed, 1 warnings");
  // Every kind of check ran.
  for (const name of [
    "OK   robots.txt",
    "OK   sitemap-index.xml",
    "OK   page /lab/svg-optimizer",
    "OK   redirect /lab/en/svg-optimizer -> /en/lab/svg-optimizer",
    "OK   headers /_astro/*",
    "OK   Just HEX OGP /hex/FF5A36",
    "OK   Just HEX OGP image /hex/FF5A36.png",
  ]) {
    expect(
      lines.some((line) => line.startsWith(name)),
      name,
    ).toBe(true);
  }
});
