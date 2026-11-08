import { useEffect, useState } from "react";

export interface HueStop {
  /** The hue group's section id (palette-<collection>-<hue>). */
  id: string;
  /** The hue's name, shown on hover and focus. */
  name: string;
  /** The hue's name and number of colors, read out. */
  label: string;
  color: string;
}

/**
 * A rail of hue dots (links) at the screen's right edge while the hue groups are on
 * screen: a link to each group, with the group at the middle of the screen
 * drawn as a capsule.
 */
export default function HueRail({
  stops,
  label,
  gridSelector,
}: {
  stops: HueStop[];
  /** The rail's accessible name. */
  label: string;
  /** The element holding the groups. */
  gridSelector: string;
}) {
  const [shown, setShown] = useState(false);
  const [current, setCurrent] = useState<string | null>(null);
  const ids = stops.map((stop) => stop.id).join(" ");

  useEffect(() => {
    const update = () => {
      const grid = document.querySelector<HTMLElement>(gridSelector);
      if (!grid) return;
      const middle = innerHeight / 2;
      const box = grid.getBoundingClientRect();
      setShown(box.top < middle && box.bottom > middle);
      // The last group whose top is above the middle of the screen.
      let at: string | null = null;
      for (const id of ids.split(" ")) {
        const top = document.getElementById(id)?.getBoundingClientRect().top;
        if (top !== undefined && top <= middle) at = id;
      }
      setCurrent(at);
    };
    update();
    addEventListener("scroll", update, { passive: true });
    addEventListener("resize", update);
    return () => {
      removeEventListener("scroll", update);
      removeEventListener("resize", update);
    };
  }, [ids, gridSelector]);

  return (
    <nav
      className="palette-hue-rail"
      aria-label={label}
      data-shown={shown || undefined}
    >
      {stops.map((stop) => (
        <a
          key={stop.id}
          href={`#${stop.id}`}
          aria-label={stop.label}
          aria-current={stop.id === current ? "location" : undefined}
          style={{ backgroundColor: stop.color }}
        >
          <span className="palette-hue-rail-name" aria-hidden="true">
            {stop.name}
          </span>
        </a>
      ))}
    </nav>
  );
}
