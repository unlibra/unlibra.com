// Tests for the donate page (/donate): the address to send an Amazon e-gift
// card to, a button that copies it, and links to both donation methods. Run after
// `npm run build`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, globSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
if (!existsSync(join(dist, "index.html"))) {
  throw new Error("dist/ not found. Run `npm run build` before `npm test`.");
}

const { site } = await import("../src/config/site.ts");
const page = readFileSync(join(dist, "donate/index.html"), "utf8");
const main = page.match(/<main[\s>][\s\S]*?<\/main>/)[0];

test("the donation settings: GitHub Sponsors, the address and the Amazon e-gift card", () => {
  assert.deepEqual(site.donation, {
    githubSponsors: "https://github.com/sponsors/unlibra",
    email: "gift@unlibra.com",
    amazonGift: "https://www.amazon.co.jp/dp/B06X1GVMW7?gpo=500",
  });
  assert.equal(site.links.sponsor, undefined);
});

test("the page shows the address and a button that copies it", () => {
  assert.match(main, /<h1[^>]*>寄付・支援<\/h1>/);
  assert.match(
    main,
    /サイトの運営や制作活動を応援していただける方は、GitHub SponsorsまたはAmazonギフトカードで支援できます。/,
  );
  assert.match(main, /アドレスを入力してください。金額は自由です。/);
  // Two steps: copy the address, then buy the gift card.
  assert.deepEqual(
    [...main.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map((m) => m[1].trim()),
    ["GitHub Sponsors", "Amazonギフトカード"],
  );
  assert.deepEqual(
    [...main.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/g)].map((m) =>
      m[1].replace(/<[^>]*>/g, "|").replace(/\s+/g, ""),
    ),
    // The number in its circle, then the step.
    ["|1|送付先メールアドレスをコピー", "|2|Amazonでギフトカードを購入"],
  );
  assert.doesNotMatch(main, /unlibra の/);
  // The password generator's field: the address in monospace, with the
  // shared copy button (src/components/ui/copy-button.tsx) at its right.
  assert.match(
    main,
    /<div[^>]*\bfont-mono\b[^>]*data-donate-email[^>]*>\s*gift@unlibra\.com\s*<\/div>/,
  );
  const button = main.match(/<button[^>]*>[\s\S]*?<\/button>/)[0];
  assert.match(button, /type="button"/);
  assert.match(button, /\bbg-primary\b/);
  // The name contains the label on screen (WCAG 2.5.3), as on the password
  // generator.
  assert.match(button, /aria-label="メールアドレスをクリップボードにコピー"/);
  assert.match(button, />コピー</);
});

test("Scrape Shield: the address is text only, never in an attribute", () => {
  // Cloudflare's Email Address Obfuscation hides addresses in the text but
  // leaves attributes (and so the island's props) as they are.
  assert.equal(page.match(/gift@unlibra\.com/g).length, 1);
  assert.doesNotMatch(page, /="[^"]*gift@unlibra\.com/);
});

test("the page links to the Amazon e-gift card in a new tab, drawn as a button", () => {
  const links = [...main.matchAll(/<a\s[^>]*>/g)].map((m) => m[0]);
  assert.equal(links.length, 2);
  const link = links.find((tag) => tag.includes(site.donation.amazonGift));
  // gpo fills in ¥500 on Amazon's page (the amount can be changed there).
  assert.match(
    link,
    /href="https:\/\/www\.amazon\.co\.jp\/dp\/B06X1GVMW7\?gpo=500"/,
  );
  assert.match(link, /target="_blank"/);
  assert.match(link, /rel="noopener noreferrer"/);
  assert.match(link, /\bdata-button\b/);
  assert.match(main, />\s*Amazonでギフトカードを選ぶ\s*</);
});

test("the page links to GitHub Sponsors in a new tab, drawn as a button", () => {
  const link = main.match(
    /<a\s[^>]*href="https:\/\/github\.com\/sponsors\/unlibra"[^>]*>[\s\S]*?<\/a>/,
  )[0];
  assert.match(link, /target="_blank"/);
  assert.match(link, /rel="noopener noreferrer"/);
  assert.match(link, /\bdata-button\b/);
  assert.match(link, />\s*GitHub Sponsorsで支援する\s*</);
});

test("the page is like the privacy policy: Japanese, canonical, in the sitemap", () => {
  assert.match(page, /<html lang="ja"/);
  assert.match(
    page,
    /<link rel="canonical" href="https:\/\/unlibra\.com\/donate">/,
  );
  assert.match(
    readFileSync(join(dist, "sitemap-0.xml"), "utf8"),
    /<loc>https:\/\/unlibra\.com\/donate<\/loc>/,
  );
  assert.match(page, /<title>寄付・支援 - unlibra<\/title>/);
});

test("no page links to OFUSE any more", () => {
  for (const file of globSync("**/*.html", { cwd: dist })) {
    assert.doesNotMatch(
      readFileSync(join(dist, file), "utf8"),
      /ofuse\.me/,
      file,
    );
  }
});
