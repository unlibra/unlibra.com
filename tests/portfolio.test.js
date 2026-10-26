// Integration tests for the portfolio top page (Phase 3) against dist/.
// Run `npm run build` before `npm test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, globSync, readFileSync } from "node:fs";
import { dirname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");

if (!existsSync(join(dist, "index.html"))) {
  throw new Error("dist/ not found. Run `npm run build` before `npm test`.");
}

const readDist = (path) => readFileSync(join(dist, path), "utf8");
const attr = (tag, name) => tag.match(new RegExp(`${name}="([^"]*)"`))?.[1];
const hrefs = (html) =>
  [...html.matchAll(/<a\s[^>]*>/g)].map((m) => attr(m[0], "href"));
/** Text content with tags removed. */
const text = (html) => html.replace(/<[^>]*>/g, "").trim();

const SHOP = "https://unlibra-vrc.booth.pm/";
/** The BOOTH product added in ui-revise3 (the user's instruction). */
const MURURU_ITEM = "https://unlibra-vrc.booth.pm/items/9009879";
/** Section IDs (anchors) and headings, as written in the HTML. */
const CATEGORIES = [
  ["keyboards", "DIY Keyboards"],
  ["libraries", "Libraries"],
  ["apps", "Apps"],
  ["vr-3d", "VR &amp; 3D"],
];
/** The DIY keyboard whose card opens nothing (ui-revise9 3). */
const PLAIN = "prototypes";
// Display order (ui-revise14: SVG Optimizer first).
const TOOLS = ["svg-optimizer", "favicon-generator", "password-generator"];
/** The Apps in order: Just HEX (at /hex, the large card) first, then the tools. */
const APPS = ["just-hex", ...TOOLS];
const appPath = (app) => (app === "just-hex" ? "/hex" : `/lab/${app}`);

/**
 * The former arrows (Heroicons "arrow-up-right" until ui-revise5 6, Lucide
 * "move-up-right" until ui-revise7 8'), the arrow since ui-revise7 8' (a
 * path of Tabler Icons "arrow-up-right") and the chevrons (Heroicons and
 * Tabler Icons "chevron-right").
 */
const FORMER_ARROWS = [
  "m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25",
  'd="M19 5L5 19"',
];
const ARROW = 'd="M17 7l-10 10"';
const CHEVRONS = ["m8.25 4.5 7.5 7.5-7.5 7.5", 'd="M9 6l6 6l-6 6"'];
/** The paths of an SVG, without the invisible bounding box of Tabler Icons. */
const svgPaths = (svg) =>
  [...svg.matchAll(/\sd="([^"]+)"/g)]
    .map((m) => m[1])
    .filter((d) => d !== "M0 0h24v24H0z");

const top = readDist("index.html");
const { cardKind, cardStyles } = await import("../src/config/cards.ts");

/** The <section id="..."> of a category on the top page. */
const sectionOf = (id) => {
  const sections = top.match(
    new RegExp(`<section[^>]*\\sid="${id}"[\\s\\S]*?</section>`, "g"),
  );
  assert.equal(sections?.length, 1, `section #${id} count`);
  return sections[0];
};

/** Work cards (<article>) in a piece of HTML. */
const cardsOf = (html) =>
  [...html.matchAll(/<article\s[^>]*>[\s\S]*?<\/article>/g)].map((m) => m[0]);

/** The detail dialog of a work. */
const dialogOf = (id) => {
  const dialogs = top.match(
    new RegExp(
      `<dialog[^>]*\\sdata-work-dialog="${id}"[\\s\\S]*?</dialog>`,
      "g",
    ),
  );
  assert.equal(dialogs?.length, 1, `dialog of ${id} count`);
  return dialogs[0];
};

test("D2: the top page has the four category sections in order (ui-revise2 6)", () => {
  const ids = [...top.matchAll(/<section[^>]*\sid="([^"]+)"/g)].map(
    (m) => m[1],
  );
  assert.deepEqual(
    ids,
    CATEGORIES.map(([id]) => id),
  );
  for (const [id, label] of CATEGORIES) {
    const heading = sectionOf(id).match(/<h2[^>]*>([\s\S]*?)<\/h2>/);
    assert.equal(text(heading[1]), label, `#${id} heading`);
    assert.ok(cardsOf(sectionOf(id)).length > 0, `#${id} has works`);
  }
  // The former names are gone from the page (except in the works' texts).
  const page = top
    .match(/<body[\s\S]*<\/body>/)[0]
    .replace(/<dialog[\s\S]*?<\/dialog>/g, "");
  assert.doesNotMatch(page, /WEBツール|ソフトウェア|VRChat/);
  for (const id of ["keyboard", "software", "web", "vrchat"]) {
    assert.doesNotMatch(top, new RegExp(`id="${id}"|href="/#${id}"`), id);
  }
});

test("D2: the header links to each category section (ui-revise2 1, 6)", () => {
  const header = top.match(/<header[\s>][\s\S]*?<\/header>/)[0];
  const nav = header.match(/<ul[^>]*data-category-nav[\s\S]*?<\/ul>/)[0];
  const items = [...nav.matchAll(/<a\s[^>]*>([\s\S]*?)<\/a>/g)].map((m) => [
    attr(m[0], "href"),
    text(m[1]),
  ]);
  assert.deepEqual(
    items,
    CATEGORIES.map(([id, label]) => [`/#${id}`, label]),
  );
  assert.doesNotMatch(nav, /<button[\s>]/);
  // Every section a header link points to exists.
  for (const [id] of CATEGORIES) sectionOf(id);
});

