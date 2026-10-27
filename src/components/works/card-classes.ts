// Classes shared by the cards. The photo cards (frame, featured) and the list
// items (Apps, Libraries) differ in layout, but follow the same rules for the
// title, the summary, the links, the corner radius, the focus ring
// (ui-revise3 3) and the hover (ui-revise4 2).

/** The corner radius of the photo cards, the list items and the icons. */
export const cardRadius = "rounded-card";

/** Titles: the same weight and color on every card (the size may differ). */
export const cardTitle = "font-semibold text-gray-900 dark:text-white";

/**
 * Summaries: the same size, line height and color on every card. Text to
 * read: 16px with a 28px line (DADS 1.7, ui-revise7 7).
 */
export const cardSummary =
  "text-base leading-7 text-gray-600 dark:text-gray-400";

/**
 * Links on the cards (the work's actions and "詳しく見る"): the same color
 * and size. The actions end with the up-right arrow (Tabler Icons "arrow-up-right" since ui-revise7),
 * the size of the text (16px since ui-revise7 7) and centered on the line
 * (ui-revise5 6, 8);
 * "詳しく見る" opens the details and has none (ui-revise4 2). The color is
 * the site's link color: 4.5:1 on the cards' hover (gray-100) in light mode,
 * link-dark in dark mode (ui-revise13).
 */
export const cardLink =
  "inline-flex items-center gap-0.5 text-base font-medium text-link dark:text-link-dark";
/** The arrow of an action. It does not move (ui-revise5 5). */
export const actionArrow = "size-4 shrink-0";

/**
 * The text of a card's link, with its underline: a 1px line under the text
 * that grows from the left on hover (200ms), and appears at once under
 * prefers-reduced-motion: reduce (ui-revise5 5). In forced colors (e.g.
 * Windows high contrast), where background images are not drawn, the same
 * hovers give a text-decoration underline instead (actionText, primaryText).
 */
export const linkText =
  "bg-linear-to-r from-current to-current bg-size-[0%_1px] bg-position-[0_100%] bg-no-repeat transition-[background-size] duration-200 ease-out motion-reduce:transition-none";
/** The underline of an action's text: on the action's own hover. */
export const actionText =
  "group-hover/link:bg-size-[100%_1px] forced-colors:group-hover/link:underline";
/**
 * The underline of the card's first link (where a click on the card goes;
 * "詳しく見る" on the cards that open their details): on the card's hover
 * too, but not while the pointer is on another of the card's links
 * (ui-revise5 11).
 */
export const primaryText =
  "group-hover:bg-size-[100%_1px] group-has-[[data-work-action=secondary]:hover]:bg-size-[0%_1px] forced-colors:group-hover:underline forced-colors:group-has-[[data-work-action=secondary]:hover]:no-underline";

/** The keyboard focus ring of the cards and their links. */
export const focusRing =
  "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

/**
 * Every card's hover: the former tool site's card hover (the background
 * fades in, `transition-colors`, 150ms), on keyboard focus on the title
 * too. The photo is not zoomed and the card does not lift (ui-revise4 2).
 */
export const cardHover =
  "transition-colors hover:bg-gray-100 has-[h3_:focus-visible]:bg-gray-100 dark:hover:bg-atom-one-dark-light dark:has-[h3_:focus-visible]:bg-atom-one-dark-light";

/**
 * The large card's surface and hover (ui-revise5, design 4 of the mock in
 * light gray): a light gray surface (gray-50) that is one step darker on
 * hover and on keyboard focus on the title (gray-100, the other cards'
 * hover); in dark mode one step lighter than the page (atom-one-dark-light),
 * and halfway back to the page on hover (#2e323b), so that the gray-400
 * text keeps 4.5:1 (ui-revise5). The same transition as the other cards.
 */
export const featuredSurface =
  "bg-gray-50 transition-colors hover:bg-gray-100 has-[h3_:focus-visible]:bg-gray-100 dark:bg-atom-one-dark-light dark:hover:bg-featured-hover-dark dark:has-[h3_:focus-visible]:bg-featured-hover-dark";
