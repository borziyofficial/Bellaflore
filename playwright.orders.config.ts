import { defineConfig } from "@playwright/test";

const baseURL = process.env.BASE_URL?.trim() || "http://127.0.0.1:3000";

export default defineConfig({
  testDir: "./tests/orders",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 1,
  reporter: [["list"]],
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
  use: {
    baseURL,
  },
});
