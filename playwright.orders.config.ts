import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/orders",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 1,
  reporter: [["list"]],
});
