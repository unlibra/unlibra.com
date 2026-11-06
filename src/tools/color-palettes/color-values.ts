/** Screen values use sRGB. */
export const rgbChannels = (hex: string): [number, number, number] => {
  if (!/^#[\da-f]{6}$/i.test(hex)) throw new Error(`Invalid sRGB HEX: ${hex}`);
  return [1, 3, 5].map((start) =>
    parseInt(hex.slice(start, start + 2), 16),
  ) as [number, number, number];
};
const rounded = (value: number, digits = 1) => Number(value.toFixed(digits));
export function colorValues(hex: string) {
  const channels = rgbChannels(hex);
  const [r, g, b] = channels.map((v) => v / 255);
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b),
    delta = max - min;
  const hue =
    delta === 0
      ? 0
      : (60 *
          (max === r
            ? (g - b) / delta
            : max === g
              ? (b - r) / delta + 2
              : (r - g) / delta + 4) +
          360) %
        360;
  const lightness = (max + min) / 2;
  const saturation =
    delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
  const linear = [r, g, b].map((v) =>
    v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4,
  );
  const l = Math.cbrt(
    0.4122214708 * linear[0] +
      0.5363325363 * linear[1] +
      0.0514459929 * linear[2],
  );
  const m = Math.cbrt(
    0.2119034982 * linear[0] +
      0.6806995451 * linear[1] +
      0.1073969566 * linear[2],
  );
  const s = Math.cbrt(
    0.0883024619 * linear[0] +
      0.2817188376 * linear[1] +
      0.6299787005 * linear[2],
  );
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const chroma = Math.hypot(a, bb);
  const oklchHue =
    chroma < 0.000001 ? 0 : ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360;
  return {
    HEX: hex,
    RGB: `rgb(${channels.join(", ")})`,
    HSV: `${rounded(hue)}°, ${rounded(max === 0 ? 0 : (delta / max) * 100)}%, ${rounded(max * 100)}%`,
    HSL: `hsl(${rounded(hue)} ${rounded(saturation * 100)}% ${rounded(lightness * 100)}%)`,
    OKLCH: `oklch(${rounded(L * 100, 2)}% ${rounded(chroma, 4)} ${rounded(oklchHue, 2)})`,
    oklab: [L, a, bb] as const,
    hue,
    lightness,
    chroma,
  };
}

/** Munsell's ten hue letters, in hue-circle order, then neutrals. */
export const hueIds = [
  "R",
  "YR",
  "Y",
  "GY",
  "G",
  "BG",
  "B",
  "PB",
  "P",
  "RP",
  "N",
] as const;
export type HueId = (typeof hueIds)[number];
/**
 * Each hue group's mark in the hue navigation, the same on every palette:
 * a representative Munsell color of the hue (5 on its hue, a strong chroma)
 * and a middle gray, converted to sRGB with munsell.js 1.1.7; channels out
 * of the sRGB gamut are clipped.
 */
export const hueMarkers: Record<HueId, string> = {
  R: "#BC1933", // 5R 4/14
  YR: "#DB7B16", // 5YR 6/12
  Y: "#EAC600", // 5Y 8/12
  GY: "#9ABA28", // 5GY 7/10
  G: "#008B62", // 5G 5/8
  BG: "#238781", // 5BG 5/6
  B: "#0086A6", // 5B 5/8
  PB: "#004898", // 5PB 3/12
  P: "#82479B", // 5P 4/12
  RP: "#A7326F", // 5RP 4/12
  N: "#939393", // N 6
};
/**
 * JIS Z 8102 charts put achromatic and tinted-achromatic names below about
 * chroma 1.5, so lower-chroma estimates join the neutral group.
 */
export const neutralChromaLimit = 1.5;
/** Groups a Munsell estimate such as "2B 6.9/6.3" by its hue letter. */
export function hueGroup(munsell: string): HueId {
  if (/^N \d+(?:\.\d+)?$/.test(munsell)) return "N";
  const match = munsell.match(
    /^\d+(?:\.\d+)?(RP|YR|GY|BG|PB|R|Y|G|B|P) \d+(?:\.\d+)?\/(\d+(?:\.\d+)?)$/,
  );
  if (!match) throw new Error(`Invalid Munsell estimate: ${munsell}`);
  return Number(match[2]) < neutralChromaLimit ? "N" : (match[1] as HueId);
}

/** WCAG relative luminance for opaque sRGB colors. */
export function contrastRatio(first: string, second: string): number {
  const luminance = (hex: string) => {
    const channels = rgbChannels(hex).map((channel) => {
      const value = channel / 255;
      return value <= 0.04045
        ? value / 12.92
        : ((value + 0.055) / 1.055) ** 2.4;
    });
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  };
  const a = luminance(first),
    b = luminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/** Light to dark by OKLCH lightness; equal lightness keeps the input order. */
export function lightToDark<T extends { hex: string }>(
  colors: readonly T[],
): T[] {
  return colors
    .map((color) => ({ color, lightness: colorValues(color.hex).oklab[0] }))
    .sort((a, b) => b.lightness - a.lightness)
    .map((item) => item.color);
}