test("ui-revise 4: the category buttons are gone from the top page", () => {
  const main = top.match(/<main[\s>][\s\S]*?<\/main>/)[0];
  assert.doesNotMatch(main, /href="#/);
  assert.doesNotMatch(main, /<nav[\s>]/);
});

test("ui-revise3 1, ui-revise4 1, ui-revise5 1, ui-revise7 4: the hero has the h1 in the body font and the GitHub and BOOTH text buttons with their logos, without the symbol", () => {
  const hero = top.match(/<div[^>]*data-hero[\s\S]*?<\/ul>/)[0];
  // The wave; the brand symbol is gone (ui-revise4 1).
  assert.match(hero, /viewBox="0 0 1440 320"/);
  assert.doesNotMatch(hero, /viewBox="0 0 512 512"/);
  // The main text is the page's only h1, in the body font (no font-brand,
  // not a logotype).
  // The text is in parts since ui-revise13 (the colors of "昼" and "夜").
  const h1 = hero.match(/<h1([^>]*)>([\s\S]*?)<\/h1>/);
  assert.equal(text(h1[2]), "昼はカフェ。夜はバー。");
  assert.doesNotMatch(h1[1], /font-brand|data-logotype/);
  // 28px (1.75rem) at every width (ui-revise5; text-2xl since ui-revise4 1),
  // with a 44px line (ui-revise7 7).
  const sizes = attr(`<h1${h1[1]}>`, "class")
    .split(/\s+/)
    .filter((name) =>
      /(^|:)text-(xs|sm|base|lg|\dxl|\[[^\]]+\])(\/\S+)?$/.test(name),
    );
  assert.deepEqual(sizes, ["text-[1.75rem]/11"]);
  assert.equal(top.match(/<h1[\s>]/g).length, 1);
  // The former logotype and subtitle are gone.
  assert.doesNotMatch(hero, />\s*unlibra\s*</);
  assert.ok(!top.includes("昼はカフェ、夜はバー。"));
  // The buttons below the text: GitHub and BOOTH (site.links), new tabs.
  const links = hero.slice(hero.indexOf("</h1>"));
  // The GitHub mark as in the former footer (GitHubIcon.astro), and
  // a box (chosen in ui-revise5; Tabler Icons "box" from @tabler/icons
  // since ui-revise7 8') as it is in the package.
  assert.match(links, /viewBox="0 0 98 96"[^>]*data-icon="github"/);
  const tablerBox = readFileSync(
    join(root, "node_modules/@tabler/icons/icons/outline/box.svg"),
    "utf8",
  );
  const bag = links.match(/<svg[^>]*data-icon="box"[\s\S]*?<\/svg>/)[0];
  assert.deepEqual(svgPaths(bag), svgPaths(tablerBox));
  assert.equal(svgPaths(bag).length, 4);
  const anchors = [...links.matchAll(/<a\s[^>]*>([\s\S]*?)<\/a>/g)];
  assert.deepEqual(
    anchors.map((m) => [text(m[1]), attr(m[0], "href")]),
    [
      ["GitHub", "https://github.com/unlibra"],
      ["BOOTH", SHOP],
    ],
  );
  for (const [i, [tag, inner]] of anchors.entries()) {
    assert.match(tag, /target="_blank"/);
    assert.match(tag, /rel="noopener noreferrer"/);
    // Text buttons (pattern A, ui-revise5 1): the logo, then the text; no
    // up-right arrow, and without the former pill's background and ring.
    // GitHub has its mark, BOOTH a box (not BOOTH's logo).
    const icons = [...inner.matchAll(/<svg[^>]*data-icon="([^"]+)"/g)];
    assert.deepEqual(
      icons.map((m) => m[1]),
      [["github", "box"][i]],
      tag,
    );
    assert.ok(inner.trim().startsWith("<svg"), `${tag}: the logo first`);
    assert.ok(!tag.includes(ARROW), tag);
    const cls = attr(tag, "class").split(/\s+/);
    assert.ok(
      !cls.some((name) => /^(dark:)?(bg-|ring-|rounded-full)/.test(name)),
      tag,
    );
    // ui-revise7 4: the text is 16px (text-base, no longer text-sm).
    assert.ok(cls.includes("text-base"), tag);
    assert.ok(!cls.includes("text-sm"), tag);
  }
});

test('ui-revise13 2, 3: the hero\'s background is in the theme colors, and the catch copy colors only "昼" (light) and "夜" (dark)', () => {
  const hero = top.match(/<div[^>]*data-hero[\s\S]*?<\/ul>/)[0];
  const background = hero.match(/class="([^"]*bg-linear-to-b[^"]*)"/)[1];
  for (const name of [
    "from-white/0",
    "from-3%",
    "via-sora/60",
    "to-sora-deep/80",
  ]) {
    assert.ok(background.split(/\s+/).includes(name), name);
  }
  const h1 = hero.match(/<h1([^>]*)>([\s\S]*?)<\/h1>/);
  // The 0.5em on the left is kept (ui-revise11).
  assert.ok(attr(`<h1${h1[1]}>`, "class").split(/\s+/).includes("pl-[0.5em]"));
  const spans = [...h1[2].matchAll(/<span([^>]*)>([^<]*)<\/span>/g)].map(
    ([, attrs, inner]) => ({
      part: attr(attrs, "data-catch-copy"),
      classes: attr(attrs, "class").split(/\s+/),
      text: inner,
    }),
  );
  assert.deepEqual(spans, [
    {
      part: "day",
      classes: ["text-catch-day", "dark:text-inherit"],
      text: "昼",
    },
    { part: "night", classes: ["dark:text-catch-night"], text: "夜" },
  ]);
  // No space between the parts: the text reads as one line.
  assert.equal(text(h1[2]), "昼はカフェ。夜はバー。");
  assert.doesNotMatch(h1[2], /aria-|role=/);
});

test("ui-revise 3: no page has sponsor or share buttons; the footer links to the donate page", () => {
  const pages = globSync("**/*.html", { cwd: dist });
  assert.ok(pages.length >= 9, "self-check of the page list");
  for (const page of pages) {
    const html = readDist(page);
    if (page === "404.html") {
      // No footer since not-found, and no sponsor or share button either.
      assert.doesNotMatch(html, /<footer[\s>]|ofuse\.me|navigator\.share/);
      continue;
    }
    const footer = html.match(/<footer[\s>][\s\S]*?<\/footer>/)[0];
    let rest = html.replace(footer, "");
    if (page.split(sep).join("/") === "hex/index.html") {
      // The one exception (the user's requests, docs/decisions/just-hex):
      // Just HEX's dock on the color screen, and the share dialog of its top
      // page (JH-16), have "Share on X", whose link is set by the script.
      // The rest of the page has none.
      const dock = rest.match(/<div[^>]*data-hex-dock[\s\S]*?<\/div>/)[0];
      assert.match(dock, /data-hex-share/);
      const dialog = rest.match(
        /<dialog[^>]*data-hex-dialog[\s\S]*?<\/dialog>/,
      )[0];
      assert.match(dialog, /data-hex-dialog-x/);
      rest = rest.replace(dock, "").replace(dialog, "");
    }
    for (const href of hrefs(rest)) {
      assert.doesNotMatch(
        href,
        /ofuse\.me|twitter\.com\/intent|x\.com\/intent/,
        page,
      );
    }
    assert.doesNotMatch(
      rest,
      /navigator\.share|スポンサー|シェアする|ポストする/,
      page,
    );
    assert.ok(hrefs(footer).includes("/donate"), page);
  }
  assert.equal(
    existsSync(join(root, "src/components/SponsorButton.astro")),
    false,
  );
});

test("ui-revise 5, ui-revise3 1: the only GitHub link in main is the hero's button", () => {
  const main = top.match(/<main[\s>][\s\S]*?<\/main>/)[0];
  const hero = main.match(/<div[^>]*data-hero[\s\S]*?<\/ul>/)[0];
  assert.deepEqual(
    hrefs(main).filter((href) => href.includes("github.com")),
    ["https://github.com/unlibra"],
  );
  assert.ok(hrefs(hero).includes("https://github.com/unlibra"));
});

/** The <a> elements in a piece of HTML (`tag`), with their text. */
const linksIn = (html) =>
  [...html.matchAll(/<a\s[^>]*>([\s\S]*?)<\/a>/g)].map((m) => ({
    tag: m[0],
    label: text(m[1]),
    href: attr(m[0], "href"),
  }));

/** A card's title link (the cards that go to a link), or undefined. */
const titleLinkOf = (card) =>
  linksIn(card.match(/<h3[^>]*>([\s\S]*?)<\/h3>/)[1])[0];

/** The <a> elements of a card's actions (outside the title). */
const actionsOf = (card) =>
  linksIn(card.replace(/<h3[\s\S]*?<\/h3>/, "")).filter(({ tag }) =>
    /data-work-action/.test(tag),
  );

test("D3, ui-revise4 2: each app card links to its tool, in the same tab", () => {
  const cards = cardsOf(sectionOf("apps"));
  assert.deepEqual(
    cards.map((card) => attr(card, "data-work")),
    APPS,
  );
  for (const [i, card] of cards.entries()) {
    const link = titleLinkOf(card);
    assert.equal(link.href, appPath(APPS[i]), APPS[i]);
    // Internal links open in the same tab.
    assert.doesNotMatch(link.tag, /target=/, APPS[i]);
  }
});

