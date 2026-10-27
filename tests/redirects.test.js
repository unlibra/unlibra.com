// Tests for public/_redirects (Phase 6), read from the build output.
// Run `npm run build` before `npm test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, globSync, readFileSync } from "node:fs";
import { dirname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");

if (!existsSync(join(dist, "_redirects"))) {
  throw new Error(
    "dist/_redirects not found. Run `npm run build` before `npm test`.",
  );
}

const TOOLS = ["favicon-generator", "svg-optimizer", "password-generator"];

/**
 * Former URLs and their new URLs (P1-4 for the sitemap).
 * The tool list pages were removed (ui-revise): the list URLs, former and
 * new, go to the apps section of the top page (#apps since ui-revise2), in
 * their language. /en is the English top page, no
 * longer redirected.
 */
const APPS_SECTION = "/#apps";
const EN_APPS_SECTION = "/en#apps";
const EXPECTED = [
  ["/ja", "/"],
  ["/lab/ja", APPS_SECTION],
  ["/lab/ja/*", "/lab/:splat"],
  ["/lab/en", EN_APPS_SECTION],
  ["/lab/en/*", "/en/lab/:splat"],
  ["/lab", APPS_SECTION],
  ["/en/lab", EN_APPS_SECTION],
  ["/sitemap.xml", "/sitemap-index.xml"],
];

const isDynamic = (source) => /[*:]/.test(source);

/** Parses Cloudflare `_redirects` into [{ source, destination, code, line }]. */
const parseRedirects = (text) =>
  text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== "" && !line.startsWith("#"))
    .map((line) => {
      const [source, destination, code, ...rest] = line.split(/\s+/);
      return { source, destination, code, rest, line };
    });

const rules = parseRedirects(readFileSync(join(dist, "_redirects"), "utf8"));

/** Source pattern as a RegExp: `*` is greedy, `:name` stops at a slash. */
const sourcePattern = (source) => {
  const names = [];
  const body = source
    .split(/(\*|:[A-Za-z]\w*)/)
    .map((part) => {
      if (part === "*") {
        names.push("splat");
        return "(.*)";
      }
      if (/^:[A-Za-z]\w*$/.test(part)) {
        names.push(part.slice(1));
        return "([^/]+)";
      }
      return part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    })
    .join("");
  return { regexp: new RegExp(`^${body}$`), names };
};

/**
 * Orders in which Workers may try the dynamic rules. `wrangler dev` keeps the
 * file order, but production does not: wrangler uploads the dynamic rules as
 * an object keyed by the source, without line numbers (static rules carry
 * theirs), and on workers.dev a placeholder rule lost to a splat rule written
 * after it (ui-revise3 4). The file must give the same result in any order.
 */
const DYNAMIC_ORDERS = {
  file: (dynamic) => dynamic,
  reversed: (dynamic) => [...dynamic].reverse(),
  "sorted by source": (dynamic) =>
    [...dynamic].sort((a, b) =>
      a.source < b.source ? -1 : a.source > b.source ? 1 : 0,
    ),
};

/**
 * Applies the rules the way Workers does: static rules first, then dynamic
 * rules (in the given order); the first match wins. Returns the destination
 * or null.
 */
const resolveIn = (path, order) => {
  const ordered = [
    ...rules.filter((r) => !isDynamic(r.source)),
    ...order(rules.filter((r) => isDynamic(r.source))),
  ];
  for (const { source, destination } of ordered) {
    const { regexp, names } = sourcePattern(source);
    const match = regexp.exec(path);
    if (!match) continue;
    return names.reduce(
      (dest, name, i) => dest.replace(`:${name}`, match[i + 1]),
      destination,
    );
  }
  return null;
};

/**
 * Where a path is redirected (or null), the same in every order of the
 * dynamic rules (see DYNAMIC_ORDERS); fails if the orders disagree.
 */
const resolve = (path) => {
  const results = Object.entries(DYNAMIC_ORDERS).map(([name, order]) => [
    name,
    resolveIn(path, order),
  ]);
  for (const [name, result] of results) {
    assert.equal(result, results[0][1], `${path}: ${name} order`);
  }
  return results[0][1];
};

