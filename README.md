# unlibra.com

The source of [unlibra.com](https://unlibra.com), the personal site of unlibra:
a portfolio of the things I make, and a few tools that run in the browser.

This repository is public to show how the site is built. It is the site
itself, not a template or a starter to deploy.

## The site

- **Portfolio** (`/`): DIY keyboards, apps, libraries, and VRChat items, each
  with links to where it is published or sold.
- **Just HEX** (`/hex`): one color on the whole screen, with a share URL per
  color (`/hex/FF5A36`) that has the color's own preview image.
- **Web tools** (`/lab/...`): Favicon Generator, SVG Optimizer and Password
  Generator. They work entirely in the browser: files and passwords are never
  sent anywhere.
- **Japanese and English**: every page is in Japanese (no prefix) and English
  (under `/en`), except the privacy policy, which is in Japanese only.

## How it is built

- **[Astro](https://astro.build/) 7**, as a static site. The pages are HTML
  and CSS; only the tools are [React](https://react.dev/) islands.
  [Tailwind CSS](https://tailwindcss.com/) v4, TypeScript throughout.
- **[Cloudflare Workers](https://developers.cloudflare.com/workers/static-assets/)**
  serves the static files. A small Worker (`worker/`) runs only for Just HEX's
  color pages: it rewrites the page's title and OGP for the color, and draws
  the color's PNG preview image on the fly.
- **Two languages from one set of pages**: each page is written once and
  rendered per language. The English paths come from one rule
  (`localizedPath`), the English texts have the same shape as the Japanese
  ones (checked by the type system), and `hreflang`, canonical URLs and the
  sitemap follow from them.
- **Fonts**: Noto Sans JP is cut down at build time to the characters the
  site uses. The logotype is an SVG drawing, so it never waits for a font.
- **Design rules**: [DESIGN.md](DESIGN.md) holds the type scale, colors,
  spacing, components and the reasons behind them.
- **Tests**: unit tests on the built output (`node:test`) and browser tests
  with [Playwright](https://playwright.dev/) against the Workers runtime
  (`wrangler dev`): layout at phone and desktop widths, light and dark
  themes, color contrast, redirects and the Worker's pages.
- **Automation** (`.github/`): tests on every pull request (required for
  main), CodeQL, Dependabot, a daily check of the production site, and an
  [IndexNow](https://www.indexnow.org/) ping for the pages a deploy changed.
- **Licenses of the bundled packages** are collected at build time into
  [/third-party-licenses.txt](https://unlibra.com/third-party-licenses.txt).

## Repository layout

- `src/pages/` - Routes (thin; the page bodies are in `src/components/pages/`)
- `src/components/` - Astro components
- `src/config/` - Site settings and the list of works
- `src/messages/` - Page texts in Japanese and English
- `src/tools/` - The web tools (MIT)
- `src/components/ui/` - UI parts shared with the tools (MIT)
- `worker/` - The Worker for Just HEX's color pages
- `scripts/` - Build integrations and asset generators
- `tests/` - Unit tests, and Playwright tests in `tests/e2e/`
- `public/` - Static files, with Cloudflare's `_headers` and `_redirects`

## License

Copyright (c) 2025 unlibra. All rights reserved, with the exceptions below.
See [LICENSE](LICENSE) for the full terms.

- The web tools (`src/tools/`) and shared UI parts (`src/components/ui/`) are
  licensed under the [MIT License](LICENSES/MIT.txt).
- Some files contain material by other authors (Tabler Icons, DiceBear). They
  are listed in [LICENSE](LICENSE), with the full license texts in
  [LICENSES/](LICENSES/).
- BOOTH product images that show material by other creators are not covered by
  any of these licenses.
