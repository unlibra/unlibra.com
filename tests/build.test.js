// Integration tests against the build output (dist/) and repository files.
// Run `npm run build` before `npm test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const SITE = "https://unlibra.com";

const readDist = (path) => readFileSync(join(dist, path), "utf8");

if (!existsSync(join(dist, "index.html"))) {
  throw new Error("dist/ not found. Run `npm run build` before `npm test`.");
}

/** Parses Cloudflare `_headers` into { path: { headerName: value } }. */
const parseHeaders = (text) => {
  const rules = {};
  let current = null;
  for (const line of text.split(/\r?\n/)) {
    if (line.trim() === "" || line.trim().startsWith("#")) continue;
    if (/^\s/.test(line)) {
      assert.ok(current, `header line without a path: ${line}`);
      const index = line.indexOf(":");
      const name = line.slice(0, index).trim().toLowerCase();
      rules[current][name] = line.slice(index + 1).trim();
    } else {
      current = line.trim();
      rules[current] ??= {};
    }
  }
  return rules;
};

/** Parses JSONC (comments and trailing commas), respecting string literals. */
const parseJsonc = (text) => {
  let out = "";
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '"') {
      let j = i + 1;
      while (text[j] !== '"') j += text[j] === "\\" ? 2 : 1;
      out += text.slice(i, j + 1);
      i = j + 1;
    } else if (text.startsWith("//", i)) {
      while (i < text.length && text[i] !== "\n") i++;
    } else if (text.startsWith("/*", i)) {
      i = text.indexOf("*/", i + 2) + 2;
    } else {
      out += ch;
      i++;
    }
  }
  return JSON.parse(out.replace(/,(\s*[}\]])/g, "$1"));
};

const attr = (tag, name) => tag.match(new RegExp(`${name}="([^"]*)"`))?.[1];

test("A2: build output has the expected pages and files", () => {
  for (const path of [
    "index.html",
    "404.html",
    "privacy/index.html",
    "credits/index.html",
    "robots.txt",
    "sitemap-index.xml",
    "_headers",
  ]) {
    assert.ok(existsSync(join(dist, path)), `dist/${path} is missing`);
  }
});

test("A3: the English pages are under /en, the Japanese ones without a prefix", () => {
  // Every page but the privacy policy is in Japanese and English
  // (docs/decisions/i18n/): Japanese has no prefix (no /ja), English is
  // under /en. One 404 page (404.html) for every path, /en included.
  assert.equal(existsSync(join(dist, "ja")), false, "dist/ja/");
  for (const locale of ["ja", "en"]) {
    assert.equal(existsSync(join(dist, `${locale}.html`)), false);
  }
  assert.deepEqual(readdirSync(join(dist, "en")).sort(), [
    "credits",
    "donate",
    "hex",
    "index.html",
    "lab",
  ]);
  assert.equal(existsSync(join(dist, "en", "privacy")), false);
  const sitemap = readDist("sitemap-0.xml");
  assert.doesNotMatch(sitemap, /unlibra\.com\/ja\b/);
});

test("A6: robots.txt allows all and points to sitemap-index.xml", () => {
  const lines = readDist("robots.txt")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  assert.deepEqual(lines, [
    "User-agent: *",
    "Allow: /",
    `Sitemap: ${SITE}/sitemap-index.xml`,
  ]);
});

test("A6: sitemap lists the top page, privacy, credits, donate, Just HEX, and the tool pages only, in each language", () => {
  assert.match(
    readDist("sitemap-index.xml"),
    new RegExp(`<loc>${SITE}/sitemap-0\\.xml</loc>`),
  );
  const entries = Object.fromEntries(
    [...readDist("sitemap-0.xml").matchAll(/<url>([\s\S]*?)<\/url>/g)].map(
      ([, url]) => [
        url.match(/<loc>([^<]*)<\/loc>/)[1],
        Object.fromEntries(
          [...url.matchAll(/<xhtml:link[^>]*>/g)].map(([link]) => [
            attr(link, "hreflang"),
            attr(link, "href"),
          ]),
        ),
      ],
    ),
  );
  // @astrojs/sitemap 3.7.4+ writes the origin-only URL with "/", which is
  // the same resource as the canonical URL without it.
  const tools = ["favicon-generator", "password-generator", "svg-optimizer"];
  const japanese = [
    "/",
    "/credits",
    "/donate",
    "/hex",
    ...tools.map((tool) => `/lab/${tool}`),
  ];
  const english = (path) => (path === "/" ? "/en" : `/en${path}`);
  assert.deepEqual(
    Object.keys(entries).sort(),
    [
      ...japanese.map((path) => SITE + path),
      ...japanese.map((path) => SITE + english(path)),
      `${SITE}/privacy`,
    ].sort(),
  );
  // Each page with both languages and x-default (the Japanese page), as the
  // pages' own alternate links; the privacy policy is in Japanese only.
  for (const path of japanese) {
    const alternates = {
      ja: SITE + path,
      en: SITE + english(path),
      "x-default": SITE + path,
    };
    assert.deepEqual(entries[SITE + path], alternates, path);
    assert.deepEqual(entries[SITE + english(path)], alternates, path);
  }
  assert.deepEqual(entries[`${SITE}/privacy`], {});
});

