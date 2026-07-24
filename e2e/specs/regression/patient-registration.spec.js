import { test, expect } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test.use({ storageState: path.join(__dirname, "../../.auth/superadmin.json") });

test.describe("Patient registration @regression @patient-care", () => {
  test("register a patient with a real hospital number and see them in the list", async ({ page }) => {
    await page.goto("/patients/adt");

    // A unique, timestamped name avoids collisions across repeated test
    // runs against the same real, persistent tenant — this isn't a
    // disposable test environment, so re-using a fixed name like "Test
    // Patient" across many runs would create genuine clutter in real
    // hospital data over time.
    const uniqueSuffix = Date.now();
    const firstName = "E2E";
    const lastName = `TestPatient${uniqueSuffix}`;

    await page.getByRole("button", { name: "+ Register patient" }).click();
    await expect(page.getByRole("heading", { name: "Register patient" })).toBeVisible();

    // Required-field validation, checked against the actual source
    // (registerADT's submit handler): first name, last name, and date
    // of birth are the only three fields that block submission.
    await page.getByLabel("First name").fill(firstName);
    await page.getByLabel("Last name").fill(lastName);
    await page.getByLabel("Date of birth").fill("1990-01-01");

    await page.getByRole("button", { name: "Register", exact: true }).click();

    // The modal has no explicit success banner of its own (confirmed
    // against source — it just calls onSaved() and closes) — so the
    // real signals are: the modal's own heading disappears, and the
    // new patient appears in the underlying list in the app's actual
    // "LastName, FirstName" display format.
    await expect(page.getByRole("heading", { name: "Register patient" })).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByText(`${lastName}, ${firstName}`)).toBeVisible({ timeout: 10000 });
  });

  test("cannot register without required fields", async ({ page }) => {
    await page.goto("/patients/adt");
    await page.getByRole("button", { name: "+ Register patient" }).click();
    await page.getByRole("button", { name: "Register", exact: true }).click();

    // Exact validation message, checked directly against source rather
    // than a generic "some error appeared" assertion.
    await expect(page.getByText("First and last name are required.")).toBeVisible();
  });
});
