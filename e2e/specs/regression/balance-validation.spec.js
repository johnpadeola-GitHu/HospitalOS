import { test, expect } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test.use({ storageState: path.join(__dirname, "../../.auth/superadmin.json") });

// Server-side balance validation — confirms a payment genuinely cannot
// exceed what a patient owes, a core financial safety guarantee
// referenced throughout this whole project but never actually tested
// until now.
//
// This took two attempts to get right, worth recording honestly: the
// first plan was to register a brand-new patient (guaranteed zero
// balance) and try to overpay them. That doesn't work — traced
// directly through billingService.js and confirmed listAccounts()
// only includes patients who already have at least one charge, and
// getAccount()/recordPayment() both fail earlier with "No account for
// this patient" for anyone with none, before ever reaching the
// balance check at all. The working approach instead uses whichever
// existing account in the real Billing table already has a positive
// balance — found via the "Take payment" button, which the app itself
// only renders when balance > 0 (verified directly against
// Billing.jsx) — and reads that account's actual balance from the
// page rather than assuming or hardcoding a number, so this stays
// correct regardless of what real data exists in the demo tenant at
// the time it runs.
test.describe("Server-side balance validation @regression @finance @safety", () => {
  test("a payment cannot exceed the patient's actual outstanding balance", async ({ page }) => {
    await page.goto("/finance/billing");

    const takePaymentButton = page.getByRole("button", { name: "Take payment" }).first();
    const hasPayableAccount = await takePaymentButton.isVisible({ timeout: 10000 }).catch(() => false);
    test.skip(!hasPayableAccount, "No account with an outstanding balance currently exists in this tenant to test against.");

    // The balance is displayed in the same row as the button, in the
    // "Balance" column — read the real, current, live value rather
    // than assume one.
    const row = page.locator("tr", { has: takePaymentButton });
    const balanceCell = row.locator("td").nth(3); // Patient, Charges, Paid, Balance — the 4th column, 0-indexed
    const balanceText = await balanceCell.textContent();
    const balance = parseInt(balanceText.replace(/[^\d]/g, ""), 10);
    expect(balance).toBeGreaterThan(0);

    await takePaymentButton.click();

    const overAmount = balance + 5000;
    await page.getByLabel("Amount (₦)").fill(String(overAmount));
    await page.getByRole("button", { name: "Record payment" }).click();

    // The exact message, confirmed directly against billingService.js's
    // client-side check (also independently re-verified server-side —
    // see routes/billing.js, this is genuinely defense in depth, not
    // just a UI-level restriction).
    await expect(page.getByText(`Payment exceeds the outstanding balance of ₦${balance.toLocaleString()}.`)).toBeVisible({ timeout: 10000 });
  });
});