test("A7: the top pages' canonical and og:url, and their hreflang links", () => {
  const html = readDist("index.html");

  const canonical = html.match(/<link[^>]*rel="canonical"[^>]*>/g) ?? [];
  assert.equal(canonical.length, 1);
  assert.equal(attr(canonical[0], "href"), SITE);

  const ogUrl = html.match(/<meta[^>]*property="og:url"[^>]*>/g) ?? [];
  assert.equal(ogUrl.length, 1);
  assert.equal(attr(ogUrl[0], "content"), SITE);

  assert.match(html, /<html[^>]*lang="ja"/);

  const english = readDist("en/index.html");
  const englishCanonical = english.match(/<link[^>]*rel="canonical"[^>]*>/g);
  assert.deepEqual(
    englishCanonical.map((tag) => attr(tag, "href")),
    [`${SITE}/en`],
  );
  assert.match(english, /<html[^>]*lang="en"/);

  for (const page of [html, english]) {
    const alternates = [
      ...page.matchAll(/<link[^>]*rel="alternate"[^>]*>/g),
    ].map(([tag]) => [attr(tag, "hreflang"), attr(tag, "href")]);
    assert.deepEqual(alternates, [
      ["ja", SITE],
      ["en", `${SITE}/en`],
      ["x-default", SITE],
    ]);
  }
});

test("A8: _headers has the security headers and immutable cache for /_astro/*", () => {
  const text = readDist("_headers");
  const rules = parseHeaders(text);

  assert.deepEqual(rules["/*"], {
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "content-security-policy":
      "frame-ancestors 'none'; object-src 'none'; base-uri 'self'",
    "x-xss-protection": "1; mode=block",
    "referrer-policy": "strict-origin-when-cross-origin",
    "permissions-policy": "camera=(), microphone=(), geolocation=()",
    "strict-transport-security": "max-age=63072000; includeSubDomains; preload",
  });
  assert.equal(
    rules["/_astro/*"]?.["cache-control"],
    "public, max-age=31536000, immutable",
  );
  assert.doesNotMatch(text, /no-transform/i);
});

test("A9: wrangler.jsonc serves dist/ as static assets, with the Worker for the colors under /hex/ and /en/hex/ only", () => {
  const config = parseJsonc(readFileSync(join(root, "wrangler.jsonc"), "utf8"));

  assert.equal(config.name, "unlibra-com");
  // The Worker runs only for Just HEX's colors (/hex/FFFFFF,
  // /en/hex/FFFFFF), not for its top pages (/hex, /en/hex, with or without
  // the slash); every other request is a static asset, served without it.
  assert.equal(config.main, "./worker/index.ts");
  // Only the custom domain serves the site (no workers.dev, no Version URLs).
  assert.equal(config.workers_dev, false);
  assert.equal(config.preview_urls, false);
  assert.deepEqual(config.assets, {
    directory: "./dist",
    html_handling: "drop-trailing-slash",
    not_found_handling: "404-page",
    binding: "ASSETS",
    run_worker_first: ["/hex/*", "!/hex/", "/en/hex/*", "!/en/hex/"],
  });

  // The latest date the installed runtime supports is encoded in the
  // workerd version (1.YYYYMMDD.x).
  assert.match(config.compatibility_date, /^\d{4}-\d{2}-\d{2}$/);
  const workerd = JSON.parse(
    readFileSync(join(root, "node_modules/workerd/package.json"), "utf8"),
  );
  const [, ymd] = workerd.version.split(".");
  const supported = `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`;
  assert.ok(
    config.compatibility_date <= supported,
    `${config.compatibility_date} is newer than ${supported}`,
  );

  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  assert.ok(
    Object.values(pkg.scripts).some((s) => /^wrangler dev\b/.test(s)),
    "package.json has no script running `wrangler dev`",
  );
});

test("index.html footer keeps the space between the year and the name", () => {
  // Astro 7 compresses whitespace between expressions (compressHTML: "jsx").
  assert.match(
    readDist("index.html"),
    /(?:&copy;|©) \d{4}(?:–\d{4})? unlibra</,
  );
});

