// The Worker in front of the static assets: it runs only for /hex/*
// (`run_worker_first` in wrangler.jsonc); every other request is served as
// a static asset without it. It serves the share URLs of Just HEX with the
// color's own OGP, which a hash URL (/hex#ffffff) cannot have: the hash is
// never sent to the server.
//
//   /hex/ffffff      the Just HEX page, with the color's title and OGP
//   /hex/ffffff.png  the color's OGP image
//
// Other spellings of a color ("FFF") redirect to its one written form;
// anything else under /hex/ goes to the static assets (a 404, or the
// trailing slash's redirect of /hex/).
import { site } from "../src/config/site";
import {
  hexPath,
  imagePath,
  parseHex,
  sharePath,
  type Hex,
} from "../src/config/hex";
import { hexMessages as t, withHex } from "../src/messages/hex";
import { colorPng } from "./og-image";

const route = /^\/hex\/([^/]+?)(\.png)?$/;

/** Sets an attribute of each element the rewriter finds. */
const setAttribute = (name: string, value: string) => ({
  element: (element: Element) => {
    element.setAttribute(name, value);
  },
});

/** The Just HEX page with the color's title, description and OGP. */
const colorPage = (page: Response, hex: Hex): Response => {
  const title = `${withHex(t.colorTitle, hex)} - ${site.title}`;
  const description = withHex(t.colorDescription, hex);
  const url = site.url + sharePath(hex);
  const image = site.url + imagePath(hex);
  const response = new HTMLRewriter()
    .on("title", {
      element: (element) => {
        element.setInnerContent(title);
      },
    })
    .on('meta[name="description"]', setAttribute("content", description))
    .on('link[rel="canonical"]', setAttribute("href", url))
    .on('meta[property="og:title"]', setAttribute("content", title))
    .on('meta[name="twitter:title"]', setAttribute("content", title))
    .on('meta[property="og:description"]', setAttribute("content", description))
    .on(
      'meta[name="twitter:description"]',
      setAttribute("content", description),
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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const match = route.exec(url.pathname);
    const hex = match ? parseHex(match[1]!) : null;
    if (!match || !hex) return env.ASSETS.fetch(request);

    const image = match[2] !== undefined;
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
