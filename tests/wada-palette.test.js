import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const data = JSON.parse(
  readFileSync(new URL("../src/data/palettes/wada.json", import.meta.url)),
);

test("Wada preserves original combinations separately from digital numeric data", () => {
  assert.equal(data.original.year, 1935);
  assert.equal(data.original.rights, "Public Domain Mark");
  assert.equal(data.license, "MIT");
  assert.equal(data.colors.length, 12);
  assert.deepEqual(
    data.combinations.map(({ number, canvas, sourceCombination }) => [
      number,
      canvas,
      sourceCombination,
    ]),
    [
      [31, 3, 271],
      [34, 6, 274],
      [38, 10, 278],
    ],
  );
  const ids = data.combinations.flatMap(({ colors }) => colors);
  assert.equal(new Set(ids).size, 12);
  assert.deepEqual(new Set(ids), new Set(data.colors.map(({ id }) => id)));
  for (const combination of data.combinations) {
    assert.equal(combination.colors.length, 4);
    assert.ok(
      combination.image.includes(
        `R${String(combination.canvas).padStart(7, "0")}/`,
      ),
    );
  }
  for (const color of data.colors) {
    assert.ok(color.source.includes(data.revision));
    assert.equal(color.cmyk.length, 4);
    for (const ink of color.cmyk) assert.ok(ink >= 0 && ink <= 100);
  }
  // Source CMYK 43/62/5/0 gives RGB 145/97/242 without a print profile.
  assert.equal(
    data.colors.find(({ name }) => name === "Light Mauve").hex,
    "#9161F2",
  );
  assert.match(data.digital.provenance, new RegExp(data.revision));
  assert.equal(data.digital.sourceEdition.publisher, "青幻舎");
});
