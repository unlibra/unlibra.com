// The Worker in front of the static assets: it runs only for the colors
// under /hex/ (`run_worker_first` in wrangler.jsonc, which leaves out /hex
// and /hex/); every other request is served as a static asset without it.
// It serves each color's page with the color's own OGP.
//
//   /hex/FFFFFF      the Just HEX page, with the color's title and OGP; the
//                    page shows the color (the color screen)
//   /hex/FFFFFF.png  the color's OGP image
//
// Other spellings of a color ("fff") redirect to its one written form; a
// path that is no color goes to the top page with the error
// (/hex?invalid=zzz), and an image that is no color is not found (a 404).
import { site } from "../src/config/site";
import {
  hexPath,
  imagePath,
  invalidPath,
  parseHex,
  sharePath,
  type Hex,
} from "../src/tools/just-hex/hex";
import { hexMessages as t, withHex } from "../src/tools/just-hex/messages";
import { colorPng } from "../src/tools/just-hex/og-image";

const route = /^\/hex\/(.+?)(\.png)?$/;

/** Sets an attribute of each element the rewriter finds. */
const setAttribute = (name: string, value: string) => ({
  element: (element: Element) => {
    element.setAttribute(name, value);
  },
});

/**
 * The Just HEX page with the color's title, OGP and canonical URL. Its
 * meta description stays the top page's (the user's choice).
 */
const colorPage = (page: Response, hex: Hex): Response => {
  const title = `${withHex(t.colorTitle, hex)} - ${site.title}`;
  const ogTitle = withHex(t.colorOgTitle, hex);
  const ogDescription = t.colorOgDescription;
  const url = site.url + sharePath(hex);
  const image = site.url + imagePath(hex);
  const response = new HTMLRewriter()
    .on("title", {
      element: (element) => {
        element.setInnerContent(title);
      },
    })
    .on('link[rel="canonical"]', setAttribute("href", url))
    .on('meta[property="og:title"]', setAttribute("content", ogTitle))
    .on('meta[name="twitter:title"]', setAttribute("content", ogTitle))
    .on(
      'meta[property="og:description"]',
      setAttribute("content", ogDescription),
    )
    .on(
      'meta[name="twitter:description"]',
      setAttribute("content", ogDescription),
    )
    .on('meta[property="og:url"]', setAttribute("content", url))
    .on('meta[property="og:image"]', setAttribute("content", image))
    .on('meta[name="twitter:image"]', setAttribute("content", image))
    // 16.7 million pages of one color each: for sharing, not for search.
    .on("head", {
      element: (element) => {
        element.append('<meta name="robots" content="noindex" />', {
          html: true,
        });
      },
    })
    .transform(page);
  // The tag of /hex itself, not of this page.
  response.headers.delete("ETag");
  return response;
};

/** The path's text as written (decoded when it can be). */
const decoded = (text: string): string => {
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const match = route.exec(url.pathname);
    if (!match) return env.ASSETS.fetch(request);
    const image = match[2] !== undefined;
    const hex = parseHex(decoded(match[1]!));
    if (!hex) {
      if (image) return env.ASSETS.fetch(request);
      // Not the code's page: the code is in the query, which the user may
      // fix on the top page.
      return Response.redirect(
        new URL(invalidPath(decoded(match[1]!)), url).toString(),
        302,
      );
    }

    const path = image ? imagePath(hex) : sharePath(hex);
    if (url.pathname !== path) {
      return Response.redirect(new URL(path, url).toString(), 301);
    }

    if (image) {
      return new Response(await colorPng(hex), {
        headers: {
          "Content-Type": "image/png",
          // The URL names the image's only content.
          "Cache-Control": "public, max-age=31536000, immutable",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    const page = await env.ASSETS.fetch(new URL(hexPath, url));
    return page.ok ? colorPage(page, hex) : page;
  },
} satisfies ExportedHandler<Env>;
