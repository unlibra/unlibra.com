# Color references

These datasets have their own licenses, separate from the site's UI code.
The color swatch book exposes the data and notices under `/palette-data/`
and links to the sources from each collection's source panel. Name-reference
badges on a color's page and in the inspector are separate from the source
of the displayed values.

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
- **World colors / Japanese colors**: `world.json` is the canonical dataset
  of 460 selected rows from the Japanese Wikipedia color-name lists. The
  Japanese collection is a 261-row subset derived by `named-colors.ts`;
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
  Three rows that diverge from the usual color for their name are
  excluded: the pale pink 薄色 (`#FDE8E9`; the pale purple `#BAA4C4`
  remains), the purple 紺青 (`#694F94`; the dark blue `#1A4472` remains),
  and 深緋 read ふかひ (`#B4534B`; 深緋 read こきひ, `#C9171E`, remains).
  Salmon pink uses the value of its individual article (`#FF9E8C`)
  instead of the list row's `#EE7948`.
  Each row's `slug` names its page under `/colors/`. Japanese names use
  the reading in Hepburn without long vowels or the trailing 色 (桜色 →
  `sakura`, 黄丹 → `oni`); katakana names use the English name
  (`salmon-pink`). Names sharing a reading append the other kanji's kun
  reading: `moegi-negi` (萌葱色), `kuri-kurotsuchi` (涅色) and
  `kaba-gama` (蒲色). Slugs are stored, not derived at build time, so a
  page keeps its URL when a reading is corrected; a test keeps them
  unique.
  The adapted dataset is provided under CC BY-SA 4.0, attributed to the
  linked pages' contributors. These are display examples, not definitive
  values for each name or vendor-standard matches. Use `world.json` when
  updating values or provenance; do not maintain the subset separately.
  Sanzo Wada remains a color-name reference for seven entries with no
  other corroborating reference among the four adopted systems. There is
  no separate Wada collection or Wada numeric dataset. JIS is used only
  to corroborate color names; there is no JIS swatch collection or
  separately distributed JIS numeric dataset.

The full license texts are in `LICENSES/Tailwind-MIT.txt`,
`LICENSES/Nord-MIT.txt`, `LICENSES/Radix-MIT.txt`,
`LICENSES/Catppuccin-MIT.txt`, `LICENSES/Dracula-MIT.txt`,
`LICENSES/Open-Color-MIT.txt`, and
`LICENSES/CC-BY-SA-4.0.txt`. Attribution and
license links travel with the JSON datasets.

## Display conversions

Named collections are grouped by the hue letter of each color's Munsell
estimate (the ten Munsell hues R, YR, Y, GY, G, BG, B, PB, P, RP), solely
for browsing. Estimates below chroma 1.5 join a neutral group, following
the achromatic region of the JIS Z 8102 charts. All entries appear once.
Within a group, colors run from light to dark by OKLab lightness; equal
lightness keeps the dataset order. This is not the classification of any
standard or a claim about cultural origin. Official scale/theme order
stays unchanged.

HEX and RGB describe sRGB screen values. HSV, HSL and OKLCH are calculated
from that sRGB value; Tailwind retains its original OKLCH instead. CMYK is
not displayed: no output print condition or ICC profile is selected.

`munsell-estimates.json` contains generated estimates for every unique
sRGB HEX, using the pinned dev dependency `munsell@1.1.7` (MPL-2.0):
<https://github.com/privet-kitty/munsell.js>. Regenerate after installing
locked dependencies with `node scripts/generate-munsell-values.mjs`. An
optional first argument specifies an isolated installation's module entry.
The library uses RIT renotation data under Illuminant C, Bradford chromatic
adaptation from D65, and interpolation/extrapolation. Results are rounded
to one decimal and precomputed to keep the conversion library out of the
browser bundle. These estimates do not represent standard reference
values; neither an estimate nor an sRGB preview replaces a physical
color measurement. The combined generated lookup is CC BY-SA 4.0,
with the underlying named-color and MIT palette sources credited above.

## Browsing and UI preview

Each collection has its own page, `/palette/<slug>` (`/en/palette/<slug>`
in English): `japanese`, `world`, `tailwindcss`, `radix-colors`,
`open-color`, `nord`, `catppuccin` and `dracula`. `/palette`, `/colors`
and the former `/palette-preview` redirect to the Japanese colors. The
pages are grouped as color names/references (Japanese, world, DIC and
PANTONE links), UI color scales (Tailwind, Radix, Open Color), and color
themes (Nord, Catppuccin, Dracula). Reference badges are plain text
indicating name corroboration; source links remain in the source panel.

Every Japanese and world color also has its own page, `/colors/<slug>`:
the color fills the top with the name and reading, followed by its values,
name references, a UI preview and the source of its value. On the
Japanese and world colors' pages, a swatch opens that page in place, as
Just HEX opens a color: the color floods the screen from the swatch and
the address changes; going back shrinks it into the swatch. The other
collections keep an inspector beside the list (a dock on phones).

The inspector and each color's page include light and dark interface
examples using the color as the accent. The field, checkbox, radios and toggle are
interactive samples; the example buttons do not submit or navigate.
Buttons change color on hover, toggles slide between states, and labels
use a filled background. Reduced-motion settings disable transitions.
Button text uses white or black, whichever has higher WCAG contrast.
Text contrast against each example background is also displayed; the
normal-text threshold is 4.5:1. This does not certify an entire interface.
<https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html>
