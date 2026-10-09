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
  {
    files: ["backend/src/modules/**/*.service.ts", "backend/src/modules/**/*.queries.ts", "backend/src/modules/**/session.snapshot.ts"],
    rules: {
      "no-restricted-imports": ["error", {
        paths: [{ name: "express", message: "Application services must be reusable outside HTTP." }],
        patterns: [{ group: ["**/*.routes.js", "**/app.js"], message: "Services must not depend on HTTP adapters." }],
      }],
      "no-restricted-syntax": ["error", {
        selector: "CallExpression[callee.property.name='query']",
        message: "Keep SQL in repositories and pass the transaction client to them.",
      }],
    },
  },
  {
    files: ["backend/src/modules/**/*.routes.ts"],
    rules: {
      "no-restricted-imports": ["error", {
        paths: [{ name: "pg", message: "HTTP adapters receive application services, not database connections." }],
        patterns: [{ group: ["**/*.repository.js", "**/config/db.js"], message: "Routes must invoke services instead of accessing persistence." }],
      }],
    },
  },
  {
    files: ["backend/src/modules/**/*.repository.ts"],
    rules: {
      "no-restricted-imports": ["error", {
        paths: [{ name: "express", message: "Repositories must not depend on HTTP." }],
        patterns: [{ group: ["**/*.service.js", "**/*.routes.js", "**/config/db.js"], message: "Repositories use the caller's database client; orchestration belongs in services." }],
      }],
    },
  },
);
