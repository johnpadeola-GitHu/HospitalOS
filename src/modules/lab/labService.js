// Laboratory service.
// Lifecycle: ordered -> collected -> resulted -> verified.
// Results are auto-flagged against reference ranges (low / normal / high /
// critical), which is what feeds the critical-value alerting concept.
//
// PHASE 1 LIVE: the order lifecycle now calls the real deployed Worker.
// The test catalogue stays entirely client-side (see the note in the
// backend's routes/lab.js) — it's static reference data, not tenant data,
// so flagValue()/orderHasCritical()/getTest() below still operate purely
// on whatever data the Worker returns, no change to their own logic.

const API_URL = "https://hospitalos-api.johnpadeola.workers.dev";

function authHeaders() {
  const token = localStorage.getItem("hospitalos_session_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiCall(path, { method = "GET", body } = {}) {
  let res, data;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: body ? JSON.stringify(body) : undefined,
    });
    data = await res.json();
  } catch {
    throw new Error("Couldn't reach the server. Check your connection and try again.");
  }
  if (!res.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

// Test catalogue. Each analyte carries a unit and a reference range.
// crit low/high are the panic thresholds that raise a critical flag.
export { TEST_CATALOGUE, DISCIPLINES, testsInDiscipline, searchCatalogue, CATALOGUE_SIZE } from "./catalogue";
import { TEST_CATALOGUE } from "./catalogue";
import { rangeFor } from "../../engines/labReferenceRanges";

export const STATUSES = ["ordered", "collected", "resulted", "verified"];
export const STATUS_LABELS = {
  ordered: "Ordered",
  collected: "Collected",
  resulted: "Resulted",
  verified: "Verified",
};

export function getTest(code) {
  return TEST_CATALOGUE.find((t) => t.code === code) || null;
}

// Flag a single analyte value against its range. testCode + analyte.key
// select the override, if a tenant has set one — see engines/labReferenceRanges.
export function flagValue(testCode, analyte, value) {
  const effective = rangeFor(testCode, analyte.key, analyte);
  if (effective.qualitative) {
    return value && value.toLowerCase().startsWith("pos") ? "high" : "normal";
  }
  const v = parseFloat(value);
  if (Number.isNaN(v)) return "normal";
  if (effective.critLow != null && v <= effective.critLow) return "critical";
  if (effective.critHigh != null && v >= effective.critHigh) return "critical";
  if (effective.low != null && v < effective.low) return "low";
  if (effective.high != null && v > effective.high) return "high";
  return "normal";
}

// Does an order contain any critical result?
export function orderHasCritical(order) {
  if (!order.results) return false;
  const test = getTest(order.testCode);
  if (!test) return false;
  return test.analytes.some((a) => flagValue(order.testCode, a, order.results[a.key]) === "critical");
}

export async function listOrders({ status = "all", query = "" } = {}) {
  const params = new URLSearchParams();
  if (status !== "all") params.set("status", status);
  if (query.trim()) params.set("query", query.trim());
  const qs = params.toString();
  return apiCall(`/lab/orders${qs ? `?${qs}` : ""}`);
}

export async function createOrder({ patientId, testCode }) {
  const test = getTest(testCode);
  if (!test) throw new Error("Unknown test.");
  return apiCall("/lab/orders", {
    method: "POST",
    body: { patientId, testCode: test.code, testName: test.name, department: test.department },
  });
}

export async function collectSample(id) {
  return apiCall(`/lab/orders/${encodeURIComponent(id)}/collect`, { method: "PATCH" });
}

export async function enterResults(id, results) {
  return apiCall(`/lab/orders/${encodeURIComponent(id)}/results`, { method: "PATCH", body: { results } });
}

export async function verifyOrder(id) {
  return apiCall(`/lab/orders/${encodeURIComponent(id)}/verify`, { method: "PATCH" });
}

// Feed for the Alerts / critical-values screen later.
export async function listCriticalOrders() {
  const orders = await listOrders({});
  return orders.filter(orderHasCritical);
}

// Feed for Billing: every order as a priced charge.
import { priceFor } from "../../engines/pricing";

export async function listBillableOrders() {
  const orders = await listOrders({});
  return orders.map((o) => {
    const test = getTest(o.testCode);
    return {
      patientId: o.patientId,
      patientName: o.patientName,
      hospitalNo: o.hospitalNo,
      source: "Laboratory",
      description: o.testName,
      reference: o.accession,
      amount: test ? priceFor("lab", o.testCode, test.price) : 0,
      at: o.orderedAt,
    };
  });
}
