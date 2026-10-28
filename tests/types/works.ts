// Type-level tests for the works data, checked by `astro check` (part of
// `npm run build`). Each @ts-expect-error fails the check if the line it marks
// stops being an error. The valid works below show that the errors come only
// from the marked property.
import type { ImageMetadata } from "astro";
import type { Work } from "@/config/works";

declare const image: ImageMetadata;

export const valid: Work[] = [
  { id: "mira-zero", category: "keyboards", image },
  // A keyboard without a description opens its photo alone; it may be a
  // large card (the cover of DIY Keyboards).
  { id: "prototypes", category: "keyboards", image },
  { id: "keyboards-cover", category: "keyboards", image, featured: true },
  {
    id: "tkinter-unblur",
    category: "libraries",
    image,
    link: "https://pypi.org/project/tkinter-unblur",
    docs: "https://docs.unlibra.com/tkinter-unblur/",
  },
  {
    id: "svg-optimizer",
    category: "apps",
    image,
    link: "/lab/svg-optimizer",
  },
  {
    id: "mururu-blink-lipsync",
    category: "vr-3d",
    image,
    link: "https://unlibra.booth.pm/items/9056145",
    // ui-revise5 5: VRChat works can have their documentation.
    docs: "https://docs.unlibra.com/mururu-blink-lipsync/",
  },
];

// ui-revise4 2: the cards that are links need a link; DIY Keyboards open
// their details and have none.
export const linkCardWithoutLink: Work[] = [
  // @ts-expect-error A library card links to its package.
  { id: "tkinter-unblur", category: "libraries", image },
  // @ts-expect-error An app card links to its tool.
  { id: "svg-optimizer", category: "apps", image },
  // @ts-expect-error A VRChat card links to its item.
  { id: "mururu-blink-lipsync", category: "vr-3d", image },
];

export const keyboardWithLink: Work[] = [
  {
    id: "mira-zero",
    category: "keyboards",
    image,
    // @ts-expect-error DIY Keyboards have no link: their cards open the details.
    link: "https://example.com/",
  },
];

export const oldDocsHost: Work[] = [
  {
    id: "tkinter-unblur",
    category: "libraries",
    image,
    link: "https://pypi.org/project/tkinter-unblur",
    // @ts-expect-error Documentation links point to docs.unlibra.com.
    docs: "https://unlibra.github.io/tkinter-unblur/",
  },
];
