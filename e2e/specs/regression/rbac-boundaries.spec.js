import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Each entry: a role expected to be BLOCKED from a given route, and the
// route it should be blocked from. This is the actual point of this
// file — proving a restriction is enforced, not just that an allowed
// role can reach an allowed screen (which is a much weaker guarantee).
// Paths below were checked directly against navGroups.js — an earlier
// draft guessed two of these wrong (/patients/registration, /diagnostics/lab)
// before being corrected against the real routes (/patients/adt, /lab).
const BOUNDARIES = [
  { role: "cashier", path: "/patients/adt", area: "Patient care", reason: "Cashier has no Patient care area at all" },
  { role: "nurse", path: "/finance/billing", area: "Finance & trade", reason: "Nurse has no Finance area at all" },
  { role: "pharmacist", path: "/lab", area: "Diagnostics", reason: "Pharmacist has no Diagnostics area at all" },
];

for (const b of BOUNDARIES) {
  test.describe(`RBAC boundary — ${b.role} @regression @rbac`, () => {
    const authFile = path.join(__dirname, `../../.auth/${b.role}.json`);

    test(`${b.role} cannot reach ${b.path} (${b.reason})`, async ({ browser }) => {
      test.skip(
        !fs.existsSync(authFile),
        `No saved session for "${b.role}" — create this test account first (see e2e/README.md), then re-run "npm run e2e:setup" to generate .auth/${b.role}.json.`
      );

      const context = await browser.newContext({ storageState: authFile });
      const page = await context.newPage();

      // Direct navigation, not a sidebar click — this specifically
      // proves the server-side area check works even when the UI
      // wouldn't have shown a way to get here at all. A test that only
      // clicked sidebar links could pass even if the route itself were
      // wide open to anyone who typed the URL directly.
      await page.goto(b.path);

      await expect(page.getByRole("heading", { name: "You don't have access to this area" })).toBeVisible({ timeout: 10000 });
      await expect(page.getByText(b.area, { exact: false })).toBeVisible();

      await context.close();
    });
  });
}
