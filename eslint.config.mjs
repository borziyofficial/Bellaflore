import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Legacy Node audit utility intentionally uses CommonJS.
  {
    files: ["audit-categories.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  // PostgreSQL driver errors can expose a runtime `code` property that is
  // not part of the standard Error type. Keep this narrow exception local.
  {
    files: ["lib/deliveryZonesDb.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "Codex.app/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
