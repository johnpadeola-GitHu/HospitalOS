import { test, expect } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test.use({ storageState: path.join(__dirname, "../../.auth/superadmin.json") });

// Smoke tests: fast, critical-path only — "is the app fundamentally
// alive," not "does every workflow behave correctly." These should run
// in seconds and catch a genuinely broken build, not subtle logic bugs.
test.describe("Application is alive @smoke", () => {
  test("dashboard loads after sign-in with the sidebar fully rendered", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({ timeout: 15000 });

    // Super Admin's account has all 13 areas — confirmed directly
    // against rbac.js's AREAS list and navGroups.js's NAV_GROUPS ids,
    // which match exactly (checked, not assumed) — so this is a real,
    // accurate count for this specific account, not a guess.
    const groupHeaders = page.locator("nav button[aria-expanded]");
    await expect(groupHeaders).toHaveCount(13);
  });

  test("search palette opens and closes", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("heading", { name: "Dashboard" }).waitFor({ timeout: 15000 });

    await page.keyboard.press("Control+k");
    const searchInput = page.getByPlaceholder("Search patients, screens, help…");
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    await page.keyboard.press("Escape");
    await expect(searchInput).not.toBeVisible({ timeout: 5000 });
  });
});
