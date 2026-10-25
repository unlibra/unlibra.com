import type { ImageMetadata } from "astro";
import miraImg from "@/assets/works/mira.webp";
import prototypesImg from "@/assets/works/prototypes.webp";
import fostyNaturalImg from "@/assets/works/fosty-natural.webp";
import fostyDarkImg from "@/assets/works/fosty-dark.webp";
// Images that show material by other creators (LICENSE, section 3).
import mururuBlinkLipsyncImg from "@/assets/works/third-party/mururu-blink-lipsync.webp";
import npmImg from "@/assets/npm.svg";
import pypiImg from "@/assets/pypi.svg";
import type { SitePath } from "@/config/site";
import { toolIcons, toolPath } from "@/config/tools";
import type messages from "@/messages/ja";

/** Work categories in display order. */
export const categories = ["keyboards", "libraries", "apps", "vr-3d"] as const;
export type Category = (typeof categories)[number];

/** Documentation pages live on docs.unlibra.com (design doc 3.6). */
export type DocsUrl = `https://docs.unlibra.com/${string}`;

/** Every work has a title and summary in the messages. */
export type WorkId = keyof (typeof messages)["works"];

type WorkMessages = (typeof messages)["works"];
/** The works with a description in the messages, for their details. */
export type DescribedWorkId = {
  [K in WorkId]: WorkMessages[K] extends { description: string } ? K : never;
}[WorkId];

interface WorkBase<Id extends WorkId = WorkId> {
  id: Id;
  image: ImageMetadata;
  /** Shown as a large, full-width card in its category. */
  featured?: true;
}

/**
 * DIY Keyboards have no links: their cards open the details (ui-revise4 2),
 * which need the work's description. A keyboard without a description is
 * `plain: true`: its card has no link and no details, and opens nothing
 * (ui-revise9 3); it is never a large card.
 * The works of the other categories have a link, and their cards go there
 * directly; Libraries and VR & 3D have their documentation too (ui-revise5 5).
 */
export type Work =
  | (WorkBase<DescribedWorkId> & {
      category: "keyboards";
      link?: never;
      docs?: never;
      plain?: never;
    })
  | (WorkBase<Exclude<WorkId, DescribedWorkId>> & {
      category: "keyboards";
      link?: never;
      docs?: never;
      /** The card opens nothing: no link and no details. */
      plain: true;
      featured?: never;
    })
  | (WorkBase & {
      category: "libraries";
      /** The package on npm or PyPI. */
      link: `https://${string}`;
      docs?: DocsUrl;
    })
  | (WorkBase & {
      category: "apps";
      /** The tool's page. */
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
  {
    id: "fosty-natural",
    category: "keyboards",
    image: fostyNaturalImg,
    featured: true,
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
    plain: true,
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
    link: "https://unlibra-vrc.booth.pm/items/9009879",
    docs: "https://docs.unlibra.com/mururu-blink-lipsync/",
  },
];

/** Link to a category's section on the top page, e.g. "/#apps". */
export const categoryHref = (category: Category): `/#${Category}` =>
  `/#${category}`;
