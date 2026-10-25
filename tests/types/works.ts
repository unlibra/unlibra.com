// Type-level tests for the works data, checked by `astro check` (part of
// `npm run build`). Each @ts-expect-error fails the check if the line it marks
// stops being an error. The valid works below show that the errors come only
// from the marked property.
import type { ImageMetadata } from "astro";
import type { Work } from "@/config/works";

declare const image: ImageMetadata;

export const valid: Work[] = [
  { id: "mira-zero", category: "keyboards", image },
  // ui-revise9 3: a keyboard without a description opens nothing.
  { id: "prototypes", category: "keyboards", image, plain: true },
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
    link: "https://unlibra-vrc.booth.pm/items/9009879",
    // ui-revise5 5: VR & 3D works can have their documentation.
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
  // @ts-expect-error A VR & 3D card links to its item.
  { id: "mururu-blink-lipsync", category: "vr-3d", image },
];

// ui-revise9 3: a DIY keyboard's card opens its details, which need its
// description; a keyboard without one is plain (its card opens nothing),
// and only those are.
export const keyboardWithoutDetails: Work[] = [
  // @ts-expect-error No description: the card must be plain.
  { id: "prototypes", category: "keyboards", image },
];

export const plainWithDetails: Work[] = [
  // @ts-expect-error A keyboard with a description opens its details.
  { id: "mira-zero", category: "keyboards", image, plain: true },
];

export const plainFeatured: Work[] = [
  {
    id: "prototypes",
    category: "keyboards",
    image,
    plain: true,
    // @ts-expect-error A card that opens nothing is not a large card.
    featured: true,
  },
];

export const plainWithLink: Work[] = [
  {
    id: "prototypes",
    category: "keyboards",
    image,
    plain: true,
    // @ts-expect-error A plain card has no link either.
    link: "https://example.com/",
  },
];

export const plainLinkCard: Work[] = [
  {
    id: "svg-optimizer",
    category: "apps",
    image,
    link: "/lab/svg-optimizer",
    // @ts-expect-error Only DIY Keyboards can be plain.
    plain: true,
  },
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

// ui-revise4 2: no year and no VR & 3D subcategory.
export const withYear: Work[] = [
  {
    id: "mira-zero",
    category: "keyboards",
    image,
    // @ts-expect-error Works have no year.
    year: "2024",
  },
];

export const withSubcategory: Work[] = [
  {
    id: "mururu-blink-lipsync",
    category: "vr-3d",
    image,
    link: "https://unlibra-vrc.booth.pm/items/9009879",
    // @ts-expect-error VR & 3D works have no subcategory.
    subcategory: "unity-tool",
  },
];

// ui-revise7 2: every photo is cropped around its center; no work sets
// where its photo is cropped.
export const withImagePosition: Work[] = [
  {
    id: "mururu-blink-lipsync",
    category: "vr-3d",
    image,
    link: "https://unlibra-vrc.booth.pm/items/9009879",
    // @ts-expect-error Photos are cropped around the center.
    imagePosition: "top",
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
