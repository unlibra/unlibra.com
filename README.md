# unlibra.com

The website of unlibra. It has a portfolio of works (custom keyboards,
software, web tools, and VRChat items) and a set of web tools that run in the
browser.

- `/` - Portfolio (Japanese)
- `/lab/{tool}` and `/en/lab/{tool}` - Web tools (Japanese and English)
- `/privacy` - Privacy policy (Japanese)

## Tech Stack

- [Astro](https://astro.build/) 7 - Static site generation
- [Tailwind CSS](https://tailwindcss.com/) v4 - Styling
- [React](https://react.dev/) - Islands for the interactive web tools
- [Cloudflare Workers](https://developers.cloudflare.com/workers/static-assets/) - Static asset hosting only (no Worker script)
- TypeScript

## Development

Requires Node.js 22.22.0 or later (`.node-version` pins 24).

```bash
# Install dependencies
npm ci

# Start the dev server (http://localhost:4321)
npm run dev

# Type-check and build into dist/
npm run build

# Run the tests against dist/ (run `npm run build` first)
npm test

# Serve dist/ with Wrangler, as on Cloudflare Workers
npm run preview:cf

# Lint and format
npm run lint
npm run format:check
npm run format

# Regenerate the icons from src/assets/brand/symbol.svg (public/ogp.png is made by hand)
npm run generate:icons

# Redraw the logotype from LINE Seed JP (src/assets/brand/logotype.svg)
npm run generate:logotype

# Redraw the icon of Just HEX (src/assets/tools/just-hex.svg)
npm run generate:just-hex-icon
```

## Project Structure

- `src/pages/` - Pages
- `src/config/` - Site settings and the list of works
- `src/components/` - Astro components
- `src/components/ui/` - Shared UI parts (MIT)
- `src/tools/` - Web tool implementations (MIT)
- `public/_headers` - Security and cache headers for Cloudflare
- `wrangler.jsonc` - Cloudflare Workers configuration
- `DESIGN.md` - Design guidelines: type, color, spacing and components, and the reasons (read this before adding pages or content)
- `docs/` - Design document and decision logs

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
