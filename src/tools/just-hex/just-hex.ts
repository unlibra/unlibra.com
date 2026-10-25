// Just HEX in the browser: the top page's form and the color screen, its
// dock, and the color flooding the screen and shrinking back. The page
// (src/pages/hex.astro) has the markup and calls startJustHex.
import {
  hexPath,
  parseHex,
  screenPath,
  screenUrl,
  sharePath,
  toneOf,
  type Hex,
} from "./hex";
import { hexMessages as t, withHex } from "./messages";

/** The site the page is on: its origin for the share URLs, its name for titles. */
export interface JustHexSite {
  url: string;
  title: string;
}

export const startJustHex = (site: JustHexSite): void => {
  const element = <T extends Element>(selector: string): T => {
    const found = document.querySelector<T>(selector);
    if (!found) throw new Error(`Just HEX: ${selector} is missing`);
    return found;
  };

  const root = document.documentElement;
  const dock = element<HTMLElement>("[data-hex-dock]");
  const copy = element<HTMLButtonElement>("[data-hex-copy]");
  const share = element<HTMLAnchorElement>("[data-hex-share]");
  const topLink = element<HTMLAnchorElement>("[data-hex-top]");
  const status = element<HTMLElement>("[data-hex-status]");
  const form = element<HTMLFormElement>("[data-hex-form]");
  const input = element<HTMLInputElement>("[data-hex-input]");
  const submit = element<HTMLButtonElement>("[data-hex-submit]");
  const stage = element<HTMLElement>("[data-hex-stage]");
  const error = element<HTMLElement>("[data-hex-error]");
  const topTitle = document.title;

  let shown: Hex | null = null;
  let copyTimer: ReturnType<typeof setTimeout> | undefined;
  let dockTimer: ReturnType<typeof setTimeout> | undefined;

  /** How long the dock stays: after the pointer stops, on opening, on a tap. */
  const DOCK_IDLE = 2000;
  const DOCK_INTRO = 3000;
  const DOCK_TAP = 3000;

  /** A random color, for the input on opening. */
  const randomHex = () =>
    Math.floor(Math.random() * 0x1000000)
      .toString(16)
      .padStart(6, "0");

  /**
   * The button takes the input's color (on the stage, --swatch), its arrow
   * black or white for contrast; a code that is not a color leaves the
   * button empty (the arrow alone).
   */
  const paintButton = () => {
    const hex = parseHex(input.value);
    if (!hex) {
      submit.dataset.empty = "";
      stage.style.removeProperty("--swatch");
      delete submit.dataset.tone;
      return;
    }
    delete submit.dataset.empty;
    stage.style.setProperty("--swatch", `#${hex}`);
    submit.dataset.tone = toneOf(hex);
  };

  /** How long the color takes to flood the screen, or to shrink back. */
  const SWEEP = 400;

  /**
   * The color floods the screen from the top page's button ("out"), or
   * shrinks back into it ("in"), as a layer of the color whose circle grows
   * or shrinks between the button's and one that covers the screen. `swap`
   * changes the page under the layer: after the flood (the color screen
   * comes under it in the same color), or before the shrink (the top page is
   * there to shrink into). With reduced motion, the page just changes.
   */
  const sweep = async (
    hex: Hex,
    direction: "out" | "in",
    swap: () => void,
  ): Promise<void> => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      swap();
      return;
    }
    sweeping = true;
    const layer = document.createElement("div");
    layer.setAttribute("aria-hidden", "true");
    layer.dataset.hexFlood = direction;
    layer.style.cssText = `position: fixed; inset: 0; z-index: 100; pointer-events: none; background: #${hex};`;
    document.body.append(layer);
    if (direction === "in") {
      swap();
      // The button is measured on the top page, from its top.
      scrollTo(0, 0);
    }
    const { left, top, width, height } = submit.getBoundingClientRect();
    const x = left + width / 2;
    const y = top + height / 2;
    const radius = Math.hypot(
      Math.max(x, innerWidth - x),
      Math.max(y, innerHeight - y),
    );
    const frames = [
      { clipPath: `circle(${width / 2}px at ${x}px ${y}px)` },
      { clipPath: `circle(${radius}px at ${x}px ${y}px)` },
    ];
    if (direction === "in") frames.reverse();
    await layer
      .animate(frames, {
        duration: SWEEP,
        easing: "cubic-bezier(0.4, 0, 0.2, 1)",
      })
      .finished.catch(() => undefined);
    sweeping = false;
    if (direction === "in") {
      layer.remove();
      return;
    }
    swap();
    // Gone after the color screen is drawn under it.
    requestAnimationFrame(() => requestAnimationFrame(() => layer.remove()));
  };

  let sweeping = false;

  const setInput = (value: string) => {
    input.value = value;
    paintButton();
  };

  const setError = (invalid: boolean) => {
    error.textContent = invalid ? t.invalid : "";
    if (invalid) input.setAttribute("aria-invalid", "true");
    else input.removeAttribute("aria-invalid");
  };

  const resetCopy = () => {
    clearTimeout(copyTimer);
    delete copy.dataset.copied;
    status.textContent = "";
  };

  const hideDock = () => {
    clearTimeout(dockTimer);
    // Never under the pointer, or with the keyboard's focus in it. A button
    // pressed with the mouse keeps the focus too, but not :focus-visible,
    // so the dock still hides once the pointer leaves it.
    if (dock.matches(":hover, :has(:focus-visible)")) {
      dockTimer = setTimeout(hideDock, DOCK_IDLE);
      return;
    }
    dockTimer = undefined;
    delete root.dataset.dock;
  };

  /** Shows the dock, and hides it after `ms` without a move. */
  const showDock = (ms: number) => {
    if (!shown) return;
    root.dataset.dock = "";
    clearTimeout(dockTimer);
    dockTimer = setTimeout(hideDock, ms);
  };

  const show = (hex: Hex | null) => {
    shown = hex;
    resetCopy();
    if (!hex) {
      clearTimeout(dockTimer);
      dockTimer = undefined;
      delete root.dataset.dock;
      delete root.dataset.hex;
      root.style.removeProperty("--hex");
      document.title = topTitle;
      return;
    }
    // After a color, the top page no longer rises into place (the color
    // shrinks back into its button).
    root.dataset.hexSeen = "";
    root.dataset.hex = "";
    root.style.setProperty("--hex", `#${hex}`);
    // The dock is the color's opposite: dark on a light color, light on a
    // dark one.
    dock.dataset.tone = toneOf(hex);
    document.title = `${withHex(t.colorTitle, hex)} - ${site.title}`;
    const copyLabel = withHex(t.dock.copy, hex);
    copy.setAttribute("aria-label", copyLabel);
    copy.title = copyLabel;
    // Back on the top page, the input has the last color.
    setInput(`#${hex}`);
    share.href = `https://x.com/intent/post?${new URLSearchParams({
      text: t.shareText,
      url: site.url + sharePath(hex),
    })}`;
    // On coming to a color, the dock shows for a moment, so that it is
    // found.
    if (!root.hasAttribute("data-dock")) showDock(DOCK_INTRO);
  };

  /** The hash as written (decoded when it can be). */
  const rawHash = () => {
    try {
      return decodeURIComponent(location.hash.slice(1));
    } catch {
      return location.hash.slice(1);
    }
  };

  /**
   * Shows the hash's color at /hex/#ffffff; the top page is /hex. A hash
   * that is no color comes back to the form with the code in the input.
   */
  const read = () => {
    const raw = rawHash();
    const hex = raw ? parseHex(raw) : null;
    const here = location.pathname + location.hash;
    if (hex && here !== screenUrl(hex)) {
      history.replaceState(null, "", screenUrl(hex));
    } else if (!raw && location.pathname === screenPath) {
      history.replaceState(null, "", hexPath);
    }
    if (raw && !hex) {
      setInput(raw);
      setError(true);
    }
    show(hex);
  };

  // A mouse that moves shows the dock; a tap on the color shows it or, when
  // it is shown, hides it. The keyboard's focus in it keeps it.
  window.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "touch") showDock(DOCK_IDLE);
  });
  window.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "touch" || dock.contains(event.target as Node)) {
      return;
    }
    if (root.hasAttribute("data-dock")) {
      clearTimeout(dockTimer);
      dockTimer = undefined;
      delete root.dataset.dock;
    } else {
      showDock(DOCK_TAP);
    }
  });
  dock.addEventListener("focusin", () => showDock(DOCK_IDLE));
  dock.addEventListener("focusout", () => showDock(DOCK_IDLE));

  copy.addEventListener("click", async () => {
    if (!shown) return;
    resetCopy();
    try {
      await navigator.clipboard.writeText(`#${shown}`);
      copy.dataset.copied = "";
      status.textContent = t.dock.copied;
      copyTimer = setTimeout(resetCopy, 2000);
    } catch (err) {
      status.textContent = t.dock.copyFailed;
      console.error("Failed to copy:", err);
    }
  });

  /**
   * Back to the top page from the color screen, the color shrinking into
   * the button; the input keeps the color. After a Show, it is the
   * history's back (the top page is the entry before); from a color opened
   * directly, the top page is a new entry.
   */
  const backToTop = () => {
    if (!shown || sweeping) return;
    if ((history.state as { fromTop?: boolean } | null)?.fromTop) {
      history.back();
      return;
    }
    void sweep(shown, "in", () => {
      history.pushState(null, "", hexPath);
      read();
    });
  };

  // The dock's back is a link to /hex (a new tab and the like still work as
  // a link); a plain click goes back in the page.
  topLink.addEventListener("click", (event) => {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    backToTop();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (sweeping) return;
    const hex = parseHex(input.value);
    if (!hex) {
      setError(true);
      delete input.dataset.shake;
      void input.offsetWidth; // restarts the animation
      input.dataset.shake = "";
      input.focus();
      return;
    }
    setError(false);
    await sweep(hex, "out", () => {
      history.pushState({ fromTop: true }, "", screenUrl(hex));
      read();
    });
  });
  input.addEventListener("input", () => {
    setError(false);
    paintButton();
  });
  input.addEventListener("animationend", () => delete input.dataset.shake);

  // The path changes with the hash (/hex <-> /hex/#ffffff), so going back
  // and forth is a popstate; a hash typed in the address bar is a hashchange.
  // Leaving a color for the top page, the color shrinks into the button.
  window.addEventListener("popstate", () => {
    const raw = rawHash();
    if (shown && !(raw && parseHex(raw)) && !sweeping) {
      void sweep(shown, "in", read);
    } else {
      read();
    }
  });
  window.addEventListener("hashchange", read);
  read();
  if (!shown && !input.value) setInput(`#${randomHex()}`);
};
