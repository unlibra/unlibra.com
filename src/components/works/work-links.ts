// Where a work's card goes: a dialog with the details or the photo alone (DIY
// Keyboards), or the work's links (where it is published or sold, then its
// documentation), the first of which the whole card links to (ui-revise4 2,
// ui-revise5 10, 11).
import type { Locale } from "@/config/locales";
import { localizedPath, type SitePath } from "@/config/site";
import type { Work } from "@/config/works";
import { messages, type Messages } from "@/messages";

export interface WorkLink {
  label: string;
  href: string;
  external: boolean;
}

type LinkKind = "app" | "npm" | "pypi" | "booth";

/** What a work's main link is. Unknown kinds of links stop the build. */
const kindOf = (work: Work, href: string): LinkKind => {
  switch (work.category) {
    case "apps":
      return "app";
    case "libraries":
      if (href.startsWith("https://www.npmjs.com/")) return "npm";
      if (href.startsWith("https://pypi.org/")) return "pypi";
      break;
    case "vr-3d":
      if (/^https:\/\/[\w-]+\.booth\.pm\//.test(href)) return "booth";
      break;
    case "keyboards":
      break;
  }
  throw new Error(`${work.id}: no label for the link ${href}`);
};

/**
 * The main link's label, by its message (the same link has the same name
 * everywhere).
 */
const labelKeys = {
  app: "openApp",
  npm: "npm",
  pypi: "pypi",
  booth: "viewOnBooth",
} as const satisfies Record<LinkKind, keyof Messages["workDetails"]>;

/** A work's link: another site's, or a page of this site (`Work`'s types). */
type Href = `https://${string}` | SitePath;

const isExternal = (href: Href): href is `https://${string}` =>
  href.startsWith("https://");

const linkTo = (label: string, href: Href, lang: Locale): WorkLink =>
  isExternal(href)
    ? { label, href, external: true }
    : // A page of this site: the one in the page's language.
      { label, href: localizedPath(href, lang), external: false };

/**
 * A work's links, in order: the main link (the app, the package on npm or
 * PyPI, the item on BOOTH), then the documentation (ui-revise5 10), in the
 * page's language. DIY Keyboards have none.
 */
export const linksOf = (work: Work, lang: Locale): WorkLink[] => [
  ...(work.link
    ? [
        linkTo(
          messages[lang].workDetails[labelKeys[kindOf(work, work.link)]],
          work.link,
          lang,
        ),
      ]
    : []),
  ...(work.docs ? [linkTo(messages[lang].links.docs, work.docs, lang)] : []),
];

/**
 * What a work's card opens: a dialog with its details, a dialog with its
 * photo alone, or a link.
 */
export type CardTarget =
  | { kind: "details" }
  | { kind: "photo" }
  | { kind: "link"; link: WorkLink; actions: [WorkLink, ...WorkLink[]] };

/** The work's description, shown in its details (DIY Keyboards). */
export const descriptionOf = (work: Work, lang: Locale): string | undefined => {
  const entry = messages[lang].works[work.id];
  return "description" in entry ? entry.description : undefined;
};

/**
 * A DIY keyboard's card opens a dialog: the details when the work has a
 * description, its photo alone when not (the user's choice on 2026-10-28;
 * those cards opened nothing until then, ui-revise9 3). The other cards go
 * to their first link (the app for Apps, npm or PyPI for Libraries, the item
 * on BOOTH for VRChat), and show all their links as actions, the first one
 * first (ui-revise5 9, 11).
 */
export const cardTarget = (work: Work, lang: Locale): CardTarget => {
  if (work.category === "keyboards") {
    return descriptionOf(work, lang) === undefined
      ? { kind: "photo" }
      : { kind: "details" };
  }
  const [first, ...rest] = linksOf(work, lang);
  // The type requires a link for these categories.
  if (!first) throw new Error(`${work.id}: no link for its card`);
  return { kind: "link", link: first, actions: [first, ...rest] };
};
