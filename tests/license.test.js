// Tests for the license files (Phase 5): LICENSE, LICENSES/, package.json,
// and README.md. These read repository files only, not dist/.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** File contents with line endings normalized to LF. */
const read = (path) =>
  readFileSync(join(root, path), "utf8").replace(/\r\n/g, "\n");

const license = read("LICENSE");

/** Text of a numbered section of LICENSE ("1. MIT License" etc.). */
const section = (number) => {
  const start = license.search(new RegExp(`^${number}\\. `, "m"));
  assert.notEqual(start, -1, `LICENSE has no section ${number}`);
  const rest = license.slice(start + 1);
  const end = rest.search(/^\d+\. /m);
  return end === -1 ? rest : rest.slice(0, end);
};

/** Paths listed as "  - path" in a block of LICENSE. */
const listed = (text) => [...text.matchAll(/^ {2}- (\S+)$/gm)].map((m) => m[1]);

/**
 * The blocks of section 2 after its title and its first paragraph: one per
 * source (heading, license, files).
 */
const sourceBlocks = (text) => {
  const [, intro, ...blocks] = text.split(/\n\n(?=\S)/);
  assert.match(intro, /^The following files contain material by other/);
  return blocks;
};

/** Headings of the source blocks that do not point to a license file. */
const withoutLicenseFile = (text) =>
  sourceBlocks(text)
    .filter((block) => !/^The full text is in LICENSES\/\S+$/m.test(block))
    .map((block) => block.split("\n")[0]);

/**
 * Third-party sources in section 2 of LICENSE. Each source is a paragraph
 * (name, license, "The full text is in LICENSES/...") followed by its files.
 */
