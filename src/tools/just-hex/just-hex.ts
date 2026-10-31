// Just HEX in the browser: the top page's form and its share dialog, the
// color screen and its dock, and the color flooding the screen and
// shrinking back. The page (src/components/pages/HexPage.astro) has the
// markup and calls startJustHex.
import {
  hexLocale,
  hexPath,
  invalidParam,
  invalidPath,
  parseHex,
  sharePath,
  toneOf,
  type Hex,
  type HexLocale,
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
  /** The page's language, as the page writes it on the form. */
  const lang: HexLocale = hexLocale(form.dataset.hexLocale);
  /** The top page in the page's language (/hex or /en/hex). */
  const top = hexPath(lang);
  const input = element<HTMLInputElement>("[data-hex-input]");
  const submit = element<HTMLButtonElement>("[data-hex-submit]");
  const stage = element<HTMLElement>("[data-hex-stage]");
  const error = element<HTMLElement>("[data-hex-error]");
  const shareOpen = element<HTMLButtonElement>("[data-hex-share-open]");
  const discover = element<HTMLButtonElement>("[data-hex-discover]");
  const discoverStatus = element<HTMLElement>("[data-hex-discover-status]");
  const dockDiscover = element<HTMLButtonElement>("[data-hex-dock-discover]");
  const dialog = element<HTMLDialogElement>("[data-hex-dialog]");
  const dialogClose = element<HTMLButtonElement>("[data-hex-dialog-close]");
  const dialogUrl = element<HTMLElement>("[data-hex-dialog-url]");
  const dialogCopy = element<HTMLButtonElement>("[data-hex-dialog-copy]");
  const dialogX = element<HTMLAnchorElement>("[data-hex-dialog-x]");
  const dialogStatus = element<HTMLElement>("[data-hex-dialog-status]");
  const topTitle = document.title;

  let shown: Hex | null = null;
  let dockTimer: ReturnType<typeof setTimeout> | undefined;

  /** How long the dock stays: after the pointer stops, on opening, on a tap. */
  const DOCK_IDLE = 2000;
  const DOCK_INTRO = 3000;
  const DOCK_TAP = 3000;

  /** A random RGB color, excluding the current one when there is one. */
  const randomHex = (current: Hex | null): Hex => {
    // Sample the remaining colors directly, without retrying a repeated color.
    let value = Math.floor(
      Math.random() * (current === null ? 0x1000000 : 0xffffff),
    );
    if (current !== null && value >= parseInt(current, 16)) value += 1;
    return value.toString(16).toUpperCase().padStart(6, "0") as Hex;
  };

  /** A color's URL to share: its page, with the color's OGP. */
  const shareUrl = (hex: Hex) => site.url + sharePath(hex, lang);

  /**
   * The Tweet intent as X documents it (/intent/tweet): on a phone with the
   * X app, it opens the app's composer. The undocumented alias /intent/post
   * went through an in-app browser instead (to X's login). The post reads
   * "Just HEX | URL".
   */
  const xIntent = (hex: Hex) =>
    `https://x.com/intent/tweet?${new URLSearchParams({
      text: t.shareText,
      url: shareUrl(hex),
    })}`;

  /**
   * The button takes the input's color (on the stage, --swatch), its arrow
   * black or white for contrast; a code that is not a color leaves the
   * button empty (the arrow alone), and Share cannot be pressed.
   */
  const paintButton = () => {
    const hex = parseHex(input.value);
    shareOpen.disabled = !hex;
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
   * The color floods the screen from the pressed button ("out"), or
   * shrinks back into it ("in"), as a layer of the color whose circle grows
   * or shrinks between the button's and one that covers the screen. `swap`
   * changes the page under the layer: after the flood (the color screen
   * comes under it in the same color), or before the shrink (the top page is
   * there to shrink into). With reduced motion, the page just changes.
   */
  const sweep = async (
    hex: Hex,
    direction: "out" | "in",
    origin: HTMLElement,
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
    const { left, top, width, height } = origin.getBoundingClientRect();
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

  /**
   * A copy button: it copies the color's link with the text of a post
   * ("Just HEX | URL"), shows a check for 2 seconds (data-copied) and says
   * so in its status (in the dialog, a status outside it is not read).
   */
  const copyButton = (button: HTMLButtonElement, statusOf: HTMLElement) => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const reset = () => {
      clearTimeout(timer);
      delete button.dataset.copied;
      statusOf.textContent = "";
    };
    const copyLink = async (hex: Hex) => {
      reset();
      try {
        await navigator.clipboard.writeText(`${t.shareText} ${shareUrl(hex)}`);
        button.dataset.copied = "";
        statusOf.textContent = t.copied;
        timer = setTimeout(reset, 2000);
      } catch (err) {
        statusOf.textContent = t.copyFailed;
        console.error("Failed to copy:", err);
      }
    };
    return { reset, copyLink };
  };

  const dockCopy = copyButton(copy, status);
  const dialogCopier = copyButton(dialogCopy, dialogStatus);

  /** The kind of the last pointer: a tap leaves :hover on what it hit. */
  let lastPointer = "mouse";

  const hideDock = () => {
    clearTimeout(dockTimer);
    // Never under the pointer, or with the keyboard's focus in it. A button
    // pressed with the mouse keeps the focus too, but not :focus-visible,
    // so the dock still hides once the pointer leaves it. After a tap, the
    // button keeps :hover until the next tap elsewhere: no pointer is over
    // it, so the dock hides all the same.
    const hovered = lastPointer !== "touch" && dock.matches(":hover");
    if (sweeping || hovered || dock.matches(":has(:focus-visible)")) {
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
    dockCopy.reset();
    if (!hex) {
      clearTimeout(dockTimer);
      dockTimer = undefined;
      delete root.dataset.dock;
      delete root.dataset.hex;
      root.style.removeProperty("--hex");
      document.title = topTitle;
      return;
    }
    // After a color, the top page no longer fades into view (the color
    // shrinks back into its button).
    root.dataset.hexSeen = "";
    root.dataset.hex = "";
    root.style.setProperty("--hex", `#${hex}`);
    // The dock is the color's opposite: dark on a light color, light on a
    // dark one.
    dock.dataset.tone = toneOf(hex);
    document.title = `${withHex(t.colorTitle, hex)} - ${site.title}`;
    // Back on the top page, the input has the last color.
    setInput(`#${hex}`);
    share.href = xIntent(hex);
    // On coming to a color, the dock shows for a moment, so that it is
    // found.
    if (!root.hasAttribute("data-dock")) showDock(DOCK_INTRO);
  };

  /** A text of the URL as written (decoded when it can be). */
  const decoded = (text: string) => {
    try {
      return decodeURIComponent(text);
    } catch {
      return text;
    }
  };

  /**
   * The code the URL names: the path's (/hex/FFFFFF), or the hash's on the
   * top page (/hex#fff, also where /hex/#fff comes: the static assets
   * redirect /hex/ to /hex, and the browser keeps the hash).
   */
  const urlCode = () => {
    const { pathname, hash } = location;
    if (pathname.startsWith(`${top}/`)) {
      const path = decoded(pathname.slice(top.length + 1));
      if (path) return path;
    }
    return decoded(hash.slice(1));
  };

  /**
   * Shows the URL's color at /hex/FFFFFF; the top page is /hex. A code that
   * is no color comes to /hex?invalid=zzz (as the Worker sends /hex/zzz),
   * the form with the code in the input and the error.
   */
  const read = () => {
    const code = urlCode();
    const hex = code ? parseHex(code) : null;
    const here = location.pathname + location.search + location.hash;
    // The entry's state (Show's fromTop) is kept.
    if (hex && here !== sharePath(hex, lang)) {
      history.replaceState(history.state, "", sharePath(hex, lang));
    } else if (code && !hex) {
      history.replaceState(history.state, "", invalidPath(code, lang));
    } else if (!code && here !== top && !location.search) {
      history.replaceState(history.state, "", top);
    }
    const invalid = hex
      ? null
      : new URLSearchParams(location.search).get(invalidParam);
    if (invalid !== null) {
      setInput(invalid);
      setError(true);
    }
    show(hex);
  };

  // A mouse that moves shows the dock; a tap on the color shows it or, when
  // it is shown, hides it. The keyboard's focus in it keeps it.
  window.addEventListener("pointermove", (event) => {
    lastPointer = event.pointerType;
    if (event.pointerType !== "touch") showDock(DOCK_IDLE);
  });
  window.addEventListener("pointerdown", (event) => {
    lastPointer = event.pointerType;
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

  copy.addEventListener("click", () => {
    if (shown) void dockCopy.copyLink(shown);
  });

  discover.addEventListener("click", () => {
    if (sweeping) return;
    const hex = randomHex(parseHex(input.value));
    setError(false);
    delete input.dataset.shake;
    setInput(`#${hex}`);
    // A new valid choice also replaces a URL holding an invalid input.
    if (location.search || location.hash)
      history.replaceState(history.state, "", top);
    discoverStatus.textContent = withHex(t.discovered, hex);
  });

  dockDiscover.addEventListener("click", () => {
    if (!shown || sweeping) return;
    const hex = randomHex(shown);
    const previousColor = shown;
    const previousUrl = location.href;
    void sweep(hex, "out", dockDiscover, () => {
      // Navigation during the animation takes precedence over this choice.
      if (shown !== previousColor || location.href !== previousUrl) return;
      // Keep the entry and its fromTop state: Back to Just HEX must still
      // return to the form after any number of discoveries.
      history.replaceState(history.state, "", sharePath(hex, lang));
      read();
      showDock(DOCK_TAP);
      status.textContent = withHex(t.discovered, hex);
    });
  });

  /** The color the dialog shares: the input's, when it opened. */
  let sharing: Hex | null = null;

  // Share opens the dialog, its card in the input's color.
  shareOpen.addEventListener("click", () => {
    const hex = parseHex(input.value);
    if (!hex || sweeping) return;
    sharing = hex;
    dialogCopier.reset();
    dialog.style.setProperty("--share", `#${hex}`);
    dialogUrl.textContent = new URL(shareUrl(hex)).host + sharePath(hex, lang);
    dialogX.href = xIntent(hex);
    dialog.showModal();
  });
  dialogCopy.addEventListener("click", () => {
    if (sharing) void dialogCopier.copyLink(sharing);
  });
  dialogClose.addEventListener("click", () => dialog.close());
  // A click on the dialog element itself is on the backdrop.
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
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
    void sweep(shown, "in", submit, () => {
      history.pushState(null, "", top);
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
    // A code on the top page is one that is no color (/hex?invalid=nope):
    // leave it, so that coming back here does not put it in the input
    // again.
    if (location.search || location.hash) {
      history.replaceState(history.state, "", top);
    }
    await sweep(hex, "out", submit, () => {
      history.pushState({ fromTop: true }, "", sharePath(hex, lang));
      read();
    });
  });
  input.addEventListener("input", () => {
    setError(false);
    paintButton();
  });
  input.addEventListener("animationend", () => delete input.dataset.shake);

  // Going back and forth (/hex <-> /hex/FFFFFF) is a popstate; a hash typed
  // in the address bar is a hashchange. Leaving a color for the top page,
  // the color shrinks into the button.
  window.addEventListener("popstate", () => {
    const code = urlCode();
    if (shown && !(code && parseHex(code)) && !sweeping) {
      void sweep(shown, "in", submit, read);
    } else {
      read();
    }
  });
  window.addEventListener("hashchange", read);
  read();
  if (!shown && !input.value) setInput("#59B9C6");
  // The first color is in: the top page appears (a frame later, so that the
  // button does not fade into its first color).
  requestAnimationFrame(() => {
    stage.dataset.ready = "";
  });
};
