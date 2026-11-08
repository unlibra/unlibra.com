/** How long the color takes to flood the screen, or to shrink back. */
export const SWEEP = 400;

/**
 * The color floods the screen from a swatch ("out"), or shrinks back into
 * it ("in"), as Just HEX's color screen does: a layer of the color whose
 * circle grows or shrinks between the swatch's and one that covers the
 * screen. `swap` changes the page under the layer: after the flood (the
 * color's page comes under it), or before the shrink (the list is there to
 * shrink into; `origin` is measured after it). With reduced motion, the
 * page just changes.
 */
export async function sweep(
  hex: string,
  direction: "out" | "in",
  origin: () => Element | null,
  swap: () => void,
): Promise<void> {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    swap();
    return;
  }
  const layer = document.createElement("div");
  layer.setAttribute("aria-hidden", "true");
  layer.dataset.paletteFlood = direction;
  layer.style.cssText = `position: fixed; inset: 0; z-index: 100; pointer-events: none; background: ${hex};`;
  document.body.append(layer);
  if (direction === "in") swap();
  const box = origin()?.getBoundingClientRect();
  const x = box ? box.left + box.width / 2 : innerWidth / 2;
  const y = box ? box.top + box.height / 2 : innerHeight / 2;
  const start = box ? Math.min(box.width, box.height) / 2 : 0;
  const radius = Math.hypot(
    Math.max(x, innerWidth - x),
    Math.max(y, innerHeight - y),
  );
  const frames = [
    { clipPath: `circle(${start}px at ${x}px ${y}px)` },
    { clipPath: `circle(${radius}px at ${x}px ${y}px)` },
  ];
  if (direction === "in") frames.reverse();
  await layer
    .animate(frames, {
      duration: SWEEP,
      easing: "cubic-bezier(0.4, 0, 0.2, 1)",
    })
    .finished.catch(() => undefined);
  if (direction === "in") {
    layer.remove();
    return;
  }
  swap();
  // The page's color fills only its top: the layer fades to show the rest.
  await layer
    .animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160 })
    .finished.catch(() => undefined);
  layer.remove();
}
