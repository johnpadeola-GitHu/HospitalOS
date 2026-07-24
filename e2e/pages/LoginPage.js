// Page object for the combined activation/demo/sign-in landing screen
// (src/auth/Login.jsx + OnboardingWizard.jsx's embedded FrontDoorAlternatives).
// Selectors here are checked directly against that source, not guessed —
// see e2e/README.md's "what's verified vs what isn't" note for the
// honest boundary: checked-against-source is not the same claim as
// watched-it-pass, until this has actually been run once.
export class LoginPage {
  constructor(page) {
    this.page = page;
    // Deliberately scoped to the exact placeholder text, not a generic
    // input[type=email] selector — the same page also renders the
    // onboarding wizard's own "Work email" field (placeholder
    // "you@hospital.ng", one character different from the sign-in
    // field's "you@hospitalos.ng"), which makes a generic selector
    // ambiguous and fails Playwright's strict-mode check.
    this.emailInput = page.getByPlaceholder("you@hospitalos.ng");
    this.passwordInput = page.getByPlaceholder("••••••••");
    this.signInButton = page.getByRole("button", { name: "Sign in", exact: false });
    this.notYouLink = page.getByRole("button", { name: "Not you?" });
    this.dashboardHeading = page.getByRole("heading", { name: "Dashboard" });
  }

  async goto() {
    await this.page.goto("/");
  }

  async signIn(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }

  async expectSignedIn(timeout = 15000) {
    await this.dashboardHeading.waitFor({ timeout });
  }

  // There's no stable selector on the error banner itself (a plain div
  // with no role/id/data-testid — see OnboardingWizard.jsx's errBox) —
  // so this asserts the specific expected message text rather than a
  // generic "an error exists" check, which is both more meaningful and
  // the only reliable option given the actual markup.
  async expectError(expectedTextOrPattern, timeout = 10000) {
    await this.page.getByText(expectedTextOrPattern).waitFor({ timeout });
  }
}
