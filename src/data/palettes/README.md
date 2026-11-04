# Color references

These datasets have their own licenses, separate from the site's UI code.
The preview exposes the data and notices under `/palette-data/` and links to
the sources from each collection's source panel. Name-reference badges in
the inspector are separate from the source of the displayed values.

- **Tailwind CSS 4.3.3**: extracted from the installed, lockfile-pinned
  `tailwindcss/theme.css`. MIT, Tailwind Labs, Inc. Run
  `node scripts/generate-tailwind-palette.mjs` to regenerate. The original
  OKLCH is preserved. HEX is an sRGB approximation converted through OKLab,
  with out-of-gamut channels clipped. All displayed swatches use that HEX,
  so the preview and the code sent to Just HEX describe the same color.
- **Nord**: the 16 color definitions in `nordtheme/nord`, revision
  `005e87ea78245c9a2e48066d3c81f1d49919e2ac`. MIT, Sven Greb. Names are
  grouped into Polar Night, Snow Storm, Frost, and Aurora.
- **Radix Colors**: 31 opaque sRGB scales, each with 12 steps in both Light
  and Dark (744 values). Extracted from `src/light.ts` and `src/dark.ts` in
  `radix-ui/colors`, revision `dbdb85470547c7d34b9001f48fddb08ded335979`.
  Alpha and Display P3 scales are omitted. MIT, Modulz and WorkOS.
- **Catppuccin**: all four flavors, each with 26 color tokens (104 values),
  from `catppuccin/palette`'s `palette.json`, revision
  `07d02aa110ef9eb7e7427afca5c73ba9cf7f8ebd`. Official ordering and HEX
  values are retained. MIT, Catppuccin.
- **Dracula**: the Dracula and Alucard OSS palette tables, each with 12 role
  tokens (24 entries), from `dracula/dracula-theme`'s README, revision
  `8d33e5492b56740c4857c5ebe7c5d5ab4040caf1`. Different role tokens sharing
  a HEX remain separate. MIT, Dracula Theme.
- **Open Color**: 13 ten-step scales plus white and black (132 values), from
  `yeun/open-color`'s `open-color.json`, revision
  `3a716ee1f5ff5456db33cb8a6e964afdca1e7bc3`. MIT, heeyeun.
  These four datasets use official HEX values normalized to uppercase;
  source links and revisions accompany each download. All variants are
  visible together: Catppuccin groups flavors by token name, Radix pairs
  Light/Dark scales, and Dracula/Alucard have separate sections.
- **JIS color names**: `jis.json` is extracted from Japanese Wikipedia's
  `JIS慣用色名`, fixed revision `111583927`, under CC BY-SA 4.0. It retains
  representative Munsell notation alongside Wikipedia's reference HEX.
  These HEX/RGB values are screen approximations, not official JIS RGB.
  Of the 269 names, gold and silver have no representative Munsell notation
  and are recorded as excluded rather than assigned substitute values.
  The preview displays the remaining 267 colors. Regenerate with
  `node scripts/generate-jis-palette.mjs <MediaWiki API JSON>` using that
  revision's main-slot content, then format the result with Prettier.
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
  English names remain in the downloadable data. Multiple names in one source row remain
  one entry; distinct rows are not merged merely for sharing a HEX value.
  Repeated display names retain their source readings as qualifiers so
  that, for example, the two readings of 紅色 remain distinguishable.
  The adapted dataset is provided under CC BY-SA 4.0, attributed to the
  linked pages' contributors. These are display examples, not definitive
  values for each name or vendor-standard matches. Use `world.json` when
  updating values or provenance; do not maintain the subset separately.
  Sanzo Wada remains a color-name reference for seven entries with no
  other corroborating reference among the four adopted systems. There is
  no separate Wada collection or Wada numeric dataset.

The full license texts are in `LICENSES/Tailwind-MIT.txt`,
`LICENSES/Nord-MIT.txt`, `LICENSES/Radix-MIT.txt`,
`LICENSES/Catppuccin-MIT.txt`, `LICENSES/Dracula-MIT.txt`,
`LICENSES/Open-Color-MIT.txt`, and
`LICENSES/CC-BY-SA-4.0.txt`. Attribution and
license links travel with the JSON datasets.

## Display conversions

Named collections use twelve 30-degree HSV hue sectors plus neutrals
(OKLCH chroma below 0.02), solely for browsing. All entries appear once.
The neutral group includes near-neutral display colors. This is not the
JIS system of ten basic chromatic names or a claim about cultural origin.

HEX and RGB describe sRGB screen values. HSV, HSL and OKLCH are calculated
from that sRGB value; Tailwind retains its original OKLCH instead. CMYK
uses the simple unprofiled CMY/K formula, with K = 1 − max(R,G,B). It is
explicitly an approximation, not an ICC print separation. Black is
0%, 0%, 0%, 100%. Actual print conversion requires the output ICC profile.

`munsell-estimates.json` contains generated estimates for every unique
sRGB HEX, using the pinned dev dependency `munsell@1.1.7` (MPL-2.0):
<https://github.com/privet-kitty/munsell.js>. Regenerate after installing
locked dependencies with `node scripts/generate-munsell-values.mjs`. An
optional first argument specifies an isolated installation's module entry.
The library uses RIT renotation data under Illuminant C, Bradford chromatic
adaptation from D65, and interpolation/extrapolation. Results are rounded
to one decimal and precomputed to keep the conversion library out of the
browser bundle. Estimates are distinct from the original Munsell notation
retained in `jis.json`; neither an estimate nor an sRGB preview replaces a
physical color measurement. The combined generated lookup is CC BY-SA 4.0,
with the underlying named-color and MIT palette sources credited above.
