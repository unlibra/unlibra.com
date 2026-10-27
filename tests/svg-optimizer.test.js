// Unit tests for the SVG optimizer logic (E6).
//
// tests/fixtures/svg-optimizer/expected.json holds the optimizer's output for
// each fixture and option set. It was first made from the former tool site's
// optimizer (its own source with svgo 4.0.0, the version in its lock file),
// then remade with this code (svgo 4.1.0) after fixing the switches that did
// not turn their plugins off (FX-1). The
// outputs that did not involve those switches are unchanged. Remade again
// when removeDesc started to remove every <desc> and the precision sliders
// started to reach path data and angles.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildSvgoConfig,
  optimizeSvg,
} from "../src/tools/svg-optimizer/svgo.ts";
import {
  DEFAULT_SVGO_OPTIONS,
  PRESET_MAXIMUM,
  PRESET_SAFE,
  PRESET_SVGO_DEFAULT,
  PRESETS,
} from "../src/tools/svg-optimizer/svgo-presets.ts";

const fixtures = join(
  dirname(fileURLToPath(import.meta.url)),
  "fixtures/svg-optimizer",
);
const expected = JSON.parse(
  readFileSync(join(fixtures, "expected.json"), "utf8"),
);

/** The option sets the expected outputs were made with. */
const cases = {
  safe: PRESET_SAFE,
  "svgo-default": PRESET_SVGO_DEFAULT,
  maximum: PRESET_MAXIMUM,
  custom: {
    ...PRESET_SAFE,
    keepScripts: true,
    keepStyleElement: true,
    floatPrecision: 0,
    transformPrecision: 1,
    sortAttrs: true,
    removeTitle: true,
    convertColors: false,
    mergePaths: false,
  },
};

test("E6/H2: optimized SVGs match the expected output", async () => {
  assert.deepEqual(Object.keys(expected).sort(), ["editor.svg", "icon.svg"]);
  for (const [file, outputs] of Object.entries(expected)) {
    const svg = readFileSync(join(fixtures, file), "utf8");
    assert.deepEqual(Object.keys(outputs).sort(), Object.keys(cases).sort());
    for (const [name, options] of Object.entries(cases)) {
      assert.equal(
        await optimizeSvg(svg, options),
        outputs[name],
        `${file} ${name}`,
      );
    }
  }
});

test("E6: the presets and default options are the former tool's", () => {
  assert.equal(DEFAULT_SVGO_OPTIONS, PRESET_SAFE);
  assert.deepEqual(
    PRESETS.map((p) => p.id),
    ["safe", "svgo-default", "maximum"],
  );
  assert.deepEqual(
    [PRESET_SAFE, PRESET_SVGO_DEFAULT, PRESET_MAXIMUM].map((p) => [
      p.floatPrecision,
      p.transformPrecision,
    ]),
    [
      [3, 5],
      [3, 5],
      [1, 3],
    ],
  );
});

test("E6: the SVGO config passes precision to preset-default and multipass is on", () => {
  const config = buildSvgoConfig({
    ...PRESET_SAFE,
    floatPrecision: 2,
    transformPrecision: 4,
  });
  assert.equal(config.multipass, true);
  const [preset] = config.plugins;
  assert.equal(preset.name, "preset-default");
  assert.deepEqual(preset.params.overrides.cleanupNumericValues, {
    floatPrecision: 2,
  });
  for (const plugin of [
    "convertPathData",
    "mergePaths",
    "convertShapeToPath",
  ]) {
    assert.deepEqual(
      preset.params.overrides[plugin],
      { floatPrecision: 2 },
      plugin,
    );
  }
  assert.deepEqual(preset.params.overrides.convertTransform, {
    floatPrecision: 4,
    degPrecision: 4,
  });
  const listOfValues = config.plugins.find(
    (p) => p.name === "cleanupListOfValues",
  );
  assert.deepEqual(listOfValues.params, { floatPrecision: 2 });
  const removeDesc = buildSvgoConfig({
    ...PRESET_SAFE,
    removeDesc: true,
  }).plugins.find((p) => p.name === "removeDesc");
  assert.deepEqual(removeDesc?.params, { removeAny: true });
});

/** The toggles for plugins outside SVGO's preset-default. */
const STANDALONE_PLUGINS = [
  "removeViewBox",
  "convertStyleToAttrs",
  "cleanupListOfValues",
  "removeTitle",
  "removeDesc",
  "removeDimensions",
  "removeRasterImages",
];

