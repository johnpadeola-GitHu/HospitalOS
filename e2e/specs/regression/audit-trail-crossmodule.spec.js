import { test, expect } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test.use({ storageState: path.join(__dirname, "../../.auth/superadmin.json") });

// Deliberately cross-module: registers a real patient in one screen,
// then confirms the exact resulting entry is findable in a completely
// different screen (Administration → Security & audit). This is the
// kind of test the directive specifically asked for over a superficial
// "does the audit page load" check — it proves the actual guarantee
// (every consequential action leaves a real, searchable record) rather
// than just that the audit list renders something.
test.describe("Cross-module: registration writes a real audit entry @regression @audit", () => {
  test("registering a patient produces a matching, searchable audit entry", async ({ page }) => {
    const uniqueSuffix = Date.now();
    const firstName = "E2EAudit";
    const lastName = `AuditCheck${uniqueSuffix}`;

    await page.goto("/patients/adt");
    await page.getByRole("button", { name: "+ Register patient" }).click();
    await page.getByLabel("First name").fill(firstName);
    await page.getByLabel("Last name").fill(lastName);
    await page.getByLabel("Date of birth").fill("1990-01-01");
    await page.getByRole("button", { name: "Register", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Register patient" })).not.toBeVisible({ timeout: 10000 });

    await page.goto("/system/security");
    await page.getByPlaceholder("Search detail, entity, user…").fill(lastName);

    // The exact detail string a real registration writes — checked
    // directly against RegistrationADT.jsx's own record() call
    // (`Registered ${lastName}, ${firstName}`), not a loose substring
    // guess at what an audit log "probably" says.
    await expect(page.getByText(`Registered ${lastName}, ${firstName}`)).toBeVisible({ timeout: 20000 });
  });
});
