// Site datasets are passed into the standalone MIT UI as props.
import { japanese, world } from "@/data/palettes/named-colors";
import nord from "@/data/palettes/nord.json";
import jis from "@/data/palettes/jis.json";
import tailwind from "@/data/palettes/tailwind.json";
import radix from "@/data/palettes/radix.json";
import catppuccin from "@/data/palettes/catppuccin.json";
import dracula from "@/data/palettes/dracula.json";
import openColor from "@/data/palettes/open-color.json";
import munsellEstimates from "@/data/palettes/munsell-estimates.json";
import {
  references,
  type CollectionId,
  type PaletteColor,
} from "@/tools/color-palettes/data";

const nordGroups = ["Polar Night", "Snow Storm", "Frost", "Aurora"];
const nordGroup = (index: number) =>
  nordGroups[index < 4 ? 0 : index < 7 ? 1 : index < 11 ? 2 : 3];
export const colors: Record<CollectionId, PaletteColor[]> = {
  japanese: japanese.colors.map((color) => ({ ...color, group: "" })),
  world: world.colors.map((color) => ({ ...color, group: "" })),
  jis: jis.colors.map((color) => ({ ...color, group: "" })),
  tailwind: tailwind.colors.map((color) => ({
    ...color,
    name: color.id,
    group: color.family,
    source: references.tailwind.url,
  })),
  nord: nord.colors.map((color, index) => ({
    ...color,
    name: color.id,
    group: nordGroup(index),
    source: nord.source,
  })),
  radix: radix.colors,
  catppuccin: catppuccin.colors.map((color) => ({
    ...color,
    source: catppuccin.source,
  })),
  dracula: dracula.colors.map((color) => ({
    ...color,
    source: dracula.source,
  })),
  "open-color": openColor.colors.map((color) => ({
    ...color,
    source: openColor.source,
  })),
};
for (const items of Object.values(colors)) {
  for (const color of items) {
    const estimate = (munsellEstimates.values as Record<string, string>)[
      color.hex
    ];
    if (!estimate) throw new Error(`Missing Munsell estimate: ${color.hex}`);
    color.munsellEstimate = estimate;
  }
}