test("not-found: the 404 page says the page is not found and has the capsule button to the top, in English only", () => {
  const html = readDist("404.html");
  const body = html.match(/<body[^>]*>([\s\S]*)<\/body>/)[1];
  const visible = body
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, "")
    .replace(/<metadata[\s\S]*?<\/metadata>/g, "")
    .replace(/<!--[\s\S]*?-->/g, "");
  const h1 = [...visible.matchAll(/<h1[^>]*>([^<]*)<\/h1>/g)].map((m) =>
    m[1].trim(),
  );
  assert.deepEqual(h1, ["Page not found"]);
  const links = [...visible.matchAll(/<a\s[^>]*>([\s\S]*?)<\/a>/g)];
  assert.equal(links.length, 1);
  assert.equal(links[0][1].replace(/<[^>]*>/g, "").trim(), "Back to top");
  assert.match(links[0][0], /\shref="\/"/);
  assert.match(links[0][0], /class="[^"]*\brounded-full\b/);
  // No Japanese on the page, and the <title> and the description are in
  // English too (i18n I18N-6).
  const text = visible.replace(/<[^>]*>/g, " ");
  assert.doesNotMatch(text, /[\p{scx=Hira}\p{scx=Kana}\p{scx=Han}]/u);
  assert.match(html, /<html[^>]*lang="en"/);
  assert.match(html, /<title>Page not found - unlibra<\/title>/);
  assert.match(html, /<meta name="description" content="Page not found"/);
});

test("not-found: the planet and the stars are the DiceBear Planets SVG, split in two", () => {
  const read = (name) =>
    readFileSync(join(root, "src/assets/not-found", name), "utf8");
  const planet = read("planet.svg");
  const stars = read("stars.svg");
  for (const svg of [planet, stars]) {
    // The metadata (DiceBear, CC0) is kept.
    assert.match(svg, /<dc:title>Planets<\/dc:title>/);
    assert.match(svg, /<dc:creator>DiceBear<\/dc:creator>/);
    assert.match(svg, /publicdomain\/zero\/1\.0/);
    assert.match(svg, /^<svg [^>]*viewBox="0 0 100 100"/);
  }
  // The planet: the disc, the surface, the shade, the ring, the moons and
  // the animation with its prefers-reduced-motion handling; no background
  // and no stars.
  for (const id of [
    "planet-disc",
    "surface-marbled",
    "shade-soft",
    "ring-bold",
    "moons-two",
    "animation-medium",
  ]) {
    assert.match(planet, new RegExp(`href="#${id}-3377a579"`), id);
  }
  assert.match(planet, /@media \(prefers-reduced-motion: no-preference\)/);
  assert.doesNotMatch(planet, /#282c34|star-(small|faint)/);
  // The stars: the background and the twelve stars, no planet.
  assert.match(stars, /<rect width="100" height="100" fill="#282c34"\/>/);
  assert.equal(stars.match(/href="#star-(small|faint)-3377a579"/g).length, 12);
  assert.doesNotMatch(stars, /planet-disc|moons|ring-bold|dbpa/);
  // The page shows the planet inline (for its CSS animation) and the stars
  // as the background tile.
  const html = readDist("404.html");
  assert.match(
    html,
    /<svg [^>]*viewBox="0 0 100 100"[\s\S]*href="#planet-disc-3377a579"/,
  );
  assert.match(html, /background-image: ?url\(\/_astro\/stars\.[\w-]+\.svg\)/);
});

test("ui-revise13 1, 2: the theme colors, the link colors and the catch copy's colors are tokens with their values", () => {
  const css = readFileSync(join(root, "src/styles/global.css"), "utf8");
  const tokens = Object.fromEntries(
    [...css.matchAll(/--color-([\w-]+):\s*([^;]+);/g)].map(([, n, v]) => [
      n,
      v.trim(),
    ]),
  );
  assert.equal(tokens.sora, "#a0d8ef");
  assert.equal(tokens["sora-deep"], "#4d9fd6");
  assert.equal(tokens.primary, "#277db2");
  assert.equal(tokens["primary-dark"], "#02689c");
  assert.equal(tokens["link-dark"], "#a0d8ef");
  assert.equal(tokens["primary-light"], undefined);
  assert.equal(tokens.link, "#1e76ab");
  assert.equal(tokens["link-hover"], "#005d91");
  assert.equal(tokens["link-dark-hover"], "#a5def5");
  assert.equal(tokens["catch-day"], "#ee7800");
  assert.equal(tokens["catch-night"], "#e7d9a8");
  // The Markdown pages' links take the tokens, not values written there.
  const markdown = readFileSync(
    join(root, "src/layouts/MarkdownLayout.astro"),
    "utf8",
  );
  const links = markdown.slice(
    markdown.indexOf(".prose a:not([data-button]) {"),
  );
  assert.doesNotMatch(links, /#[0-9a-f]{3,8}\b/i);
  for (const token of ["link", "link-hover", "link-dark", "link-dark-hover"]) {
    assert.ok(links.includes(`var(--color-${token})`), token);
  }
});

test("IndexNow: the key file is at the site root, holding only its own key", () => {
  // Microsoft's IndexNow (Bing): the key is the file's name and its content.
  const key = "67426e8c4c044cef96ebc2f901da0154";
  assert.equal(readDist(`${key}.txt`), key);
});
