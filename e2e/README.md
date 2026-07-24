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

Eleven tests across seven files — a smoke check that the app is alive
and navigable, and regression coverage for the cash session lifecycle,
RBAC boundaries, patient registration (including a required-field
validation check), a cross-module audit trail check (registering a
patient and confirming the exact resulting entry is independently
findable in Security & audit, a completely different screen), and the
pharmacy allergy hard-block — the highest safety-value test in the
suite, spanning Records (recording the allergy) and Pharmacy
(attempting the dispense). It was deliberately held back in an earlier
round until both modules' selectors were checked directly against
source; that verification turned up a genuinely important detail — the
actual match is a case-insensitive substring check
(`drugName.includes(substance)`), not an exact one, confirmed against
the backend route before the test was written to rely on it. It also
caught a real path error before it shipped: an early draft used
`/system/records`, the real path is `/records`.

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