test("H1: a switched-off plugin is left out of the SVGO config", () => {
  const pluginNames = (options) =>
    buildSvgoConfig(options).plugins.map((p) => p.name);

  for (const plugin of STANDALONE_PLUGINS) {
    assert.ok(
      pluginNames({ ...PRESET_MAXIMUM, [plugin]: true }).includes(plugin),
      `${plugin} on`,
    );
    const names = pluginNames({ ...PRESET_MAXIMUM, [plugin]: false });
    assert.ok(!names.includes(plugin), `${plugin} off`);
  }
  // The second raster image plugin (SVG 2's href) follows the same switch.
  assert.ok(
    pluginNames(PRESET_MAXIMUM).includes("removeRasterImagesHref"),
    "removeRasterImagesHref on",
  );
  assert.ok(
    !pluginNames({ ...PRESET_MAXIMUM, removeRasterImages: false }).includes(
      "removeRasterImagesHref",
    ),
    "removeRasterImagesHref off",
  );
  // Inverted: keeping the element means the removal plugin is off.
  for (const [option, plugin] of [
    ["keepScripts", "removeScripts"],
    ["keepStyleElement", "removeStyleElement"],
  ]) {
    assert.ok(
      pluginNames({ ...PRESET_MAXIMUM, [option]: false }).includes(plugin),
      `${plugin} on`,
    );
    assert.ok(
      !pluginNames({ ...PRESET_MAXIMUM, [option]: true }).includes(plugin),
      `${plugin} off`,
    );
  }
  // removeDesc is also part of preset-default, so it is switched off there too.
  const [preset] = buildSvgoConfig({
    ...PRESET_MAXIMUM,
    removeDesc: false,
  }).plugins;
  assert.equal(preset.params.overrides.removeDesc, false);
});

test("H1: switching off the precision plugins turns them off in preset-default", async () => {
  const [preset] = buildSvgoConfig({
    ...PRESET_SAFE,
    cleanupNumericValues: false,
    convertTransform: false,
  }).plugins;
  assert.equal(preset.params.overrides.cleanupNumericValues, false);
  assert.equal(preset.params.overrides.convertTransform, false);

  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><circle cx="5.123456" cy="5" r="2" transform="translate(1.123456 0)"/></svg>';
  const off = await optimizeSvg(svg, {
    ...PRESET_SAFE,
    cleanupNumericValues: false,
    convertTransform: false,
  });
  assert.match(off, /cx="5\.123456"/);
  assert.match(off, /translate\(1\.123456 0\)/);
  const on = await optimizeSvg(svg, { ...PRESET_SAFE, floatPrecision: 2 });
  assert.doesNotMatch(on, /5\.123456/);
});

test("H1: the recommended preset keeps <title>, width, height, viewBox and raster images", async () => {
  const icon = await optimizeSvg(
    readFileSync(join(fixtures, "icon.svg"), "utf8"),
    PRESET_SAFE,
  );
  assert.match(icon, /<title>Check<\/title>/);
  assert.match(icon, / width="24"/);
  assert.match(icon, / height="24"/);
  assert.match(icon, / viewBox="0 0 24 24"/);

  const editor = await optimizeSvg(
    readFileSync(join(fixtures, "editor.svg"), "utf8"),
    PRESET_SAFE,
  );
  assert.match(editor, /<title>Sample drawing<\/title>/);
  assert.match(editor, /<image /);
  // Removed by default: scripts and style elements.
  assert.doesNotMatch(editor, /<script/);
  assert.doesNotMatch(editor, /<style/);
});

test("H1: keepScripts and keepStyleElement keep <script> and <style>", async () => {
  // A media query that preset-default's inlineStyles leaves in <style>.
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><style>@media (prefers-color-scheme:dark){path{fill:#fff}}</style><script>alert(1)</script><path d="M0 0h10v10z"/></svg>';
  const kept = await optimizeSvg(svg, {
    ...PRESET_MAXIMUM,
    keepScripts: true,
    keepStyleElement: true,
  });
  assert.match(kept, /<script>alert\(1\)<\/script>/);
  assert.match(kept, /<style>@media/);
  const removed = await optimizeSvg(svg, PRESET_MAXIMUM);
  assert.doesNotMatch(removed, /<script|<style/);
});

test("H1: removeDesc switched off keeps even an editor's <desc>", async () => {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><desc>Created with an editor</desc><path d="M0 0h10v10z"/></svg>';
  assert.match(
    await optimizeSvg(svg, { ...PRESET_SAFE, removeDesc: false }),
    /<desc>Created with an editor<\/desc>/,
  );
  assert.doesNotMatch(
    await optimizeSvg(svg, { ...PRESET_SAFE, removeDesc: true }),
    /<desc>/,
  );
});

test("E6: an unparsable SVG is reported as an optimization failure", async () => {
  // Muted: the optimizer logs the parser error before rethrowing.
  const original = console.error;
  console.error = () => {};
  try {
    await assert.rejects(optimizeSvg("<svg><g></svg>", PRESET_SAFE), {
      message: "SVGの最適化に失敗しました",
    });
  } finally {
    console.error = original;
  }
});
