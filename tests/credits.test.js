// Tests for the credits page (/credits, ui-revise6 4). Section 2 of LICENSE
// is the source of truth for the material by other authors: a source added
// there and missing from src/config/credits.ts (or the other way round)
// fails here. Run after `npm run build`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { LICENSES_FILE } from "../scripts/third-party-licenses.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
if (!existsSync(join(dist, "index.html"))) {
  throw new Error("dist/ not found. Run `npm run build` before `npm test`.");
}

/** File contents with line endings normalized to LF. */
const read = (path) =>
  readFileSync(join(root, path), "utf8").replace(/\r\n/g, "\n");

const credits = await import("../src/config/credits.ts");
const { characters, materials, thirdPartyLicensesPath } = credits;

/**
 * The sources of section 2 of a LICENSE text, as the credits page shows
 * them: the name (the heading up to its first "("), the license and its
 * copyright holder (from the line before "The full text is in"), the
 * license file (from that line), and the listed files.
 */
const licenseSources = (text) => {
  const start = text.search(/^2\. /m);
  assert.notEqual(start, -1, "LICENSE has no section 2");
  const rest = text.slice(start + 1);
  const end = rest.search(/^\d+\. /m);
  const section = end === -1 ? rest : rest.slice(0, end);
  // The section's title and its first paragraph, then one block per source.
  const [, intro, ...blocks] = section.split(/\n\n(?=\S)/);
  assert.match(intro, /^The following files contain material by other/);
  return blocks.map((block) => {
    // Every source points to its license file: a block without the
    // sentence is not skipped, but stops here (ui-revise6 review).
    assert.match(
      block,
      /^The full text is in LICENSES\/\S+$/m,
      `LICENSE section 2: no license file for "${block.split("\n")[0]}"`,
    );
    const lines = block.split("\n");
    const fullText = lines.findIndex((l) =>
      l.startsWith("The full text is in"),
    );
    // The holder may end with the sentence's period ("Contributors.") or
    // with its own ("Inc."): it is kept, and compared with and without.
    const [license, holder] = lines[fullText - 1].split(
      /, Copyright \(c\) (?:\d{4}(?:-\d{4})? )?/,
    );
    return {
      name: lines[0].split(" (")[0],
      license: holder ? license : license.replace(/\.$/, ""),
      holder,
      licenseFile: lines[fullText].match(/(LICENSES\/\S+)\.$/)[1],
      files: [...block.matchAll(/^ {2}- (\S+)$/gm)].map((m) => m[1]),
    };
  });
};

/** The page's data for a source of LICENSE, without its author. */
const shown = ({ name, license, licenseFile }) => ({
  name,
  license,
  licenseFile,
});

test("ui-revise6 4: the credited materials are the sources of section 2 of LICENSE, in its order", () => {
  const sources = licenseSources(read("LICENSE"));
  assert.ok(sources.length >= 2, "self-check: sources found in LICENSE");
  assert.deepEqual(materials.map(shown), sources.map(shown));
});

test("ui-revise6 4: each material's author is its copyright holder in LICENSE, or the creator in its files", () => {
  const sources = licenseSources(read("LICENSE"));
  for (const [i, source] of sources.entries()) {
    const { author } = materials[i];
    if (source.holder) {
      assert.ok(
        [author, `${author}.`].includes(source.holder),
        `${source.name}: ${author} / ${source.holder}`,
      );
      continue;
    }
    // No copyright holder (CC0): the creator named in the files' metadata.
    const creators = new Set(
      source.files.map(
        (file) => read(file).match(/<dc:creator>([^<]*)<\/dc:creator>/)?.[1],
      ),
    );
    assert.deepEqual([...creators], [author], source.name);
  }
});

test("ui-revise6 4: a source added to LICENSE and missing from the credits is found", () => {
  const license = read("LICENSE");
  const added = license.replace(
    /\n\n3\. /,
    `
Example Icons 1.0 (https://example.com/icons)
MIT License, Copyright (c) 2026 Example.
The full text is in LICENSES/Example-MIT.txt.

  - src/components/icons/ExampleIcon.astro


3. `,
  );
  assert.notEqual(added, license, "self-check: the source was added");
  const sources = licenseSources(added);
  assert.deepEqual(sources.at(-1), {
    name: "Example Icons 1.0",
    license: "MIT License",
    holder: "Example.",
    licenseFile: "LICENSES/Example-MIT.txt",
    files: ["src/components/icons/ExampleIcon.astro"],
  });
  assert.notDeepEqual(materials.map(shown), sources.map(shown));
});

