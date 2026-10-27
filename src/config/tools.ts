import type { ImageMetadata } from "astro";
import faviconGeneratorIcon from "@/assets/tools/favicon-generator.svg";
import svgOptimizerIcon from "@/assets/tools/svg-optimizer.svg";
import passwordGeneratorIcon from "@/assets/tools/password-generator.svg";
import type { Locale } from "@/config/locales";
import { localizedPath, paths, type SitePath } from "@/config/site";

/** Web tools served under /lab (design doc 3.2), in display order. */
export const toolIds = [
  "svg-optimizer",
  "favicon-generator",
  "password-generator",
] as const;

export type ToolId = (typeof toolIds)[number];

/** Path of a tool page: `/lab/{tool}` (Japanese) or `/en/lab/{tool}`. */
export const toolPath = (id: ToolId, lang: Locale): SitePath =>
  localizedPath(`${paths.tools}/${id}`, lang);

/** Tool icons (square SVGs drawn on a colored circle). */
export const toolIcons: Record<ToolId, ImageMetadata> = {
  "favicon-generator": faviconGeneratorIcon,
  "svg-optimizer": svgOptimizerIcon,
  "password-generator": passwordGeneratorIcon,
};
