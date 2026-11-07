# Color references

The palette datasets have their own licenses, separate from the site's UI
code. The color swatch book links each palette's source and license from
its source panel; the license texts are at `/palette-data/licenses.txt`.
The named colors show no source (see below).

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
  of 519 named colors. The Japanese collection is a 299-row subset derived
  by `named-colors.ts`; every Japanese color remains in the world
  collection. Membership uses the display name: names not starting with
  katakana (after NFKC normalization) also belong to Japanese colors. This is
  a naming convention for browsing, not a claim about geographical origin.
  Names were chosen by counting how many references list them, and each
  value is a real value from those references, picked by a weighted vote.
  The references and the tally are kept outside this repository and are not
  published: the dataset holds names, readings, aliases, values and slugs
  only, and the site shows no source for them. The one name badge is JIS:
  `nameSources` is `["jis"]` for names among the JIS Z 8102 conventional
  color names, and empty otherwise. The datasets are not offered for
  download. Use `world.json` when updating names or values; do not maintain
  the subset separately. These are display examples, not definitive values
  for each name.
  One color name read several ways is one entry, with its other readings
  among its aliases. Names that are different colors keep separate entries
  with their readings as qualifiers, as the two 紅色 (べにいろ and
  くれないいろ) do.
  Each row's `slug` names its page under `/colors/`. Japanese names use
  the reading in Hepburn without long vowels or the trailing 色 (桜色 →
  `sakura`, 黄丹 → `oni`); katakana names use the English name
  (`salmon-pink`). Names sharing a reading append the other kanji's
  reading: `moegi-negi` (萌葱色), `kuri-kurotsuchi` (涅色) and
  `ama-ten` (天色). Slugs are stored, not derived at build time, so a page
  keeps its URL when a reading is corrected; a test keeps them unique.

The full license texts are in `LICENSES/Tailwind-MIT.txt`,
`LICENSES/Nord-MIT.txt`, `LICENSES/Radix-MIT.txt`,
`LICENSES/Catppuccin-MIT.txt`, `LICENSES/Dracula-MIT.txt`,
and `LICENSES/Open-Color-MIT.txt`. The palette pages link each MIT
palette's license text at `/palette-data/licenses.txt`.

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
and the former `/palette-preview` redirect to the Japanese colors. A
palette's link switches the palette in place, with its colors from
`/palette/<slug>.json` (the colors as the page shows them), so the page and
its fonts do not load again. The
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
