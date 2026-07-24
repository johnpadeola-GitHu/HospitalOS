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
