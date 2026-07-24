import { test, expect } from "../../fixtures/pages.fixture.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Uses the demo Super Admin's saved session — Super Admin can reach
// every area including Finance, so this runs correctly today. Swap
// this to a dedicated Cashier account's storageState once one exists
// (see e2e/README.md) for a more representative test of the role this
// screen is actually built for.
test.use({ storageState: path.join(__dirname, "../../.auth/superadmin.json") });

test.describe("Cash session lifecycle @regression @finance", () => {
  test("open a session, see it reflected, then close it honestly", async ({ paymentsPage }) => {
    await paymentsPage.goto();

    // Baseline: confirm the till's actual current state before assuming
    // anything — a session left open by a previous run makes the "Open"
    // trigger absent, which is real, correct behavior (only one session
    // per cashier at a time), not a bug in this test.
    if (await paymentsPage.hasOpenSession()) {
      test.skip(true, "A cash session is already open on this account from a prior run — close it manually once, then re-run.");
    }

    await expect(paymentsPage.openSessionTrigger).toBeVisible();
    await paymentsPage.openSession(20000);
    await expect(paymentsPage.closeSessionTrigger).toBeVisible();

    const result = await paymentsPage.closeSession(20000);

    // A perfectly matched count (no Cash payments taken during this
    // session) should show zero variance, in the app's real Naira
    // formatting (₦0, confirmed against the naira() helper's actual
    // Math.round().toLocaleString() output) — not a hardcoded
    // expectation independent of what was actually entered.
    expect(result.variance).toContain("₦0");
    await expect(paymentsPage.openSessionTrigger).toBeVisible();
  });
});
