import type { ImageMetadata } from "astro";
import miraImg from "@/assets/works/mira.webp";
import prototypesImg from "@/assets/works/prototypes.webp";
import fostyNaturalImg from "@/assets/works/fosty-natural.webp";
import fostyNaturalBlankImg from "@/assets/works/fosty-natural-blank.webp";
import fostyDarkImg from "@/assets/works/fosty-dark.webp";
import xoyoImg from "@/assets/works/xoyo.webp";
import xoyoPlusImg from "@/assets/works/xoyo-plus.webp";
// Images that show material by other creators (LICENSE, section 3).
import mururuBlinkLipsyncImg from "@/assets/works/third-party/mururu-blink-lipsync.webp";
import npmImg from "@/assets/npm.svg";
import pypiImg from "@/assets/pypi.svg";
import justHexIcon from "@/assets/tools/just-hex.svg";
import type { Locale } from "@/config/locales";
import { localizedPath, paths, type SitePath } from "@/config/site";
import { toolIcons, toolPath } from "@/config/tools";
import type messages from "@/messages/ja";

/** Work categories in display order. */
export const categories = ["keyboards", "libraries", "apps", "vr-3d"] as const;
export type Category = (typeof categories)[number];

/** Documentation pages live on docs.unlibra.com. */
export type DocsUrl = `https://docs.unlibra.com/${string}`;

/** Every work has a title and summary in the messages. */
export type WorkId = keyof (typeof messages)["works"];

interface WorkBase {
  id: WorkId;
  image: ImageMetadata;
  /** Shown as a large, full-width card in its category. */
  featured?: true;
}

/**
 * DIY Keyboards have no links: their cards open a dialog (ui-revise4 2), with
 * the work's details when the messages have its description, and with its
 * photo alone when not (the user's choice on 2026-10-28, in place of the
 * cards that opened nothing, ui-revise9 3).
 * The works of the other categories have a link, and their cards go there
 * directly; Libraries and VRChat have their documentation too (ui-revise5 5).
 */
export type Work =
  | (WorkBase & {
      category: "keyboards";
      link?: never;
      docs?: never;
    })
  | (WorkBase & {
      category: "libraries";
      /** The package on npm or PyPI. */
      link: `https://${string}`;
      docs?: DocsUrl;
    })
  | (WorkBase & {
      category: "apps";
      /** The app's page in Japanese (in English: under /en, `localizedPath`). */
      link: SitePath;
      docs?: never;
    })
  | (WorkBase & {
      category: "vr-3d";
      /** The item on BOOTH. */
      link: `https://${string}`;
      docs?: DocsUrl;
    });

/** Works in display order within each category. */
export const works: Work[] = [
  // The cover of DIY Keyboards: fosty natural with blank keycaps, not a
  // keyboard of its own.
  {
    id: "keyboards-cover",
    category: "keyboards",
    image: fostyNaturalBlankImg,
    featured: true,
  },
  {
    id: "fosty-natural",
    category: "keyboards",
    image: fostyNaturalImg,
  },
  {
    id: "fosty-dark",
    category: "keyboards",
    image: fostyDarkImg,
  },
  {
    id: "prototypes",
    category: "keyboards",
    image: prototypesImg,
  },
  {
    id: "xoyo-plus",
    category: "keyboards",
    image: xoyoPlusImg,
  },
  {
    id: "xoyo",
    category: "keyboards",
    image: xoyoImg,
  },
  {
    id: "mira-zero",
    category: "keyboards",
    image: miraImg,
  },
  {
    id: "tkinter-unblur",
    category: "libraries",
    image: pypiImg,
    link: "https://pypi.org/project/tkinter-unblur",
    docs: "https://docs.unlibra.com/tkinter-unblur/",
  },
  {
    id: "i18n-tiny-astro",
    category: "libraries",
    image: npmImg,
    link: "https://www.npmjs.com/package/@i18n-tiny/astro",
    docs: "https://docs.unlibra.com/i18n-tiny/astro/introduction",
  },
  {
    id: "i18n-tiny-next",
    category: "libraries",
    image: npmImg,
    link: "https://www.npmjs.com/package/@i18n-tiny/next",
    docs: "https://docs.unlibra.com/i18n-tiny/next/introduction",
  },
  {
    id: "i18n-tiny-react",
    category: "libraries",
    image: npmImg,
    link: "https://www.npmjs.com/package/@i18n-tiny/react",
    docs: "https://docs.unlibra.com/i18n-tiny/react/introduction",
  },
  {
    id: "just-hex",
    category: "apps",
    image: justHexIcon,
    link: paths.hex,
    featured: true,
  },
  {
    id: "svg-optimizer",
    category: "apps",
    image: toolIcons["svg-optimizer"],
    link: toolPath("svg-optimizer", "ja"),
  },
  {
    id: "favicon-generator",
    category: "apps",
    image: toolIcons["favicon-generator"],
    link: toolPath("favicon-generator", "ja"),
  },
  {
    id: "password-generator",
    category: "apps",
    image: toolIcons["password-generator"],
    link: toolPath("password-generator", "ja"),
  },
  {
    id: "mururu-blink-lipsync",
    category: "vr-3d",
    image: mururuBlinkLipsyncImg,
    link: "https://unlibra.booth.pm/items/9056145",
    docs: "https://docs.unlibra.com/mururu-blink-lipsync/",
  },
];

/** Link to a category's section on the top page, e.g. "/#apps" ("/en#apps"). */
export const categoryHref = (category: Category, lang: Locale): string =>
  `${localizedPath(paths.home, lang)}#${category}`;
