// Integration tests for the web tool pages (Phase 4) against dist/, and the
// license boundary lint rule. Run `npm run build` before `npm test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, globSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ESLint } from "eslint";

import ja from "../src/tools/messages/ja.ts";
import en from "../src/tools/messages/en.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const SITE = "https://unlibra.com";

if (!existsSync(join(dist, "index.html"))) {
  throw new Error("dist/ not found. Run `npm run build` before `npm test`.");
}

const readDist = (path) => readFileSync(join(dist, path), "utf8");
const attr = (tag, name) => tag.match(new RegExp(`${name}="([^"]*)"`))?.[1];
const hrefs = (html) =>
  [...html.matchAll(/<a\s[^>]*>/g)].map((m) => attr(m[0], "href"));

const TOOLS = ["favicon-generator", "svg-optimizer", "password-generator"];
const messages = { ja, en };
const prefix = { ja: "", en: "/en" };
const other = { ja: "en", en: "ja" };

/** Site path of a tool page. */
const pathOf = (lang, tool) => `${prefix[lang]}/lab/${tool}`;
const fileOf = (path) => `${path.slice(1)}/index.html`;

/** The six tool pages as { lang, tool, path }. */
const pages = ["ja", "en"].flatMap((lang) =>
  TOOLS.map((tool) => ({
    lang,
    tool,
    path: pathOf(lang, tool),
  })),
);

const head = (html) => html.match(/<head>([\s\S]*?)<\/head>/)[1];

/** Parsed JSON-LD blocks of a page. */
const jsonLd = (html) =>
  [
    ...html.matchAll(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
    ),
  ].map((m) => JSON.parse(m[1]));

test("E2: the six tool pages exist with lang, canonical and hreflang", () => {
  assert.equal(pages.length, 6);
  for (const { lang, tool, path } of pages) {
    const html = readDist(fileOf(path));
    assert.match(html, new RegExp(`<html[^>]*lang="${lang}"`), path);

    const h = head(html);
    const canonical = h.match(/<link[^>]*rel="canonical"[^>]*>/g) ?? [];
    assert.equal(canonical.length, 1, `${path}: canonical count`);
    assert.equal(attr(canonical[0], "href"), SITE + path, path);

    const alternates = Object.fromEntries(
      [...h.matchAll(/<link[^>]*rel="alternate"[^>]*>/g)].map((m) => [
        attr(m[0], "hreflang"),
        attr(m[0], "href"),
      ]),
    );
    assert.deepEqual(
      alternates,
      {
        ja: SITE + pathOf("ja", tool),
        en: SITE + pathOf("en", tool),
        "x-default": SITE + pathOf("ja", tool),
      },
      path,
    );
  }
});

test("E2: the language switcher links to the same page in the other language", () => {
  for (const { lang, tool, path } of pages) {
    const html = readDist(fileOf(path));
    const switcher = html.match(/<a\s[^>]*data-language-switch[^>]*>/);
    assert.ok(switcher, `${path}: no language switch`);
    assert.equal(attr(switcher[0], "href"), pathOf(other[lang], tool), path);
  }
});

