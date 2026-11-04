// Site datasets are passed into the standalone MIT UI as props.
import { japanese, world } from "@/data/palettes/named-colors";
import nord from "@/data/palettes/nord.json";
import tailwind from "@/data/palettes/tailwind.json";
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
};