test("ui-revise6 4: a source added to LICENSE without a license file is found too", () => {
  const license = read("LICENSE");
  const added = license.replace(
    /\n\n3\. /,
    `
Example Photo (https://example.com/photo)
Public domain.

  - src/assets/example.webp


3. `,
  );
  assert.notEqual(added, license, "self-check: the source was added");
  assert.throws(() => licenseSources(added), /no license file for "Example/);
});

/** Text of an HTML fragment, without tags and with spaces collapsed. */
const textOf = (html) =>
  html
    .replace(/<[^>]*>/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

const page = readFileSync(join(dist, "credits/index.html"), "utf8");
const main = page.match(/<main[\s>][\s\S]*?<\/main>/)[0];

test("ui-revise6 4, ui-revise7 9, ui-revise10: the credits page has its heading, description and the character", () => {
  assert.match(page, /<title>クレジット - unlibra<\/title>/);
  assert.match(main, /<h1>クレジット<\/h1>/);
  assert.ok(
    main.includes(
      "<p>当サイトで使用しているキャラクターや素材等の権利表記を掲載しています。</p>",
    ),
  );
  const headings = [...main.matchAll(/<h2>([^<]*)<\/h2>/g)].map((m) => m[1]);
  assert.deepEqual(headings, [
    "キャラクター",
    "グラフィック素材",
    "オープンソースライセンス",
  ]);
  const list = main.match(/<ul[^>]*data-credits-characters[\s\S]*?<\/ul>/)[0];
  assert.deepEqual(
    [...list.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => textOf(m[1])),
    ["ムルル ©Lethal Cats"],
  );
  // ui-revise7 9: as the author writes it, without a space after ©.
  assert.deepEqual(characters, [{ name: "ムルル", rights: "©Lethal Cats" }]);
  assert.doesNotMatch(list, /© /);
  // ui-revise8 2: no paragraph under the materials' heading.
  assert.ok(!main.includes("必要に応じて"));
  assert.match(main, /<h2>グラフィック素材<\/h2>\s*<section[^>]*data-credit/);
});

test("ui-revise6 4: the credits page lists each graphic material with its author, and its license linked to the full text", () => {
  const entries = [
    ...main.matchAll(/<section[^>]*data-credit[^>]*>([\s\S]*?)<\/section>/g),
  ].map(([, html]) => ({
    name: textOf(html.match(/<h3[^>]*>([\s\S]*?)<\/h3>/)[1]),
    author: textOf(html.match(/data-credit-author[^>]*>([^<]*)</)[1]),
    license: textOf(html.match(/data-credit-license[^>]*>([^<]*)</)[1]),
    links: [...html.matchAll(/<a\s[^>]*>/g)].map((m) => m[0]),
  }));
  const expected = materials;
  assert.equal(entries.length, expected.length);
  for (const [i, credit] of expected.entries()) {
    const entry = entries[i];
    assert.equal(entry.name, credit.name);
    assert.equal(entry.author, credit.author, credit.name);
    assert.equal(entry.license, credit.license, credit.name);
    assert.equal(entry.links.length, 1, credit.name);
    // The license file of this repository, shown on GitHub.
    assert.ok(existsSync(join(root, credit.licenseFile)), credit.licenseFile);
    assert.ok(
      entry.links[0].includes(
        `href="https://github.com/unlibra/unlibra.com/blob/main/${credit.licenseFile}"`,
      ),
      credit.name,
    );
    assert.match(entry.links[0], /data-credit-license/);
    assert.match(entry.links[0], /target="_blank"/);
    assert.match(entry.links[0], /rel="noopener noreferrer"/);
  }
});

test("ui-revise6 4: the credits page links to the list of the bundled packages", () => {
  assert.equal(thirdPartyLicensesPath, `/${LICENSES_FILE}`);
  assert.ok(existsSync(join(dist, LICENSES_FILE)));
  assert.match(main, new RegExp(`<a href="${thirdPartyLicensesPath}"[^>]*>`));
});

test("ui-revise10: the list of the bundled packages has its own section, with the link alone", () => {
  assert.match(
    main,
    new RegExp(
      `<h2[^>]*>オープンソースライセンス</h2>\\s*<p[^>]*>\\s*<a href="${thirdPartyLicensesPath}"[^>]*>サードパーティライセンス一覧</a>\\s*</p>`,
    ),
  );
  assert.doesNotMatch(main, /同梱ライブラリ|このほか/);
});

test("ui-revise6 4: the credits page is like the privacy policy: Japanese, canonical, in the sitemap", () => {
  assert.match(page, /<html lang="ja"/);
  assert.match(
    page,
    /<link rel="canonical" href="https:\/\/unlibra\.com\/credits">/,
  );
  assert.match(
    readFileSync(join(dist, "sitemap-0.xml"), "utf8"),
    /<loc>https:\/\/unlibra\.com\/credits<\/loc>/,
  );
  const description = page.match(/<meta name="description" content="([^"]*)"/);
  assert.equal(
    description[1],
    "unlibra のクレジットです。当サイトで使用しているキャラクターや素材等の権利表記を掲載しています。",
  );
});

test("the credits page lists the logos of other services as their owners' trademarks", () => {
  const { trademarks } = credits;
  assert.deepEqual(
    trademarks.map(({ name }) => name),
    ["GitHub マーク", "X ロゴ"],
  );
  const section = main.match(
    /<section[^>]*data-trademarks[^>]*>([\s\S]*?)<\/section>/,
  )[1];
  assert.equal(textOf(section.match(/<h3[^>]*>([\s\S]*?)<\/h3>/)[1]), "ロゴ");
  const items = [...section.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map(
    ([, html]) => textOf(html),
  );
  assert.deepEqual(
    items,
    trademarks.map(({ name, owner }) => `${name}：${owner} の商標です`),
  );
  // The same logos are named in section 3 of LICENSE, as not licensed.
  const license = read("LICENSE");
  const notCovered = license.slice(license.search(/^3\. /m));
  assert.match(
    notCovered,
    /GitHub mark in\s+src\/components\/icons\/GitHubIcon\.astro/,
  );
  assert.match(
    notCovered,
    /X logo drawn in\s+src\/components\/icons\/BrandXIcon\.astro/,
  );
});
