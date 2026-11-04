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
    hue,
    lightness,
    chroma,
  };
}

export const hueIds = [
  "red",
  "orange",
  "yellow",
  "green",
  "blue",
  "purple",
  "neutral",
] as const;
export type HueId = (typeof hueIds)[number];
export const hueAngles: Record<HueId, number> = {
  red: 0,
  orange: 30,
  yellow: 60,
  green: 120,
  blue: 210,
  purple: 285,
  neutral: 0,
};
/** Broad browsing groups; neutral includes low-chroma sRGB display colors. */
export function hueGroup(hex: string): HueId {
  const { hue, chroma } = colorValues(hex);
  if (chroma < 0.02) return "neutral";
  if (hue >= 315 || hue < 15) return "red";
  if (hue < 45) return "orange";
  if (hue < 75) return "yellow";
  if (hue < 165) return "green";
  if (hue < 255) return "blue";
  return "purple";
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
