// Tests that scripts/check-prod.mjs reports a broken site: a local server
// that answers wrongly on purpose. That it passes on the real build is
// checked by tests/e2e/check-prod.spec.js (I4).
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createServer } from "node:http";

import {
  BEACON,
  checkSite,
  HINTS,
  parseHeaders,
  parseRedirects,
} from "../scripts/check-prod.mjs";

let server;
let base;
before(async () => {
  server = createServer((request, response) => {
    const send = (status, body, headers = {}) => {
      response.writeHead(status, headers);
      response.end(body);
    };
    switch (request.url) {
      case "/robots.txt":
        return send(200, "User-agent: *\nDisallow: /\n");
      case "/sitemap-index.xml":
        return send(200, "<loc>https://unlibra.com/sitemap-0.xml</loc>");
      case "/sitemap-0.xml":
        return send(
          200,
          "<loc>https://unlibra.com/</loc><loc>https://unlibra.com/missing</loc><loc>https://unlibra.com/blocked</loc><loc>https://example.com/lab</loc>",
        );
      case "/":
        return send(
          200,
          `<link href="/_astro/a.css"><script src="https://${BEACON}"></script>`,
        );
      case "/missing":
        return send(404, "");
      case "/blocked":
        return send(403, "");
      default:
        // Everything else: 200, no redirects, no headers.
        return send(200, "");
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

const run = async () => {
  const reports = [];
  await checkSite(base, (status, name, detail, hints) =>
    reports.push([status, name, hints]),
  );
  return reports;
};

test("check:prod reports what is wrong on a broken site", async () => {
  const reports = await run();
  const status = (prefix) =>
    reports.filter(([, name]) => name.startsWith(prefix)).map(([s]) => s);

  assert.deepEqual(status("robots.txt"), ["fail"]);
  assert.deepEqual(status("sitemap-index.xml"), ["ok"]);
  // /, /missing, /blocked, other host
  assert.deepEqual(status("page /"), ["ok", "fail", "fail", "fail"]);
  const redirects = status("redirect ");
  assert.equal(
    redirects.length,
    parseRedirects(
      readFileSync(new URL("../public/_redirects", import.meta.url), "utf8"),
    ).length,
  );
  assert.ok(redirects.every((s) => s === "fail"));
  assert.ok(status("headers ").every((s) => s === "fail"));
  assert.ok(status("headers ").length > 0);
  // Just HEX: the share URL has no OGP, and the image is not a PNG.
  assert.deepEqual(status("Just HEX OGP /"), ["fail"]);
  assert.deepEqual(status("Just HEX OGP image "), ["fail"]);
  assert.deepEqual(status("Web Analytics"), ["ok"]);
});

test("check:prod adds hints for what the Cloudflare zone may change", async () => {
  const reports = await run();
  const hints = (name) => reports.find(([, n]) => n.startsWith(name))[2];

  assert.deepEqual(hints("robots.txt"), [HINTS.robots]);
  // Every header of "/*" is missing, HSTS and nosniff among them.
  assert.deepEqual(hints("headers /* "), [HINTS.hsts]);
  assert.deepEqual(hints("headers /favicon.svg "), [HINTS.cache]);
  assert.deepEqual(hints("page /blocked"), [HINTS.blocked]);
  assert.deepEqual(hints("page /missing"), []);
  // Passing checks have none.
  assert.deepEqual(hints("sitemap-index.xml"), []);
});

test("check:prod warns, without failing, when the beacon is missing", async () => {
  const original = server.listeners("request")[0];
  server.removeAllListeners("request");
  server.on("request", (request, response) => {
    if (request.url === "/") {
      response.writeHead(200);
      return response.end("<html></html>");
    }
    return original(request, response);
  });
  try {
    const reports = await run();
    assert.deepEqual(
      reports.filter(([, name]) => name.startsWith("Web Analytics")),
      [["warn", "Web Analytics beacon in /", []]],
    );
  } finally {
    server.removeAllListeners("request");
    server.on("request", original);
  }
});

test("check:prod skips header lines that come before any path", () => {
  assert.deepEqual(parseHeaders("  A: 1\n/x\n  B: 2\n"), [
    { path: "/x", headers: [["b", "2"]] },
  ]);
});

test("check:prod reads _headers rules with their headers", () => {
  assert.deepEqual(parseHeaders("/*\n  A: 1\n  B: x: y\n\n/x.png\n  C: 2\n"), [
    {
      path: "/*",
      headers: [
        ["a", "1"],
        ["b", "x: y"],
      ],
    },
    { path: "/x.png", headers: [["c", "2"]] },
  ]);
});
