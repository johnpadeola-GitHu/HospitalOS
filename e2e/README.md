# HospitalOS E2E tests (Playwright)

## Read this before running anything

**I could not execute the HospitalOS tests themselves.** My sandbox's
network access is restricted to package registries (npm, GitHub,
etc.) — it cannot reach `hospitalos.agorox.africa` or the backend
Worker. Every selector and assertion in this suite was checked directly
against the current source code (exact button text, exact placeholder
strings, exact heading elements, exact CSS variable usage confirmed to
render real DOM) — but "checked against the source" is not the same as
"watched it pass." You are the first person to actually run these
against the live app. Expect to find at least a small thing that needs
adjusting on first run; that's normal for a suite that's never been
executed, not a sign it was built carelessly.

I *was* able to verify the QA Command Center (see below) against real
Playwright output, since that only requires running Playwright itself,
not reaching the live HospitalOS app — that part has genuinely been
tested, not just written.

One real mistake already caught before you'd have hit it: an early
draft of `rbac-boundaries.spec.js` used two guessed route paths
(`/patients/registration`, `/diagnostics/lab`) that don't actually
exist — the real paths are `/patients/adt` and `/lab`. Fixed by
checking `navGroups.js` directly. Worth knowing this happened, since
it's exactly the class of error a first live run is likely to also
surface elsewhere.

## Structure

```
e2e/
  auth.setup.js              # signs in as each configured role, saves sessions
  fixtures/
    pages.fixture.js         # extends Playwright's test with page objects
  pages/
    LoginPage.js              # page object for sign-in
    PaymentsPage.js           # page object for cash sessions / billing
  specs/
    smoke/                    # fast, critical-path — tag: @smoke
      app-health.spec.js
    regression/                # broader coverage — tag: @regression
      cash-session.spec.js
      rbac-boundaries.spec.js
      patient-registration.spec.js
      audit-trail-crossmodule.spec.js
  .auth/                      # generated session tokens — gitignored, never commit
```

Add new page objects to `pages/`, register them in
`fixtures/pages.fixture.js`, and put new specs under `specs/smoke/` or
`specs/regression/` (create `specs/release/` for full-release-only
coverage as that grows) with the matching `@smoke` / `@regression` tag
in the test title — Playwright parses that automatically into
queryable tags, no extra config needed.

## Setup

```bash
npm install                       # installs @playwright/test, already in package.json
npx playwright install chromium   # downloads the actual browser binary — only needs doing once
```

## Test accounts and credentials — required before most of this runs

Credentials are never hardcoded in the test files — they come from
environment variables (a local `.env` file, or GitHub Secrets in CI).
This wasn't always true; an earlier version of this suite had the demo
account's password sitting in plain text in a committed file, which
was corrected once flagged.

```bash
cp .env.example .env
```

Then edit `.env` and fill in real values. `.env` itself is gitignored
and must never be committed — only `.env.example` (the template, no
real credentials) is tracked.

Only one real, confirmed account is used right now: the permanent demo
Super Admin (`demo@agorox.africa`), already isolated on its own tenant.
Filling in just `SUPERADMIN_PASSWORD` is enough to run the smoke suite
and `cash-session.spec.js`, since Super Admin can reach every area
including Finance.

`rbac-boundaries.spec.js` needs dedicated per-role test accounts —
**do not use real hospital staff credentials for automated testing.**
Create these on the demo tenant, signed in as the demo Super Admin,
under Administration → Users & roles, then fill in their email/password
pairs in `.env`:

| Role | .env variables |
|---|---|
| Cashier | `CASHIER_EMAIL`, `CASHIER_PASSWORD` |
| Nurse | `NURSE_EMAIL`, `NURSE_PASSWORD` |
| Pharmacist | `PHARMACIST_EMAIL`, `PHARMACIST_PASSWORD` |

A role is silently skipped in `auth.setup.js` if its email/password
aren't both set — no error, it just won't have a saved session, and
its dependent tests will skip with an explicit message telling you
exactly what to create rather than failing confusingly.

## Running

```bash
npm run e2e:setup        # signs in as every configured role, saves sessions to e2e/.auth/
npm run e2e:smoke         # fast critical-path only
npm run e2e:regression    # broader coverage
npm run e2e               # everything — the "full release" level; no separate tag needed
npm run e2e:report        # opens Playwright's own HTML report (traces, screenshots, video)
npm run qa-center         # generates qa-command-center/dashboard.html from the results
```

## The QA Command Center

`qa-command-center/` is a separate internal dashboard — not part of
HospitalOS, never bundled or deployed with it. See
`qa-command-center/README.md` for the full detail; short version: it
reads Playwright's real JSON output and nothing else, has no fake-data
path, and was verified against two real (if synthetic) Playwright runs
before being called done — 8 separate checks confirming module
grouping, tag grouping, release-readiness, and failure rendering all
handle genuine data correctly.

## What's here now, and what's deliberately not

92 tests across seven files. Two genuinely different kinds of
coverage, worth telling apart:

**Deep coverage** (a handful of tests, thoroughly verified): the cash
session lifecycle, RBAC boundaries, patient registration, a
cross-module audit trail check, and the pharmacy allergy hard-block —
each one walks a real multi-step workflow and checks the actual
guarantee, not just that a page renders.

**Broad coverage** (`all-routes-smoke.spec.js`, 82 tests): one test
per route extracted directly from `navGroups.js`, each confirming the
route loads to a real, non-empty heading rather than a blank page or a
crash. This was originally written quickly, at explicit direction to
prioritize speed — and on review, two real gaps from that speed were
found and fixed, not just asserted fixed:

