// Tells IndexNow (Bing and the other search engines that share it) which
// pages a push to main changed, once the new version is live (SP-18).
//
// - An Astro integration writes dist/commit.txt, the commit the build is
//   made from, so the workflow can tell when production serves it.
// - .github/workflows/indexnow.yml builds the commit before the push and the
//   pushed one, and runs
//
//     node scripts/indexnow.mjs <old dist/> <new dist/>
//
//   which prints the URLs (one per line) of the pages whose content changed:
//   the title, the description, and the text, links and images of <main>.
//   Not the rest of the HTML, where a rebuilt stylesheet or script changes
//   the file names in every page. Pages added to or removed from the sitemap
//   are included.
// - The workflow then waits for the commit and calls submit() through
//   `node scripts/indexnow.mjs --submit <url>...`.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

/** The key, also the name and content of /<key>.txt (public/). */
export const INDEXNOW_KEY = "67426e8c4c044cef96ebc2f901da0154";

/** The file in dist/ that names the commit of the build. */
export const COMMIT_FILE = "commit.txt";

const SITE = "https://unlibra.com";

/** Writes dist/commit.txt: Workers Builds' commit, or git's. */
export function commitMarker() {
  return {
    name: "commit-marker",
    hooks: {
      "astro:build:done": ({ dir }) => {
        const commit =
          process.env.WORKERS_CI_COMMIT_SHA ??
          execFileSync("git", ["rev-parse", "HEAD"], {
            encoding: "utf8",
          }).trim();
        if (!/^[0-9a-f]{40}$/.test(commit)) {
          throw new Error(`${COMMIT_FILE}: not a commit: ${commit}`);
        }
        writeFileSync(join(fileURLToPath(dir), COMMIT_FILE), `${commit}\n`);
      },
    },
  };
}

/** The page URLs of a build's sitemap. */
export const sitemapUrls = (dist) =>
  [
    ...readFileSync(join(dist, "sitemap-0.xml"), "utf8").matchAll(
      /<loc>([^<]*)<\/loc>/g,
    ),
  ].map((match) => match[1]);

/** The built file of a page URL (trailingSlash: "never"). */
const pageFile = (dist, url) => {
  const path = new URL(url).pathname.replace(/^\//, "");
  return join(dist, path, "index.html");
};

/** "/_astro/name.Hash_x.webp" -> "name": the hash and format are build details. */
const assetName = (src) =>
  src.replace(/^.*\/_astro\//, "").replace(/\..*$/, "");

/**
 * What a reader gets from a page: its title and description, and the text,
 * link targets and images (name and alt) of its <main>.
 */
export const pageContent = (html) => {
  const main = html.match(/<main[\s>][\s\S]*?<\/main>/i)?.[0] ?? "";
  // Read <main> as tokens: a script or style element (skipped whole), a
  // tag, or text. Nothing is rendered: the result is only compared.
  const text = [];
  const tags = [];
  for (const [token, skipped] of main.matchAll(
    /<(script|style)\b[\s\S]*?<\/\1\s*>|<[^>]*>|[^<]+/gi,
  )) {
    if (skipped) continue;
    (token.startsWith("<") ? tags : text).push(token);
  }
  return JSON.stringify({
    title: html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "",
    description:
      html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? "",
    text: text.join(" ").replace(/\s+/g, " ").trim(),
    links: tags.flatMap((tag) => tag.match(/\shref="([^"]*)"/)?.[1] ?? []),
    images: tags
      .filter((tag) => /^<img\s/i.test(tag))
      .map((img) => [
        assetName(img.match(/\ssrc="([^"]*)"/)?.[1] ?? ""),
        img.match(/\salt="([^"]*)"/)?.[1] ?? "",
      ]),
  });
};

/** The URLs of the pages that changed between two builds. */
export function changedPages(oldDist, newDist) {
  const before = new Set(sitemapUrls(oldDist));
  const after = new Set(sitemapUrls(newDist));
  const changed = [];
  for (const url of new Set([...before, ...after])) {
    if (!before.has(url) || !after.has(url)) {
      changed.push(url);
      continue;
    }
    const [a, b] = [oldDist, newDist].map((dist) => {
      const file = pageFile(dist, url);
      if (!existsSync(file)) throw new Error(`${url}: ${file} not found`);
      return pageContent(readFileSync(file, "utf8"));
    });
    if (a !== b) changed.push(url);
  }
  return changed.sort();
}

/** Sends URLs to IndexNow. Throws unless it answers 200 or 202. */
export async function submit(urls) {
  for (const url of urls) {
    if (!url.startsWith(`${SITE}/`)) throw new Error(`not on ${SITE}: ${url}`);
  }
  const response = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: new URL(SITE).host,
      key: INDEXNOW_KEY,
      keyLocation: `${SITE}/${INDEXNOW_KEY}.txt`,
      urlList: urls,
    }),
  });
  if (response.status !== 200 && response.status !== 202) {
    throw new Error(
      `IndexNow answered ${response.status}: ${await response.text()}`,
    );
  }
  return response.status;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [first, ...rest] = process.argv.slice(2);
  if (first === "--submit") {
    console.log(`IndexNow: ${await submit(rest)} for ${rest.length} URLs`);
  } else {
    for (const url of changedPages(first, rest[0])) console.log(url);
  }
}
