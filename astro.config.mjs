// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

import { commitMarker } from "./scripts/indexnow.mjs";
import localized404 from "./scripts/localized-404.mjs";
import notoSansJpSubset, {
  METRIC_OVERRIDES,
} from "./scripts/noto-sans-jp-subset.mjs";
import thirdPartyLicenses from "./scripts/third-party-licenses.mjs";

/**
 * Noto Sans JP's ascent (1.16em) is far larger than its descent (0.288em),
 * so its text sits about 0.07em below the middle of its line, and the icons
 * beside it look too high. These overrides keep the sum (1.448em, so the
 * line heights stay) and put the middle of the capitals and the kanji
 * (0.37em above the baseline) in the middle of the line.
 */
const notoSansJpMetrics = () => ({
  name: "noto-sans-jp-metrics",
  enforce: /** @type {const} */ ("pre"),
  /** @param {string} code @param {string} id */
  transform(code, id) {
    if (!/@fontsource-variable[\\/]noto-sans-jp[\\/].*\.css/.test(id)) return;
    if (!code.includes("@font-face {")) {
      throw new Error(`${id}: no @font-face to add the metric overrides to`);
    }
    return code.replaceAll(
      "@font-face {",
      "@font-face {\n" +
        Object.entries(METRIC_OVERRIDES)
          .map(([name, value]) => `  ${name}: ${value};`)
          .join("\n"),
    );
  },
});

// https://astro.build/config
export default defineConfig({
  site: "https://unlibra.com",
  trailingSlash: "never",
  integrations: [
    react(),
    // Each page with its pages in each language (hreflang), as the pages'
    // own alternate links say: Japanese without a prefix, English under
    // /en, and x-default the Japanese page.
    sitemap({
      i18n: {
        defaultLocale: "ja",
        locales: { ja: "ja", en: "en" },
      },
      serialize: (item) => {
        const links = item.links ?? [];
        const japanese = links.find(({ lang }) => lang === "ja");
        return japanese
          ? {
              ...item,
              links: [...links, { lang: "x-default", url: japanese.url }],
            }
          : item;
      },
    }),
    thirdPartyLicenses(),
    notoSansJpSubset(),
    commitMarker(),
    localized404(),
  ],
  vite: {
    plugins: [notoSansJpMetrics(), tailwindcss()],
    build: {
      // Font files stay files: inlined as base64, they made the stylesheet
      // that every page waits for heavier with fonts that only a few pages
      // use (SP-14). Other small assets keep Vite's default (4 KB).
      assetsInlineLimit: (/** @type {string} */ file) =>
        /\.(woff2?|ttf|otf)$/.test(file) ? false : undefined,
      rolldownOptions: {
        output: {
          minify: {
            compress: {
              dropConsole: true,
              dropDebugger: true,
            },
          },
        },
      },
    },
  },
});
