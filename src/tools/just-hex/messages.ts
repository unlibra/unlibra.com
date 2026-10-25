// Texts of Just HEX. The app is in English only (no Japanese page), so its
// texts are not in the tools' messages (src/tools/messages), which need both.
// The page shows almost no text (the user's choice: an art piece, not a
// tool): the input's placeholder is its only hint. The other texts are
// names for screen readers and the page's metadata.

export const hexMessages = {
  name: "Just HEX",
  /** The page's meta description (not shown on the page). */
  description: "One color. The whole screen.",
  colorCode: "Color code",
  placeholder: "#000000",
  show: "Show",
  invalid: "Not a color code.",
  /** The dock of the color screen: icon buttons, named for screen readers. */
  dock: {
    label: "Just HEX",
    top: "Back to Just HEX",
    copy: "Copy {hex}",
    copied: "Copied!",
    copyFailed: "Could not copy the color code.",
    share: "Share on X",
  },
  /** The text of a post on X, before its URL: "Just HEX | https://…". */
  shareText: "Just HEX |",
  /** The title and description of a color's share URL. */
  colorTitle: "{hex} - Just HEX",
  colorDescription: "A screen filled with {hex}.",
} as const;

/** Puts the color code ("#ffffff") into a text. */
export const withHex = (text: string, hex: string): string =>
  text.replaceAll("{hex}", `#${hex}`);
