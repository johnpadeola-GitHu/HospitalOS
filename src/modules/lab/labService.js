// Laboratory service.
// Lifecycle: ordered -> collected -> resulted -> verified.
// Results are auto-flagged against reference ranges (low / normal / high /
// critical), which is what feeds the critical-value alerting concept.
// In-memory now; async API shaped for a later D1 swap.

const delay = (ms = 110) => new Promise((r) => setTimeout(r, ms));

// Test catalogue. Each analyte carries a unit and a reference range.
// crit low/high are the panic thresholds that raise a critical flag.
export { TEST_CATALOGUE, DISCIPLINES, testsInDiscipline, searchCatalogue, CATALOGUE_SIZE } from "./catalogue";
import { TEST_CATALOGUE } from "./catalogue";

export const STATUSES = ["ordered", "collected", "resulted", "verified"];
export const STATUS_LABELS = {
  ordered: "Ordered",
  collected: "Collected",
  resulted: "Resulted",
  verified: "Verified",
};

let _accession = 240;
const _orders = [
  {
    id: "o1",
    accession: "LAB-000241",
    patientId: "p1",
    patientName: "Okafor, Adaeze",
    hospitalNo: "H001001",
    testCode: "UE",
    testName: "Urea & Electrolytes",
    department: "Clinical Chemistry",
    status: "ordered",
    orderedAt: new Date(Date.now() - 40 * 60000).toISOString(),
    results: null,
  },
];

function accessionNo() {
  _accession += 1;
  return "LAB-" + String(_accession).padStart(6, "0");
}

export function getTest(code) {
  return TEST_CATALOGUE.find((t) => t.code === code) || null;
}

// Flag a single analyte value against its range.
export function flagValue(analyte, value) {
  if (analyte.qualitative) {
    return value && value.toLowerCase().startsWith("pos") ? "high" : "normal";
  }
  const v = parseFloat(value);
  if (Number.isNaN(v)) return "normal";
  if (analyte.critLow != null && v <= analyte.critLow) return "critical";
  if (analyte.critHigh != null && v >= analyte.critHigh) return "critical";
  if (analyte.low != null && v < analyte.low) return "low";
  if (analyte.high != null && v > analyte.high) return "high";
  return "normal";
}

// Does an order contain any critical result?
export function orderHasCritical(order) {
  if (!order.results) return false;
  const test = getTest(order.testCode);
  if (!test) return false;
  return test.analytes.some((a) => flagValue(a, order.results[a.key]) === "critical");
}

export async function listOrders({ status = "all", query = "" } = {}) {
  await delay();
  const q = query.trim().toLowerCase();
  return _orders
    .filter((o) => (status === "all" ? true : o.status === status))
    .filter((o) => {
      if (!q) return true;
      return (
        o.patientName.toLowerCase().includes(q) ||
        o.hospitalNo.toLowerCase().includes(q) ||
        o.accession.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => new Date(b.orderedAt) - new Date(a.orderedAt));
}

export async function createOrder({ patientId, patientName, hospitalNo, testCode }) {
  await delay();
  const test = getTest(testCode);
  if (!test) throw new Error("Unknown test.");
  const order = {
    id: "o" + Date.now(),
    accession: accessionNo(),
    patientId,
    patientName,
    hospitalNo,
    testCode: test.code,
    testName: test.name,
    department: test.department,
    status: "ordered",
    orderedAt: new Date().toISOString(),
    results: null,
  };
  _orders.unshift(order);
  return order;
}

export async function collectSample(id) {
  await delay(80);
  const o = _orders.find((x) => x.id === id);
  if (!o) throw new Error("Order not found");
  if (o.status !== "ordered") throw new Error("Sample already collected.");
  o.status = "collected";
  o.collectedAt = new Date().toISOString();
  return o;
}

export async function enterResults(id, results) {
  await delay();
  const o = _orders.find((x) => x.id === id);
  if (!o) throw new Error("Order not found");
  if (o.status !== "collected" && o.status !== "resulted") {
    throw new Error("Collect the sample before entering results.");
  }
  o.results = results;
  o.status = "resulted";
  o.resultedAt = new Date().toISOString();
  return o;
}

export async function verifyOrder(id) {
  await delay();
  const o = _orders.find((x) => x.id === id);
  if (!o) throw new Error("Order not found");
  if (o.status !== "resulted") throw new Error("Enter results before verifying.");
  o.status = "verified";
  o.verifiedAt = new Date().toISOString();
  return o;
}

// Feed for the Alerts / critical-values screen later.
export async function listCriticalOrders() {
  await delay(60);
  return _orders.filter(orderHasCritical);
}

// Feed for Billing: every order as a priced charge.
import { priceFor } from "../../engines/pricing";

export async function listBillableOrders() {
  await delay(60);
  return _orders.map((o) => {
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
