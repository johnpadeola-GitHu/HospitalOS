// Laboratory service.
// Lifecycle: ordered -> collected -> resulted -> verified.
// Results are auto-flagged against reference ranges (low / normal / high /
// critical), which is what feeds the critical-value alerting concept.
// In-memory now; async API shaped for a later D1 swap.

const delay = (ms = 110) => new Promise((r) => setTimeout(r, ms));

// Test catalogue. Each analyte carries a unit and a reference range.
// crit low/high are the panic thresholds that raise a critical flag.
export const TEST_CATALOGUE = [
  {
    code: "FBC",
    name: "Full Blood Count",
    department: "Haematology",
    price: 2500,
    analytes: [
      { key: "hb", label: "Haemoglobin", unit: "g/dL", low: 12, high: 17, critLow: 7, critHigh: 20 },
      { key: "wbc", label: "White Cell Count", unit: "x10\u2079/L", low: 4, high: 11, critLow: 1, critHigh: 30 },
      { key: "plt", label: "Platelets", unit: "x10\u2079/L", low: 150, high: 400, critLow: 20, critHigh: 1000 },
    ],
  },
  {
    code: "UE",
    name: "Urea & Electrolytes",
    department: "Clinical Chemistry",
    price: 3500,
    analytes: [
      { key: "na", label: "Sodium", unit: "mmol/L", low: 135, high: 145, critLow: 120, critHigh: 160 },
      { key: "k", label: "Potassium", unit: "mmol/L", low: 3.5, high: 5.1, critLow: 2.5, critHigh: 6.5 },
      { key: "urea", label: "Urea", unit: "mmol/L", low: 2.5, high: 7.8, critLow: null, critHigh: 40 },
      { key: "creat", label: "Creatinine", unit: "\u00b5mol/L", low: 60, high: 110, critLow: null, critHigh: 600 },
    ],
  },
  {
    code: "GLU",
    name: "Blood Glucose",
    department: "Clinical Chemistry",
    price: 1200,
    analytes: [
      { key: "glu", label: "Glucose", unit: "mmol/L", low: 3.9, high: 7.8, critLow: 2.2, critHigh: 25 },
    ],
  },
  {
    code: "MP",
    name: "Malaria Parasite",
    department: "Microbiology",
    price: 1500,
    analytes: [
      { key: "mp", label: "MP (qualitative)", unit: "", low: null, high: null, critLow: null, critHigh: null, qualitative: true },
    ],
  },
  {
    code: "LFT",
    name: "Liver Function Test",
    department: "Clinical Chemistry",
    price: 4000,
    analytes: [
      { key: "alt", label: "ALT", unit: "U/L", low: 7, high: 56, critLow: null, critHigh: 500 },
      { key: "ast", label: "AST", unit: "U/L", low: 10, high: 40, critLow: null, critHigh: 500 },
      { key: "bili", label: "Total Bilirubin", unit: "\u00b5mol/L", low: 3, high: 17, critLow: null, critHigh: 300 },
    ],
  },
];

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
      amount: test ? test.price : 0,
      at: o.orderedAt,
    };
  });
}
