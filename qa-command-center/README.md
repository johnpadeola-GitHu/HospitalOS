# HospitalOS QA Command Center

An internal developer/QA tool. **Not part of HospitalOS itself** — it
lives here, outside `src/`, is never imported by any customer-facing
code, is never bundled by `vite build`, and is never deployed to
`hospitalos.agorox.africa`. An ordinary hospital user has no way to
reach this; it only exists as a file a developer opens locally.

## What it is

A generator script (`generate.js`) that reads Playwright's own JSON
reporter output (`e2e-results/results.json`, produced by a real test
run — see the root `playwright.config.js`) and writes a single,
self-contained `dashboard.html` you open directly in a browser. No
server, no build step, no dependencies beyond Node itself.

**It has exactly one data source.** If `e2e-results/results.json`
doesn't exist, it says so plainly and shows nothing — there is no
synthetic or placeholder data path that could be mistaken for a real
result. This was verified directly: run it with no results file
present, and it correctly reports "no results found" rather than
inventing numbers.

## Usage

```bash
npm run e2e              # or e2e:smoke / e2e:regression — any real run works
npm run qa-center         # reads e2e-results/results.json, writes dashboard.html
open qa-command-center/dashboard.html
```

Re-run `npm run qa-center` after every test run to refresh it — it's
a static snapshot of whichever run last completed, not a live server.

## What it shows

- Overall totals (passed / failed / skipped) and a release-readiness
  signal — deliberately conservative: **any** failure blocks "ready,"
  regardless of how minor it looks.
- A breakdown by test level (`@smoke` / `@regression`), parsed directly
  from Playwright's own tag system — tag a test `@smoke` in its title
  and it's automatically categorized, no separate config needed.
- A breakdown by module (derived from each spec file's name).
- Full failure details — title, file, the actual error message (ANSI
  color codes stripped for clean reading), and which evidence
  (screenshot/trace/video) Playwright captured for it. For the actual
  screenshot/trace/video files themselves, `npm run e2e:report` opens
  Playwright's own HTML report, which this dashboard deliberately
  doesn't try to reproduce or embed.

## Why it's built this way

Reading through Playwright's JSON schema from documentation or memory
was avoidable and wasn't the approach taken — this generator was built
against a **real** JSON file produced by an actual Playwright run
executed specifically to inspect the true structure (nested suites,
the `expected`/`unexpected`/`skipped` stats fields, ANSI codes in error
messages), then verified a second time against a second real run
covering multiple modules and both tags, checking that module grouping,
tag grouping, release-readiness, and failure rendering all handled
real data correctly — 8 separate checks, all passing — before being
called done.

**None of that verification data is HospitalOS test data.** It was a
synthetic, clearly-separate check of the dashboard machinery itself
(two toy files, `alpha.spec.js` / `beta.spec.js`, deleted immediately
after), not a claim that HospitalOS has been tested. The dashboard you
see on first use will say "no results yet," honestly, because no one
has yet run the real HospitalOS suite against the real live app from a
machine that can actually reach it.
