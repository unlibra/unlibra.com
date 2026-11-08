// Each palette's colors as its page shows them (/palette/<slug>.json), for
// switching palettes in place on a palette page.
import type { APIRoute, GetStaticPaths } from "astro";
import { colors } from "@/components/palettes/data";
import { collectionIds, collectionSlugs } from "@/tools/color-palettes/data";

export const getStaticPaths = (() =>
  collectionIds.map((collection) => ({
    params: { palette: collectionSlugs[collection] },
    props: { collection },
  }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) =>
  new Response(
    JSON.stringify({
      collection: props.collection,
      colors: colors[props.collection as keyof typeof colors],
    }),
    { headers: { "Content-Type": "application/json; charset=utf-8" } },
  );
