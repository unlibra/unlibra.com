import type { APIRoute, GetStaticPaths } from "astro";
import { japanese, world } from "@/data/palettes/named-colors";
import nord from "@/data/palettes/nord.json";
import tailwind from "@/data/palettes/tailwind.json";
import wada from "@/data/palettes/wada.json";

const datasets = {
  japanese,
  world,
  nord,
  wada,
  tailwind: {
    ...tailwind,
    license: "MIT",
    attribution: "Copyright (c) Tailwind Labs, Inc.",
    source:
      "https://github.com/tailwindlabs/tailwindcss/blob/v4.3.3/packages/tailwindcss/theme.css",
    changes:
      "HEX converted from OKLCH via OKLab to sRGB, clipping out-of-gamut channels. Original OKLCH retained.",
    licenseUrl: "/palette-data/licenses.txt",
  },
};
export const getStaticPaths: GetStaticPaths = () =>
  Object.entries(datasets).map(([collection, data]) => ({
    params: { collection },
    props: { data },
  }));
export const GET: APIRoute = ({ props }) =>
  new Response(JSON.stringify(props.data, null, 2), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
