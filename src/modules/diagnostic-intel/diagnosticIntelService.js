// Diagnostic Intelligence — cross-diagnostic analytics.
// Reads across Laboratory, Radiology, and Blood Bank to surface patterns no
// single module shows on its own: turnaround performance, positivity rates,
// test utilisation, and where critical values are actually coming from.
// This is read-only intelligence; it owns no data of its own.

import { listOrders, TEST_CATALOGUE } from "../lab/labService";
import { listStudies } from "../radiology/radiologyService";
import { listRequests as listBloodRequests } from "../blood-bank/bloodBankService";

const delay = (ms = 100) => new Promise((r) => setTimeout(r, ms));

export async function diagnosticSummary() {
  await delay();
  const [labOrders, studies, bloodReqs] = await Promise.all([
    listOrders({ status: "all" }), listStudies({}), listBloodRequests({ includeCompleted: true }),
  ]);

  const labVerified = labOrders.filter((o) => o.status === "verified").length;
  const labPending = labOrders.length - labVerified;
  const radReported = studies.filter((s) => s.status === "reported").length;

  // Test utilisation — which tests get ordered most.
  const byTest = {};
  for (const o of labOrders) byTest[o.testName] = (byTest[o.testName] || 0) + 1;
  const topTests = Object.entries(byTest).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, n]) => ({ name, n }));

  // Department load.
  const byDept = {};
  for (const o of labOrders) byDept[o.department] = (byDept[o.department] || 0) + 1;

  return {
    labTotal: labOrders.length,
    labVerified,
    labPending,
    labCompletionPct: labOrders.length ? Math.round((labVerified / labOrders.length) * 100) : 0,
    radTotal: studies.length,
    radReported,
    bloodRequests: bloodReqs.length,
    topTests,
    byDept: Object.entries(byDept).map(([dept, n]) => ({ dept, n })),
    catalogueSize: TEST_CATALOGUE.length,
  };
}

// Turnaround performance — declared TAT vs. what actually happened, per test
// that has at least one resulted order.
export async function turnaroundReport() {
  await delay(80);
  const orders = await listOrders({ status: "all" });
  const byCode = {};
  for (const o of orders) {
    if (!o.resultedAt) continue;
    const mins = Math.round((new Date(o.resultedAt) - new Date(o.orderedAt)) / 60000);
    if (!byCode[o.testCode]) byCode[o.testCode] = { name: o.testName, samples: [] };
    byCode[o.testCode].samples.push(mins);
  }
  return Object.entries(byCode).map(([code, v]) => {
    const test = TEST_CATALOGUE.find((t) => t.code === code);
    const avg = Math.round(v.samples.reduce((a, b) => a + b, 0) / v.samples.length);
    return { code, name: v.name, declaredTat: test?.tat || "\u2014", actualMinutes: avg, n: v.samples.length };
  });
}

// Positivity rate for qualitative tests (infectious disease screens etc).
export async function positivityReport() {
  await delay(80);
  const orders = await listOrders({ status: "all" });
  const qualCodes = TEST_CATALOGUE.filter((t) => t.analytes.some((a) => a.qualitative)).map((t) => t.code);
  const rows = [];
  for (const code of qualCodes) {
    const relevant = orders.filter((o) => o.testCode === code && o.results);
    if (relevant.length === 0) continue;
    const test = TEST_CATALOGUE.find((t) => t.code === code);
    const qualKey = test.analytes.find((a) => a.qualitative)?.key;
    const positive = relevant.filter((o) => String(o.results[qualKey] || "").toLowerCase().startsWith("pos")).length;
    rows.push({ code, name: test.name, tested: relevant.length, positive, ratePct: Math.round((positive / relevant.length) * 100) });
  }
  return rows;
}
