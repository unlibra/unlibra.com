# Color references

These datasets have their own licenses, separate from the site's UI code.
The preview exposes the data and notices under `/palette-data/` and links to
the sources from the color inspector and each collection's source panel.

- **Tailwind CSS 4.3.3**: extracted from the installed, lockfile-pinned
  `tailwindcss/theme.css`. MIT, Tailwind Labs, Inc. Run
  `node scripts/generate-tailwind-palette.mjs` to regenerate. The original
  OKLCH is preserved. HEX is an sRGB approximation converted through OKLab,
  with out-of-gamut channels clipped. All displayed swatches use that HEX,
  so the preview and the code sent to Just HEX describe the same color.
- **Nord**: the 16 color definitions in `nordtheme/nord`, revision
  `005e87ea78245c9a2e48066d3c81f1d49919e2ac`. MIT, Sven Greb. Names are
  grouped into Polar Night, Snow Storm, Frost, and Aurora.
- **World colors / Japanese colors**: `world.json` is the canonical dataset
  of 463 selected rows from the Japanese Wikipedia color-name lists. The
  Japanese collection is a 264-row subset derived by `named-colors.ts`;
  every Japanese color remains in the world collection. Both downloads
  retain the same IDs, values, fixed-revision links, and attribution.
  Membership uses the first name printed in each source row: names not
  starting with katakana also belong to Japanese colors. The first
  character is checked after NFKC normalization. This is a naming
  convention for browsing, not a claim about geographical origin.
  Names are corroborated by at least one of JIS, DIC, Sanzo Wada, or
  Pantone. Their reference links are retained separately from the display
  values, which come only from the linked Wikipedia revisions. Previously
  featured colors retain their individual-article values and sources,
  including Shinbashi `#59B9C6`. No vendor RGB/HEX values, numbers, article
  prose, or images are included. Names, readings, aliases, and available
  English names are searchable. Multiple names in one source row remain
  one entry; distinct rows are not merged merely for sharing a HEX value.
  Repeated display names retain their source readings as qualifiers so
  that, for example, the two readings of 紅色 remain distinguishable.
  The adapted dataset is provided under CC BY-SA 4.0, attributed to the
  linked pages' contributors. These are display examples, not definitive
  values for each name or vendor-standard matches. Use `world.json` when
  updating values or provenance; do not maintain the subset separately.
- **Sanzo Wada**: 12 colors in three selected combinations (No. 31, 34,
  and 38) in _Haishoku Sōkan_, A10, second printing (Hakubisha, 1935).
  Color names and combination membership were checked in the public-domain
  NDL scans, identifier `1145849`, canvases 3, 6, and 10. Page images and
  layouts are not reproduced. Numeric CMYK percentages come from
  `dblodorn/sanzo-wada`, revision
  `1f620807861df45f5a4e764b4e6be5e8fb9ce9eb` (MIT, Dain Blodorn).
  Its About page cites Seigensha's revised _A Dictionary of Color
  Combinations_; that provenance is retained in the JSON. Source names,
  including the spelling "Pomegranite Purple", are preserved.
  HEX is a screen approximation: for each CMY channel,
  `round(255 * (1 - ink/100) * (1 - black/100))`, without an ICC profile.
  The monochrome NDL scans are not the source of these numeric values.
  Each combination retains both its original volume/number and its digital
  source number, plus a link to the original scan.

The full license texts are in `LICENSES/Tailwind-MIT.txt`,
`LICENSES/Nord-MIT.txt`, `LICENSES/Sanzo-Wada-MIT.txt`, and
`LICENSES/CC-BY-SA-4.0.txt`. Attribution and
license links travel with the JSON datasets.