test("D3: each app card shows the tool's icon, and the file is in dist/", () => {
  // The tool list pages checked the icons until ui-revise removed them.
  const cards = cardsOf(sectionOf("apps"));
  for (const [i, card] of cards.entries()) {
    const imgs = card.match(/<img\s[^>]*>/g) ?? [];
    assert.equal(imgs.length, 1, `${APPS[i]}: icon count`);
    const src = attr(imgs[0], "src");
    assert.match(
      src,
      new RegExp(`^/_astro/${APPS[i]}\\.[\\w-]+\\.svg$`),
      `${APPS[i]}: icon`,
    );
    assert.ok(existsSync(join(dist, src.slice(1))), `${APPS[i]}: ${src}`);
  }
});

test("ui-revise4 2, ui-revise6 2: the Apps cards have the former tool site's names, and summaries shortened from its card texts", () => {
  // liblab frontend/src/messages/ja/tools.ts: the tool's name, and its
  // description, which the former tool cards showed without the line breaks
  // (tool-card.tsx replaces /\r?\n/g with ''). Since ui-revise6 2 the
  // summaries are shorter (about two lines; the E2E counts the lines).
  const liblab = {
    "favicon-generator": [
      "Faviconジェネレーター",
      "無料のFavicon一括生成ツール。PNG、JPEG、SVGなどの画像をアップロードするだけで、Webサイトに必要な全サイズのFaviconとApple Touch Iconを自動生成。\n角丸加工や背景色の設定もブラウザ上で簡単に完了します。",
    ],
    "svg-optimizer": [
      "SVGオプティマイザー",
      "無料のSVG最適化・圧縮ツール。品質を保ったままファイルサイズを削減し、Webサイトの読み込み速度を改善。\nブラウザ上で完結するため、セキュアで高速に最適化できます。",
    ],
    "password-generator": [
      "パスワードジェネレーター",
      "無料の強力なパスワード生成ツール。文字数、大文字・小文字・数字・記号を自由に組み合わせて、セキュアなパスワードを作成。\n紛らわしい文字の除外にも対応し、ブラウザ完結で安全です。",
    ],
  };
  for (const card of cardsOf(sectionOf("apps"))) {
    const work = attr(card, "data-work");
    // Just HEX is new (not from the former tool site).
    if (work === "just-hex") continue;
    const [name, description] = liblab[work];
    const title = card.match(/<span id="work-[^"]+-name">([^<]*)<\/span>/)[1];
    assert.equal(title, name, work);
    const summary = card.match(/<p[^>]*data-work-summary[^>]*>([^<]*)<\/p>/)[1];
    assert.notEqual(summary.trim(), "", work);
    assert.ok(
      summary.length < description.replace(/\r?\n/g, "").length,
      `${work}: not shortened`,
    );
  }
});

test("ui-revise4 2: VR & 3D has the real product only, without subcategories or dummies", () => {
  const section = sectionOf("vr-3d");
  const cards = cardsOf(section);
  assert.deepEqual(
    cards.map((card) => attr(card, "data-work")),
    ["mururu-blink-lipsync"],
  );
  // No subcategory label or attribute anywhere on the page. The footer's
  // description (the owner's words, ui-revise6 1) names VR avatars and 3D
  // assets, which are not labels: that paragraph only is left out. So is the
  // product's summary (the owner's words, ui-revise8 3), which calls it a
  // Unity tool.
  assert.doesNotMatch(top, /data-subcategory/);
  const footer = top.match(/<footer[\s>][\s\S]*?<\/footer>/)[0];
  const description = footer.match(/<p class="mt-3[^"]*">[^<]*<\/p>/);
  assert.ok(description?.[0].includes("VRアバター"), "self-check");
  const summary = cards[0].match(/<p[^>]*data-work-summary[^>]*>[^<]*<\/p>/);
  assert.ok(summary?.[0].includes("Unityツール"), "self-check");
  const body = text(
    top
      .match(/<body[\s\S]*<\/body>/)[0]
      .replace(footer, footer.replace(description[0], ""))
      .replace(summary[0], ""),
  );
  for (const label of ["アバター", "アセット", "Unityツール", "ダミー"]) {
    assert.ok(!body.includes(label), label);
  }
  assert.ok(!existsSync(join(root, "src/assets/works/dummy.svg")));
  assert.equal(globSync("_astro/dummy*", { cwd: dist }).length, 0);
  // No subcategory in the data or the messages.
  const works = readFileSync(join(root, "src/config/works.ts"), "utf8");
  const ja = readFileSync(join(root, "src/messages/ja.ts"), "utf8");
  for (const source of [works, ja]) {
    assert.doesNotMatch(source, /subcategor|dummy/i);
  }
  // No shop link outside the cards (it was beside the heading until
  // ui-revise3).
  const outside = section.replace(/<article[\s\S]*?<\/article>/g, "");
  assert.ok(outside.includes('id="vr-3d-heading"'), "self-check");
  assert.deepEqual(hrefs(outside), [], "links outside the cards");
  assert.ok(!top.includes("BOOTH ショップ"));
});

test("ui-revise3 (user), ui-revise4 2, ui-revise5 5, ui-revise7 1 2, ui-revise8 3: the BOOTH product: its card, links and image", () => {
  const work = "mururu-blink-lipsync";
  const card = cardsOf(sectionOf("vr-3d"))[0];
  assert.equal(attr(card, "data-work"), work);
  assert.equal(attr(card, "data-card"), "frame");
  const title = "【ムルル対応】まばたき＆リップシンク追加ツール";
  assert.match(
    card,
    new RegExp(`<span id="work-${work}-name">${title}</span>`),
  );
  assert.match(
    card,
    /<p[^>]*data-work-summary[^>]*>ムルルに、ユーザーの声に合わせて自然に口が動くリップシンク機能とまばたき機能を追加するUnityツールです。<\/p>/,
  );
  // The card goes to the item on BOOTH, in a new tab. The text links are
  // "BOOTH で見る" (where the card goes) and the documentation (ui-revise5 5).
  const link = titleLinkOf(card);
  assert.equal(link.href, MURURU_ITEM);
  assert.match(link.tag, /target="_blank"/);
  assert.match(link.tag, /rel="noopener noreferrer"/);
  assert.deepEqual(
    actionsOf(card).map(({ label, href }) => [label, href]),
    [
      ["BOOTH で見る", MURURU_ITEM],
      ["ドキュメント", "https://docs.unlibra.com/mururu-blink-lipsync/"],
    ],
  );
  assert.doesNotMatch(top, new RegExp(`data-work-dialog="${work}"`));

  // The image: the file from the third-party directory (LICENSE section 3),
  // 1200x900 (ui-revise7 1), cropped around its center like every photo.
  const source = join(
    root,
    "src/assets/works/third-party/mururu-blink-lipsync.webp",
  );
  assert.ok(existsSync(source));
  const img = card.match(/<img\s[^>]*>/)[0];
  const src = attr(img, "src");
  assert.match(src, /^\/_astro\/mururu-blink-lipsync\.[\w-]+\.webp$/);
  assert.ok(existsSync(join(dist, src.slice(1))), src);
  assert.equal(attr(img, "width"), "1200");
  assert.equal(attr(img, "height"), "900");
  assert.ok(attr(img, "class").split(/\s+/).includes("object-center"), img);
});

