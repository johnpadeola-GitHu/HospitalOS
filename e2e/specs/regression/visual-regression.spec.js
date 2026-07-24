import { test, expect } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test.use({ storageState: path.join(__dirname, "../../.auth/superadmin.json") });

// Visual regression — genuinely new territory for this suite; nothing
// before this checked appearance, only behavior. Scoped deliberately
// to a small number of the most stable, least frequently-redesigned
// screens rather than all 82 routes: a screenshot test on something
// still actively being iterated on would fail constantly for
// legitimate reasons, training whoever reviews it to ignore failures
// — worse than not having the check at all.
//
// IMPORTANT — read before running: this cannot be pre-verified the
// way the rest of this suite was. I have no way to generate or inspect
// a screenshot from this sandbox (no live network access), so there
// are no baseline images committed yet. The first real run will FAIL
// with "no baseline found" for every one of these — that's expected,
// not a bug. Run once locally with --update-snapshots to generate the
// baselines, review them yourself to confirm they actually look
// correct, then commit the generated .png files alongside this test.
// After that, failures mean a real visual change happened — worth a
// deliberate look, not an automatic "update and move on."
test.describe("Visual regression — stable screens @regression @visual", () => {
  test("Dashboard", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("heading", { name: "Dashboard" }).waitFor({ timeout: 15000 });
    // A short settle delay for any live data/animation to finish
    // rendering — this screen pulls real, live stats, so without this
    // the screenshot could catch a mid-load state intermittently.
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot("dashboard.png", { fullPage: true, maxDiffPixelRatio: 0.02 });
  });

  test("Login / activation screen", async ({ browser }) => {
    // Deliberately a fresh, signed-out context — the one screen every
    // single user sees before anything else, and the one most worth
    // catching a visual regression on immediately.
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("/");
    await page.getByRole("heading", { name: "Activate your hospital" }).waitFor({ timeout: 15000 });
    await expect(page).toHaveScreenshot("login.png", { fullPage: true, maxDiffPixelRatio: 0.02 });
    await context.close();
  });

  test("Sidebar navigation, fully expanded", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("heading", { name: "Dashboard" }).waitFor({ timeout: 15000 });
    const sidebar = page.locator("nav").first();
    await expect(sidebar).toHaveScreenshot("sidebar.png", { maxDiffPixelRatio: 0.02 });
  });
});
