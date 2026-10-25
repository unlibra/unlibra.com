// Just HEX: a screen filled with one color, named by the URL's hash
// (`/hex#ffffff`). Shared by the page and the Worker, which serves the share
// URLs (`/hex/ffffff`) with the color's own OGP image.

/** Path of the top page. */
export const hexPath = "/hex";

/**
 * A color code as typed or as in a URL: 3 or 6 hex digits, with or without
 * "#", in either case. The page's first script reads the hash with this
 * pattern before the page is drawn (it cannot import this module).
 */
export const hexPattern = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** A color in its one written form: 6 lowercase hex digits, without "#". */
export type Hex = string & { readonly __hex: unique symbol };

/** The color of a code, or null when it is not one. */
export const parseHex = (input: string): Hex | null => {
  const digits = hexPattern.exec(input.trim())?.[1]?.toLowerCase();
  if (!digits) return null;
  return (
    digits.length === 3 ? [...digits].map((d) => d + d).join("") : digits
  ) as Hex;
};

/** Path of a color's share URL, which has its own OGP image. */
export const sharePath = (hex: Hex): `/hex/${string}` => `/hex/${hex}`;

/** Path of a color's OGP image. */
export const imagePath = (hex: Hex): `/hex/${string}.png` => `/hex/${hex}.png`;
