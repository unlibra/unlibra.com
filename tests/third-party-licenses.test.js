// Tests for the list of third-party licenses (dist/third-party-licenses.txt)
// written by scripts/third-party-licenses.mjs. Run `npm run build` before
// `npm test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  existsSync,
  globSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  DERIVED_ASSETS,
  LICENSE_FALLBACKS,
  LICENSES_FILE,
  OUTSIDE_MODULE_GRAPH,
  PREBUNDLED,
  bundledDependencies,
  packageOfModule,
  packageOfPath,
  readLicense,
} from "../scripts/third-party-licenses.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

if (!existsSync(join(dist, "index.html"))) {
  throw new Error("dist/ not found. Run `npm run build` before `npm test`.");
}

const list = readFileSync(join(dist, LICENSES_FILE), "utf8");

/** "name version" of each package in the summary at the top of the list. */
const listedPackages = () =>
  [...list.matchAll(/^ {2}- (\S+) (\S+) \(/gm)].map(([, name, version]) => ({
    name,
    version,
  }));

/** The section of the list for one package (and version, if given). */
const sectionOf = (name, version = "") => {
  const sections = list.split(/^={78}$/m).slice(1);
  const found = sections.filter((s) => s.startsWith(`\n${name} ${version}`));
  assert.equal(found.length, 1, `one section for ${name} ${version}`);
  return found[0];
};

const normalize = (text) => text.replace(/\r\n/g, "\n").trim();

test("H4: the list is in dist/ and has the license text of each shipped package", () => {
  for (const name of [
    "react",
    "react-dom",
    "@headlessui/react",
    "@tabler/icons-react",
    "svgo",
    "jszip",
  ]) {
    const dir = join(root, "node_modules", name);
    const { version } = JSON.parse(
      readFileSync(join(dir, "package.json"), "utf8"),
    );
    const section = sectionOf(name);
    assert.ok(section.startsWith(`\n${name} ${version}\n`), name);
    const [license] = globSync("LICENSE*", { cwd: dir });
    const text = normalize(readFileSync(join(dir, license), "utf8"));
    assert.ok(normalize(section).includes(text), `${name}: full text`);
    assert.match(section, /^Copyright \(c\) .+$/m, `${name}: copyright`);
  }
});

test("H4/H5: the list has exactly the packages the build output ships", () => {
  // From the client JavaScript, the fonts, the packages inside svgo's and
  // JSZip's own bundles, and the code outside the module graph. Update this
  // when the dependencies change, after checking the output.
  assert.deepEqual(
    listedPackages().map((p) => p.name),
    [
      "@astrojs/react",
      "@fontsource-variable/noto-sans-jp",
      "@fontsource/dm-mono",
      "@headlessui/react",
      "@tabler/icons",
      "@tabler/icons-react",
      "astro",
      "boolbase",
      "css-select",
      "css-tree",
      "css-tree",
      "css-what",
      "csso",
      "dom-serializer",
      "domelementtype",
      "domhandler",
      "domutils",
      "entities",
      "immediate",
      "jszip",
      "lie",
      "mdn-data",
      "mdn-data",
      "nth-check",
      "pako",
      "react",
      "react-aria",
      "react-dom",
      "react-stately",
      "rolldown",
      "sax",
      "scheduler",
      "setimmediate",
      "source-map-js",
      "svgo",
      "tailwindcss",
      "vite",
    ],
  );
});

test("H4: every package that a prebuilt bundle contains is listed, at each of its versions", () => {
  const listed = listedPackages().map((p) => `${p.name}@${p.version}`);
  for (const [name, { file, exclude }] of Object.entries(PREBUNDLED)) {
    const dir = join(root, "node_modules", name);
    const { version } = JSON.parse(
      readFileSync(join(dir, "package.json"), "utf8"),
    );
    for (const spec of bundledDependencies(dir, exclude).keys()) {
      assert.ok(listed.includes(spec), spec);
      const at = spec.lastIndexOf("@");
      assert.ok(
        sectionOf(spec.slice(0, at), spec.slice(at + 1)).includes(
          `part of ${name} ${version} (${file})`,
        ),
        spec,
      );
    }
  }
  // svgo bundles css-tree at two versions (its own and csso's).
  assert.equal(listedPackages().filter((p) => p.name === "css-tree").length, 2);
});

test("H4: the bundler's runtime helpers are listed", () => {
  assert.match(sectionOf("vite"), /^Included as: .*vite\/preload-helper/m);
  assert.match(sectionOf("rolldown"), /^Included as: .*rolldown\/runtime/m);
});

test("H4: license expressions are not wrapped in a second pair of parentheses", () => {
  assert.doesNotMatch(list, /\(\(/);
  assert.match(list, /^ {2}- jszip \S+ \(MIT OR GPL-3\.0-or-later\)$/m);
  assert.match(list, /^ {2}- react \S+ \(MIT\)$/m);
});

test("H5: no build-only package is in the list", () => {
  const names = new Set(listedPackages().map((p) => p.name));
  // Packages that a shipped file is made from (DERIVED_ASSETS) are
  // devDependencies, and are listed. So is @tabler/icons, whose icons are
  // copied into the HTML (OUTSIDE_MODULE_GRAPH, ui-revise7 8').
  const derived = new Set(
    Object.values(DERIVED_ASSETS).map((asset) => asset.name),
  );
  for (const name of [
    // vite and rolldown are listed for their runtime helpers (FX-8); their
    // plugins and other build tools must not be.
    ...Object.keys(pkg.devDependencies).filter(
      (name) =>
        !derived.has(name) && !Object.hasOwn(OUTSIDE_MODULE_GRAPH, name),
    ),
    "@tailwindcss/vite",
    "@vitejs/plugin-react",
    "@astrojs/sitemap",
    "commander",
    "picocolors",
    "readable-stream",
  ]) {
    assert.equal(names.has(name), false, name);
  }
});

test("H6: a package without a license file stops the build", () => {
  const dir = mkdtempSync(join(tmpdir(), "tpl-"));
  try {
    const pkgDir = join(dir, "node_modules", "no-license");
    mkdirSync(pkgDir, { recursive: true });
    writeFileSync(
      join(pkgDir, "package.json"),
      JSON.stringify({
        name: "no-license",
        version: "1.0.0",
        license: "MIT",
        author: "Someone",
      }),
    );
    writeFileSync(join(pkgDir, "README.md"), "MIT");
    assert.throws(
      () => readLicense(pkgDir),
      /no-license@1\.0\.0.*no license file/,
    );
    // A fallback text is used when there is one, at any version, while the
    // package's license and author are those the text is made from.
    const fallback = {
      license: "MIT",
      author: "Someone",
      note: "Made up.",
      text: "Text\n",
    };
    assert.deepEqual(readLicense(pkgDir, { "no-license": fallback }), {
      texts: ["Text"],
      note: "Made up.",
    });
    for (const field of ["license", "author"]) {
      assert.throws(
        () =>
          readLicense(pkgDir, {
            "no-license": { ...fallback, [field]: "Other" },
          }),
        new RegExp(`no-license@1\\.0\\.0: its ${field} is`),
      );
    }
    // License and notice files are all read.
    writeFileSync(join(pkgDir, "LICENSE.md"), "License\n");
    writeFileSync(join(pkgDir, "NOTICE"), "Notice\n");
    assert.deepEqual(readLicense(pkgDir), {
      texts: ["License", "Notice"],
      note: "",
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("H6: each license fallback is for a shipped package that has no license file", () => {
  const listed = new Set(listedPackages().map((p) => p.name));
  for (const key of Object.keys(LICENSE_FALLBACKS)) {
    assert.ok(listed.has(key), key);
    assert.deepEqual(
      globSync("{LICEN[CS]E,licen[cs]e,COPYING,NOTICE}*", {
        cwd: join(root, "node_modules", key),
      }),
      [],
      key,
    );
    // The text names the author, as the package.json does.
    assert.ok(
      LICENSE_FALLBACKS[key].text.includes(LICENSE_FALLBACKS[key].author),
      key,
    );
    const section = sectionOf(key);
    assert.ok(section.includes(LICENSE_FALLBACKS[key].text.trim()), key);
    assert.ok(section.includes(`Note: ${LICENSE_FALLBACKS[key].note}`), key);
  }
});

test("every JavaScript file in dist/ points to the list", () => {
  const files = globSync("_astro/*.js", { cwd: dist });
  assert.ok(files.length > 0);
  const banner = `/*! Third-party licenses: https://unlibra.com/${LICENSES_FILE} */`;
  for (const file of files) {
    // At the top, or right after the dependency map that Vite puts before
    // everything in chunks with dynamic imports.
    const lines = readFileSync(join(dist, file), "utf8").split("\n");
    const index = lines.indexOf(banner);
    assert.ok(
      index === 0 ||
        (index === 1 && lines[0].startsWith("const __vite__mapDeps=")),
      file,
    );
  }
});

test("the reasons for the hand-listed packages still hold", () => {
  // OUTSIDE_MODULE_GRAPH
  assert.deepEqual(Object.keys(OUTSIDE_MODULE_GRAPH).sort(), [
    "@tabler/icons",
    "astro",
    "tailwindcss",
  ]);
  // The icons copied from @tabler/icons are in the pages (ui-revise7 8').
  const top = readFileSync(join(dist, "index.html"), "utf8");
  for (const icon of ["box", "arrow-up-right", "x", "sun", "moon"]) {
    assert.match(top, new RegExp(`<svg[^>]*data-icon="${icon}"`), icon);
  }
  const tool = readFileSync(
    join(dist, "lab/password-generator/index.html"),
    "utf8",
  );
  for (const icon of ["world", "chevron-right"]) {
    assert.match(tool, new RegExp(`<svg[^>]*data-icon="${icon}"`), icon);
  }
  const html = readFileSync(join(dist, "lab/svg-optimizer/index.html"), "utf8");
  assert.match(html, /customElements\.define\(`astro-island`/);
  const css = globSync("_astro/*.css", { cwd: dist })
    .map((file) => readFileSync(join(dist, file), "utf8"))
    .join("\n");
  // Tailwind's preflight
  assert.match(css, /box-sizing:border-box;border:0 solid;margin:0;padding:0/);

  // PREBUNDLED: the bundles are shipped.
  for (const [name, { file }] of Object.entries(PREBUNDLED)) {
    const base = file.split("/").pop().replace(/\.js$/, "");
    assert.equal(
      globSync(`_astro/${base}.*.js`, { cwd: dist }).length,
      1,
      `${name}: ${file} is shipped`,
    );
  }
});

test("packageOfPath finds the package of a module or asset path", () => {
  assert.deepEqual(
    packageOfPath("C:\\p\\node_modules\\react-dom\\cjs\\react-dom.js"),
    {
      name: "react-dom",
      dir: "C:/p/node_modules/react-dom",
      file: "cjs/react-dom.js",
    },
  );
  assert.deepEqual(
    packageOfPath("/p/node_modules/a/node_modules/@scope/b/index.js?v=1"),
    {
      name: "@scope/b",
      dir: "/p/node_modules/a/node_modules/@scope/b",
      file: "index.js",
    },
  );
  assert.equal(
    packageOfPath("\0/p/node_modules/svgo/dist/svgo.browser.js").file,
    "dist/svgo.browser.js",
  );
  assert.equal(packageOfPath("/p/src/tools/svg-optimizer/svgo.ts"), null);
  assert.equal(packageOfPath("\0virtual:astro:page"), null);
});

test("H7: LICENSE section 4 points to the list on the website", () => {
  const license = readFileSync(join(root, "LICENSE"), "utf8");
  const section4 = license.slice(license.indexOf("\n4. Dependencies\n"));
  assert.match(section4, /\/third-party-licenses\.txt/);
  assert.match(section4, /scripts\/third-party-licenses\.mjs/);
});

test("bundledDependencies finds each name@version, also when nested, without the excluded ones and theirs", () => {
  const svgo = join(root, "node_modules", "svgo");
  const found = bundledDependencies(svgo, PREBUNDLED.svgo.exclude);
  const dirs = [...found.values()].map((dir) => dir.replaceAll("\\", "/"));
  assert.ok(dirs.some((d) => /\/node_modules\/css-tree$/.test(d)));
  assert.ok(dirs.some((d) => /\/csso\/node_modules\/css-tree$/.test(d)));
  const names = (map) =>
    [...map.keys()].map((spec) => spec.slice(0, spec.lastIndexOf("@")));
  assert.ok(names(found).includes("css-select"));
  assert.ok(!names(found).includes("commander"));
  // An excluded package's own dependencies go with it.
  const jszip = join(root, "node_modules", "jszip");
  assert.ok(names(bundledDependencies(jszip)).includes("util-deprecate"));
  const without = names(bundledDependencies(jszip, ["readable-stream"]));
  assert.ok(!without.includes("readable-stream"));
  assert.ok(!without.includes("util-deprecate"));
  assert.ok(without.includes("pako"));
});

test("packageOfModule maps known virtual modules and stops on unknown ones", () => {
  assert.equal(packageOfModule("\0vite/preload-helper.js", root).name, "vite");
  assert.equal(packageOfModule("\0rolldown/runtime.js", root).name, "rolldown");
  assert.equal(
    packageOfModule(join(root, "node_modules/react/index.js"), root).name,
    "react",
  );
  assert.equal(
    packageOfModule(join(root, "src/tools/svg-optimizer/svgo.ts"), root),
    null,
  );
  assert.throws(
    () => packageOfModule("\0some-plugin/helper.js", root),
    /some-plugin\/helper\.js/,
  );
  assert.throws(
    () => packageOfModule("/elsewhere/helper.js", root),
    /elsewhere/,
  );
});

test("H4: vite shows only its core license, not those of its Node.js bundle", () => {
  const section = sectionOf("vite");
  assert.match(section, /^# Vite core license$/m);
  assert.match(
    section,
    /^Copyright \(c\) .*VoidZero Inc\. and Vite contributors$/m,
  );
  assert.doesNotMatch(section, /Licenses of bundled dependencies/);
  assert.match(section, /^Note: Only the Vite core license is shown\./m);
});

test("a license cut whose marker is missing stops the build", () => {
  const dir = mkdtempSync(join(tmpdir(), "tpl-"));
  try {
    writeFileSync(
      join(dir, "package.json"),
      JSON.stringify({ name: "cut-me", version: "1.0.0" }),
    );
    writeFileSync(join(dir, "LICENSE"), "Own\n\n# Others\nOther\n");
    assert.deepEqual(
      readLicense(dir, {}, { "cut-me": { before: "# Others", note: "N" } }),
      { texts: ["Own"], note: "N" },
    );
    assert.throws(
      () => readLicense(dir, {}, { "cut-me": { before: "# Gone", note: "N" } }),
      /cut-me@1\.0\.0.*# Gone/,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("H4: rolldown's entry also has its THIRD-PARTY-LICENSE (Rollup's MIT)", () => {
  const dir = join(root, "node_modules", "rolldown");
  const section = normalize(sectionOf("rolldown"));
  for (const file of ["LICENSE", "THIRD-PARTY-LICENSE"]) {
    const text = normalize(readFileSync(join(dir, file), "utf8"));
    assert.ok(section.includes(text), file);
  }
  assert.match(section, /github\.com\/rollup\/rollup\/graphs\/contributors/);
});

test("readLicense adds a LICENSE_NOTES note to the license's own note", () => {
  const dir = mkdtempSync(join(tmpdir(), "licenses-"));
  try {
    writeFileSync(
      join(dir, "package.json"),
      JSON.stringify({ name: "noted", version: "1.0.0", license: "MIT" }),
    );
    writeFileSync(join(dir, "LICENSE"), "The license text\n");
    const notes = { noted: { note: "Extra." } };
    assert.deepEqual(readLicense(dir, {}, {}, notes), {
      texts: ["The license text"],
      note: "Extra.",
    });
    // Another package gets no note.
    assert.deepEqual(readLicense(dir, {}, {}, { other: notes.noted }), {
      texts: ["The license text"],
      note: "",
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
