// Texts of Just HEX. The app is in English only (no Japanese texts; the
// header and the footer around it are the site's, in Japanese), so its
// texts are not in the tools' messages (src/tools/messages), which need both.
// The page shows almost no text (the user's choice: an art piece, not a
// tool): the input's placeholder is its only hint. The other texts are
// the error, the share dialog, names for screen readers and the metadata.

export const hexMessages = {
  name: "Just HEX",
  /** The meta description of the top page and of each color's page. */
  description:
    "Just one color. Enter a HEX color code to fill your entire screen with color. Explore, enjoy, and share your favorite colors with anyone.",
  colorCode: "Color code",
  placeholder: "#000000",
  show: "Show",
  discover: "Discover",
  discovered: "New color: {hex}.",
  invalid: "Not a color code.",
  /** The dock of the color screen: icon buttons, named for screen readers. */
  dock: {
    label: "Just HEX",
    top: "Back to Just HEX",
    copy: "Copy link",
    share: "Share on X",
  },
  /** The top page's button that opens the share dialog, and the dialog. */
  share: {
    open: "Share",
    title: "Share this color",
    close: "Close",
    copy: "Copy link",
    /** "Share on" and the X logo; its name for screen readers is `x`. */
    xLabel: "Share on",
    x: "Share on X",
  },
  /** Said to screen readers (and shown in the dialog) after copying. */
  copied: "Copied!",
  copyFailed: "Could not copy the link.",
  /**
   * The text before a color's URL, in a post on X and in a copied link:
   * "Just HEX https://…".
   */
  shareText: "Just HEX",
  /** The tab's title of a color. */
  colorTitle: "{hex} - Just HEX",
  /** The OGP title and description of a color's page. */
  colorOgTitle: "{hex}",
  colorOgDescription: "Just HEX — Just one color.",
} as const;

/** Puts the color code ("#FFFFFF") into a text. */
export const withHex = (text: string, hex: string): string =>
  text.replaceAll("{hex}", `#${hex}`);
