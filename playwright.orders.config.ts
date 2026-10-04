import { defineConfig } from "@playwright/test";

const baseURL = process.env.BASE_URL?.trim() || "http://localhost:3000";
const useLocalServer = !process.env.BASE_URL?.trim();

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
  webServer: useLocalServer
    ? {
        command: "npm run start",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      }
    : undefined,
});
