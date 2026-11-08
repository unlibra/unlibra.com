import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (id) =>
  JSON.parse(
    readFileSync(new URL(`../src/data/palettes/${id}.json`, import.meta.url)),
  );

test("additional palettes retain official source revisions, attribution, and valid colors", () => {
  for (const [id, count] of [
    ["radix", 744],
    ["catppuccin", 104],
    ["dracula", 24],
    ["open-color", 132],
  ]) {
    const data = read(id);
    assert.equal(data.colors.length, count);
    assert.equal(data.license, "MIT");
    assert.match(data.attribution, /Copyright \(c\)/);
    assert.match(data.revision, /^[a-f0-9]{40}$/);
    assert.ok(data.source.includes(data.revision));
    assert.equal(new Set(data.colors.map((color) => color.id)).size, count);
    for (const color of data.colors) assert.match(color.hex, /^#[0-9A-F]{6}$/);
  }
});

test("Radix retains every 12-step opaque scale in both variants", () => {
  const data = read("radix");
  for (const variant of ["Light", "Dark"]) {
    const colors = data.colors.filter((color) => color.variant === variant);
    const families = new Set(colors.map((color) => color.group));
    assert.equal(families.size, 31);
    for (const family of families) {
      const scale = colors.filter((color) => color.group === family);
      assert.deepEqual(
        scale.map((color) => color.shade),
        Array.from({ length: 12 }, (_, i) => String(i + 1)),
      );
      assert.ok(scale.every((color) => color.source.includes(data.revision)));
    }
  }
  assert.equal(
    data.colors.find((color) => color.id === "light-blue-9").hex,
    "#0090FF",
  );
  assert.equal(
    data.colors.find((color) => color.id === "dark-blue-1").hex,
    "#0D1520",
  );
});

test("Catppuccin and Dracula retain their full flavors and role tokens", () => {
  const cat = read("catppuccin");
  assert.deepEqual(
    [...new Set(cat.colors.map((color) => color.variant))],
    ["Latte", "Frappé", "Macchiato", "Mocha"],
  );
  for (const flavor of ["Latte", "Frappé", "Macchiato", "Mocha"])
    assert.equal(
      cat.colors.filter((color) => color.variant === flavor).length,
      26,
    );
  assert.equal(
    cat.colors.find((color) => color.id === "mocha-mauve").hex,
    "#CBA6F7",
  );
  const dracula = read("dracula");
  for (const variant of ["Dracula", "Alucard"])
    assert.equal(
      dracula.colors.filter((color) => color.variant === variant).length,
      12,
    );
  assert.equal(
    dracula.colors.find((color) => color.id === "dracula-current-line").hex,
    "#44475A",
  );
  assert.equal(
    dracula.colors.find((color) => color.id === "dracula-selection").hex,
    "#44475A",
  );
});
