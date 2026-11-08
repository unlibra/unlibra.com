// SP-7: Noto Sans JP cut down to the site's characters
// (scripts/noto-sans-jp-subset.mjs), checked against dist/.
// Run `npm run build` before `npm test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, globSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  fallbackLink,
  FAMILY,
  FONT_DISPLAY,
  METRIC_OVERRIDES,
  STYLE_ATTRIBUTE,
  formatUnicodeRange,
  parseFontsourceCss,
  parseUnicodeRange,
} from "../scripts/noto-sans-jp-subset.mjs";
import { cmapCharacters, nameOf, woff2Tables } from "./helpers/woff2.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const fontsource = join(root, "node_modules/@fontsource-variable/noto-sans-jp");

if (!existsSync(join(dist, "index.html"))) {
  throw new Error("dist/ not found. Run `npm run build` before `npm test`.");
}

const pages = globSync("**/*.html", { cwd: dist });
const readDist = (path) => readFileSync(join(dist, path), "utf8");
const sourceFaces = parseFontsourceCss(
  readFileSync(join(fontsource, "index.css"), "utf8"),
);
const inRanges = (ranges, cp) =>
  ranges.some(([first, last]) => cp >= first && cp <= last);

/** The added rules of a page: [{ url, ranges, rule }]. */
const subsetFaces = (html) => {
  const styles = [
    ...html.matchAll(
      new RegExp(`<style ${STYLE_ATTRIBUTE}>([\\s\\S]*?)</style>`, "g"),
    ),
  ];
  assert.equal(styles.length, 1, "one added <style>");
  return [...styles[0][1].matchAll(/@font-face\{[^}]*\}/g)].map(([rule]) => ({
    rule,
    url: rule.match(/src:url\(([^)]+)\)/)[1],
    ranges: parseUnicodeRange(rule.match(/unicode-range:([^;]+);/)[1]),
  }));
};

test("SP-7: unicode-range values are parsed and written back with runs joined", () => {
  assert.deepEqual(parseUnicodeRange("U+3042,U+3044-3046"), [
    [0x3042, 0x3042],
    [0x3044, 0x3046],
  ]);
  assert.equal(
    formatUnicodeRange([0x3046, 0x3042, 0x3044, 0x3045, 0x3042]),
    "U+3042,U+3044-3046",
  );
  assert.throws(() => parseUnicodeRange("U+30??"), /wildcards/);
});

test("SP-7: every page adds the cut files after its stylesheets, at the end of <head>", () => {
  assert.ok(pages.length > 0);
  for (const page of pages) {
    const html = readFileSync(join(dist, page), "utf8");
    const head = html.slice(0, html.indexOf("</head>"));
    const style = head.lastIndexOf(`<style ${STYLE_ATTRIBUTE}>`);
    assert.ok(style >= 0, page);
    assert.ok(head.lastIndexOf('rel="stylesheet"') < style, page);
    assert.match(head.slice(style), /^<style [^>]*>[^<]*<\/style>$/, page);
  }
});

/** The stylesheets a page waits for: <link rel="stylesheet"> without media. */
const blockingStylesheets = (html) =>
  [...html.matchAll(/<link rel="stylesheet" href="([^"]+)"(?![^>]*media=)/g)]
    .filter(
      ({ index }) =>
        html.lastIndexOf("<noscript>", index) <=
        html.lastIndexOf("</noscript>", index),
    )
    .map(([, href]) => href);

