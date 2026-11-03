import type { Category } from "@/config/works";
import MoonIcon from "@/components/icons/MoonIcon.astro";
import SunLowIcon from "@/components/icons/SunLowIcon.astro";
import SunHighIcon from "@/components/icons/SunHighIcon.astro";
import Sunset2Icon from "@/components/icons/Sunset2Icon.astro";

/**
 * The sky of each category, from morning to night in the categories' order:
 * the icons of the hero's category navigation and of the time rail.
 */
export const categorySky = {
  keyboards: SunLowIcon,
  apps: SunHighIcon,
  libraries: Sunset2Icon,
  "vr-3d": MoonIcon,
} satisfies Record<Category, typeof MoonIcon>;
