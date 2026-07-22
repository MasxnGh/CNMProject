import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 15000,
  fullyParallel: true,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:5175",
    trace: "on-first-retry",
    screenshot: "on",
    ...devices["Desktop Chrome"],
  },
});
