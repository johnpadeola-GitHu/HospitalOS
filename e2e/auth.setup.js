import { test as setup } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// One saved session per role, so every other test starts already
// signed in instead of re-running sign-in every single test. This is
// the standard Playwright "storageState" pattern, applied per role
// since HospitalOS's real behavior differs meaningfully by role — a
// test suite that only ever signs in once, as one role, would miss
// almost everything RBAC actually does.
//
// CAUTION, read before running this: these accounts must already
// exist and have real passwords set before this setup will work. This
// file does not create them — see e2e/README.md for exactly which
// accounts are expected and how to create them safely, without using
// real hospital staff credentials for automated testing.
const ROLES = {
  superadmin: { email: "demo@agorox.africa", password: "demo-hospital" },
  // Add real per-role test accounts here once created — see README.
  // cashier: { email: "cashier-test@example.com", password: "REPLACE_ME" },
  // nurse: { email: "nurse-test@example.com", password: "REPLACE_ME" },
};

for (const [role, creds] of Object.entries(ROLES)) {
  setup(`authenticate as ${role}`, async ({ page }) => {
    await page.goto("/");

    // Deliberately scoped to the ACTUAL sign-in placeholder text, not a
    // generic input[type=email] selector — the same page also renders
    // the onboarding wizard's own "Work email" field
    // (placeholder "you@hospital.ng", one character different from the
    // sign-in field's "you@hospitalos.ng"), which would make a generic
    // selector ambiguous and fail Playwright's strict-mode check.
    await page.getByPlaceholder("you@hospitalos.ng").fill(creds.email);
    await page.getByPlaceholder("••••••••").fill(creds.password);
    await page.getByRole("button", { name: "Sign in", exact: false }).click();

    // Wait for a genuine post-sign-in signal rather than a fixed delay —
    // the Dashboard is the universal landing screen for every role
    // (confirmed: every role includes "overview" in its area list), so
    // waiting for its heading is a real, role-independent success check.
    await page.getByRole("heading", { name: "Dashboard" }).waitFor({ timeout: 15000 });

    await page.context().storageState({ path: path.join(__dirname, `.auth/${role}.json`) });
  });
}
