import { test, expect } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test.use({ storageState: path.join(__dirname, "../../.auth/superadmin.json") });

// The highest safety-value test in this suite: proves the allergy
// hard-block genuinely disables dispensing, not just discourages it.
// Held back from an earlier round specifically because it spans two
// modules (Records, for recording the allergy, and Pharmacy, for the
// dispense attempt) whose selectors hadn't both been verified yet —
// see e2e/README.md's prior note. All selectors below were checked
// directly against source before being trusted, including a genuinely
// important detail: checkAllergy() matches via
// drugName.toLowerCase().includes(substance.toLowerCase()) — a
// case-insensitive substring match, not an exact one — confirmed
// directly against routes/records.js on the backend.
test.describe("Pharmacy allergy hard-block @regression @pharmacy @safety", () => {
  test("a recorded severe allergy disables dispensing that exact drug", async ({ page }) => {
    const uniqueSuffix = Date.now();
    const firstName = "E2EAllergy";
    const lastName = `AllergyCheck${uniqueSuffix}`;

    // Step 1 — register a fresh, unique patient for this test.
    await page.goto("/patients/adt");
    await page.getByRole("button", { name: "+ Register patient" }).click();
    await page.getByLabel("First name").fill(firstName);
    await page.getByLabel("Last name").fill(lastName);
    await page.getByLabel("Date of birth").fill("1990-01-01");
    await page.getByRole("button", { name: "Register", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Register patient" })).not.toBeVisible({ timeout: 10000 });

    // Step 2 — discover a real, currently-dispensable drug's exact name
    // from the live inventory (never hardcoded — the formulary is
    // entirely database-driven, confirmed directly, so any guessed name
    // would be unreliable). Open the first enabled Dispense action,
    // read the drug's name from the modal's own title, then cancel
    // without actually dispensing anything.
    await page.goto("/pharmacy/dispensing");
    const firstDispenseButton = page.getByRole("button", { name: "Dispense", exact: true }).first();
    const hasDispensableDrug = await firstDispenseButton.waitFor({ timeout: 15000 }).then(() => true).catch(() => false);
    test.skip(!hasDispensableDrug, "No in-stock, dispensable drug currently exists in this tenant's pharmacy to test against.");
    await firstDispenseButton.click();

    const modalHeading = page.getByRole("heading", { name: /^Dispense —/ });
    await modalHeading.waitFor({ timeout: 10000 });
    const headingText = await modalHeading.textContent();
    const drugName = headingText.replace("Dispense —", "").trim();
    expect(drugName.length).toBeGreaterThan(0);

    await page.getByRole("button", { name: "Cancel" }).click();

    // Step 3 — record a severe allergy against that exact drug name.
    await page.goto("/records");
    await page.getByPlaceholder("Find patient…").fill(lastName);
    await page.getByRole("button", { name: `${lastName}, ${firstName}` }).click();
    await page.getByRole("button", { name: "Record allergy" }).click();
    await page.getByLabel("Substance").fill(drugName);
    await page.getByLabel("Reaction").fill("Anaphylaxis");
    await page.getByLabel("Severity").selectOption("severe");
    await page.getByRole("button", { name: "Save", exact: true }).click();

    // Step 4 — return to Pharmacy, dispense the same drug, select the
    // same patient, and confirm the hard block is real: the Dispense
    // button is genuinely disabled, and the block is explained, not
    // silent.
    await page.goto("/pharmacy/dispensing");
    await firstDispenseButton.waitFor({ timeout: 15000 });
    await firstDispenseButton.click();
    await modalHeading.waitFor({ timeout: 15000 });

    await page.getByPlaceholder("Name or hospital no.").fill(lastName);
    await page.getByRole("button", { name: `${lastName}, ${firstName}` }).click();

    await expect(page.getByText("Severe allergy on record. Dispensing is blocked.")).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("button", { name: "Dispense", exact: true }).last()).toBeDisabled();
  });
});