/** URL paths of everything served from dist/ (pages without the slash). */
const servedPaths = () =>
  globSync("**/*", { cwd: dist, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) =>
      join(entry.parentPath, entry.name)
        .slice(dist.length)
        .split(sep)
        .join("/"),
    )
    .filter((path) => !["/_headers", "/_redirects"].includes(path))
    .map((path) => path.replace(/\/index\.html$/, "") || "/");

/**
 * Whether a new URL path is a page or file in dist/. With a fragment, the
 * page must also have an element with that id.
 */
const existsInDist = (url) => {
  const [path, fragment] = url.split("#");
  const page =
    path === "/" ? join(dist, "index.html") : join(dist, path, "index.html");
  if (fragment !== undefined) {
    return (
      existsSync(page) &&
      new RegExp(`\\sid="${fragment}"`).test(readFileSync(page, "utf8"))
    );
  }
  return (
    existsSync(page) || (/\.\w+$/.test(path) && existsSync(join(dist, path)))
  );
};

test("G2: every line is a well-formed 301 redirect", () => {
  assert.ok(rules.length > 0);
  for (const { source, destination, code, rest, line } of rules) {
    // Workers ignores malformed lines silently, so check the shape here.
    assert.equal(rest.length, 0, `extra fields: ${line}`);
    assert.match(source, /^\//, `source must be a path: ${line}`);
    assert.match(destination, /^\//, `destination must be a path: ${line}`);
    assert.equal(code, "301", `status must be 301: ${line}`);
  }
});

test("G2: static rules come before dynamic rules, without duplicates", () => {
  const firstDynamic = rules.findIndex((r) => isDynamic(r.source));
  const lastStatic = rules.findLastIndex((r) => !isDynamic(r.source));
  assert.ok(firstDynamic === -1 || lastStatic < firstDynamic);
  const sources = rules.map((r) => r.source);
  assert.deepEqual(sources, [...new Set(sources)]);
});

test("G2: every former URL redirects as listed", () => {
  for (const [source, destination] of EXPECTED) {
    const rule = rules.find((r) => r.source === source);
    assert.ok(rule, `${source} is missing`);
    assert.equal(rule.destination, destination, source);
    assert.equal(rule.code, "301", source);
  }
});

test("G2: former URLs reach the new URL in one hop, with or without a trailing slash", () => {
  const cases = [
    ["/ja", "/"],
    ["/lab/ja", APPS_SECTION],
    ["/lab/en", EN_APPS_SECTION],
    ["/lab", APPS_SECTION],
    ["/en/lab", EN_APPS_SECTION],
    ...TOOLS.flatMap((tool) => [
      [`/lab/ja/${tool}`, `/lab/${tool}`],
      [`/lab/en/${tool}`, `/en/lab/${tool}`],
    ]),
  ];
  for (const [from, to] of cases) {
    assert.equal(resolve(from), to, from);
    assert.equal(resolve(`${from}/`), to, `${from}/`);
  }
  assert.equal(resolve("/sitemap.xml"), "/sitemap-index.xml");
});

test("ui-revise3 4: the result does not depend on the order of the dynamic rules, as in production", () => {
  // The tools of this test are the tool pages in dist/ (the static rules
  // for the trailing slash are listed per tool).
  const toolPages = servedPaths()
    .filter((path) => /^\/lab\/[^/]+$/.test(path))
    .map((path) => path.slice("/lab/".length))
    .sort();
  assert.deepEqual(toolPages, [...TOOLS].sort());
  // Paths a dynamic rule may see: the former tool URLs with and without the
  // slash, an unknown tool, and a deeper path.
  const paths = [...TOOLS, "iromide", "no-such-tool", "a/b"].flatMap((tool) =>
    ["ja", "en"].flatMap((lang) => [
      `/lab/${lang}/${tool}`,
      `/lab/${lang}/${tool}/`,
    ]),
  );
  for (const path of paths) resolve(path); // fails if the orders disagree
  // The dynamic rules that are left do not overlap.
  const dynamic = rules.filter((r) => isDynamic(r.source));
  for (const path of paths) {
    const matching = dynamic.filter((r) =>
      sourcePattern(r.source).regexp.test(path),
    );
    assert.ok(matching.length <= 1, `${path}: ${matching.map((r) => r.line)}`);
  }
  // Self-check: the former placeholder rule did depend on the order.
  const former = [
    { source: "/lab/ja/:tool/", destination: "/lab/:tool" },
    { source: "/lab/ja/*", destination: "/lab/:splat" },
  ];
  const first = (list, path) => {
    for (const { source, destination } of list) {
      const { regexp, names } = sourcePattern(source);
      const match = regexp.exec(path);
      if (match) {
        return names.reduce(
          (dest, name, i) => dest.replace(`:${name}`, match[i + 1]),
          destination,
        );
      }
    }
    return null;
  };
  const path = "/lab/ja/favicon-generator/";
  assert.equal(
    first(DYNAMIC_ORDERS.file(former), path),
    "/lab/favicon-generator",
  );
  assert.equal(
    first(DYNAMIC_ORDERS["sorted by source"](former), path),
    "/lab/favicon-generator/",
  );
});

test("G2: redirect destinations exist in the build output", () => {
  for (const { source, destination } of rules) {
    if (isDynamic(destination)) continue; // checked with real tools below
    assert.ok(existsInDist(destination), `${source} -> ${destination}`);
  }
  // The sections the list URLs go to.
  assert.ok(existsInDist(APPS_SECTION));
  assert.ok(existsInDist(EN_APPS_SECTION));
  assert.ok(!existsInDist("/#no-such-section"), "self-check of fragments");
  for (const tool of TOOLS) {
    for (const from of [`/lab/ja/${tool}`, `/lab/en/${tool}`]) {
      assert.ok(existsInDist(resolve(from)), `${from} -> ${resolve(from)}`);
    }
  }
});

test("G2: the removed Iromide is forwarded by the bulk rules to a missing page", () => {
  // No rule of its own; 301 by the bulk rule, then 404.
  assert.ok(!rules.some((r) => r.source.includes("iromide")));
  assert.equal(resolve("/lab/ja/iromide"), "/lab/iromide");
  assert.equal(resolve("/lab/en/iromide"), "/en/lab/iromide");
  assert.equal(existsInDist("/lab/iromide"), false);
  assert.equal(existsInDist("/en/lab/iromide"), false);
});

test("remove-tw-palette: the removed TW Palette Generator ends in 404, as Iromide", () => {
  // No rule of its own: the former URLs go by the bulk rules to the removed
  // page, and the new URLs are not redirected.
  assert.ok(!rules.some((r) => r.line.includes("tw-palette")));
  for (const slash of ["", "/"]) {
    assert.equal(
      resolve(`/lab/ja/tw-palette-generator${slash}`),
      `/lab/tw-palette-generator${slash}`,
    );
    assert.equal(
      resolve(`/lab/en/tw-palette-generator${slash}`),
      `/en/lab/tw-palette-generator${slash}`,
    );
    for (const path of [
      `/lab/tw-palette-generator${slash}`,
      `/en/lab/tw-palette-generator${slash}`,
    ]) {
      assert.equal(resolve(path), null, path);
      assert.equal(existsInDist(path), false, path);
    }
  }
});

test("G2: no redirect shadows a page or file of the new site", () => {
  const paths = servedPaths();
  assert.ok(paths.includes("/lab/svg-optimizer"), "self-check of servedPaths");
  // The English top page is served, not redirected (it was until i18n).
  assert.ok(paths.includes("/en"), "self-check of servedPaths");
  assert.ok(!paths.includes("/lab") && !paths.includes("/en/lab"));
  for (const path of paths) {
    for (const candidate of new Set([path, `${path}/`.replace("//", "/")])) {
      assert.equal(resolve(candidate), null, `${candidate} is redirected`);
    }
  }
});
