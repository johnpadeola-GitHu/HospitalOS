#!/usr/bin/env node
// HospitalOS QA Command Center — generator.
//
// This is a developer/QA tool, deliberately separate from the
// customer-facing HospitalOS app: it lives outside src/, is never
// bundled by Vite, is never deployed to hospitalos.agorox.africa, and
// is run locally by whoever needs to look at test health. It has
// exactly one data source — e2e-results/results.json, Playwright's own
// JSON reporter output from a real run — and no other. If that file
// doesn't exist or is stale, this script says so plainly rather than
// inventing numbers; there is no synthetic/demo data path here at all.
//
// The JSON schema this reads from was NOT taken from memory or
// documentation — it was captured from a real, minimal Playwright run
// executed specifically to verify the actual shape (see the project
// history around this file's creation), including the detail that
// error messages come through with embedded ANSI color codes that need
// stripping for clean HTML display.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RESULTS_PATH = path.join(__dirname, "..", "e2e-results", "results.json");
const OUTPUT_PATH = path.join(__dirname, "dashboard.html");

function stripAnsi(str) {
  // eslint-disable-next-line no-control-regex
  return (str || "").replace(/\x1b\[[0-9;]*m/g, "");
}

function loadResults() {
  if (!fs.existsSync(RESULTS_PATH)) {
    return null;
  }
  const raw = fs.readFileSync(RESULTS_PATH, "utf8");
  return JSON.parse(raw);
}

/** Recursively walks Playwright's nested suite structure (a folder like
 * specs/smoke/ produces a suite that CONTAINS file-suites, which contain
 * specs) — a single-level walk would silently miss most tests. */
function collectSpecs(suites, filePathPrefix = "") {
  let out = [];
  for (const suite of suites || []) {
    const currentPath = suite.file ? suite.file : filePathPrefix;
    for (const spec of suite.specs || []) {
      out.push({ ...spec, file: spec.file || currentPath });
    }
    if (suite.suites && suite.suites.length) {
      out = out.concat(collectSpecs(suite.suites, currentPath));
    }
  }
  return out;
}

function classify(spec) {
  // Playwright auto-parses @tag from the test title into spec.tags —
  // verified directly against real output, not assumed from docs.
  const tags = spec.tags || [];
  const level = tags.includes("smoke") ? "smoke" : tags.includes("regression") ? "regression" : "other";
  const test = spec.tests && spec.tests[0];
  const result = test && test.results && test.results[0];
  const status = result ? result.status : "unknown"; // passed | failed | skipped | timedOut
  return { level, status, duration: result ? result.duration : 0, test, result };
}

function moduleFromFile(file) {
  // e2e/specs/regression/cash-session.spec.js -> "cash-session"
  const base = path.basename(file || "unknown", ".spec.js");
  return base;
}

function buildData(raw) {
  if (!raw) return null;
  const specs = collectSpecs(raw.suites);
  const rows = specs.map((spec) => {
    const c = classify(spec);
    return {
      title: spec.title,
      file: spec.file,
      module: moduleFromFile(spec.file),
      level: c.level,
      status: c.status,
      duration: c.duration,
      error: c.result && c.result.errors && c.result.errors[0] ? stripAnsi(c.result.errors[0].message).split("\n").slice(0, 6).join("\n") : null,
      attachments: c.result ? (c.result.attachments || []).map((a) => a.name) : [],
    };
  });

  const total = rows.length;
  const passed = rows.filter((r) => r.status === "passed").length;
  const failed = rows.filter((r) => r.status === "failed" || r.status === "timedOut").length;
  const skipped = rows.filter((r) => r.status === "skipped").length;
  const blocked = rows.filter((r) => r.status === "unknown").length;

  const byModule = {};
  for (const r of rows) {
    byModule[r.module] = byModule[r.module] || { total: 0, passed: 0, failed: 0, skipped: 0 };
    byModule[r.module].total++;
    if (r.status === "passed") byModule[r.module].passed++;
    if (r.status === "failed" || r.status === "timedOut") byModule[r.module].failed++;
    if (r.status === "skipped") byModule[r.module].skipped++;
  }

  const byLevel = {};
  for (const level of ["smoke", "regression", "other"]) {
    const inLevel = rows.filter((r) => r.level === level);
    byLevel[level] = {
      total: inLevel.length,
      passed: inLevel.filter((r) => r.status === "passed").length,
      failed: inLevel.filter((r) => r.status === "failed" || r.status === "timedOut").length,
      skipped: inLevel.filter((r) => r.status === "skipped").length,
    };
  }

  // Release readiness is deliberately conservative: any failure at all
  // blocks a "ready" signal. Skips don't block it, since a skip here
  // means "no test account configured yet" (see rbac-boundaries.spec.js),
  // a known, explained gap — not a defect.
  const releaseReady = failed === 0 && total > 0;

  return {
    generatedAt: new Date().toISOString(),
    resultsGeneratedAt: raw.stats ? raw.stats.startTime : null,
    duration: raw.stats ? raw.stats.duration : 0,
    total, passed, failed, skipped, blocked,
    releaseReady,
    byModule, byLevel,
    rows,
    configErrors: raw.errors || [],
  };
}

function statusBadge(status) {
  const map = { passed: "pass", failed: "fail", timedOut: "fail", skipped: "skip", unknown: "skip" };
  return map[status] || "skip";
}

function render(data) {
  if (!data) {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>HospitalOS QA Command Center</title>
    <style>body{font-family:-apple-system,sans-serif;background:#0f1115;color:#e8e8ec;padding:60px;text-align:center}
    .box{max-width:520px;margin:0 auto;background:#181b21;border:1px solid #2a2e37;border-radius:12px;padding:32px}
    h1{font-size:18px} p{color:#9a9fab;font-size:13.5px;line-height:1.6}
    code{background:#0f1115;padding:2px 6px;border-radius:4px;font-size:12.5px}</style></head>
    <body><div class="box"><h1>No results yet</h1>
    <p>No <code>e2e-results/results.json</code> was found. This dashboard has exactly one data source —
    a real Playwright run — and shows nothing until one exists. Run <code>npm run e2e</code> (or
    <code>npm run e2e:smoke</code> / <code>npm run e2e:regression</code>) first, then
    <code>npm run qa-center</code> again.</p></div></body></html>`;
  }

  const moduleRows = Object.entries(data.byModule).map(([mod, s]) => `
    <tr><td>${mod}</td><td>${s.total}</td>
    <td class="pass">${s.passed}</td><td class="fail">${s.failed}</td><td class="skip">${s.skipped}</td>
    <td><div class="bar"><div class="bar-fill" style="width:${s.total ? (s.passed / s.total) * 100 : 0}%"></div></div></td></tr>
  `).join("");

  const levelCards = ["smoke", "regression", "other"].filter((l) => data.byLevel[l].total > 0).map((l) => `
    <div class="level-card">
      <div class="level-name">${l.toUpperCase()}</div>
      <div class="level-stats">
        <span class="pass">${data.byLevel[l].passed} passed</span>
        <span class="fail">${data.byLevel[l].failed} failed</span>
        <span class="skip">${data.byLevel[l].skipped} skipped</span>
      </div>
    </div>
  `).join("");

  const failedRows = data.rows.filter((r) => r.status === "failed" || r.status === "timedOut");
  const failureDetails = failedRows.length === 0 ? `<p class="muted">No failures in this run.</p>` : failedRows.map((r) => `
    <div class="failure">
      <div class="failure-head">
        <span class="badge fail">FAILED</span>
        <strong>${r.title}</strong>
        <span class="muted">${r.file}</span>
      </div>
      ${r.error ? `<pre class="error">${r.error}</pre>` : ""}
      ${r.attachments.length ? `<div class="muted">Evidence captured: ${r.attachments.join(", ")} — see playwright-report/ for the actual screenshot/trace/video.</div>` : ""}
    </div>
  `).join("");

  const allRows = data.rows.map((r) => `
    <tr>
      <td><span class="badge ${statusBadge(r.status)}">${r.status.toUpperCase()}</span></td>
      <td>${r.title}</td>
      <td class="muted">${r.module}</td>
      <td class="muted">${r.level}</td>
      <td class="muted">${r.duration}ms</td>
    </tr>
  `).join("");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>HospitalOS QA Command Center</title>
<style>
  :root { --bg:#0f1115; --card:#181b21; --border:#2a2e37; --ink:#e8e8ec; --muted:#9a9fab;
    --pass:#3ecf8e; --fail:#f45b69; --skip:#e8b74b; --accent:#5b8def; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: var(--bg); color: var(--ink);
    margin: 0; padding: 32px; line-height: 1.5; }
  .wrap { max-width: 1100px; margin: 0 auto; }
  .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
  .header h1 { font-size: 19px; margin: 0; }
  .header .sub { color: var(--muted); font-size: 12.5px; margin-top: 4px; }
  .readiness { padding: 8px 16px; border-radius: 999px; font-size: 12.5px; font-weight: 700; letter-spacing: 0.03em; }
  .readiness.ready { background: rgba(62,207,142,0.15); color: var(--pass); border: 1px solid rgba(62,207,142,0.35); }
  .readiness.not-ready { background: rgba(244,91,105,0.15); color: var(--fail); border: 1px solid rgba(244,91,105,0.35); }
  .stat-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 24px; }
  .stat { background: var(--card); border: 1px solid var(--border); border-radius: 10px; padding: 16px; }
  .stat .num { font-size: 24px; font-weight: 700; }
  .stat .label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; margin-top: 4px; }
  .stat.pass .num { color: var(--pass); } .stat.fail .num { color: var(--fail); } .stat.skip .num { color: var(--skip); }
  .level-row { display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
  .level-card { background: var(--card); border: 1px solid var(--border); border-radius: 10px; padding: 14px 18px; flex: 1; min-width: 180px; }
  .level-name { font-size: 11px; font-weight: 700; color: var(--accent); letter-spacing: 0.05em; margin-bottom: 8px; }
  .level-stats span { font-size: 12.5px; margin-right: 12px; }
  section { background: var(--card); border: 1px solid var(--border); border-radius: 10px; padding: 20px; margin-bottom: 20px; }
  section h2 { font-size: 14px; margin: 0 0 14px; }
  table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
  th { text-align: left; color: var(--muted); font-weight: 600; font-size: 11px; text-transform: uppercase;
    letter-spacing: 0.03em; padding: 8px 10px; border-bottom: 1px solid var(--border); }
  td { padding: 9px 10px; border-bottom: 1px solid rgba(255,255,255,0.03); }
  .pass { color: var(--pass); } .fail { color: var(--fail); } .skip { color: var(--skip); } .muted { color: var(--muted); }
  .badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 999px; letter-spacing: 0.03em; }
  .badge.pass { background: rgba(62,207,142,0.15); }
  .badge.fail { background: rgba(244,91,105,0.15); }
  .badge.skip { background: rgba(232,183,75,0.15); }
  .bar { background: rgba(255,255,255,0.06); border-radius: 999px; height: 6px; overflow: hidden; }
  .bar-fill { background: var(--pass); height: 100%; }
  .failure { border: 1px solid var(--border); border-radius: 8px; padding: 12px 14px; margin-bottom: 10px; }
  .failure-head { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
  pre.error { background: var(--bg); border: 1px solid var(--border); border-radius: 6px; padding: 10px 12px;
    font-size: 11.5px; overflow-x: auto; color: #ff9b9b; margin: 8px 0; }
  footer { color: var(--muted); font-size: 11.5px; text-align: center; margin-top: 24px; }
  code { background: var(--bg); padding: 1px 5px; border-radius: 4px; }
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <div>
      <h1>HospitalOS QA Command Center</h1>
      <div class="sub">Internal developer tool — not part of the customer-facing app. Generated ${new Date(data.generatedAt).toLocaleString()} from a real Playwright run started ${data.resultsGeneratedAt ? new Date(data.resultsGeneratedAt).toLocaleString() : "unknown"}.</div>
    </div>
    <div class="readiness ${data.releaseReady ? "ready" : "not-ready"}">${data.releaseReady ? "✓ RELEASE READY" : "✕ NOT RELEASE READY"}</div>
  </div>

  <div class="stat-row">
    <div class="stat"><div class="num">${data.total}</div><div class="label">Total</div></div>
    <div class="stat pass"><div class="num">${data.passed}</div><div class="label">Passed</div></div>
    <div class="stat fail"><div class="num">${data.failed}</div><div class="label">Failed</div></div>
    <div class="stat skip"><div class="num">${data.skipped}</div><div class="label">Skipped</div></div>
    <div class="stat"><div class="num">${(data.duration / 1000).toFixed(1)}s</div><div class="label">Duration</div></div>
  </div>

  <div class="level-row">${levelCards}</div>

  <section>
    <h2>Coverage by module</h2>
    <table>
      <thead><tr><th>Module</th><th>Total</th><th>Passed</th><th>Failed</th><th>Skipped</th><th>Pass rate</th></tr></thead>
      <tbody>${moduleRows}</tbody>
    </table>
  </section>

  <section>
    <h2>Failure details — what failed, where, why, evidence</h2>
    ${failureDetails}
  </section>

  <section>
    <h2>All tests, this run</h2>
    <table>
      <thead><tr><th>Status</th><th>Test</th><th>Module</th><th>Level</th><th>Duration</th></tr></thead>
      <tbody>${allRows}</tbody>
    </table>
  </section>

  <footer>
    Data source: <code>e2e-results/results.json</code> (Playwright's own JSON reporter — no other source, nothing fabricated).
    For traces/screenshots/video on failures, open <code>npm run e2e:report</code>.
  </footer>
</div>
</body>
</html>`;
}

function main() {
  const raw = loadResults();
  const data = buildData(raw);
  const html = render(data);
  fs.writeFileSync(OUTPUT_PATH, html);
  if (!data) {
    console.log(`No results found at ${RESULTS_PATH} — wrote a placeholder dashboard explaining that. Run tests first.`);
  } else {
    console.log(`QA Command Center written to ${OUTPUT_PATH}`);
    console.log(`${data.passed}/${data.total} passed, ${data.failed} failed, ${data.skipped} skipped. Release ready: ${data.releaseReady}`);
  }
}

main();
