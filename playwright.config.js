import { defineConfig, devices } from "@playwright/test";
import { responsiveViewports } from "./tests/e2e/responsive-helpers.js";

const responsiveTestFiles = /responsive-(?:home|game)\.spec\.js/;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 15000,
  fullyParallel: true,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:5175",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    ...devices["Desktop Chrome"],
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 5175",
    url: "http://127.0.0.1:5175",
    reuseExistingServer: true,
  },
  projects: [
    {
      name: "desktop",
      testIgnore: responsiveTestFiles,
      use: devices["Desktop Chrome"],
    },
    ...responsiveViewports.map(({ name, viewport }) => ({
      name,
      testMatch: responsiveTestFiles,
      use: {
        ...devices["Desktop Chrome"],
        viewport,
      },
    })),
  ],
});