test("ui-revise8 3: the cards' summaries; none says it runs in the browser", () => {
  const summaries = Object.fromEntries(
    cardsOf(top).map((card) => [
      attr(card, "data-work"),
      card.match(/<p[^>]*data-work-summary[^>]*>([^<]*)<\/p>/)[1],
    ]),
  );
  const expected = {
    "svg-optimizer":
      "品質を保ったままSVGのファイルサイズを削減し、Webサイトの読み込みを速くします。",
    "password-generator":
      "文字数や文字の種類を選んで、強力なパスワードを生成。紛らわしい文字の除外にも対応しています。",
    "tkinter-unblur":
      "Windows で Tkinter のアプリがぼやけて表示される問題をシンプルに解決する Python ライブラリです。",
    "mururu-blink-lipsync":
      "ムルルに、ユーザーの声に合わせて自然に口が動くリップシンク機能とまばたき機能を追加するUnityツールです。",
  };
  for (const [work, summary] of Object.entries(expected)) {
    assert.equal(summaries[work], summary, work);
  }
  assert.ok(Object.keys(summaries).length > 10, "self-check");
  for (const [work, summary] of Object.entries(summaries)) {
    assert.ok(!summary.includes("ブラウザ"), `${work}: ${summary}`);
  }
});

test("ui-revise8 4: Libraries has @i18n-tiny/react after @i18n-tiny/next, with the npm image", () => {
  const cards = cardsOf(sectionOf("libraries"));
  assert.deepEqual(
    cards.map((card) => attr(card, "data-work")),
    // tkinter-unblur first since ui-revise14
    ["tkinter-unblur", "i18n-tiny-astro", "i18n-tiny-next", "i18n-tiny-react"],
  );
  const card = cards[3];
  assert.match(
    card,
    /<span id="work-i18n-tiny-react-name">@i18n-tiny\/react<\/span>/,
  );
  assert.match(
    card,
    /<p[^>]*data-work-summary[^>]*>依存ゼロ・型安全・最小構成で、React のアプリを多言語化できる1KB未満のi18nライブラリです。<\/p>/,
  );
  // The same image as the other npm libraries.
  const image = (c) => attr(c.match(/<img\s[^>]*>/)[0], "src");
  // cards[0] is tkinter-unblur (PyPI) since ui-revise14.
  assert.match(image(cards[1]), /\/npm\.[\w-]+\.svg$/);
  assert.equal(image(cards[2]), image(cards[1]));
  assert.equal(image(card), image(cards[1]));
});

test("ui-revise9 1, 2, 4: the i18n-tiny and DIY Keyboards summaries and the keyboards' descriptions are the user's texts", () => {
  const summaryOf = (work) =>
    cardsOf(top)
      .find((card) => attr(card, "data-work") === work)
      .match(/<p[^>]*data-work-summary[^>]*>([^<]*)<\/p>/)[1];
  const i18n = (framework, kind) =>
    `依存ゼロ・型安全・最小構成で、${framework} の${kind}を多言語化できる1KB未満のi18nライブラリです。`;
  const summaries = {
    "i18n-tiny-astro": i18n("Astro", "サイト"),
    "i18n-tiny-next": i18n("Next.js", "アプリ"),
    "i18n-tiny-react": i18n("React", "アプリ"),
    "fosty-natural":
      "HHKB配列を40%キーボードに落とし込み、美しいデザインと打鍵感を両立したエンドゲームキーボード。",
    "fosty-dark": "fosty naturalのアナザーカラー。もうひとつのエンドゲーム。",
    "mira-zero": "はじめて基板・ケースともに自作した思い出の分割キーボード。",
    prototypes:
      "エンドゲームに行き着くまでに生まれた、数々のプロトタイプキーボードたち...。",
    // ui-revise11 (2026-10-23, the user's wording)
    "favicon-generator":
      "画像からファビコンとApple Touch Iconを一括生成。角丸や背景色も設定できます。",
  };
  for (const [work, summary] of Object.entries(summaries)) {
    assert.equal(summaryOf(work), summary, work);
  }
  assert.ok(!top.includes("必要な機能だけを小さくまとめています"));

  const descriptionOf = (work) =>
    dialogOf(work).match(/<p[^>]*data-work-description[^>]*>([^<]*)<\/p>/)[1];
  const descriptions = {
    "fosty-dark": [
      "fosty naturalのアナザーカラー。40%ロープロキーボード。",
      "fosty naturalの持っている打鍵感・携帯性・配列・デザインはそのままに、黒いデスクに映えるブラック×オレンジという配色に合わせた特別な構成のキースイッチでカスタム。",
      "「黒も欲しくなった」ことをきっかけに制作した、もうひとつのエンドゲーム。",
    ],
    "fosty-natural": [
      "HHKBの特徴的な配列を40%キーボードに落とし込んだ、ロープロファイル（Choc V2）キーボード。",
      "HHKBのJust60キーに対してJust40キーとなるようにしたのもこだわりポイント。",
      "アルミ削り出しの筐体と無駄のない薄型設計による美しいデザイン、ガスケットマウントによる心地よい打鍵感、そして一体型レイアウトによる携帯性と安定性を追求。",
      "白いデスクに映える白×シルバーの配色で、キースイッチまで統一したキメラスイッチを採用。",
      "打鍵感・携帯性・配列・デザインのバランスが理想形となり、自分の“エンドゲーム”と呼べる一台に仕上がっています。",
    ],
    "mira-zero": [
      "40%サイズの左右分割ロープロファイル（Choc V1）キーボード。",
      "はじめて基板から自作した初号機で、さまざまな技術を試す“プロトタイプ”として制作。",
    ],
  };
  for (const [work, lines] of Object.entries(descriptions)) {
    // The line breaks as the user wrote them (whitespace-pre-line).
    assert.equal(descriptionOf(work), lines.join("\n"), work);
  }
});

