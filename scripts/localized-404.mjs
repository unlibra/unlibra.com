// The English 404 page where Cloudflare looks for it. With
// `not_found_handling: "404-page"`, Cloudflare serves the 404.html nearest to
// the path that was not found: dist/en/404.html for the paths under /en,
// dist/404.html for the others. Astro writes src/pages/en/404.astro to
// dist/en/404/index.html (only the root 404 page becomes 404.html), so this
// integration moves it after the build.
import { existsSync, renameSync, rmdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

/** The 404 pages Astro writes as directories, by their directory in dist/. */
export const LOCALIZED_404_DIRS = ["en"];

export default function localized404() {
  return {
    name: "localized-404",
    hooks: {
      "astro:build:done": ({ dir }) => {
        const dist = fileURLToPath(dir);
        for (const locale of LOCALIZED_404_DIRS) {
          const built = join(dist, locale, "404", "index.html");
          if (!existsSync(built)) {
            throw new Error(`localized-404: ${built} was not built`);
          }
          renameSync(built, join(dist, locale, "404.html"));
          rmdirSync(join(dist, locale, "404"));
        }
      },
    },
  };
}
