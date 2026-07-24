import { test as base } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage.js";
import { PaymentsPage } from "../pages/PaymentsPage.js";

// Standard Playwright fixture-extension pattern — each spec imports
// `test` from here instead of directly from @playwright/test, and gets
// `loginPage` / `paymentsPage` already constructed against the current
// `page`, instead of every spec repeating `new LoginPage(page)` at the
// top of every test. Add new page objects here as they're built, rather
// than importing them ad hoc per spec file.
export const test = base.extend({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  paymentsPage: async ({ page }, use) => {
    await use(new PaymentsPage(page));
  },
});

export { expect } from "@playwright/test";
