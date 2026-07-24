import { defineConfig, devices } from "@playwright/test";

// Points at the REAL, live deployment — not a local dev server, since
// the frontend's own apiCall() functions hit the real Cloudflare Worker
// by absolute URL regardless of how the frontend itself is served.
// There is no meaningful "local" version of this app to test against;
// the backend is always the real one.
const BASE_URL = process.env.HOSPITALOS_BASE_URL || "https://hospitalos.agorox.africa";

export default defineConfig({
  testDir: "./e2e/specs",
  fullyParallel: true,
  // Deliberately conservative retries — a flaky-looking failure against
  // a real backend is more often a genuine timing issue worth seeing
  // (e.g. a real network request that was slower than expected) than
  // something to paper over by silently retrying until it passes.
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ["html", { open: "never", outputFolder: "playwright-report" }],
    // JSON is the real, machine-readable source of truth the QA
    // Command Center reads from — see qa-command-center/README.md. This
    // is what "consume real Playwright results, not fabricated ones"
    // actually means mechanically: the dashboard has no other data
    // source than this file.
    ["json", { outputFile: "e2e-results/results.json" }],
    ["list"],
  ],
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
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
