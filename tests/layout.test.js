// Integration tests for the common layout (Phase 2) against dist/.
// Run `npm run build` before `npm test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, globSync, readFileSync } from "node:fs";
import { dirname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const SITE = "https://unlibra.com";

if (!existsSync(join(dist, "index.html"))) {
  throw new Error("dist/ not found. Run `npm run build` before `npm test`.");
}

const readDist = (path) => readFileSync(join(dist, path), "utf8");
const attr = (tag, name) => tag.match(new RegExp(`${name}="([^"]*)"`))?.[1];

/** HTML files in dist/ as posix-style paths relative to dist/. */
const htmlPages = () =>
  globSync("**/*.html", { cwd: dist })
    .map((p) => p.split(sep).join("/"))
    .sort();

/** "index.html" -> "/", "privacy/index.html" -> "/privacy". */
const pathOf = (file) => "/" + file.replace(/(^|\/)index\.html$/, "");

const head = (html) => {
  const match = html.match(/<head>([\s\S]*?)<\/head>/);
  assert.ok(match, "no <head>");
  return match[1];
};

/** Inline <script> bodies (no src attribute) in the order they appear. */
const inlineScripts = (html) =>
  [...html.matchAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(
    (m) => ({ index: m.index, tag: m[0], body: m[1] }),
  );

const isThemeInit = (body) =>
  body.includes("localStorage") && /classList\.toggle\("dark"/.test(body);

test("the build has the pages this test suite expects", () => {
  // Guards against the checks below passing on an empty page list.
  const tools = ["favicon-generator", "password-generator", "svg-optimizer"];
  assert.deepEqual(
    htmlPages(),
    [
      "404.html",
      "credits/index.html",
      "donate/index.html",
      "en/credits/index.html",
      "en/donate/index.html",
      "en/hex/index.html",
      "en/index.html",
      ...tools.map((tool) => `en/lab/${tool}/index.html`),
      "hex/index.html",
      "index.html",
      ...tools.map((tool) => `lab/${tool}/index.html`),
      "privacy/index.html",
    ].sort(),
  );
});

/**
 * The pages with the header and the footer: all but the 404 page, which
 * fills the screen by itself (not-found).
 */
const BARE_PAGES = ["404.html"];
const chromePages = () =>
  htmlPages().filter((file) => !BARE_PAGES.includes(file));

test("not-found: the 404 page has no header, no footer and no logotype", () => {
  for (const file of BARE_PAGES) {
    const html = readDist(file);
    assert.doesNotMatch(html, /<header[\s>]|<footer[\s>]/);
    assert.doesNotMatch(html, /data-logotype|font-brand|data-theme-option/);
  }
  assert.equal(
    chromePages().length,
    htmlPages().length - BARE_PAGES.length,
    "self-check",
  );
});

/**
 * Language of a page: English under /en and the 404 page (one for every
 * path, in English), otherwise ja (docs/decisions/i18n/).
 * Just HEX's app is in English on both (lang="en" on the app's parts;
 * just-hex JH-16).
 */
const langOf = (file) =>
  file === "404.html" || file.startsWith("en/") ? "en" : "ja";

/** The top page in a language. */
const homeOf = (lang) => (lang === "ja" ? "/" : "/en");

/** A page's path in a language, from its Japanese path. */
const localized = (path, lang) =>
  lang === "ja" ? path : path === "/" ? "/en" : `/en${path}`;

/**
 * Pages without a page in the other language: the privacy policy (Japanese
 * only, for its exact wording) and the 404 page (one for every path, in
 * English).
 */
const singleLanguagePages = ["404.html", "privacy/index.html"];

/** The pages in both languages, by their Japanese path. */
const bilingualPages = () =>
  htmlPages()
    .filter((file) => !singleLanguagePages.includes(file))
    .map(pathOf)
    .filter((path) => !/^\/en(\/|$)/.test(path));

test("C2: pages other than 404 have exactly one canonical and a matching og:url", () => {
  for (const file of htmlPages().filter((f) => !BARE_PAGES.includes(f))) {
    const html = head(readDist(file));
    const expected = SITE + pathOf(file).replace(/\/$/, "");
    assert.doesNotMatch(expected, /\/$/);

    const canonical = html.match(/<link[^>]*rel="canonical"[^>]*>/g) ?? [];
    assert.equal(canonical.length, 1, `${file}: canonical count`);
    assert.equal(attr(canonical[0], "href"), expected, `${file}: canonical`);

    const ogUrl = html.match(/<meta[^>]*property="og:url"[^>]*>/g) ?? [];
    assert.equal(ogUrl.length, 1, `${file}: og:url count`);
    assert.equal(attr(ogUrl[0], "content"), expected, `${file}: og:url`);
  }
});

test("C2: the 404 page has neither canonical nor og:url", () => {
  for (const file of BARE_PAGES) {
    const html = readDist(file);
    assert.doesNotMatch(html, /rel="canonical"/, file);
    assert.doesNotMatch(html, /property="og:url"/, file);
  }
});

test("pages have title, description, OGP and Twitter card metadata", () => {
  for (const file of htmlPages()) {
    const html = head(readDist(file));
    assert.match(html, /<title>[^<]+<\/title>/, file);
    for (const [key, name] of [
      ["name", "description"],
      ["property", "og:title"],
      ["property", "og:description"],
      ["property", "og:image"],
      ["property", "og:site_name"],
      ["name", "twitter:card"],
      ["name", "twitter:image"],
    ]) {
      const tags = html.match(
        new RegExp(`<meta[^>]*${key}="${name}"[^>]*>`, "g"),
      );
      assert.equal(tags?.length, 1, `${file}: ${name}`);
      assert.ok(attr(tags[0], "content"), `${file}: ${name} is empty`);
    }
    const ogImage = html.match(/<meta[^>]*property="og:image"[^>]*>/)[0];
    assert.equal(attr(ogImage, "content"), `${SITE}/ogp.png`, file);
    assert.match(
      readDist(file),
      new RegExp(`<html[^>]*lang="${langOf(file)}"`),
      file,
    );
  }
});

test("C3: the theme init script comes before any stylesheet in <head>", () => {
  for (const file of htmlPages()) {
    const html = head(readDist(file));
    const scripts = inlineScripts(html).filter((s) => isThemeInit(s.body));
    assert.equal(scripts.length, 1, `${file}: theme init script count`);
    assert.doesNotMatch(scripts[0].tag, /type="module"/, file);

    const styles = [
      html.search(/<link[^>]*rel="stylesheet"/),
      html.search(/<style[\s>]/),
    ].filter((i) => i >= 0);
    assert.ok(styles.length > 0, `${file}: no stylesheet in <head>`);
    assert.ok(
      scripts[0].index < Math.min(...styles),
      `${file}: theme init script is after a stylesheet`,
    );
  }
});

/** Runs the theme init script with a fake browser environment. */
const runThemeInit = ({ stored, systemDark, storageThrows = false }) => {
  const script = inlineScripts(head(readDist("index.html"))).find((s) =>
    isThemeInit(s.body),
  ).body;
  const classes = new Set();
  const context = {
    matchMedia: (query) => ({
      matches: query === "(prefers-color-scheme: dark)" && systemDark,
    }),
    document: {
      documentElement: {
        classList: {
          toggle: (name, force) => {
            if (force) classes.add(name);
            else classes.delete(name);
          },
        },
      },
    },
  };
  context.window = context;
  Object.defineProperty(context, "localStorage", {
    get() {
      if (storageThrows) throw new Error("SecurityError: storage is disabled");
      return { getItem: (key) => (key === "theme" ? stored : null) };
    },
  });
  vm.runInNewContext(script, context);
  return classes.has("dark");
};

test("theme init: an explicit choice wins over the system setting", () => {
  assert.equal(runThemeInit({ stored: "dark", systemDark: false }), true);
  assert.equal(runThemeInit({ stored: "light", systemDark: true }), false);
});

test("theme init: system (or no choice) follows prefers-color-scheme", () => {
  for (const stored of ["system", null, "unexpected"]) {
    assert.equal(runThemeInit({ stored, systemDark: true }), true, stored);
    assert.equal(runThemeInit({ stored, systemDark: false }), false, stored);
  }
});

test("theme init: unavailable localStorage does not throw and follows the system", () => {
  assert.equal(
    runThemeInit({ stored: "light", systemDark: true, storageThrows: true }),
    true,
  );
  assert.equal(
    runThemeInit({ stored: "dark", systemDark: false, storageThrows: true }),
    false,
  );
});

/** CSS files linked from an HTML page, plus inline <style> contents. */
const pageCss = (html) => {
  const linked = [...html.matchAll(/<link[^>]*rel="stylesheet"[^>]*>/g)].map(
    (m) => readDist(attr(m[0], "href").replace(/^\//, "")),
  );
  const inline = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(
    (m) => m[1],
  );
  return linked.concat(inline).join("\n");
};

test("C6: body text uses Noto Sans JP and its font files are in dist/", () => {
  for (const file of htmlPages()) {
    const css = pageCss(readDist(file));
    assert.match(css, /--font-sans:\s*"Noto Sans JP Variable"/, file);
    assert.match(css, /--default-font-family:\s*var\(--font-sans\)/, file);

    const faces = [...css.matchAll(/@font-face\s*{([^}]*)}/g)]
      .map((m) => m[1])
      .filter((face) => /font-family:\s*"?Noto Sans JP Variable/.test(face));
    assert.ok(faces.length > 0, `${file}: no @font-face for Noto Sans JP`);
    for (const face of faces) {
      for (const [, url] of face.matchAll(/url\(([^)]+)\)/g)) {
        const path = url.replace(/^["']|["']$/g, "").replace(/^\//, "");
        assert.ok(existsSync(join(dist, path)), `${file}: ${path} is missing`);
      }
    }
  }
});

test("ui-revise7 5: no text class smaller than 14px in the sources (the sizes and line heights are checked in typography.spec.js)", () => {
  const small = /\btext-(?:xs|2xs|\[(?:\d|1[0-3])px\]|\[0?\.\d+rem\])/;
  const files = globSync("src/**/*.{astro,ts,tsx,css,md}", { cwd: root });
  assert.ok(files.length > 50, "self-check");
  const found = files.filter((f) =>
    small.test(readFileSync(join(root, f), "utf8")),
  );
  assert.deepEqual(found, []);
  // The check finds them.
  assert.ok(small.test('className="text-xs"'));
  assert.ok(small.test('class="text-[0.75rem]"'));
});

test("ui-revise7 3, just-hex JH-12: monospace text uses DM Mono in the weights used (400, 500); Geist Mono and Roboto Mono are gone", () => {
  for (const file of htmlPages()) {
    const css = pageCss(readDist(file));
    assert.match(css, /--font-mono:\s*"DM Mono",\s*monospace/, file);
    const faces = [...css.matchAll(/@font-face\s*{([^}]*)}/g)]
      .map((m) => m[1])
      .filter((face) => /font-family:\s*["']?DM Mono/.test(face));
    // Only the upright 400 and 500 (font-medium) are loaded.
    const weights = new Set(
      faces.map((face) => face.match(/font-weight:\s*(\d+)/)[1]),
    );
    assert.deepEqual([...weights].sort(), ["400", "500"], file);
    for (const face of faces) {
      assert.match(face, /font-style:\s*normal/, file);
      for (const [, url] of face.matchAll(/url\(([^)]+)\)/g)) {
        const path = url.replace(/^["']|["']$/g, "").replace(/^\//, "");
        // The bundler inlines the small subsets as data: URLs.
        if (path.startsWith("data:font/")) continue;
        assert.ok(existsSync(join(dist, path)), `${file}: ${path} is missing`);
      }
    }
  }
  // The font files in dist/: DM Mono in 400 and 500 only.
  const files = globSync("_astro/dm-mono-*", { cwd: dist });
  assert.ok(files.length > 0, "DM Mono files in dist/");
  for (const f of files) {
    assert.match(f, /dm-mono-[\w-]+-(400|500)-normal\.[\w-]+\.woff2?$/, f);
  }

  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  assert.ok(pkg.dependencies["@fontsource/dm-mono"]);
  for (const field of ["dependencies", "devDependencies"]) {
    assert.equal(pkg[field]?.["@fontsource/roboto-mono"], undefined);
    assert.equal(pkg[field]?.["@fontsource/geist-mono"], undefined);
  }
  // ("Roboto" alone is in the system font stack of Tailwind's preflight.)
  const roboto = /roboto[ -]?mono/i;
  assert.deepEqual(
    globSync("**/*.{html,css,js,txt}", { cwd: dist })
      .concat(globSync("**/*roboto*", { cwd: dist }))
      .filter(
        (p) =>
          roboto.test(p) || roboto.test(readFileSync(join(dist, p), "utf8")),
      ),
    [],
  );
});

/**
 * JavaScript a page loads: inline module scripts, external scripts and
 * modulepreloads, and the dist/_astro/*.js files they reference (recursively).
 */
const pageJavaScript = (html) => {
  const sources = inlineScripts(html).map((s) => s.body);
  const pending = [
    ...html.matchAll(/<script[^>]*\ssrc="([^"]+)"/g),
    ...html.matchAll(/<link[^>]*rel="modulepreload"[^>]*href="([^"]+)"/g),
  ].map((m) => m[1]);
  const seen = new Set();
  const referenced = (code) =>
    [...code.matchAll(/([\w.-]+\.js)\b/g)]
      .map((m) => `/_astro/${m[1]}`)
      .filter((p) => existsSync(join(dist, p)));
  for (const code of sources) pending.push(...referenced(code));
  while (pending.length > 0) {
    const path = pending.pop();
    if (seen.has(path)) continue;
    seen.add(path);
    const code = readDist(path.replace(/^\//, ""));
    sources.push(code);
    pending.push(...referenced(code));
  }
  return sources;
};

test("C7: the top page, privacy and credits do not load the React runtime", () => {
  // Symbols every React runtime build defines.
  const reactMarker = /react\.(transitional\.)?element/;
  for (const file of [
    "index.html",
    "en/index.html",
    "privacy/index.html",
    "credits/index.html",
    "en/credits/index.html",
  ]) {
    const html = readDist(file);
    assert.doesNotMatch(html, /<astro-island/, file);
    for (const code of pageJavaScript(html)) {
      assert.doesNotMatch(code, reactMarker, file);
    }
  }
});

const sectionOf = (html, tag) => {
  const sections = html.match(
    new RegExp(`<${tag}[\\s>][\\s\\S]*?</${tag}>`, "g"),
  );
  assert.equal(sections?.length, 1, `<${tag}> count`);
  return sections[0];
};

const hrefs = (html) =>
  [...html.matchAll(/<a\s[^>]*>/g)].map((m) => attr(m[0], "href"));

/** Category IDs (the section anchors) and names, the same in both languages. */
const CATEGORIES = [
  ["keyboards", "DIY Keyboards"],
  ["libraries", "Libraries"],
  ["apps", "Apps"],
  ["vr-3d", "VR &amp; 3D"],
];

/** Links (href and text) in a piece of HTML, in order. */
const anchors = (html) =>
  [...html.matchAll(/<a\s[^>]*>([\s\S]*?)<\/a>/g)].map((m) => ({
    href: attr(m[0], "href"),
    text: m[1]
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  }));

test("ui-revise2 1, 6: the header links to the category sections, without menus", () => {
  for (const file of chromePages()) {
    const lang = langOf(file);
    const header = sectionOf(readDist(file), "header");
    // The sections of the top page in the page's language.
    const expected = CATEGORIES.map(([id, name]) => ({
      href: `${homeOf(lang)}#${id}`,
      text: name,
    }));

    // Desktop: the four categories as plain links, in both languages.
    const nav = header.match(/<ul[^>]*data-category-nav[\s\S]*?<\/ul>/);
    assert.ok(nav, `${file}: no category navigation`);
    assert.deepEqual(anchors(nav[0]), expected, file);
    assert.doesNotMatch(nav[0], /<button[\s>]|data-popover/, file);
    assert.doesNotMatch(header, /category-web-menu|data-category-menu/, file);

    // No tool pages in the header (the former web tools menu), except the
    // language switch's link to this page in the other language.
    const withoutSwitcher = header.replace(
      /<a\s[^>]*data-language-switch[\s\S]*?<\/a>/,
      "",
    );
    assert.ok(
      !hrefs(withoutSwitcher).some((href) => /\/lab\//.test(href)),
      file,
    );
  }
});

test("ui-revise 1: the header has no GitHub button and no link to a tool list", () => {
  for (const file of chromePages()) {
    const links = hrefs(sectionOf(readDist(file), "header"));
    assert.ok(!links.includes("https://github.com/unlibra"), file);
    assert.ok(!links.includes("/lab") && !links.includes("/en/lab"), file);
  }
});

test("C4: every page has the common header", () => {
  for (const file of chromePages()) {
    const header = sectionOf(readDist(file), "header");
    const links = hrefs(header);
    const lang = langOf(file);
    // The logo goes to the top page in the page's language.
    assert.ok(links.includes(homeOf(lang)), `${file}: home link`);
    assert.match(
      header,
      /data-site-name data-logotype>\s*<svg class="inline" role="img" aria-label="unlibra"/,
      `${file}: site name`,
    );
    assert.match(header, /<svg[^>]*viewBox="0 0 512 512"/, `${file}: logo`);

    // Theme toggle: a button controlling a hidden panel of three choices.
    const toggleLabel = lang === "en" ? "Toggle theme" : "テーマを切り替え";
    assert.match(
      header,
      new RegExp(
        `<button[^>]*aria-label="${toggleLabel}"[^>]*aria-expanded="false"[^>]*aria-controls="theme-menu"`,
      ),
      file,
    );
    assert.match(header, /<div[^>]*id="theme-menu"[^>]*hidden/, file);
    const options = [...header.matchAll(/data-theme-option="([^"]+)"/g)].map(
      (m) => m[1],
    );
    assert.deepEqual(options, ["light", "dark", "system"], file);
  }
});

test("pages without another language version have no language switch", () => {
  for (const file of singleLanguagePages) {
    const html = readDist(file);
    assert.doesNotMatch(html, /data-language-switch/, file);
    assert.doesNotMatch(html, /hreflang/, file);
  }
});

test("i18n: every other page is in both languages, Japanese without a prefix and English under /en", () => {
  const pages = bilingualPages();
  assert.ok(pages.includes("/") && pages.includes("/donate"), "self-check");
  for (const path of pages) {
    for (const lang of ["ja", "en"]) {
      const target = localized(path, lang);
      const file =
        target === "/" ? "index.html" : `${target.slice(1)}/index.html`;
      assert.ok(existsSync(join(dist, file)), `${target} is missing`);
      assert.match(readDist(file), new RegExp(`<html lang="${lang}"`), file);
    }
  }
});

test("i18n: the language switch goes straight to this page in the other language, with the world icon and that language's name", async () => {
  const { localeNames } = await import("../src/messages/layout.ts");
  for (const path of bilingualPages()) {
    for (const [lang, target] of [
      ["ja", "en"],
      ["en", "ja"],
    ]) {
      const self = localized(path, lang);
      const file = self === "/" ? "index.html" : `${self.slice(1)}/index.html`;
      const html = readDist(file);
      const header = sectionOf(html, "header");
      const switches = [
        ...header.matchAll(/<a\s[^>]*data-language-switch[^>]*>[\s\S]*?<\/a>/g),
      ].map(([a]) => a);
      assert.equal(switches.length, 1, `${file}: switch count`);
      const [link] = switches;
      const tag = link.match(/<a\s[^>]*>/)[0];
      // A link, not a menu: no button or popover.
      assert.equal(attr(tag, "href"), localized(path, target), file);
      assert.equal(attr(tag, "hreflang"), target, file);
      assert.equal(attr(tag, "lang"), target, file);
      assert.doesNotMatch(header, /data-popover[^>]*data-language/, file);
      // The world icon and the name of the language it goes to, written in
      // that language ("English" on the Japanese pages, "日本語" on the
      // English ones).
      assert.match(link, /data-icon="world"|<svg[^>]*>[\s\S]*<\/svg>/, file);
      assert.equal(
        link
          .replace(/<svg[\s\S]*?<\/svg>/g, "")
          .replace(/<[^>]*>/g, "")
          .trim(),
        localeNames[target],
        file,
      );
      // A rounded button with a light border.
      const classes = attr(tag, "class").split(/\s+/);
      for (const name of ["rounded-full", "border", "border-gray-300"]) {
        assert.ok(classes.includes(name), `${file}: ${name}`);
      }
      // Left of the theme toggle.
      assert.ok(
        header.indexOf("data-language-switch") <
          header.indexOf("data-theme-toggle"),
        `${file}: switch before the theme toggle`,
      );
      // The hreflang links of the page agree with the switch.
      const alternates = Object.fromEntries(
        [...head(html).matchAll(/<link[^>]*rel="alternate"[^>]*>/g)].map(
          ([alternate]) => [
            attr(alternate, "hreflang"),
            attr(alternate, "href"),
          ],
        ),
      );
      const url = (p) => (p === "/" ? SITE : SITE + p);
      assert.deepEqual(
        alternates,
        {
          ja: url(localized(path, "ja")),
          en: url(localized(path, "en")),
          "x-default": url(localized(path, "ja")),
        },
        file,
      );
    }
  }
});

test("i18n: the English pages link to the English pages of this site, and to the Japanese privacy policy", () => {
  // The pages under /en (the 404 page, for every path, goes back to /).
  for (const file of htmlPages().filter((f) => f.startsWith("en/"))) {
    const html = readDist(file).replace(
      /<a\s[^>]*data-language-switch[\s\S]*?<\/a>/,
      "",
    );
    const internal = hrefs(html).filter(
      (href) => href?.startsWith("/") && !href.startsWith("//"),
    );
    for (const href of internal) {
      assert.ok(
        /^\/en([/#]|$)/.test(href) ||
          href === "/privacy" ||
          href === "/third-party-licenses.txt",
        `${file}: ${href}`,
      );
    }
  }
});

test("C4: every page has the common footer with the required links", () => {
  for (const file of chromePages()) {
    const footer = sectionOf(readDist(file), "footer");
    // The build year ends the notice (ui-revise 7).
    const year = new Date().getFullYear();
    const notice = year === 2025 ? "© 2025 unlibra" : `© 2025–${year} unlibra`;
    assert.ok(footer.includes(`>${notice}<`), `${file}: copyright`);
    const links = hrefs(footer);
    const lang = langOf(file);
    for (const href of [
      homeOf(lang),
      "https://github.com/unlibra",
      localized("/donate", lang),
      // The privacy policy is in Japanese only.
      "/privacy",
      localized("/credits", lang),
    ]) {
      assert.ok(links.includes(href), `${file}: footer link to ${href}`);
    }
  }
});

test("ui-revise 6: the footer has the GitHub, docs and BOOTH links in place of the tools", async () => {
  const { layoutMessages } = await import("../src/messages/layout.ts");
  for (const file of chromePages()) {
    const t = layoutMessages[langOf(file)].footer;
    const footer = sectionOf(readDist(file), "footer");
    const group = footer.match(/<div[^>]*data-footer-links[\s\S]*?<\/ul>/);
    assert.ok(group, `${file}: no link group`);
    assert.match(group[0], new RegExp(`<h2[^>]*>${t.links}</h2>`), file);
    assert.deepEqual(
      anchors(group[0]),
      [
        { href: "https://github.com/unlibra", text: t.github },
        { href: "https://docs.unlibra.com/", text: t.docs },
        { href: "https://unlibra.booth.pm/", text: t.shop },
      ],
      file,
    );
    for (const tag of group[0].match(/<a\s[^>]*>/g)) {
      assert.match(tag, /target="_blank"/, file);
      assert.match(tag, /rel="noopener noreferrer"/, file);
    }
    // GitHub only in this group (not under the logo as well).
    assert.equal(
      hrefs(footer).filter((href) => href === "https://github.com/unlibra")
        .length,
      1,
      `${file}: GitHub links in the footer`,
    );
    // The former TOOLS column is gone.
    assert.ok(!hrefs(footer).some((href) => /\/lab\b/.test(href)), file);
    assert.doesNotMatch(footer, />Tools</, file);
  }
});

test("ui-revise6 3: the footer's Information group links to the donate page, the privacy policy and the credits", async () => {
  const { layoutMessages } = await import("../src/messages/layout.ts");
  // The privacy policy is in Japanese only; the English label says so. The
  // donate page and the credits are in both languages (docs/decisions/i18n/).
  assert.equal(layoutMessages.en.footer.donate, "Support My Work");
  assert.equal(layoutMessages.en.footer.credits, "Credits");
  assert.equal(
    layoutMessages.en.footer.privacyPolicy,
    "Privacy Policy (Japanese)",
  );
  for (const file of chromePages()) {
    const lang = langOf(file);
    const t = layoutMessages[lang].footer;
    const footer = sectionOf(readDist(file), "footer");
    const group = footer.match(
      /<div[^>]*data-footer-information[\s\S]*?<\/ul>/,
    );
    assert.ok(group, `${file}: no information group`);
    // "INFORMATION" on screen (uppercase), in place of "SUPPORT".
    assert.match(
      group[0],
      /<h2[^>]*\buppercase\b[^>]*>Information<\/h2>/,
      file,
    );
    assert.doesNotMatch(footer, />Support</i, file);
    assert.deepEqual(
      anchors(group[0]).map(({ href, text }) => ({
        href,
        text: text.replace(/&amp;/g, "&"),
      })),
      [
        { href: localized("/donate", lang), text: t.donate },
        { href: "/privacy", text: t.privacyPolicy },
        { href: localized("/credits", lang), text: t.credits },
      ],
      file,
    );
    // The credits page is on this site: the same tab.
    const credits = group[0].match(
      new RegExp(`<a\\s[^>]*href="${localized("/credits", lang)}"[^>]*>`),
    )[0];
    assert.doesNotMatch(credits, /target=/, file);
    // The Japanese privacy policy, said so to the English pages' readers.
    const privacy = group[0].match(/<a\s[^>]*href="\/privacy"[^>]*>/)[0];
    assert.equal(
      attr(privacy, "hreflang"),
      lang === "ja" ? undefined : "ja",
      file,
    );
  }
});

test("ui-revise 7: the copyright notice runs from 2025 to the build year", async () => {
  const { copyrightNotice } = await import("../src/config/site.ts");
  assert.equal(copyrightNotice(2025), "© 2025 unlibra");
  assert.equal(copyrightNotice(2026), "© 2025–2026 unlibra");
  assert.equal(copyrightNotice(2031), "© 2025–2031 unlibra");
  for (const year of [2024, 2025.5, Number.NaN]) {
    assert.throws(() => copyrightNotice(year), /2025 or later/, String(year));
  }
});

test("ui-revise4 3: the footer is a grid of four columns, 2:1:1, with the cells left-aligned", () => {
  for (const file of chromePages()) {
    const footer = sectionOf(readDist(file), "footer");
    const classesOf = (marker) =>
      (
        attr(
          footer.match(new RegExp(`<div[^>]*${marker}[^>]*>`))[0],
          "class",
        ) ?? ""
      )
        .split(/\s+/)
        .filter(Boolean);
    const brand = footer.match(/<div[^>]*data-footer-brand[^>]*>/)[0];
    // The grid is the brand's parent: the <div> just before it.
    const before = footer.slice(0, footer.indexOf(brand));
    const grid = attr(before.match(/<div[^>]*>(?![\s\S]*<div)/)[0], "class");
    const gridClasses = grid.split(/\s+/);
    // One column when narrow (as on the former tool site), four from md.
    assert.ok(gridClasses.includes("grid-cols-1"), file);
    assert.ok(gridClasses.includes("md:grid-cols-4"), file);
    assert.ok(!gridClasses.some((name) => /grid-cols-\[/.test(name)), file);
    // The brand and the description take two columns, the others one.
    assert.deepEqual(
      classesOf("data-footer-brand").filter((n) => /col-span/.test(n)),
      ["md:col-span-2"],
      file,
    );
    for (const marker of ["data-footer-links", "data-footer-information"]) {
      const cls = classesOf(marker);
      assert.ok(
        !cls.some((n) => /col-span|justify-self|text-(right|center)/.test(n)),
        `${file}: ${marker}`,
      );
    }
  }
});

test("ui-revise2 8, ui-revise6 1: the footer's description and link labels", () => {
  const expected = {
    ja: "個人で制作したプロダクトを紹介するサイトです。昼はビルダー。夜は個人開発。自作キーボード、ライブラリ、アプリ、VRアバターや3Dアセットなど、ジャンルにとらわれず自由にものづくりしています。",
    en: "A site that showcases the things I make on my own. A builder by day. An indie developer by night. DIY keyboards, libraries, apps, VR avatars, 3D assets and more: I make things freely, without being tied to any one genre.",
  };
  for (const file of chromePages()) {
    const footer = sectionOf(readDist(file), "footer");
    assert.ok(footer.includes(`>${expected[langOf(file)]}</p>`), file);
    const group = footer.match(/<div[^>]*data-footer-links[\s\S]*?<\/ul>/)[0];
    assert.deepEqual(
      anchors(group).map((a) => a.text),
      ["GitHub", "Docs", "BOOTH"],
      file,
    );
  }
});

test("ui-revise2 4: the site name is unlibra; the domain stays unlibra.com", () => {
  for (const file of htmlPages()) {
    const html = readDist(file);
    const meta = (key, name) =>
      attr(
        html.match(new RegExp(`<meta[^>]*${key}="${name}"[^>]*>`))[0],
        "content",
      );
    const title = html.match(/<title>([^<]*)<\/title>/)[1];
    if (file === "index.html" || file === "en/index.html") {
      assert.equal(title, "unlibra");
    } else {
      assert.match(title, /^.+ - unlibra$/, file);
    }
    assert.equal(meta("property", "og:title"), title, file);
    assert.equal(meta("name", "twitter:title"), title, file);
    assert.equal(meta("property", "og:site_name"), "unlibra", file);

    // The logotypes (header, footer): see the LINE Seed JP
    // test below.
    // The domain as text is gone; URLs keep it, and so does the donate
    // page's address.
    assert.doesNotMatch(
      html
        .replace(/<script[\s\S]*?<\/script>/g, "")
        .replaceAll(">gift@unlibra.com<", "><"),
      />[^<]*\bunlibra\.com\b[^<]*</,
      file,
    );
    if (!BARE_PAGES.includes(file)) {
      const canonical = html.match(/<link[^>]*rel="canonical"[^>]*>/)[0];
      assert.match(attr(canonical, "href"), /^https:\/\/unlibra\.com(\/|$)/);
    }
  }
});

/** Where the logotype "unlibra" is shown (ui-revise2 4, SP-16). */
const LOGOTYPES = {
  header:
    /<header[\s\S]*?<span [^>]*data-site-name data-logotype>\s*(<svg [\s\S]*?<\/svg>)/,
  footer: /<footer[\s\S]*?<span [^>]*data-logotype>\s*(<svg [\s\S]*?<\/svg>)/,
};
test("ui-revise2 4, ui-revise3 1, SP-16: the logotype is the drawing of unlibra in the header and the footer, and only there", async () => {
  const { LOGOTYPE_FILE } = await import("../scripts/generate-logotype.mjs");
  const drawing = readFileSync(join(root, LOGOTYPE_FILE), "utf8").trim();
  for (const file of chromePages()) {
    const html = readDist(file);
    for (const [place, pattern] of Object.entries(LOGOTYPES)) {
      // The drawing as generated: inline, named for assistive technology.
      assert.equal(
        html.match(pattern)?.[1],
        drawing.replace(
          "<svg ",
          '<svg class="inline" role="img" aria-label="unlibra" ',
        ),
        `${file}: ${place}`,
      );
    }
    // The hero's h1 is no longer a logotype (ui-revise3 1).
    assert.doesNotMatch(html, /<h1[^>]*data-logotype/, file);
    assert.equal(
      (html.match(/\sdata-logotype[\s>]/g) ?? []).length,
      Object.keys(LOGOTYPES).length,
      file,
    );
  }
});

test("SP-16: the logotype needs no font: no LINE Seed JP in the output", () => {
  const css = globSync("_astro/*.css", { cwd: dist })
    .map((p) => readDist(p))
    .join("\n");
  assert.doesNotMatch(css, /LINE Seed JP|font-brand/);
  assert.deepEqual(globSync("**/*line-seed*", { cwd: dist }), []);
});

test("SP-16: the drawing is LINE Seed JP Bold's outlines of unlibra, sized in em on the baseline", async () => {
  const { LOGOTYPE_FILE, LOGOTYPE_SOURCE, LOGOTYPE_TEXT, drawLogotype } =
    await import("../scripts/generate-logotype.mjs");
  assert.equal(LOGOTYPE_TEXT, "unlibra");
  // Drawn again from the font, it is the file in the repository.
  const drawing = readFileSync(join(root, LOGOTYPE_FILE), "utf8");
  assert.equal(
    await drawLogotype(
      readFileSync(join(root, LOGOTYPE_SOURCE)),
      LOGOTYPE_TEXT,
    ),
    drawing,
  );
  assert.match(drawing, /fill="currentColor"/);
  assert.match(drawing, /height="1\.1em"/);
  assert.match(drawing, /style="vertical-align:-0\.168em"/);
  assert.equal((drawing.match(/<path /g) ?? []).length, 1);
});

/** Lists every key path of a nested object, e.g. "footer.github". */
const keyPaths = (object, prefix = "") =>
  Object.entries(object).flatMap(([key, value]) =>
    typeof value === "object"
      ? keyPaths(value, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  );

test("C8: header and footer texts have the same keys in ja and en", async () => {
  // The type check (tests/types/layout-messages.ts) is the guarantee; this
  // checks the actual values as well.
  const { layoutMessages } = await import("../src/messages/layout.ts");
  assert.deepEqual(Object.keys(layoutMessages).sort(), ["en", "ja"]);
  assert.deepEqual(
    keyPaths(layoutMessages.en).sort(),
    keyPaths(layoutMessages.ja).sort(),
  );
  for (const locale of ["ja", "en"]) {
    for (const path of keyPaths(layoutMessages[locale])) {
      const value = path
        .split(".")
        .reduce((object, key) => object[key], layoutMessages[locale]);
      assert.equal(typeof value, "string", `${locale}.${path}`);
      assert.notEqual(value.trim(), "", `${locale}.${path}`);
    }
  }
});

/** Width and height from a PNG's IHDR chunk. */
const pngSize = (buffer) => {
  assert.equal(
    buffer.subarray(0, 8).toString("hex"),
    "89504e470d0a1a0a",
    "not a PNG",
  );
  assert.equal(buffer.subarray(12, 16).toString("latin1"), "IHDR");
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
};

const readDistBuffer = (path) => readFileSync(join(dist, path));

test("C5: icon files are in dist/ with the expected sizes", () => {
  assert.deepEqual(pngSize(readDistBuffer("ogp.png")), {
    width: 1200,
    height: 630,
  });
  assert.deepEqual(pngSize(readDistBuffer("apple-touch-icon.png")), {
    width: 180,
    height: 180,
  });

  // favicon.ico: a directory of PNG images, one of them 32x32.
  const ico = readDistBuffer("favicon.ico");
  assert.equal(ico.readUInt16LE(0), 0);
  assert.equal(ico.readUInt16LE(2), 1, "not an icon");
  const sizes = [];
  for (let i = 0; i < ico.readUInt16LE(4); i++) {
    const entry = 6 + 16 * i;
    const size = ico.readUInt8(entry) || 256;
    const length = ico.readUInt32LE(entry + 8);
    const offset = ico.readUInt32LE(entry + 12);
    const image = ico.subarray(offset, offset + length);
    assert.deepEqual(pngSize(image), { width: size, height: size });
    sizes.push(size);
  }
  assert.ok(sizes.includes(32), `favicon.ico sizes: ${sizes}`);
});

test("C5: favicon.svg is the brand symbol", () => {
  const symbol = readFileSync(
    join(root, "src/assets/brand/symbol.svg"),
    "utf8",
  );
  const icon = readDist("favicon.svg");
  assert.match(icon, /^<svg width="512" height="512" /);
  assert.equal(
    icon.replace(' width="512" height="512"', "").trim(),
    symbol.trim(),
  );
});

test("C5: every page references the icons and the OGP image", () => {
  for (const file of htmlPages()) {
    const html = head(readDist(file));
    const links = [...html.matchAll(/<link\s[^>]*>/g)].map((m) => ({
      rel: attr(m[0], "rel"),
      href: attr(m[0], "href"),
    }));
    for (const [rel, href] of [
      ["icon", "/favicon.ico"],
      ["icon", "/favicon.svg"],
      ["apple-touch-icon", "/apple-touch-icon.png"],
    ]) {
      assert.ok(
        links.some((l) => l.rel === rel && l.href === href),
        `${file}: <link rel="${rel}" href="${href}">`,
      );
      assert.ok(existsSync(join(dist, href.slice(1))), `dist${href}`);
    }
    const twitterImage = html.match(/<meta[^>]*name="twitter:image"[^>]*>/)[0];
    assert.equal(attr(twitterImage, "content"), `${SITE}/ogp.png`, file);
  }
});
