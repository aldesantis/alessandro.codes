// @ts-check

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import astro from "eslint-plugin-astro";
import { globalIgnores } from "eslint/config";
import globals from "globals";

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  astro.configs.recommended,
  globalIgnores([".astro/*", ".vercel/*", ".vscode/*", "dist/*", "node_modules/*"]),
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  }
);
