// Page object for Finance & trade → Payments (src/modules/finance/Payments.jsx).
// Every selector here is checked directly against that file's current
// source — including the deliberately non-obvious distinction between
// the trigger button "Open cash session" and the modal's own submit
// button "Open session" (genuinely different text, confirmed by reading
// the component, not assumed to match).
export class PaymentsPage {
  constructor(page) {
    this.page = page;
    this.openSessionTrigger = page.getByRole("button", { name: "Open cash session" });
    this.closeSessionTrigger = page.getByRole("button", { name: "Close cash session" });
    this.openingBalanceInput = page.getByLabel("Opening balance");
    this.openSessionSubmit = page.getByRole("button", { name: "Open session" });
    this.actualCashInput = page.getByLabel("Actual cash counted");
    this.closeSessionSubmit = page.getByRole("button", { name: "Close session" });
    this.doneButton = page.getByRole("button", { name: "Done" });
  }

  async goto() {
    await this.page.goto("/finance/payments");
  }

  async hasOpenSession() {
    return this.closeSessionTrigger.isVisible().catch(() => false);
  }

  async openSession(openingBalance) {
    await this.openSessionTrigger.click();
    await this.openingBalanceInput.fill(String(openingBalance));
    await this.openSessionSubmit.click();
    await this.closeSessionTrigger.waitFor({ timeout: 10000 });
  }

  /** Returns { expected, counted, variance } as they appeared in the result modal, for the caller to assert against. */
  async closeSession(actualCash) {
    await this.closeSessionTrigger.click();
    await this.actualCashInput.fill(String(actualCash));
    await this.closeSessionSubmit.click();
    await this.page.getByText(/Variance:/).waitFor({ timeout: 10000 });
    const expected = await this.page.getByText(/^Expected:/).textContent();
    const counted = await this.page.getByText(/^Counted:/).textContent();
    const variance = await this.page.getByText(/^Variance:/).textContent();
    await this.doneButton.click();
    return { expected, counted, variance };
  }
}
