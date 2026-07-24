import { defineConfig, devices } from "@playwright/test";

const BASE_URL = process.env.HOSPITALOS_BASE_URL || "https://hospitalos.agorox.africa";

export default defineConfig({
  testDir: "./e2e/specs",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ["html", { open: "never", outputFolder: "playwright-report" }],
    ["json", { outputFile: "e2e-results/results.json" }],
    ["list"],
  ],
  use: {
    baseURL: BASE_URL,
    trace: "on",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /.*\.setup\.js/, testDir: "./e2e" },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },
  ],
});