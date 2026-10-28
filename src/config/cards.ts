// How the top page shows each work. Kept apart from works.ts (which imports
// the images) so that the tests can import it.
import type { Category, Work } from "@/config/works";

/**
 * Each category's card: "tool" is the former tool site's card (an icon on a
 * circle, the name and the summary), "frame" a card with a 4:3 photo.
 */
export const cardStyles = {
  keyboards: "frame",
  libraries: "tool",
  apps: "tool",
  "vr-3d": "frame",
} as const satisfies Record<Category, "tool" | "frame">;

export type CardStyle = (typeof cardStyles)[Category];

/**
 * Categories that show their first works only, with a card that shows the
 * rest: how many works come before that card (a large card counts as one).
 * DIY Keyboards: the cover and two keyboards, then "+4 more" in the third
 * place of their row (the user's choice on 2026-10-28).
 */
export const shownFirst = { keyboards: 3 } as const satisfies Partial<
  Record<Category, number>
>;

export type CollapsedCategory = keyof typeof shownFirst;

export const isCollapsed = (
  category: Category,
): category is CollapsedCategory => category in shownFirst;

/** Whether a category's works are photos (or else icons and logos). */
export const isPhoto = (category: Category): boolean =>
  cardStyles[category] === "frame";

/**
 * The card of a work: a featured work (`featured: true`) is a large,
 * full-width card in any category; the others take their category's card.
 */
export const cardKind = (
  work: Pick<Work, "category" | "featured">,
): CardStyle | "featured" =>
  work.featured ? "featured" : cardStyles[work.category];
