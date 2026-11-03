import { test } from "node:test";
import assert from "node:assert/strict";
import { globSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const dist = fileURLToPath(new URL("../dist/", import.meta.url));

test("no published HTML or JavaScript exposes the site's addresses", () => {
  const files = globSync("**/*.{html,js}", { cwd: dist });
  assert.ok(files.length > 0);
  for (const file of files) {
    const content = readFileSync(`${dist}/${file}`, "utf8");
    assert.doesNotMatch(content, /(?:hello|gift)@unlibra\.com/, file);
  }
});