test("SP-14: the stylesheets that pages wait for have no Fontsource rules of Noto Sans JP and no inlined fonts", () => {
  for (const page of pages) {
    const html = readFileSync(join(dist, page), "utf8");
    const hrefs = blockingStylesheets(html);
    assert.ok(hrefs.length > 0, page);
    for (const href of hrefs) {
      const css = readFileSync(join(dist, href), "utf8");
      assert.doesNotMatch(css, new RegExp(`font-family:\\s*["']?${FAMILY}`));
    }
  }
  for (const file of globSync("_astro/*.css", { cwd: dist })) {
    assert.doesNotMatch(readDist(file), /url\(["']?data:font/, file);
  }
});

test("SP-14, SP-15: every page links the Fontsource rules once it has loaded, before the cut files", () => {
  for (const page of pages) {
    const html = readFileSync(join(dist, page), "utf8");
    const head = html.slice(0, html.indexOf("</head>"));
    const href = head.match(
      /\/_astro\/noto-sans-jp-fallback\.[0-9a-f]{8}\.css/,
    )?.[0];
    assert.ok(href, page);
    // Added by the script after the load event (a plain link only in
    // <noscript>), in the script's place: earlier in the document, so the
    // cut files win where both have a character (the order of the style
    // sheets, CSS Fonts 4, 4.5).
    const at = head.indexOf(fallbackLink(href));
    assert.ok(at >= 0, page);
    assert.ok(at < head.indexOf(`<style ${STYLE_ATTRIBUTE}>`), page);
    assert.equal(head.split(href).length - 1, 2, page);
    // The file has every Fontsource rule, with the metric overrides.
    const rules = readDist(href.slice(1)).match(/@font-face\{[^}]*\}/g);
    assert.equal(rules.length, sourceFaces.length, page);
    for (const rule of rules) {
      assert.ok(rule.includes(FAMILY), rule);
      for (const [name, value] of Object.entries(METRIC_OVERRIDES)) {
        assert.ok(rule.includes(`${name}:${value}`), rule);
      }
      const url = rule.match(/url\(([^)]+)\)/)[1];
      assert.ok(existsSync(join(dist, url.slice(1))), url);
    }
  }
});

test("SP-7: the cut files cover every character of every page that Noto Sans JP has", () => {
  for (const page of pages) {
    const html = readFileSync(join(dist, page), "utf8");
    const faces = subsetFaces(html);
    for (const char of new Set(html)) {
      const cp = char.codePointAt(0);
      if (!sourceFaces.some(({ ranges }) => inRanges(ranges, cp))) continue;
      assert.ok(
        faces.some(({ ranges }) => inRanges(ranges, cp)),
        `${page}: ${char} (U+${cp.toString(16)})`,
      );
    }
  }
});

test("SP-7: the cut files have the Fontsource rule's descriptors and the metric overrides", () => {
  const faces = subsetFaces(readFileSync(join(dist, "index.html"), "utf8"));
  assert.ok(faces.length > 0);
  for (const { rule } of faces) {
    assert.ok(rule.includes(`font-family:'${FAMILY}';`), rule);
    assert.ok(rule.includes("font-weight:100 900;"), rule);
    assert.ok(rule.includes(`font-display:${FONT_DISPLAY};`), rule);
    assert.ok(rule.includes("format('woff2-variations')"), rule);
    for (const [name, value] of Object.entries(METRIC_OVERRIDES)) {
      assert.ok(rule.includes(`${name}:${value};`), rule);
    }
  }
  // The same overrides as the Fontsource rules in the stylesheet.
  const css = globSync("_astro/*.css", { cwd: dist })
    .map((path) => readFileSync(join(dist, path), "utf8"))
    .join("\n");
  const fontsourceRule = [...css.matchAll(/@font-face\{[^}]*\}/g)]
    .map(([rule]) => rule)
    .find((rule) => rule.includes(FAMILY));
  for (const [name, value] of Object.entries(METRIC_OVERRIDES)) {
    assert.ok(fontsourceRule.includes(`${name}:${value}`), name);
  }
});

test("SP-7: each cut file is in dist/, smaller than its source, keeps the license and has the glyphs of its range", () => {
  const faces = subsetFaces(readFileSync(join(dist, "index.html"), "utf8"));
  for (const { url, ranges } of faces) {
    const match = url.match(/^\/_astro\/(.+)-subset\.[0-9a-f]{8}\.woff2$/);
    assert.ok(match, url);
    const source = sourceFaces.find(({ file }) => file === `${match[1]}.woff2`);
    assert.ok(source, url);
    const path = join(dist, url);
    const sourcePath = join(fontsource, "files", source.file);
    assert.ok(statSync(path).size < statSync(sourcePath).size, url);

    const tables = woff2Tables(readFileSync(path));
    assert.match(nameOf(tables.name, 1), /^Noto Sans JP/);
    assert.match(nameOf(tables.name, 14), /scripts\.sil\.org\/OFL/);

    // Every character of the range that the source has (Noto Sans JP lacks
    // some, such as ł; the browser falls back for those).
    const has = cmapCharacters(tables.cmap);
    const sourceHas = cmapCharacters(
      woff2Tables(readFileSync(sourcePath)).cmap,
    );
    let checked = 0;
    for (const [first, last] of ranges) {
      for (let cp = first; cp <= last; cp++) {
        assert.ok(inRanges(source.ranges, cp), `${url}: U+${cp.toString(16)}`);
        const char = String.fromCodePoint(cp);
        if (sourceHas.has(char)) {
          assert.ok(has.has(char), `${url}: U+${cp.toString(16)}`);
          checked++;
        }
      }
    }
    assert.ok(
      checked > 0 || url.includes("latin-ext"),
      `${url}: no glyph checked`,
    );
  }
});
