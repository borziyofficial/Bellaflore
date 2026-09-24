import { defineConfig } from "@playwright/test";

const baseURL =
  process.env.AI_FLOW_BASE_URL?.trim() || "http://127.0.0.1:3000";

export default defineConfig({
  testDir: "./tests/ai-florist",
  testMatch: "order-flow-regression.spec.ts",
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [["list"]],
  timeout: 45_000,
  use: {
    baseURL,
  },
});
