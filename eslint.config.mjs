import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["**/dist/**", "**/node_modules/**", "landing_page/**"] },
  {
    files: ["**/*.mjs"],
    extends: [js.configs.recommended],
    languageOptions: { globals: globals.node },
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
  },
  {
    files: ["backend/**/*.ts", "frontend/vite.config.ts"],
    languageOptions: { globals: globals.node },
  },
  {
    files: ["frontend/src/**/*.ts", "frontend/src/**/*.tsx"],
    languageOptions: { globals: globals.browser },
  },
);
