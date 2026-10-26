// Just HEX: a screen filled with one color, named by the URL's path
// (`/hex/FFFFFF`), which is also the URL to share: the Worker serves it with
// the color's own OGP image. Shared by the page and the Worker.

/** Path of the top page. */
export const hexPath = "/hex";

/**
 * The query of the top page that holds a code that is no color
 * (`/hex?invalid=zzz`): where the Worker sends `/hex/zzz`, and where the page
 * sends `/hex#zzz`. The top page shows the code in the input, with the error.
 */
export const invalidParam = "invalid";

/** Path of the top page with a code that is no color. */
export const invalidPath = (code: string): string =>
  `${hexPath}?${new URLSearchParams({ [invalidParam]: code })}`;

/**
 * A color code as typed or as in a URL: 3 or 6 hex digits, with or without
 * "#", in either case. The page's first script reads the URL with this
 * pattern before the page is drawn (it cannot import this module).
 */
export const hexPattern = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** A color in its one written form: 6 uppercase hex digits, without "#". */
export type Hex = string & { readonly __hex: unique symbol };

/** The color of a code, or null when it is not one. */
export const parseHex = (input: string): Hex | null => {
  const digits = hexPattern.exec(input.trim())?.[1]?.toUpperCase();
  if (!digits) return null;
  return (
    digits.length === 3 ? [...digits].map((d) => d + d).join("") : digits
  ) as Hex;
};

/**
 * Whether a color is light or dark: whether black or white contrasts more
 * with it (WCAG relative luminance; the two are equal at about 0.179).
 * What sits on the color takes the other one: the arrow of the top page's
 * button, and the dock of the color screen.
 */
export const toneOf = (hex: Hex): "light" | "dark" => {
  const [r = 0, g = 0, b = 0] = (hex.match(/../g) ?? []).map((pair) => {
    const c = parseInt(pair, 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.179 ? "light" : "dark";
};

/**
 * Path of a color: the color screen, and the URL to share, which has the
 * color's own OGP image.
 */
export const sharePath = (hex: Hex): `/hex/${string}` => `/hex/${hex}`;

/** Path of a color's OGP image. */
export const imagePath = (hex: Hex): `/hex/${string}.png` => `/hex/${hex}.png`;
