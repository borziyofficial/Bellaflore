import { defineConfig } from "@playwright/test";

const baseURL =
  process.env.BASE_URL?.trim() || "https://sandbox.bellaflore.ru";

export default defineConfig({
  testDir: "./tests/orders",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL,
  },
});
