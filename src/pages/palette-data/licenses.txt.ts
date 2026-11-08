import { readFile } from "node:fs/promises";
import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
  const licenses = await Promise.all(
    [
      "Tailwind-MIT.txt",
      "Nord-MIT.txt",
      "Radix-MIT.txt",
      "Catppuccin-MIT.txt",
      "Dracula-MIT.txt",
      "Open-Color-MIT.txt",
    ].map(
      async (name) =>
        `${name}\n\n${await readFile(new URL(`../../../LICENSES/${name}`, import.meta.url), "utf8")}`,
    ),
  );
  return new Response(licenses.join("\n\n---\n\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
