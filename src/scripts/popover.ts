/**
 * Disclosure-style popover without a framework.
 *
 * Markup:
 *   <div data-popover>
 *     <button data-popover-button aria-expanded="false" aria-controls="ID">
 *     <div id="ID" data-popover-panel hidden>
 *       ...elements with data-popover-item...
 *
 * - The button toggles the panel. Opening moves focus to the current item
 *   (aria-pressed="true" or aria-current) or the first item.
 * - Arrow keys, Home, and End move between items.
 * - Escape closes and returns focus to the button.
 * - Clicking outside or moving focus out closes it.
 * - data-mobile-inline keeps the options in the drawer's normal flow on
 *   phones; selection preserves focus and Escape reaches the parent dialog.
 */
export type Popover = { close: (restoreFocus: boolean) => void };

export function setupPopover(root: HTMLElement): Popover {
  const button = root.querySelector<HTMLElement>("[data-popover-button]");
  const panel = root.querySelector<HTMLElement>("[data-popover-panel]");
  if (!button || !panel) {
    throw new Error("data-popover needs a button and a panel");
  }
  const items = () => [
    ...panel.querySelectorAll<HTMLElement>("[data-popover-item]"),
  ];
  const isOpen = () => !panel.hidden;
  const mobile = window.matchMedia("(max-width: 767px)");
  const isInline = () =>
    root.hasAttribute("data-mobile-inline") && mobile.matches;
  const layout = () => {
    root.toggleAttribute("data-inline", isInline());
    button.hidden = isInline();
    panel.hidden = !isInline();
    button.setAttribute("aria-expanded", "false");
  };
  layout();
  mobile.addEventListener("change", layout);

  const open = () => {
    if (isInline()) return;
    panel.hidden = false;
    button.setAttribute("aria-expanded", "true");
    const current = items().find(
      (item) =>
        item.getAttribute("aria-pressed") === "true" ||
        item.hasAttribute("aria-current"),
    );
    (current ?? items()[0])?.focus();
  };

  const close = (restoreFocus: boolean) => {
    if (isInline() || !isOpen()) return;
    panel.hidden = true;
    button.setAttribute("aria-expanded", "false");
    if (restoreFocus) button.focus();
  };

  button.addEventListener("click", () => {
    if (isOpen()) close(false);
    else open();
  });

  root.addEventListener("keydown", (event) => {
    if (isInline() || !isOpen()) return;
    if (event.key === "Escape") {
      event.preventDefault();
      close(true);
      return;
    }
    const list = items();
    const index = list.indexOf(document.activeElement as HTMLElement);
    const target = {
      ArrowDown: list[(index + 1) % list.length],
      ArrowUp: list[index <= 0 ? list.length - 1 : index - 1],
      Home: list[0],
      End: list[list.length - 1],
    }[event.key];
    if (target) {
      event.preventDefault();
      target.focus();
    }
  });

  document.addEventListener("click", (event) => {
    if (!root.contains(event.target as Node)) close(false);
  });

  root.addEventListener("focusout", (event) => {
    const next = event.relatedTarget as Node | null;
    if (next && !root.contains(next)) close(false);
  });

  return { close };
}
