// Encode addresses in the built HTML, including Markdown and shared footers.
// Workers responses cannot rely on Cloudflare's Email Address Obfuscation.
// This deters simple HTML scrapers; it is not encryption or access control.
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "parse5";
import { site } from "../src/config/site.ts";

const addresses = [site.contact.email, site.donation.email];
const encode = (value) => {
  // Stable output avoids changing every page on unrelated deployments.
  const key = createHash("sha256").update(value).digest()[0];
  return Buffer.from([
    key,
    ...Buffer.from(value).map((byte) => byte ^ key),
  ]).toString("hex");
};

export default function emailObfuscation() {
  return {
    name: "email-obfuscation",
    hooks: {
      "astro:build:done": ({ dir }) => {
        const root = fileURLToPath(dir);
        for (const file of readdirSync(root, { recursive: true })) {
          if (!file.endsWith(".html")) continue;
          const path = join(root, file);
          const html = readFileSync(path, "utf8");
          const edits = [];
          const visit = (node) => {
            const location = node.sourceCodeLocation;
            const href = node.attrs?.find((attr) => attr.name === "href");
            if (
              node.tagName === "a" &&
              addresses.some((email) => href?.value === `mailto:${email}`)
            ) {
              const attr = location.attrs.href;
              edits.push({
                start: attr.startOffset,
                end: attr.endOffset,
                text: `data-email-href="${encode(href.value)}"`,
              });
            }
            if (
              node.nodeName === "#text" &&
              addresses.some((email) => node.value.includes(email))
            ) {
              if (
                ["script", "style", "textarea", "title"].includes(
                  node.parentNode?.tagName,
                )
              ) {
                throw new Error(`${file}: email in unsupported text context`);
              }
              let text = html.slice(location.startOffset, location.endOffset);
              for (const email of addresses) {
                if (node.value.includes(email) && !text.includes(email)) {
                  throw new Error(
                    `${file}: email uses unsupported HTML entities`,
                  );
                }
                const help = html.includes('<html lang="en"')
                  ? "Enable JavaScript to view the email address."
                  : "メールアドレスの表示にはJavaScriptが必要です。";
                text = text.replaceAll(
                  email,
                  `<span data-email-text="${encode(email)}">[email protected]</span><noscript>${help}</noscript>`,
                );
              }
              edits.push({
                start: location.startOffset,
                end: location.endOffset,
                text,
              });
            }
            for (const child of node.childNodes ?? []) visit(child);
            if (node.content) visit(node.content);
          };
          visit(parse(html, { sourceCodeLocationInfo: true }));
          if (!edits.length) continue;
          // Work backwards so source locations stay valid. Preserve the rest
          // of Astro's HTML exactly, including island props and inline scripts.
          let output = html;
          for (const { start, end, text } of edits.sort(
            (a, b) => b.start - a.start,
          )) {
            output = output.slice(0, start) + text + output.slice(end);
          }
          output = output.replace(
            "</head>",
            '<script src="/email-decode.js" defer></script></head>',
          );
          if (addresses.some((email) => output.includes(email))) {
            throw new Error(`${file}: unencoded email remains in HTML`);
          }
          writeFileSync(path, output);
        }
        // Fail the build if browser code imports the full site settings, or
        // an unsupported attribute leaks an address. Workers Builds must not
        // depend on a separate test run to catch these regressions.
        for (const file of readdirSync(root, { recursive: true })) {
          if (!/\.(html|js)$/.test(file)) continue;
          const content = readFileSync(join(root, file), "utf8");
          if (addresses.some((email) => content.includes(email))) {
            throw new Error(
              `${file}: unencoded email remains in published output`,
            );
          }
        }
      },
    },
  };
}
