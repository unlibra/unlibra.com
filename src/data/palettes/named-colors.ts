import dataset from "./world.json";

// Both collections share the same records and provenance.
export const world = dataset;
export const japanese = {
  ...dataset,
  subsetOf: "world",
  colors: dataset.colors.filter((color) =>
    color.collectionIds.includes("japanese"),
  ),
};
