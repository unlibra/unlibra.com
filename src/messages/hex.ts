// Texts of Just HEX. The app is in English only (no Japanese page), so its
// texts are not in the tools' messages (src/tools/messages), which need both.

export const hexMessages = {
  name: "Just HEX",
  description:
    "Fill your whole screen with a single color. Type a color code, or put one at the end of this page's URL, as in /hex#ffffff. Click anywhere on the color to copy its code or share it.",
  colorCode: "Color code",
  colorCodeHint: "3 or 6 hex digits, such as #fff or #ffffff.",
  show: "Show",
  invalid: "Enter a color code of 3 or 6 hex digits, such as #ffffff.",
  openMenu: "Open menu",
  menu: {
    top: "Back to Just HEX",
    copy: "Copy {hex}",
    copied: "Copied!",
    copyFailed: "Could not copy the color code.",
    share: "Share on X",
    close: "Close",
  },
  /** The text of a post on X, before its URL. */
  shareText: "{hex} on Just HEX",
  /** The title and description of a color's share URL. */
  colorTitle: "{hex} - Just HEX",
  colorDescription: "A screen filled with {hex}.",
} as const;

/** Puts the color code ("#ffffff") into a text. */
export const withHex = (text: string, hex: string): string =>
  text.replaceAll("{hex}", `#${hex}`);