test("tool pages use the tool's name and description as title and description", () => {
  for (const { lang, tool, path } of pages) {
    const h = head(readDist(fileOf(path)));
    const { name, description } = messages[lang].tools[tool];
    // The site name is "unlibra" (ui-revise2 4).
    assert.match(h, new RegExp(`<title>${name} - unlibra</title>`));
    const meta = h.match(/<meta[^>]*name="description"[^>]*>/)[0];
    const decoded = attr(meta, "content").replace(/&#39;/g, "'");
    // In one line: nothing between Japanese sentences, a space between
    // English ones.
    const join = lang === "ja" ? "" : " ";
    assert.equal(decoded, description.replace(/\r?\n/g, join), path);
  }
});

test("E3: tool pages have WebApplication and BreadcrumbList structured data", () => {
  for (const { lang, tool, path } of pages) {
    const html = readDist(fileOf(path));
    const data = jsonLd(html);
    const { name, description } = messages[lang].tools[tool];

    const app = data.filter((d) => d["@type"] === "WebApplication");
    assert.equal(app.length, 1, `${path}: WebApplication count`);
    assert.deepEqual(app[0], {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name,
      description: description.replace(/\r?\n/g, " "),
      url: SITE + path,
      applicationCategory: "DesignApplication",
      operatingSystem: "Any",
      browserRequirements: "Requires JavaScript. Requires HTML5.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "JPY" },
      author: { "@type": "Person", name: "unlibra" },
      inLanguage: lang === "ja" ? "ja-JP" : "en-US",
    });

    const breadcrumbs = data.filter((d) => d["@type"] === "BreadcrumbList");
    assert.equal(breadcrumbs.length, 1, `${path}: BreadcrumbList count`);
    // The first item is the top page in the page's language (ui-revise:
    // there is no tool list).
    const homeLabel = lang === "ja" ? "ホーム" : "Home";
    const home = lang === "ja" ? "/" : "/en";
    assert.deepEqual(breadcrumbs[0].itemListElement, [
      {
        "@type": "ListItem",
        position: 1,
        name: homeLabel,
        item: `${SITE}${home}`,
      },
      { "@type": "ListItem", position: 2, name },
    ]);

    // Visible breadcrumb: a link to the top page, then the current page.
    // Its name is in the page's language (final-review 4).
    const navLabel = lang === "ja" ? "パンくずリスト" : "Breadcrumb";
    const nav = html.match(
      new RegExp(`<nav[^>]*aria-label="${navLabel}"[\\s\\S]*?</nav>`),
    );
    assert.ok(nav, `${path}: no breadcrumb`);
    assert.deepEqual(hrefs(nav[0]), [home]);
    assert.ok(nav[0].includes(`>${homeLabel}<`), `${path}: home label`);
    assert.match(nav[0], new RegExp(`aria-current="page">${name}<`));

    assert.match(html, new RegExp(`<h1[^>]*>${name}</h1>`), path);
  }
});

/** The page's islands as { component, client, props }. */
const islands = (html) =>
  [...html.matchAll(/<astro-island\s[^>]*>/g)].map((m) => ({
    component: attr(m[0], "component-url"),
    client: attr(m[0], "client"),
    props: JSON.parse(attr(m[0], "props").replace(/&quot;/g, '"')),
  }));

test("E3: each tool page has its own island, loaded on page load", () => {
  for (const { lang, tool, path } of pages) {
    const found = islands(readDist(fileOf(path)));
    assert.equal(found.length, 1, `${path}: island count`);
    const [island] = found;
    assert.match(
      island.component,
      new RegExp(`^/_astro/${tool}\\.[\\w-]+\\.js$`),
      path,
    );
    assert.ok(existsSync(join(dist, island.component.slice(1))), path);
    assert.equal(island.client, "load", path);
    // Astro serializes each prop as [type, value]; 0 is a plain value.
    assert.deepEqual(island.props, { locale: [0, lang] }, path);
  }
});

test("ui-revise 2: there are no tool list pages", () => {
  for (const lang of ["ja", "en"]) {
    const dir = `${prefix[lang]}/lab`.slice(1);
    assert.equal(existsSync(join(dist, dir, "index.html")), false, lang);
    assert.equal(existsSync(join(dist, `${dir}.html`)), false, lang);
  }
});

test("E8: the tools are linked from the top page in its language, not from the header", () => {
  // The footer listed the tools until ui-revise, the header's web tools
  // menu until ui-revise2 (1). The apps section's details link to them now,
  // in the top page's language.
  const files = [
    "index.html",
    "en/index.html",
    "privacy/index.html",
    // Not 404.html: it has no header since not-found.
    ...pages.map((p) => fileOf(p.path)),
  ];
  for (const file of files) {
    // Without the language switch, which links to the other language.
    const header = readDist(file)
      .match(/<header[\s\S]*?<\/header>/)[0]
      .replace(/<a\s[^>]*data-language-switch[\s\S]*?<\/a>/, "");
    for (const tool of TOOLS) {
      for (const lang of ["ja", "en"]) {
        assert.ok(!hrefs(header).includes(pathOf(lang, tool)), file);
      }
    }
  }
  // Twice: the tool's card links to it, with its title and its
  // "アプリを開く" (ui-revise4 2, ui-revise5 9).
  for (const lang of ["ja", "en"]) {
    const top = lang === "ja" ? "index.html" : "en/index.html";
    const main = readDist(top).match(/<main[\s\S]*?<\/main>/)[0];
    for (const tool of TOOLS) {
      assert.equal(
        hrefs(main).filter((href) => href === pathOf(lang, tool)).length,
        2,
        `${lang} ${tool}`,
      );
      assert.ok(!hrefs(main).includes(pathOf(other[lang], tool)), tool);
    }
  }
});

/** Lists every key path of a nested object, e.g. "common.copy". */
const keyPaths = (object, prefix = "") =>
  Object.entries(object).flatMap(([key, value]) =>
    typeof value === "object"
      ? keyPaths(value, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  );

test("E5: tool texts have the same keys in ja and en", () => {
  // The type check (tests/types/tool-messages.ts) is the guarantee; this
  // checks the actual values as well.
  assert.deepEqual(keyPaths(en).sort(), keyPaths(ja).sort());
  assert.deepEqual(Object.keys(ja.tools).sort(), [...TOOLS].sort());
  for (const [locale, texts] of Object.entries(messages)) {
    for (const path of keyPaths(texts)) {
      const value = path.split(".").reduce((object, key) => object[key], texts);
      assert.equal(typeof value, "string", `${locale}.${path}`);
      assert.notEqual(value.trim(), "", `${locale}.${path}`);
    }
  }
});

// E4: the license boundary (decision P4-1).
const eslint = new ESLint({ cwd: root });

/** Messages of the license boundary rule for some code at a path. */
const boundaryErrors = async (file, code) => {
  const [result] = await eslint.lintText(code, {
    filePath: join(root, file),
  });
  const fatal = result.messages.filter((m) => m.fatal);
  assert.deepEqual(fatal, [], `${file}: parse error`);
  return result.messages.filter((m) => m.ruleId === "local/license-boundary");
};

test("E4: MIT code cannot import All-rights-reserved files", async () => {
  const cases = [
    ["src/tools/probe.ts", 'import { site } from "@/config/site";'],
    ["src/tools/probe.ts", 'import { site } from "../config/site";'],
    ["src/tools/a/probe.ts", 'import x from "../../assets/tools/x.svg";'],
    ["src/tools/probe.ts", 'export { site } from "@/config/site";'],
    ["src/tools/probe.ts", 'export * from "@/messages/layout";'],
    ["src/tools/probe.ts", 'const m = import("@/config/site");'],
    ["src/tools/probe.ts", "const m = import(`@/config/${name}`);"],
    ["src/tools/probe.ts", 'import "/src/styles/global.css";'],
    // Specifiers that start with a top-level directory of the repository
    // (resolved from the project root, e.g. through a tsconfig baseUrl).
    ["src/tools/probe.ts", 'import { site } from "src/config/site";'],
    ["src/tools/probe.ts", 'import type { SitePath } from "src/config/site";'],
    ["src/tools/probe.ts", 'export { site } from "src/config/site";'],
    ["src/tools/probe.ts", 'export type S = import("@/config/site").SitePath;'],
    ["src/tools/probe.ts", 'import site = require("@/config/site");'],
    [
      "src/components/ui/probe.tsx",
      'import Header from "../layout/Header.astro";',
    ],
    [
      "src/components/ui/Probe.astro",
      '---\nimport { site } from "@/config/site";\n---\n<p>{site.title}</p>\n',
    ],
    [
      "src/components/ui/Probe.astro",
      '<p></p>\n<script>\n  import { setupPopover } from "../../scripts/popover";\n  setupPopover(document.body);\n</script>\n',
    ],
  ];
  for (const [file, code] of cases) {
    const errors = await boundaryErrors(file, code);
    assert.equal(errors.length, 1, `${file}: ${code}`);
    assert.equal(errors[0].severity, 2, `${file}: ${code}`);
  }
});

test("E4: MIT code may import MIT files and packages; other code may import MIT code", async () => {
  const cases = [
    ["src/tools/probe.ts", 'import { useToast } from "@/components/ui/toast";'],
    ["src/tools/a/probe.ts", 'import { toolMessages } from "../messages";'],
    [
      "src/components/ui/probe.ts",
      'import { useMessages } from "@/tools/i18n";',
    ],
    ["src/components/ui/probe.ts", 'import { useState } from "react";'],
    [
      "src/components/ui/Probe.astro",
      '---\nimport { Image } from "astro:assets";\n---\n',
    ],
    ["src/pages/probe.ts", 'import { toolMessages } from "@/tools/messages";'],
    ["src/pages/probe.ts", 'import { site } from "@/config/site";'],
  ];
  for (const [file, code] of cases) {
    assert.deepEqual(await boundaryErrors(file, code), [], `${file}: ${code}`);
  }
});

test("E4: the repository's MIT code passes the license boundary rule", async () => {
  const results = await eslint.lintFiles([
    "src/tools/**/*",
    "src/components/ui/**/*",
  ]);
  assert.ok(results.length > 0, "no MIT files linted");
  const errors = results.flatMap((r) =>
    r.messages
      .filter((m) => m.ruleId === "local/license-boundary")
      .map((m) => `${r.filePath}:${m.line} ${m.message}`),
  );
  assert.deepEqual(errors, []);
});

test("ui-revise7 8': the tools' icons are Tabler Icons, through the decorative wrappers of src/components/ui/icons.tsx", () => {
  const files = globSync("src/{tools,components/ui}/**/*.{ts,tsx,astro}", {
    cwd: root,
  });
  assert.ok(files.length > 20, "self-check");
  const users = [];
  for (const file of files) {
    const text = readFileSync(join(root, file), "utf8");
    assert.doesNotMatch(text, /@heroicons|lucide/i, file);
    // Only the wrappers import the package (so every icon is aria-hidden).
    if (join(root, file) !== join(root, "src/components/ui/icons.tsx")) {
      assert.doesNotMatch(text, /from "@tabler\/icons-react"/, file);
    }
    if (/from "(?:\.\/|@\/components\/ui\/)icons"/.test(text)) users.push(file);
  }
  assert.ok(users.length >= 6, "self-check: the tools use the wrappers");
  const icons = readFileSync(join(root, "src/components/ui/icons.tsx"), "utf8");
  assert.match(icons, /aria-hidden="true"/);
});

test("final-review 4: the file checks' errors are in the page's language", async () => {
  const { validateImageFile, validateSvgFile } =
    await import("../src/tools/lib/file.ts");
  const { formatMessage } = await import("../src/tools/messages/format.ts");
  const big = (name, type) =>
    new File([new Uint8Array(2 * 1024 * 1024)], name, { type });
  const MB = 1024 * 1024;
  const cases = {
    ja: {
      svgOnly: "SVGファイルのみアップロードできます",
      tooLarge: "ファイルサイズが大きすぎます（最大1MB）",
      selectImage: "画像ファイルを選択してください",
    },
    en: {
      svgOnly: "Only SVG files can be uploaded.",
      tooLarge: "The file is too large (max 1MB).",
      selectImage: "Please select an image file.",
    },
  };
  for (const [lang, expected] of Object.entries(cases)) {
    const m = messages[lang].common.fileErrors;
    const png = new File(["x"], "a.png", { type: "image/png" });
    assert.equal(validateSvgFile(png, m), expected.svgOnly, lang);
    assert.equal(
      validateSvgFile(big("a.svg", "image/svg+xml"), m, { maxSize: MB }),
      expected.tooLarge,
      lang,
    );
    assert.equal(
      validateSvgFile(
        new File(["<svg/>"], "a.svg", { type: "image/svg+xml" }),
        m,
        {
          maxSize: MB,
        },
      ),
      null,
    );
    const text = new File(["x"], "a.txt", { type: "text/plain" });
    assert.equal(await validateImageFile(text, m), expected.selectImage, lang);
    assert.equal(
      await validateImageFile(big("a.png", "image/png"), m, { maxSize: MB }),
      expected.tooLarge,
      lang,
    );
    // HEIC without a MIME type passes the type check.
    assert.equal(await validateImageFile(new File(["x"], "a.heic"), m), null);
  }
  assert.equal(
    formatMessage(ja.common.fileErrors.dimensionsTooLarge, {
      width: 4096,
      height: 4096,
    }),
    "画像サイズが大きすぎます（最大4096×4096px）",
  );
  assert.equal(
    formatMessage(en.common.fileErrors.dimensionsTooLarge, {
      width: 4096,
      height: 4096,
    }),
    "The image is too large (max 4096×4096px).",
  );
  assert.throws(() => formatMessage("{a} {b}", { a: 1 }), /No value for \{b\}/);
});

test("final-review 4: the tool texts in English have no Japanese", () => {
  const strings = (value) =>
    typeof value === "string"
      ? [value]
      : Object.values(value).flatMap((v) => strings(v));
  const japanese = /[぀-ヿ㐀-鿿＀-￯]/;
  for (const text of strings(en)) {
    assert.ok(!japanese.test(text), text);
  }
});

test("final-review 4: the MIT components have no fixed Japanese or English labels", () => {
  // The labels that were fixed in one language: now from the tool texts.
  const fixed = [
    /aria-label="閉じる"/,
    /alt="(最適化後)?プレビュー"/,
    /を調整"/,
    /をコピー`/,
    /"Toggle (uppercase|lowercase|numbers|symbols)"/,
    /Select preset:/,
    /"Deselect" : "Select"/,
    /aria-label="Breadcrumb"/,
  ];
  const files = globSync("src/{tools,components/ui}/**/*.{ts,tsx,astro}", {
    cwd: root,
  }).filter((file) => !file.replaceAll("\\", "/").includes("/messages/"));
  assert.ok(files.length > 10);
  for (const file of files) {
    const source = readFileSync(join(root, file), "utf8");
    for (const pattern of fixed) {
      assert.ok(!pattern.test(source), `${file}: ${pattern}`);
    }
  }
});
