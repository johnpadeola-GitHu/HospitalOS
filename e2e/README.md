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

## Test accounts — required before most of this runs

Only one real, confirmed account is used right now: the permanent demo
Super Admin (`demo@agorox.africa`), already isolated on its own tenant.
That's enough to run the smoke suite and `cash-session.spec.js`, since
Super Admin can reach every area including Finance.

`rbac-boundaries.spec.js` needs dedicated per-role test accounts —
**do not use real hospital staff credentials for automated testing.**
Create these on the demo tenant, signed in as the demo Super Admin,
under Administration → Users & roles:

| Role | Suggested email |
|---|---|
| Cashier | `cashier-test@example.com` |
| Nurse | `nurse-test@example.com` |
| Pharmacist | `pharmacist-test@example.com` |

Set a real password for each, then add them to the `ROLES` object at the
top of `e2e/auth.setup.js` (commented-out lines are already there,
ready to uncomment and fill in).

If an account doesn't exist yet, its RBAC test **skips with an explicit
message** telling you exactly what to create — it won't fail silently
or confusingly.

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

Ten tests across six files — a smoke check that the app is alive and
navigable, and regression coverage for the cash session lifecycle, RBAC
boundaries, patient registration (including a required-field validation
check), and one deliberately cross-module test: registering a patient
and then confirming the exact resulting entry is independently
findable in Security & audit, a completely different screen. That last
one matters more than it might look — it's testing the actual
guarantee (every consequential action leaves a real, searchable
record), not just that two pages individually load.

This is a deliberate, sanctioned choice, not a shortfall: establish
real infrastructure first, expand coverage progressively as it's
actually run and proven against the live app, rather than write a
large volume of untested test code in one pass.

**The clear next priority, and why it's not here yet**: the
allergy/stock pharmacy hard-block tests are the highest safety value
still missing, but testing them properly requires first recording a
patient allergy through Records/clinical notes — a second module whose
selectors haven't been verified with the same rigor as everything
above yet. Rather than write that test against guessed selectors, it's
being left as the explicit next step once those are checked directly,
the same way `/patients/adt` and `/lab` were checked directly after an
earlier draft guessed them wrong.

## The `e2e/.auth/` folder

This gets created by `--project=setup` and holds real, live session
tokens. Covered by `.gitignore` (added there directly — checked the
existing file first and found it genuinely wasn't covered before this
setup). Worth a second look yourself before your first commit anyway,
since these are working credentials, not test fixtures.