1. The core assumption ("every routed page renders a real heading")
had only been spot-checked on a handful of modules, then generalized
to all 82. Went back and checked all 88 module component files
systematically: 10 don't literally use the shared `PageHeader`
component, but every single one was individually traced — some
(CT/MRI/Ultrasound) render it indirectly through a shared wrapper, one
(`Reports.jsx`) uses its own local `<h1>`, and the rest (Settlement,
ActivationCodes, the print views, the patient picker) turned out not
to be standalone routes at all, confirmed against both `navGroups.js`
and `App.jsx`'s route table.

2. The human-readable labels used as test names had been written from
memory rather than the verified list — a systematic diff against the
real `navGroups.js` content found 55 of 82 wrong (shortened or
paraphrased). Regenerated the entire array programmatically from
source instead of hand-fixing each one, then re-diffed to confirm zero
remaining mismatches. The one "mismatch" left is a genuine duplicate:
`/instruments` is registered twice in `navGroups.js` under two
different nav groups with two different real labels — not a wrong
label, an actual property of the app's navigation.

These wrong labels never affected whether any test passed or failed —
the assertion only checks for non-empty heading text — but they'd have
made failure reports harder to read correctly, and the exercise is
what surfaced the duplicate-route finding above.

This is a deliberate, sanctioned choice: establish real infrastructure
first, expand coverage progressively, and — per direct instruction —
prioritize speed once the foundation was solid, then go back and
verify the assumptions underneath what speed produced.

## Closing the gaps: what got added, and what's still genuinely open

After a green run, a direct question was asked: does this mean
everything is tested? The honest answer was no, with five specific
gaps named — only one role tested broadly, "loads" not verified as
"works correctly," no visual/UI testing, only one browser, and most
business logic untested. Real progress was made on several of these;
none are fully closed, and it's worth being precise about which is
which.

**Cross-browser and mobile — genuinely closed for the smoke tests.**
`playwright.config.js` now runs the smoke suite (sign-in, dashboard,
search palette) on Chromium, Firefox, WebKit, and two mobile viewports
(Pixel 5, iPhone 13) — 349 tests total now, up from 92. The full
regression suite deliberately stays Chromium-only: running all of it
on every engine would roughly quadruple CI time for tests that mostly
check server-side behavior (RBAC, balance validation), which doesn't
vary by browser at all. One honest nuance: the smoke test's Ctrl+K
check still technically fires under mobile emulation even though a
real phone has no physical keyboard — Playwright can dispatch the
keyboard event regardless, so it's not a fully realistic mobile
interaction, just a mechanically-passing one.

**Per-role coverage — built and verified, not yet running.**
`per-role-route-coverage.spec.js` checks all 82 routes against each of
Cashier, Nurse, and Pharmacist's real `areas` list from `rbac.js` —
routes inside the role's allowed areas should load real content,
routes outside should show the access-denied screen. The route-to-group
mapping was extracted programmatically from `navGroups.js`, the same
way as the broad Super Admin test, specifically to avoid repeating the
55-wrong-labels mistake. This adds 246 tests — but every one of them
skips with an explicit message until those three roles' test accounts
actually exist and their credentials are set in `.env` / GitHub
Secrets. Built correctly; still needs those accounts to actually run.

**Visual regression — infrastructure built, baselines not yet
generated.** `visual-regression.spec.js` screenshots the Dashboard,
the login/activation screen, and the sidebar. This is different from
everything else in this suite: it could not be pre-verified the way
the others were, because there's no way to generate or inspect a
screenshot without a live browser against the live site, which this
sandbox doesn't have. The first real run will fail for every one of
these three tests with "no baseline found" — that's expected, not a
bug. Run locally once with `npx playwright test --update-snapshots`,
look at the generated images yourself to confirm they're actually
correct, then commit them. After that, a failure means a real visual
change happened.

**Deep functional and business-logic testing — advanced, honestly not
finished.** `balance-validation.spec.js` closes the gap flagged
earlier: the first attempt (register a fresh patient, try to overpay
their zero balance) turned out to be unworkable — traced directly
through `billingService.js` and confirmed `listAccounts()` only
includes patients with at least one existing charge, and
`getAccount()`/`recordPayment()` both fail earlier with "No account
for this patient" before ever reaching a balance check. The working
version instead finds whichever real account in the live Billing table
already has a positive balance, reads that balance directly from the
page, and confirms a payment above it is rejected with the exact
message from `billingService.js` — server-side re-validated too, not
just a client-side restriction.

What's still genuinely open: cash sessions, the allergy block,
registration, the audit trail, and now balance validation are real,
deep coverage — but stock deduction correctness, most clinical
workflows beyond what's listed, and claim/co-payment calculations
still have no assertions checking their outcomes are right, only that
their pages exist via the broad route checks. That's the honest
remaining scope, not something to treat as closed.

## Everything re-verified before calling this done

Before treating any of this as trustworthy, three checks were run
across the *whole* suite, not just the newest file:

- Every hardcoded route across every spec file (including the
  earliest ones — cash session, allergy block, registration, audit
  trail) was re-checked against the current `navGroups.js`
  programmatically. Zero drift found.
- The exact button/label text those same earlier tests depend on was
  re-confirmed present in current source — none of it had silently
  changed since those tests were originally written, across several
  rounds of real app changes since.
- `npm ci` was run against a clean copy of the current
  `package.json`/`package-lock.json` pair — the exact class of check
  that would have caught the Cloudflare Pages build failure earlier in
  this project, run proactively this time rather than after something
  broke.

## The `e2e/.auth/` folder

This gets created by `--project=setup` and holds real, live session
tokens. Covered by `.gitignore` (added there directly — checked the
existing file first and found it genuinely wasn't covered before this
setup). Worth a second look yourself before your first commit anyway,
since these are working credentials, not test fixtures.
