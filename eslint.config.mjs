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
  // AI florist routes intentionally handle untyped external JSON (OpenAI/tool payloads).
  // Keep the exception scoped to these integration surfaces; the rest of the app
  // remains under the normal strict TypeScript ESLint rules.
  {
    files: [
      "app/api/ai-florist-tools/route.ts",
      "app/api/ai-florist/route.ts",
      "components/aiSalesAgent/AiFloristChat.tsx",
      "components/aiSalesAgent/AiFloristChatWithSummary.tsx",
      "lib/orders/draftRepository.ts",
      "tests/ai-florist/ai-florist-tools-api.spec.ts",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
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