test("ui-revise9 3: prototypes (formerly 没キーボード) is a card without a link, a button, 詳しく見る, details or hover", async () => {
  const { cardHover } = await import("../src/components/works/card-classes.ts");
  const cards = cardsOf(sectionOf("keyboards"));
  assert.deepEqual(
    cards.map((card) => attr(card, "data-work")),
    ["fosty-natural", "fosty-dark", PLAIN, "mira-zero"],
  );
  const card = cards[2];
  // The title is plain text in the heading.
  assert.match(
    card,
    /<h3[^>]*data-work-title[^>]*><span id="work-prototypes-name">prototypes<\/span><\/h3>/,
  );
  assert.doesNotMatch(
    card,
    /<a[\s>]|<button[\s>]|tabindex|data-work-more|data-work-links|data-work-open|data-work-link|詳しく見る|cursor-pointer|after:absolute/,
  );
  // No hover (nor the hover on keyboard focus) on the card.
  const cls = attr(card.match(/<article[^>]*>/)[0], "class").split(/\s+/);
  for (const name of cardHover.split(/\s+/)) {
    assert.ok(!cls.includes(name), name);
  }
  assert.match(card, /<img[^>]*src="\/_astro\/prototypes\./);
  // No details.
  assert.doesNotMatch(
    top,
    /data-work-dialog="prototypes"|id="work-prototypes"/,
  );
  // The former name and id are gone from the page and the sources.
  assert.ok(!top.includes("没キーボード"));
  assert.doesNotMatch(top, /botsu/);
  for (const file of globSync("src/**/*", { cwd: root })) {
    assert.doesNotMatch(file, /botsu/, file);
    if (/\.(?:astro|ts|tsx|js|mjs|css|md|json)$/.test(file)) {
      const source = readFileSync(join(root, file), "utf8");
      assert.ok(!/botsu|没キーボード/.test(source), file);
    }
  }
});

test("ui-revise7 2: every photo is cropped around its center; nothing is cropped at an edge", () => {
  // The photos: the frame and featured cards' images and the dialogs'.
  const photos = [...top.matchAll(/<img\s[^>]*>/g)]
    .map(([img]) => img)
    .filter((img) => /\bobject-cover\b/.test(attr(img, "class")));
  const icons = photos.filter((img) => /\bscale-/.test(attr(img, "class")));
  const framed = photos.filter((img) => !icons.includes(img));
  assert.ok(
    framed.some((img) => /mururu-blink-lipsync/.test(img)) &&
      framed.length > cardsOf(sectionOf("keyboards")).length,
    "self-check: the cards' and the dialogs' photos are found",
  );
  for (const img of framed) {
    assert.ok(attr(img, "class").split(/\s+/).includes("object-center"), img);
  }
  // No edge or corner as the crop position anywhere: the sources and the
  // built pages. (Not the built CSS: Tailwind also generates the classes
  // named in the docs, which is harmless while no element uses them.)
  // Nor any other crop position: an arbitrary value (object-[50%_0%]) or
  // object-position in a style (review of ui-revise7).
  const edge =
    /\bobject-(?:top|bottom|left|right)\b|\bobject-\[|object-position|objectPosition/;
  const files = [
    ...globSync("src/**/*.{astro,ts,tsx,css}", { cwd: root }),
    ...globSync("dist/**/*.html", { cwd: root }),
  ];
  assert.ok(
    files.some((f) => f.endsWith(".html")),
    "self-check: dist",
  );
  for (const file of files) {
    const found = readFileSync(join(root, file), "utf8").match(edge);
    assert.equal(found, null, `${file}: ${found?.[0]}`);
  }
});

test("ui-revise4 2: every card has the same hover; no photo zooms and no card lifts", async () => {
  const { cardHover, featuredSurface } =
    await import("../src/components/works/card-classes.ts");
  // liblab tool-card.tsx: transition-colors hover:bg-gray-100
  // dark:hover:bg-atom-one-dark-light (and the same on keyboard focus).
  for (const name of [
    "transition-colors",
    "hover:bg-gray-100",
    "dark:hover:bg-atom-one-dark-light",
  ]) {
    assert.ok(cardHover.split(/\s+/).includes(name), name);
  }
  const cards = cardsOf(top);
  const kinds = new Set();
  for (const card of cards) {
    const work = attr(card, "data-work");
    kinds.add(attr(card, "data-card"));
    const cls = attr(card.match(/<article[^>]*>/)[0], "class").split(/\s+/);
    // The card that opens nothing has no hover (ui-revise9 3).
    if (work === PLAIN) {
      for (const name of cardHover.split(/\s+/)) {
        assert.ok(!cls.includes(name), `${work}: ${name}`);
      }
      continue;
    }
    // The large card has its own light gray surface, one step darker (or
    // lighter in dark mode) on hover, with the same transition (ui-revise5).
    const hover =
      attr(card, "data-card") === "featured" ? featuredSurface : cardHover;
    for (const name of hover.split(/\s+/)) {
      assert.ok(cls.includes(name), `${work}: ${name}`);
    }
    assert.ok(cls.includes("relative"), work);
    // No other hover: no lift, shadow or border change on the card, and no
    // zoom or transition on the photo.
    assert.ok(
      !cls.some((name) =>
        /translate|shadow|hover:border|^transition$/.test(name),
      ),
      work,
    );
    for (const img of card.match(/<img\s[^>]*>/g)) {
      // (The logos' static crop, scale-[2.25], is not a hover.)
      assert.doesNotMatch(attr(img, "class"), /hover:|transition/, work);
    }
  }
  assert.deepEqual([...kinds].sort(), ["featured", "frame", "tool"]);
  // The data has no flag for the zoom any more.
  const works = readFileSync(join(root, "src/config/works.ts"), "utf8");
  assert.doesNotMatch(works, /thirdPartyImage/);
});

test("ui-revise2 3: Apps and Libraries use the tool card, DIY Keyboards and VR & 3D the 4:3 frame", () => {
  assert.deepEqual(cardStyles, {
    keyboards: "frame",
    libraries: "tool",
    apps: "tool",
    "vr-3d": "frame",
  });
  for (const [id] of CATEGORIES) {
    for (const card of cardsOf(sectionOf(id))) {
      const work = attr(card, "data-work");
      if (attr(card, "data-card") === "featured") continue;
      assert.equal(attr(card, "data-card"), cardStyles[id], work);
      const imgs = card.match(/<img\s[^>]*>/g);
      assert.equal(imgs.length, 1, work);
      if (cardStyles[id] === "tool") {
        // The icon on its background: the cards' radius since ui-revise3,
        // a circle for Apps since ui-revise5 (6).
        const shape = id === "apps" ? "rounded-full" : "rounded-card";
        assert.match(card, new RegExp(`\\b${shape}\\b[^"]*"><img`), work);
        assert.doesNotMatch(card, /aspect-4\/3/, work);
      } else {
        assert.match(card, /<div class="aspect-4\/3[^"]*"><img/, work);
      }
    }
  }
});

test("ui-revise2 3: a featured work is a large card, chosen by the data", () => {
  // The function the page uses: `featured: true` makes any work large.
  for (const [id] of CATEGORIES) {
    assert.equal(cardKind({ category: id, featured: true }), "featured", id);
    assert.equal(cardKind({ category: id }), cardStyles[id], id);
  }
  // The page follows the data: fosty natural (the first DIY keyboard) and
  // Just HEX (the first app, the user's choice in just-hex JH-11).
  const featured = cardsOf(top).filter(
    (card) => attr(card, "data-card") === "featured",
  );
  assert.deepEqual(
    featured.map((card) => attr(card, "data-work")),
    ["fosty-natural", "just-hex"],
  );
  assert.equal(
    attr(cardsOf(sectionOf("keyboards"))[0], "data-work"),
    "fosty-natural",
  );
  assert.equal(attr(cardsOf(sectionOf("apps"))[0], "data-work"), "just-hex");
  // Full width, with the image and the summary side by side.
  const tag = featured[0].match(/<article[^>]*>/)[0];
  assert.match(attr(tag, "class"), /\bcol-span-full\b/);
  assert.match(attr(tag, "class"), /\bmd:grid-cols-2\b/);
  assert.match(featured[0], /<img[^>]*src="\/_astro\/fosty-natural\./);
});

test("ui-revise4 3: no card and no details show a year", () => {
  const main = top.match(/<main[\s>][\s\S]*?<\/main>/)[0];
  assert.doesNotMatch(main, /<time[\s>]/);
  for (const card of cardsOf(main)) {
    assert.doesNotMatch(text(card), /\b20\d\d\b/, attr(card, "data-work"));
  }
  for (const dialog of main.match(/<dialog[\s\S]*?<\/dialog>/g)) {
    assert.doesNotMatch(text(dialog), /\b20\d\d\b/);
  }
  const works = readFileSync(join(root, "src/config/works.ts"), "utf8");
  assert.doesNotMatch(works, /\byear\b/);
});

test("ui-revise2 3, ui-revise4 2, ui-revise9 3: the DIY Keyboards cards open their details, except prototypes; the other cards have none", () => {
  const cards = cardsOf(top);
  // 13 since ui-revise8 4 (@i18n-tiny/react), 12 since remove-tw-palette,
  // 13 with Just HEX.
  assert.equal(cards.length, 13, "self-check of the work count");
  const keyboards = new Set(
    cardsOf(sectionOf("keyboards")).map((card) => attr(card, "data-work")),
  );
  assert.equal(keyboards.size, 4, "self-check");
  // prototypes opens nothing (ui-revise9 3).
  assert.ok(keyboards.delete(PLAIN), "self-check: prototypes");
  const dialogs = [...top.matchAll(/<dialog[^>]*data-work-dialog="([^"]+)"/g)];
  assert.deepEqual(dialogs.map((m) => m[1]).sort(), [...keyboards].sort());
  for (const card of cards) {
    const work = attr(card, "data-work");
    // Card images are decorative: the title is the heading beside them.
    for (const img of card.match(/<img\s[^>]*>/g)) {
      // Astro writes an empty alt as a bare `alt`.
      assert.match(img, /\salt(="")?[\s>]/, work);
    }
    // The summary: one short line on the card.
    const summary = card.match(/<p[^>]*data-work-summary[^>]*>([^<]*)<\/p>/);
    assert.ok(summary, `${work}: summary`);
    assert.ok(summary[1].trim() !== "" && !summary[1].includes("\n"), work);

    if (!keyboards.has(work)) {
      // A link card, or the card that opens nothing: no button, no
      // "詳しく見る", no dialog.
      assert.doesNotMatch(card, /<button[\s>]|data-work-more|詳しく見る/, work);
      continue;
    }
    const dialog = dialogOf(work);
    // The title is the button that opens the dialog.
    const button = card.match(/<button[^>]*>([\s\S]*?)<\/button>/);
    const title = text(button[1]);
    assert.match(button[0], /type="button"/, work);
    assert.match(button[0], /aria-haspopup="dialog"/, work);
    assert.equal(attr(button[0], "aria-controls"), `work-${work}`, work);
    assert.match(button[0], /after:absolute after:inset-0/, work);
    // Its name is the title and the visible "詳しく見る" (WCAG 2.5.3).
    assert.equal(
      attr(button[0], "aria-labelledby"),
      `work-${work}-open work-${work}-more`,
      work,
    );
    assert.equal(attr(button[0], "id"), `work-${work}-open`, work);
    // "詳しく見る" opens the details, not a link: no arrow (ui-revise4 2).
    // Its text is in the span with the underline (ui-revise5 5).
    assert.match(
      card,
      new RegExp(
        `<p id="work-${work}-more"[^>]*aria-hidden="true"[^>]*data-work-more[^>]*>\\s*<span[^>]*data-link-text[^>]*>\\s*詳しく見る\\s*</span>\\s*</p>`,
      ),
      work,
    );
    assert.deepEqual(linksIn(card), [], `${work}: no links`);
    // The description (several lines) is in the details only.
    const description = dialog.match(
      /<p[^>]*data-work-description[^>]*>([^<]*)<\/p>/,
    )[1];
    assert.ok(description.length > summary[1].length, `${work}: description`);
    assert.ok(!card.includes(description.trim()), `${work}: not on the card`);

    // The dialog: closed, named by the work's title, with a close button,
    // and no links (DIY Keyboards have none).
    const open = dialog.match(/<dialog[^>]*>/)[0];
    assert.equal(attr(open, "id"), `work-${work}`, work);
    assert.doesNotMatch(open, /\sopen(?=[\s=>])/, work);
    const titleId = attr(open, "aria-labelledby");
    const heading = dialog.match(
      new RegExp(`<h2 id="${titleId}"[^>]*>([\\s\\S]*?)</h2>`),
    );
    assert.equal(text(heading[1]), title, work);
    assert.match(dialog, /<button[^>]*aria-label="閉じる"[^>]*data-work-close/);
    assert.deepEqual(linksIn(dialog), [], `${work}: dialog links`);
  }
});

test("ui-revise4 2, ui-revise5 9, 10, 11: a card goes to its first link; every link is an action, the first one first", () => {
  const npm = (name) => `https://www.npmjs.com/package/@i18n-tiny/${name}`;
  const docs = "https://docs.unlibra.com";
  // The actions, in order; the title link goes to the first.
  const expected = {
    "i18n-tiny-astro": [
      ["npm", npm("astro")],
      ["ドキュメント", `${docs}/i18n-tiny/astro/introduction`],
    ],
    "i18n-tiny-next": [
      ["npm", npm("next")],
      ["ドキュメント", `${docs}/i18n-tiny/next/introduction`],
    ],
    "i18n-tiny-react": [
      ["npm", npm("react")],
      ["ドキュメント", `${docs}/i18n-tiny/react/introduction`],
    ],
    "tkinter-unblur": [
      ["PyPI", "https://pypi.org/project/tkinter-unblur"],
      ["ドキュメント", `${docs}/tkinter-unblur/`],
    ],
    ...Object.fromEntries(
      APPS.map((app) => [app, [["アプリを開く", appPath(app)]]]),
    ),
    "mururu-blink-lipsync": [
      ["BOOTH で見る", MURURU_ITEM],
      ["ドキュメント", `${docs}/mururu-blink-lipsync/`],
    ],
  };
  const cards = cardsOf(top).filter(
    (card) => !cardsOf(sectionOf("keyboards")).includes(card),
  );
  assert.deepEqual(
    cards.map((card) => attr(card, "data-work")).sort(),
    Object.keys(expected).sort(),
  );
  for (const card of cards) {
    const work = attr(card, "data-work");
    const actions = expected[work];
    // The title is the link to the first action's place; its ::after
    // covers the card, so a click anywhere on the card goes there.
    const link = titleLinkOf(card);
    assert.equal(link.href, actions[0][1], work);
    assert.match(link.tag, /after:absolute after:inset-0/, work);
    assert.match(card, /<h3[^>]*data-work-title[^>]*><a\s/, work);
    assert.match(link.tag, new RegExp(`<span id="work-${work}-name">`), work);
    const found = actionsOf(card);
    assert.deepEqual(
      found.map(({ label, href }) => [label, href]),
      actions,
      work,
    );
    // The first action is marked as the card's own link (underlined on the
    // card's hover); the others are not.
    assert.deepEqual(
      found.map(({ tag }) => attr(tag, "data-work-action")),
      actions.map((_, i) => (i === 0 ? "primary" : "secondary")),
      work,
    );
    for (const { tag, href } of [link, ...found]) {
      if (href.startsWith("https://")) {
        assert.match(tag, /target="_blank"/, work);
        assert.match(tag, /rel="noopener noreferrer"/, work);
      } else {
        assert.doesNotMatch(tag, /target=/, work);
      }
    }
    for (const { tag } of found) {
      // In front of the title link's overlay, so that a click goes there
      // directly; described by the work's title.
      const cls = attr(tag, "class").split(/\s+/);
      assert.ok(cls.includes("relative") && cls.includes("z-10"), work);
      assert.equal(attr(tag, "aria-describedby"), `work-${work}-name`, work);
    }
  }
  // "ツールを使う" is gone (ui-revise5 9).
  assert.ok(!top.includes("ツールを使う"));
});

test("ui-revise5 5, 11: the links' text has the growing underline; the first link's also grows on the card's hover", async () => {
  const { linkText, actionText, primaryText } =
    await import("../src/components/works/card-classes.ts");
  // A 1px line under the text that grows from the left, and does not move
  // under prefers-reduced-motion: reduce.
  for (const name of [
    "bg-size-[0%_1px]",
    "bg-position-[0_100%]",
    "transition-[background-size]",
    "motion-reduce:transition-none",
  ]) {
    assert.ok(linkText.split(/\s+/).includes(name), name);
  }
  assert.ok(
    primaryText.split(/\s+/).includes("group-hover:bg-size-[100%_1px]"),
  );
  const has = (tag, list, what) => {
    const cls = attr(tag, "class").split(/\s+/);
    for (const name of list.split(/\s+/)) {
      assert.ok(cls.includes(name), `${what}: ${name}`);
    }
  };
  /** The <span data-link-text> in a piece of HTML. */
  const textOf = (html) => html.match(/<span[^>]*data-link-text[^>]*>/)[0];
  for (const card of cardsOf(top)) {
    const work = attr(card, "data-work");
    const actions = [
      ...card.matchAll(/<a\s[^>]*data-work-action="(\w+)"[\s\S]*?<\/a>/g),
    ];
    for (const [html, kind] of actions) {
      // No text-decoration underline; no arrow that moves.
      assert.doesNotMatch(attr(html, "class"), /underline/, work);
      assert.doesNotMatch(html, /translate/, work);
      const span = textOf(html);
      has(span, `${linkText} ${actionText}`, `${work} ${kind}`);
      assert.equal(
        attr(span, "class").includes("group-hover:bg-size"),
        kind === "primary",
        `${work} ${kind}`,
      );
    }
    // The first link: the action the card goes to, or "詳しく見る". The
    // card that opens nothing has none (ui-revise9 3).
    const more = card.match(/<p[^>]*data-work-more[\s\S]*?<\/p>/);
    if (work === PLAIN) assert.equal(more ?? actions[0], undefined, work);
    else if (more) has(textOf(more[0]), `${linkText} ${primaryText}`, work);
    else has(textOf(actions[0][0]), primaryText, work);
  }
});

test("ui-revise4 2, ui-revise5 2, 6, ui-revise7 8': the actions have the up-right arrow, not the chevron; the titles and 詳しく見る have none", () => {
  const main = top.match(/<main[\s>][\s\S]*?<\/main>/)[0];
  for (const chevron of CHEVRONS) {
    assert.ok(!main.includes(chevron), `no chevron in main: ${chevron}`);
  }
  // Tabler Icons "arrow-up-right" from @tabler/icons, in place of
  // Lucide "move-up-right" (ui-revise7 8') and Heroicons "arrow-up-right"
  // (ui-revise5 6).
  for (const former of FORMER_ARROWS) {
    assert.ok(!main.includes(former), `no former arrow: ${former}`);
  }
  assert.ok(
    !existsSync(join(root, "src/components/icons/MoveUpRightIcon.astro")),
  );
  const tabler = readFileSync(
    join(root, "node_modules/@tabler/icons/icons/outline/arrow-up-right.svg"),
    "utf8",
  );
  const icon = readFileSync(
    join(root, "src/components/icons/ArrowUpRightIcon.astro"),
    "utf8",
  );
  assert.deepEqual(svgPaths(icon), svgPaths(tabler));
  assert.ok(icon.includes(ARROW));
  assert.ok(
    !existsSync(join(root, "src/components/icons/ChevronRightIcon.astro")),
  );
  let links = 0;
  for (const card of cardsOf(main)) {
    const work = attr(card, "data-work");
    // No arrow (no icon at all) in the title (ui-revise5 2).
    const title = card.match(/<h3[^>]*>([\s\S]*?)<\/h3>/)[1];
    assert.doesNotMatch(title, /<svg/, `${work}: title`);
    for (const { tag } of actionsOf(card)) {
      // `tag` is the whole <a> element.
      assert.equal(tag.split(ARROW).length - 1, 1, `${work}: arrow`);
      // The size of the text: 16px (ui-revise7 7; 14px in ui-revise5 8).
      const svg = tag.match(/<svg[^>]*>/)[0];
      assert.ok(attr(svg, "class").split(/\s+/).includes("size-4"), work);
      links++;
    }
    const more = card.match(/<p[^>]*data-work-more[\s\S]*?<\/p>/);
    if (more) assert.doesNotMatch(more[0], /<svg/, `${work}: more`);
  }
  // 4 Libraries since ui-revise8 4, 3 Apps since remove-tw-palette, 4 with
  // Just HEX.
  assert.equal(links, 4 * 2 + 4 + 2, "self-check: the number of actions");
});

test("ui-revise3 3: the photo cards and the list items share the title, summary, link, radius and focus classes", async () => {
  const classes = await import("../src/components/works/card-classes.ts");
  const has = (tag, list, what) => {
    const cls = attr(tag, "class").split(/\s+/);
    for (const name of list.split(/\s+/)) {
      assert.ok(cls.includes(name), `${what}: ${name}`);
    }
  };
  const kinds = new Set();
  for (const card of cardsOf(top)) {
    const work = attr(card, "data-work");
    kinds.add(attr(card, "data-card"));
    has(card.match(/<h3[^>]*>/)[0], classes.cardTitle, `${work} title`);
    has(
      card.match(/<p[^>]*data-work-summary[^>]*>/)[0],
      classes.cardSummary,
      `${work} summary`,
    );
    const more = card.match(/<p[^>]*data-work-more[^>]*>/);
    if (more) has(more[0], classes.cardLink, `${work} more`);
    for (const { tag } of actionsOf(card)) {
      has(tag, classes.cardLink, `${work} action`);
      has(tag, classes.focusRing, `${work} action focus`);
    }
    // The photo cards and the list items have the card radius; the
    // Libraries' icon backgrounds too (the Apps' are circles, ui-revise5 6).
    has(card.match(/<article[^>]*>/)[0], classes.cardRadius, `${work} card`);
    if (attr(card, "data-card") === "tool") {
      has(
        card.match(/<div[^>]*>(?=<img)/)[0],
        TOOLS.includes(work) ? "rounded-full" : classes.cardRadius,
        `${work} icon`,
      );
    }
  }
  assert.deepEqual([...kinds].sort(), ["featured", "frame", "tool"]);
  assert.equal(classes.cardRadius, "rounded-card");
  // The token is one value in the theme.
  const css = readFileSync(join(root, "src/styles/global.css"), "utf8");
  assert.match(css, /--radius-card:\s*0\.5rem;/);
});

test("ui-revise3 3: the list items take the former tool site's card padding and icon color", () => {
  for (const id of ["libraries", "apps"]) {
    for (const card of cardsOf(sectionOf(id))) {
      const work = attr(card, "data-work");
      const cls = attr(card.match(/<article[^>]*>/)[0], "class").split(/\s+/);
      // tool-card.tsx: p-4 rounded-lg.
      assert.ok(cls.includes("p-4"), work);
    }
  }
  // The apps' icons (DiceBear "Blobs") have their own background, with no
  // color behind them (just-hex JH-11; on sora-deep at 70% before).
  for (const card of cardsOf(sectionOf("apps")).filter(
    // The list cards (the large card fills its frame: just-hex JH-14).
    (card) => attr(card, "data-card") !== "featured",
  )) {
    const frame = card.match(/<div[^>]*>(?=<img)/)[0];
    assert.doesNotMatch(attr(frame, "class"), /(^|\s)bg-/);
  }
});

test("ui-revise5 6, 7, 12: no card and no icon has a border or ring; the Apps' icons are circles", () => {
  const borderOrRing = /^(?:[\w-]+:)*(?:border|ring|outline)(?:-|$)/;
  for (const card of cardsOf(top)) {
    const work = attr(card, "data-work");
    const tag = card.match(/<article[^>]*>/)[0];
    const cls = attr(tag, "class").split(/\s+/);
    assert.ok(!cls.some((name) => borderOrRing.test(name)), `${work}: card`);
    // The image's frame or the icon's background.
    const frame = card.match(/<div[^>]*>(?=<img)/)[0];
    const frameCls = attr(frame, "class").split(/\s+/);
    assert.ok(
      !frameCls.some((name) => borderOrRing.test(name)),
      `${work}: icon`,
    );
    if (TOOLS.includes(work)) {
      assert.ok(frameCls.includes("rounded-full"), `${work}: circle`);
      assert.ok(!frameCls.includes("rounded-card"), `${work}: circle`);
    }
  }
});

test("ui-revise5 (design 4): the large card is a light gray surface with the photo inset in it", async () => {
  const { featuredSurface, cardRadius } =
    await import("../src/components/works/card-classes.ts");
  // Light gray (gray-50), one step darker (gray-100) on hover; in dark mode
  // one step lighter than the page (atom-one-dark-light), and halfway back
  // to the page on hover (for 4.5:1, ui-revise5).
  for (const name of [
    "bg-gray-50",
    "hover:bg-gray-100",
    "dark:bg-atom-one-dark-light",
    "dark:hover:bg-featured-hover-dark",
    "transition-colors",
  ]) {
    assert.ok(featuredSurface.split(/\s+/).includes(name), name);
  }
  const card = cardsOf(top).find((c) => attr(c, "data-card") === "featured");
  const article = attr(card.match(/<article[^>]*>/)[0], "class").split(/\s+/);
  // 16px between the photo and the text below 768px, 24px from there
  // (ui-revise12 2).
  for (const name of ["p-4", "sm:p-6", "gap-4", "md:gap-6", "md:grid-cols-2"]) {
    assert.ok(article.includes(name), name);
  }
  // The photo's frame has the card radius, inside the padding.
  const frame = attr(card.match(/<div[^>]*>(?=<img)/)[0], "class").split(/\s+/);
  assert.ok(frame.includes(cardRadius));
});

test("ui-revise5 13, ui-revise12 1: the large card has SPOTLIGHT above its title, in text-4xl from 768px and text-2xl below", () => {
  const featured = cardsOf(top).filter(
    (card) => attr(card, "data-card") === "featured",
  );
  // fosty natural and Just HEX (just-hex JH-11).
  assert.equal(featured.length, 2, "self-check");
  for (const card of featured) {
    const spotlight = card.match(
      /<p[^>]*data-work-spotlight[^>]*>([^<]*)<\/p>/,
    );
    assert.equal(spotlight[1].trim(), "SPOTLIGHT");
    // Right above the title (where the year was until ui-revise4).
    assert.match(
      card,
      /data-work-spotlight[^>]*>[^<]*<\/p>\s*<h3[^>]*data-work-title/,
    );
    const h3 = card.match(/<h3[^>]*>/)[0];
    const sizes = attr(h3, "class")
      .split(/\s+/)
      .filter((name) => /(^|:)text-(xs|sm|base|lg|\dxl)$/.test(name));
    assert.deepEqual(sizes, ["text-2xl", "md:text-4xl"]);
  }
  // Only the large cards have it.
  assert.equal(top.match(/data-work-spotlight/g).length, featured.length);
});

test("ui-revise5 3: the works are 24px further below the hero than the hero's margin", () => {
  const main = top.match(/<main[\s>][\s\S]*?<\/main>/)[0];
  const works = main.match(/<div[^>]*data-works[^>]*>/)[0];
  // Padding, not a margin, so that it does not collapse with the hero's.
  const cls = attr(works, "class").split(/\s+/);
  assert.ok(cls.includes("pt-6"), works);
  assert.ok(!cls.some((name) => /^(?:\w+:)?(?:mt|my|m)-/.test(name)), works);
  // The DIY Keyboards section is the first in it.
  const first = main.slice(main.indexOf(works)).match(/<section[^>]*>/)[0];
  assert.equal(attr(first, "id"), "keyboards");
});

test("D5, ui-revise5 5, ui-revise8 4: the five documentation links point to docs.unlibra.com", () => {
  // The works' links (the footer links to the docs site's top since ui-revise).
  // Each is on the work's card once, as its second action (ui-revise5 10).
  const main = top.match(/<main[\s>][\s\S]*?<\/main>/)[0];
  const expected = [
    "https://docs.unlibra.com/i18n-tiny/astro/introduction",
    "https://docs.unlibra.com/i18n-tiny/next/introduction",
    "https://docs.unlibra.com/i18n-tiny/react/introduction",
    "https://docs.unlibra.com/mururu-blink-lipsync/",
    "https://docs.unlibra.com/tkinter-unblur/",
  ];
  const docsIn = (html) =>
    hrefs(html)
      .filter((href) => /docs|github\.io/.test(href))
      .sort();
  assert.deepEqual(docsIn(main), expected);
  assert.deepEqual(docsIn(cardsOf(main).join("")), docsIn(main));
});

test("ui-revise2 9: the privacy policy's contact is the community repository", () => {
  const privacy = readDist("privacy/index.html");
  const main = privacy.match(/<main[\s>][\s\S]*?<\/main>/)[0];
  const contact = main.match(
    /8\. お問い合わせ<\/h2>([\s\S]*?)(<h2|<\/main>|<\/article>)/,
  );
  assert.ok(contact, "no section 8");
  assert.deepEqual(hrefs(contact[1]), ["https://github.com/unlibra/community"]);
  assert.ok(!hrefs(main).includes("https://github.com/unlibra"));
});

/** The content of a <meta name="..."> or <meta property="..."> tag. */
const metaOf = (html, key, name) =>
  attr(
    html.match(new RegExp(`<meta[^>]*${key}="${name}"[^>]*>`))[0],
    "content",
  );

test("ui-revise2 (parent): the privacy policy names the site and its update date", () => {
  const privacy = readDist("privacy/index.html");
  const description = metaOf(privacy, "name", "description");
  assert.match(description, /^unlibra のプライバシーポリシーです。/);
  assert.equal(metaOf(privacy, "property", "og:description"), description);
  assert.match(privacy, /<strong>最終更新日：<\/strong> 2026年10月23日<\/p>/);
});

test("final-review 8: the privacy policy has one h1, and does not call the site open source", () => {
  const privacy = readDist("privacy/index.html");
  const main = privacy.match(/<main[\s>][\s\S]*?<\/main>/)[0];
  const h1s = [...main.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => m[1]);
  assert.deepEqual(h1s, ["プライバシーポリシー"]);
  assert.ok(!/<h2[^>]*>プライバシーポリシー<\/h2>/.test(main));
  // The site is All rights reserved; only the tools and UI parts are MIT.
  assert.ok(!main.includes("オープンソース"));
  assert.ok(
    main.includes(
      "当サイトのソースコードはGitHubで公開されているため、誰でもデータの取り扱いを確認できます。",
    ),
  );
});

test("ui-revise3 2, ui-revise6 1: the top page's description is the footer's description", () => {
  const footer = top.match(/<footer[\s>][\s\S]*?<\/footer>/)[0];
  const text = footer.match(/<p class="mt-3[^"]*">([^<]*)<\/p>/)[1];
  assert.equal(
    text,
    "個人で制作したプロダクトを紹介するサイトです。昼はビルダー。夜は個人開発。自作キーボード、ライブラリ、アプリ、VRアバターや3Dアセットなど、ジャンルにとらわれず自由にものづくりしています。",
  );
  for (const [key, name] of [
    ["name", "description"],
    ["property", "og:description"],
    ["name", "twitter:description"],
  ]) {
    assert.equal(metaOf(top, key, name), text, name);
  }
});

test("remove-tw-palette: the privacy policy says local storage keeps only the theme", () => {
  const privacy = readDist("privacy/index.html");
  const main = privacy.match(/<main[\s>][\s\S]*?<\/main>/)[0];
  assert.ok(
    main.includes(
      "当サイトでは、表示テーマの選択を保持するため、お客様のブラウザにデータを保存する仕組み「ローカルストレージ」を使用しています。",
    ),
  );
  // The palette history (the only tool setting kept) was removed.
  assert.ok(!main.includes("ツール機能の設定"));
});
