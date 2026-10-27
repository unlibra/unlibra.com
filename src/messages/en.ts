// English texts of the pages: the Japanese texts (./ja.ts) are the source.
// They say the same, with the same conditions and notes, in natural English
// rather than word for word. Names that are in English on the Japanese
// pages (the categories, Just HEX, SPOTLIGHT) are the same here.
import type ja from "@/messages/ja";
import { layoutMessages } from "@/messages/layout";
import type { SameStructure } from "@/messages/types";

/** Texts of the pages: the keys of the Japanese messages, as strings. */
export type Messages = SameStructure<typeof ja>;

const en: Messages = {
  site: {
    description: layoutMessages.en.footer.description,
  },
  hero: {
    title: "Café by day. Bar by night.",
    day: "day",
    night: "night",
    github: "GitHub",
    booth: "BOOTH",
  },
  categories: layoutMessages.en.header.categories,
  links: {
    docs: "Docs",
  },
  workDetails: {
    more: "View details",
    close: "Close",
    openApp: "Open app",
    viewOnBooth: "View on BOOTH",
    npm: "npm",
    pypi: "PyPI",
    spotlight: "SPOTLIGHT",
  },
  works: {
    "tkinter-unblur": {
      title: "tkinter-unblur",
      summary:
        "A Python library that offers a simple fix for Tkinter apps that look blurry on Windows.",
    },
    "keyboards-cover": {
      title: "A Blank Endgame",
      summary:
        "A keyboard is a tool I use every day. That is exactly why I want to pursue my ideal in it: the number of keys, the layout, the typing feel, and even the look. These are the DIY keyboards born from that trial and error.",
    },
    "mira-zero": {
      title: "mira zero",
      summary:
        "A split keyboard full of memories: my first, with both the PCB and the case made by me.",
      description: `A 40% split, low-profile (Choc V1) keyboard.
My very first keyboard built from the PCB up, made as a “prototype” to try out all kinds of techniques.`,
    },
    prototypes: {
      title: "prototypes",
      summary:
        "The many prototype keyboards that came before I arrived at my endgame...",
    },
    "fosty-natural": {
      title: "fosty natural",
      summary:
        "My endgame keyboard: the HHKB layout brought to a 40% keyboard, with a beautiful design and a great typing feel.",
      description: `A low-profile (Choc V2) keyboard that brings the distinctive HHKB layout to a 40% size.
A detail I care about: where the HHKB has just 60 keys, this one has just 40.
It pursues a beautiful design with a machined aluminum case and a slim build with nothing extra, a pleasant typing feel from its gasket mount, and the portability and stability of a one-piece layout.
Its white and silver colors stand out on a white desk, and even the key switches match them: chimera switches.
Typing feel, portability, layout and design came together in my ideal balance, and it became the one I can call my “endgame.”`,
    },
    "fosty-dark": {
      title: "fosty dark",
      summary: "Another color of fosty natural. My other endgame.",
      description: `Another color of fosty natural: a 40% low-profile keyboard.
It keeps the typing feel, portability, layout and design of fosty natural, and is customized with key switches specially put together for its black and orange colors, which stand out on a black desk.
I made it because I wanted a black one too: my other endgame.`,
    },
    "i18n-tiny-next": {
      title: "@i18n-tiny/next",
      summary:
        "An i18n library under 1 KB that makes Next.js apps multilingual, with zero dependencies, type safety and a minimal setup.",
    },
    "i18n-tiny-react": {
      title: "@i18n-tiny/react",
      summary:
        "An i18n library under 1 KB that makes React apps multilingual, with zero dependencies, type safety and a minimal setup.",
    },
    "i18n-tiny-astro": {
      title: "@i18n-tiny/astro",
      summary:
        "An i18n library under 1 KB that makes Astro sites multilingual, with zero dependencies, type safety and a minimal setup.",
    },
    "just-hex": {
      title: "Just HEX",
      summary:
        "Just one color. A small web app: enter a color code, and the color fills your whole screen. Send your favorite color to someone with a share card.",
    },
    "favicon-generator": {
      title: "Favicon Generator",
      summary:
        "Generates favicons and an Apple Touch Icon from one image, all at once. You can also set rounded corners and a background color.",
    },
    "svg-optimizer": {
      title: "SVG Optimizer",
      summary:
        "Reduces the file size of your SVGs while keeping their quality, so your website loads faster.",
    },
    "password-generator": {
      title: "Password Generator",
      summary:
        "Generates strong passwords with the length and character types you choose. It can also leave out characters that are easy to confuse.",
    },
    "mururu-blink-lipsync": {
      title: "Mururu Blink & LipSync",
      summary:
        "A Unity tool that adds lip sync, which moves the mouth naturally with the user's voice, and blinking to Mururu.",
    },
  },
  donate: {
    title: "Support My Work",
    description:
      "Ways to support unlibra's work. You can support it through GitHub Sponsors or with an Amazon gift card.",
    intro: "For those who would like to support this site and my work.",
    note: "Your support is a way to show encouragement. There are no rewards or perks in return.",
    github: {
      name: "GitHub Sponsors",
      language: "",
      description: "You can give a one-time tip or sponsor me monthly.",
      requirement: "A GitHub account is required.",
      oneTime: "Give a one-time tip",
      monthly: "Sponsor monthly",
    },
    amazon: {
      name: "Amazon Gift Card",
      language: "(Japanese site)",
      description: "Please send a gift card delivered by email.",
      copyStep: "Copy the recipient's email address",
      copyLabel: "Copy email address to clipboard",
      copyFailed: "Could not copy.",
      buyStep: "Buy a gift card on Amazon",
      buyDescription:
        "Enter the copied address as the recipient. Any amount is welcome.",
      buy: "Choose a gift card on Amazon",
    },
  },
  credits: {
    title: "Credits",
    description:
      "Credits for unlibra: the rights notices for the characters, materials and other content used on this site.",
    intro:
      "The rights notices for the characters, materials and other content used on this site.",
    characters: "Characters",
    materials: "Graphic Materials",
    author: "Author: ",
    license: "License: ",
    logos: "Logos",
    trademark: "{name}: a trademark of {owner}",
    openSource: "Open Source Licenses",
    thirdPartyLicenses: "Third-party licenses",
  },
};

export default en;
