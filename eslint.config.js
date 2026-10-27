import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import eslintPluginAstro from "eslint-plugin-astro";
import tseslint from "typescript-eslint";

const root = path.dirname(fileURLToPath(import.meta.url));

/**
 * Directories licensed under MIT (web tools and shared UI parts). Everything
 * else in the repository is "All rights reserved".
 */
const mitDirectories = ["src/tools", "src/components/ui"];

/** Repository-relative posix path of an absolute path. */
const fromRoot = (absolute) =>
  path.relative(root, absolute).split(path.sep).join("/");

/** Whether a directory of this name exists at the repository root. */
const isRootDirectory = (name) =>
  name !== "" &&
  !name.startsWith("@") &&
  !name.includes(":") && // virtual modules such as astro:assets
  fs
    .statSync(path.join(root, name), { throwIfNoEntry: false })
    ?.isDirectory() === true;

const isMit = (relative) =>
  mitDirectories.some(
    (dir) => relative === dir || relative.startsWith(`${dir}/`),
  );

/**
 * MIT code must not import "All rights reserved" files, so that the MIT part
 * works on its own when taken out of the repository. Packages are allowed.
 */
const licenseBoundary = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow importing All-rights-reserved files from MIT directories",
    },
    messages: {
      outside:
        "MIT code ({{dirs}}) must not import '{{source}}', which is outside the MIT directories.",
      dynamic:
        "MIT code must use a string literal in dynamic imports so that the license boundary can be checked.",
    },
    schema: [],
  },
  create(context) {
    // `physicalFilename` is the .astro file itself for its <script> blocks.
    const filename = context.physicalFilename;
    if (!isMit(fromRoot(filename))) return {};

    const check = (node, source) => {
      if (!source) return;
      if (source.type !== "Literal" || typeof source.value !== "string") {
        context.report({ node, messageId: "dynamic" });
        return;
      }
      const spec = source.value;
      let target;
      if (spec.startsWith("@/")) {
        target = path.join(root, "src", spec.slice(2));
      } else if (spec.startsWith("/")) {
        // Vite resolves "/src/..." from the project root.
        target = path.join(root, spec);
      } else if (spec.startsWith(".")) {
        target = path.resolve(path.dirname(filename), spec);
      } else if (isRootDirectory(spec.split("/")[0])) {
        // "src/config/site": resolvable from the project root by tools that
        // take a base directory (such as a tsconfig baseUrl).
        target = path.join(root, spec);
      } else {
        return; // A package (or a virtual module such as astro:assets).
      }
      if (!isMit(fromRoot(target))) {
        context.report({
          node,
          messageId: "outside",
          data: { source: spec, dirs: mitDirectories.join(", ") },
        });
      }
    };

    return {
      ImportDeclaration: (node) => check(node, node.source),
      ExportNamedDeclaration: (node) => check(node, node.source),
      ExportAllDeclaration: (node) => check(node, node.source),
      ImportExpression: (node) => check(node, node.source),
      // import("@/x").T in type positions.
      TSImportType: (node) =>
        check(
          node,
          node.argument?.type === "TSLiteralType"
            ? node.argument.literal
            : node.argument,
        ),
      // import x = require("@/x");
      TSImportEqualsDeclaration: (node) => {
        if (node.moduleReference.type === "TSExternalModuleReference") {
          check(node, node.moduleReference.expression);
        }
      },
    };
  },
};

export default [
  // TypeScript files
  ...tseslint.configs.recommended,

  // Astro files
  ...eslintPluginAstro.configs.recommended,

  {
    rules: {
      // Add your custom rules here
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
    },
  },

  // License boundary (P4-1).
  {
    files: mitDirectories.map((dir) => `${dir}/**`),
    plugins: { local: { rules: { "license-boundary": licenseBoundary } } },
    rules: { "local/license-boundary": "error" },
  },

  {
    ignores: [
      "dist/",
      ".astro/",
      ".wrangler/",
      "node_modules/",
      "playwright-report/",
      "test-results/",
      "worker/worker-configuration.d.ts",
    ],
  },
];