const thirdPartySources = () =>
  sourceBlocks(section(2))
    .filter((block) => /The full text is in LICENSES\//.test(block))
    .map((block) => ({
      heading: block.split("\n")[0],
      licenseFile: block.match(/The full text is in (LICENSES\/\S+?)\.?$/m)[1],
      files: listed(block),
    }));

/** Matches an attribution of material by other authors. */
const ATTRIBUTION =
  /copyright \(c\)|\bMIT License\b|licensed under|SPDX-License-Identifier|dcterms:license|creativecommons\.org|data source:/i;

/**
 * Files with material by other authors that cannot carry an attribution
 * comment (JSON has no comments). They must still be listed in LICENSE.
 */
const WITHOUT_COMMENT = [];

/**
 * Files that name licenses and copyright holders without containing material
 * by other authors: this file (the attribution patterns themselves), and the
 * credits page's list of section 2 and its test (ui-revise6 4).
 */
const NAMES_LICENSES = [
  "tests/license.test.js",
  "src/config/credits.ts",
  "tests/credits.test.js",
];

/**
 * Tracked and untracked (not ignored) files under src/ and tests/, where
 * material by other authors can be. This file is left out because it
 * contains the attribution patterns themselves.
 */
const sourceFiles = () =>
  execFileSync(
    "git",
    [
      "ls-files",
      "--cached",
      "--others",
      "--exclude-standard",
      "-z",
      "src",
      "tests",
    ],
    { cwd: root, encoding: "utf8" },
  )
    .split("\0")
    .filter(Boolean)
    .filter((p) => !NAMES_LICENSES.includes(p))
    .filter((p) => existsSync(join(root, p)))
    .filter((p) => !/\.(png|webp|jpe?g|gif|ico|woff2?)$/i.test(p));

/** The beginning of a file, where its attribution must be. */
const headOf = (path) => {
  const text = read(path);
  if (!path.endsWith(".svg")) return text.split("\n").slice(0, 10).join("\n");
  // In an SVG, the part before the first element that draws or defines shapes.
  const end = text.search(/<(?:g|path|rect|circle|ellipse|mask|defs)\b/);
  return end === -1 ? text : text.slice(0, end);
};

/** The MIT License text (https://opensource.org/license/mit) without the copyright line. */
const MIT_TEXT = `MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;

/** Splits an MIT license file into its copyright line and the rest. */
const splitCopyright = (text) => {
  const lines = text.split("\n");
  const index = lines.findIndex((l) => l.startsWith("Copyright (c)"));
  assert.notEqual(index, -1, "no copyright line");
  const copyright = lines[index];
  lines.splice(index, 2); // the copyright line and the blank line after it
  return { copyright, body: lines.join("\n") };
};

test("F2: LICENSE reserves all rights by default", () => {
  assert.match(
    license.split("\n")[0],
    /^Copyright \(c\) 2025 unlibra\. All rights reserved\.$/,
  );
  assert.match(license, /no license is granted/);
});

test("F2: LICENSE lists the MIT directories, and they exist", () => {
  const dirs = listed(section(1));
  // P4-1
  assert.deepEqual(dirs, ["src/tools/", "src/components/ui/"]);
  for (const dir of dirs) {
    assert.ok(statSync(join(root, dir)).isDirectory(), dir);
  }
  assert.match(section(1), /LICENSES\/MIT\.txt/);
});

test("F2: listed third-party files exist and start with their attribution", () => {
  const sources = thirdPartySources();
  assert.deepEqual(
    sources.map((s) => s.licenseFile),
    ["LICENSES/Tabler-MIT.txt", "LICENSES/CC0-1.0.txt"],
  );
  for (const { heading, licenseFile, files } of sources) {
    assert.ok(existsSync(join(root, licenseFile)), licenseFile);
    assert.ok(files.length > 0, `${heading}: no files listed`);
    // The first word of the heading names the source (Tabler, DiceBear).
    const name = new RegExp(heading.split(" ")[0], "i");
    for (const file of files) {
      assert.ok(existsSync(join(root, file)), `${file} does not exist`);
      if (WITHOUT_COMMENT.includes(file)) continue;
      const head = headOf(file);
      assert.match(head, ATTRIBUTION, `${file}: no attribution at the top`);
      assert.match(head, name, `${file}: attribution does not name ${name}`);
    }
  }
});

test("F2: every source in section 2 points to its license file (ui-revise6 review)", () => {
  // thirdPartySources() finds the sources by this sentence; a source
  // without it would be skipped by the checks above and below.
  assert.deepEqual(withoutLicenseFile(section(2)), []);
  // A source without the sentence is found.
  const added = `${section(2).trimEnd()}

Example Photo (https://example.com/photo)
Public domain.

  - src/assets/example.webp
`;
  assert.deepEqual(withoutLicenseFile(added), [
    "Example Photo (https://example.com/photo)",
  ]);
});

test("F2: every file with material by other authors is listed in LICENSE", () => {
  const withAttribution = sourceFiles()
    .filter((p) => ATTRIBUTION.test(read(p)))
    .concat(WITHOUT_COMMENT)
    .sort();
  const inLicense = thirdPartySources()
    .flatMap((s) => s.files)
    .sort();
  assert.deepEqual(withAttribution, inLicense);
});

test("F2: LICENSE excludes BOOTH images by other creators and covers dependencies", () => {
  assert.match(section(3), /BOOTH product images/);
  assert.match(section(3), /src\/assets\/works\/third-party\//);
  assert.match(section(4), /npm packages/);
});

test("ui-revise3 (user): the BOOTH image with other creators' material is in the third-party directory that section 3 excludes", () => {
  const dir = "src/assets/works/third-party";
  const files = readdirSync(join(root, dir)).sort();
  assert.deepEqual(files, ["mururu-blink-lipsync.webp"]);
  // Section 3 names the directory; no other section claims its files.
  assert.match(section(3), new RegExp(`${dir}/`));
  for (const n of [1, 2, 4]) {
    assert.doesNotMatch(section(n), /works\/third-party/, `section ${n}`);
  }
  // The work uses the file from there (not a copy elsewhere).
  const works = read("src/config/works.ts");
  assert.match(
    works,
    /from "@\/assets\/works\/third-party\/mururu-blink-lipsync\.webp"/,
  );
  assert.ok(
    !readdirSync(join(root, "src/assets/works")).includes(files[0]),
    "not outside third-party/",
  );
});

test("F3: LICENSES/MIT.txt is the MIT License for unlibra", () => {
  const { copyright, body } = splitCopyright(read("LICENSES/MIT.txt"));
  assert.equal(copyright, "Copyright (c) 2025 unlibra");
  assert.equal(body, MIT_TEXT);
});

test("F3, ui-revise7 8': Tabler Icons license is copied verbatim", () => {
  for (const [file, pkg, holder] of [
    [
      "LICENSES/Tabler-MIT.txt",
      "node_modules/@tabler/icons/LICENSE",
      "Copyright (c) 2020-2026 Paweł Kuna",
    ],
  ]) {
    const text = read(file);
    assert.equal(text, read(pkg), file);
    const { copyright, body } = splitCopyright(text);
    assert.equal(copyright, holder, file);
    assert.equal(body, MIT_TEXT, file);
  }
});

test("F3: LICENSES/CC0-1.0.txt is the CC0 1.0 legal code", () => {
  // SHA-256 of https://creativecommons.org/publicdomain/zero/1.0/legalcode.txt
  const hash = createHash("sha256")
    .update(read("LICENSES/CC0-1.0.txt"))
    .digest("hex");
  assert.equal(
    hash,
    "a2010f343487d3f7618affe54f789f5487602331c0a8d03f49e9a7c547cf0499",
  );
});

test("F4: package.json points to LICENSE", () => {
  const pkg = JSON.parse(read("package.json"));
  assert.equal(pkg.license, "SEE LICENSE IN LICENSE");
});

test("F5: README links to LICENSE", () => {
  assert.match(read("README.md"), /\[LICENSE\]\(LICENSE\)/);
});

test("ui-revise2 4: LICENSES/OFL-1.1.txt is the OFL with LINE Seed JP's copyright notice", () => {
  const text = read("LICENSES/OFL-1.1.txt");
  // The copyright notice of the font files and of Google Fonts' OFL.txt.
  assert.equal(text.split("\n")[0], "© LY Corporation");
  // The rest is the npm package's license file (whose first line is
  // Fontsource's template "Google Inc."), copied verbatim.
  const original = read("node_modules/@fontsource/line-seed-jp/LICENSE");
  assert.equal(original.split("\n")[0], "Google Inc.");
  assert.equal(
    text.split("\n").slice(1).join("\n"),
    original.split("\n").slice(1).join("\n"),
  );
  assert.match(
    text,
    /^SIL OPEN FONT LICENSE Version 1\.1 - 26 February 2007$/m,
  );
  assert.match(text, /^PERMISSION & CONDITIONS$/m);
  assert.match(text, /^DISCLAIMER$/m);
  // LICENSE points to it for the logotype drawn with LINE Seed JP.
  const text4 = section(4).replace(/\s+/g, " ");
  assert.ok(text4.includes("LICENSES/OFL-1.1.txt"));
  assert.ok(text4.includes("src/assets/brand/logotype.svg"));
  assert.ok(text4.includes("scripts/generate-logotype.mjs"));
});

test("ui-revise5 1: section 3 names the GitHub mark, which is not listed as material under a license", () => {
  const text = section(3).replace(/\s+/g, " ");
  assert.ok(text.includes("src/components/icons/GitHubIcon.astro"));
  assert.ok(existsSync(join(root, "src/components/icons/GitHubIcon.astro")));
  for (const n of [1, 2, 4]) {
    assert.doesNotMatch(section(n), /GitHubIcon/, `section ${n}`);
  }
});

test("ui-revise7 8': the copyright of Tabler Icons is the package's; the copied icons are as in @tabler/icons", () => {
  // The tools use @tabler/icons-react, the Astro parts copies from
  // @tabler/icons. Neither is updated (.github/dependabot.yml), and no
  // version is written (SP-10).
  // The license text and its copyright line, as in the package.
  const packageLicense = read("node_modules/@tabler/icons/LICENSE");
  assert.equal(read("LICENSES/Tabler-MIT.txt"), packageLicense);
  const holder = packageLicense.match(/^Copyright \(c\) (.+)$/m)[1];
  assert.ok(license.includes(`Copyright (c) ${holder}.`), "LICENSE");
  const tabler = thirdPartySources().find((s) =>
    s.heading.startsWith("Tabler Icons "),
  );
  assert.match(tabler.heading, /^Tabler Icons \(https:.*@tabler\/icons$/);
  const icons = {
    "src/components/icons/AmazonIcon.astro": "brand-amazon",
    "src/components/icons/ArrowRightIcon.astro": "arrow-right",
    "src/components/icons/ArrowUpRightIcon.astro": "arrow-up-right",
    "src/components/icons/ArrowsShuffleIcon.astro": "arrows-shuffle",
    "src/components/icons/BoxIcon.astro": "box",
    "src/components/icons/BrandXIcon.astro": "brand-x",
    "src/components/icons/CheckIcon.astro": "check",
    "src/components/icons/LinkIcon.astro": "link",
    "src/components/icons/MoonIcon.astro": "moon",
    "src/components/icons/PaletteIcon.astro": "palette",
    "src/components/icons/PlusIcon.astro": "plus",
    "src/components/icons/ShareIcon.astro": "share",
    "src/components/icons/SunIcon.astro": "sun",
    "src/components/icons/WorldIcon.astro": "world",
    "src/components/icons/XIcon.astro": "x",
    "src/components/ui/Breadcrumb.astro": "chevron-right",
  };
  assert.deepEqual(tabler.files, Object.keys(icons));
  const paths = (svg) => [...svg.matchAll(/<path [^>]*>/g)].map((m) => m[0]);
  const attributes = (path) =>
    Object.fromEntries(
      [...path.matchAll(/([\w-]+)="([^"]*)"/g)].map(([, k, v]) => [k, v]),
    );
  for (const [file, name] of Object.entries(icons)) {
    const head = headOf(file);
    const comment = head.replace(/\s*\/\/\s*/g, " ");
    assert.ok(comment.includes("@tabler/icons (icons/outline/"), file);
    assert.ok(comment.includes(`Copyright (c) ${holder}.`), file);
    assert.ok(head.includes(`icons/outline/${name}.svg`), file);
    // The paths as they are in the package (outline, stroke width 2).
    const source = read(`node_modules/@tabler/icons/icons/outline/${name}.svg`);
    const copy = read(file).match(
      new RegExp(`<svg[^>]*data-icon="${name}"[\\s\\S]*?</svg>`),
    )[0];
    assert.deepEqual(
      paths(copy).map(attributes),
      paths(source).map(attributes),
      file,
    );
    assert.match(copy, /stroke-width="2"/, file);
  }
});
