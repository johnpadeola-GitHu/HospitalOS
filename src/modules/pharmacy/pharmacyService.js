import { priceFor } from "../../engines/pricing";
// Pharmacy service.
// Holds the drug inventory (stock, reorder level, NAFDAC no.) and the dispense
// flow: dispensing to a patient decrements stock and records the event.
// A drug at/below its reorder level is low-stock; below 1 is out of stock.
// In-memory now; async API shaped for a later D1 swap.

const delay = (ms = 110) => new Promise((r) => setTimeout(r, ms));

// Real Nigerian pharmacy products with representative NAFDAC registration nos.
const _drugs = [
  { id: "d1", name: "Paracetamol 500mg Tablet", form: "Tablet", nafdac: "A4-0001", stock: 1840, reorder: 500, unit: "tablet", price: 15 },
  { id: "d2", name: "Amoxicillin 500mg Capsule", form: "Capsule", nafdac: "A4-0102", stock: 260, reorder: 300, unit: "capsule", price: 45 },
  { id: "d3", name: "Artemether/Lumefantrine 20/120mg", form: "Tablet", nafdac: "A4-6721", stock: 96, reorder: 120, unit: "tablet", price: 80 },
  { id: "d4", name: "Metformin 500mg Tablet", form: "Tablet", nafdac: "A4-3345", stock: 720, reorder: 300, unit: "tablet", price: 25 },
  { id: "d5", name: "Lisinopril 10mg Tablet", form: "Tablet", nafdac: "A4-8890", stock: 410, reorder: 200, unit: "tablet", price: 40 },
  { id: "d6", name: "ORS Sachet", form: "Sachet", nafdac: "B1-2201", stock: 0, reorder: 150, unit: "sachet", price: 60 },
  { id: "d7", name: "Ceftriaxone 1g Injection", form: "Injection", nafdac: "A4-5540", stock: 88, reorder: 60, unit: "vial", price: 950 },
  { id: "d8", name: "Hydrocortisone 100mg Injection", form: "Injection", nafdac: "A4-7712", stock: 45, reorder: 40, unit: "vial", price: 1200 },
];

let _dispenseSeq = 0;
const _dispenses = [];

export function stockState(drug) {
  if (drug.stock <= 0) return "out";
  if (drug.stock <= drug.reorder) return "low";
  return "ok";
}

export async function listDrugs({ query = "", onlyLow = false } = {}) {
  await delay();
  const q = query.trim().toLowerCase();
  return _drugs
    .filter((d) => (onlyLow ? stockState(d) !== "ok" : true))
    .filter((d) => {
      if (!q) return true;
      return d.name.toLowerCase().includes(q) || d.nafdac.toLowerCase().includes(q);
    })
    .map((d) => ({ ...d, state: stockState(d) }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getDrug(id) {
  await delay(50);
  const d = _drugs.find((x) => x.id === id);
  return d ? { ...d, state: stockState(d) } : null;
}

// Dispense a quantity of a drug to a patient. Guards against overselling.
export async function dispense({ drugId, patientId, patientName, hospitalNo, quantity }) {
  await delay();
  const drug = _drugs.find((d) => d.id === drugId);
  if (!drug) throw new Error("Drug not found.");
  const qty = parseInt(quantity, 10);
  if (!qty || qty < 1) throw new Error("Enter a quantity of at least 1.");
  if (qty > drug.stock) throw new Error(`Only ${drug.stock} ${drug.unit}(s) in stock.`);

  const chargePrice = priceFor("pharmacy", drugId, drug.price);
  drug.stock -= qty;
  _dispenseSeq += 1;
  const record = {
    id: "disp" + Date.now(),
    ref: "DISP-" + String(_dispenseSeq).padStart(5, "0"),
    drugId,
    drugName: drug.name,
    patientId,
    patientName,
    hospitalNo,
    quantity: qty,
    unit: drug.unit,
    total: qty * chargePrice,
    at: new Date().toISOString(),
  };
  _dispenses.unshift(record);
  return record;
}

export async function listDispenses({ limit = 20 } = {}) {
  await delay(60);
  return _dispenses.slice(0, limit);
}

// Restock — used by inventory later; kept here so stock has one owner.
export async function restock(drugId, quantity) {
  await delay();
  const drug = _drugs.find((d) => d.id === drugId);
  if (!drug) throw new Error("Drug not found.");
  const qty = parseInt(quantity, 10);
  if (!qty || qty < 1) throw new Error("Enter a valid quantity.");
  drug.stock += qty;
  return { ...drug, state: stockState(drug) };
}

// Feed for the Alerts screen: drugs at or below reorder level.
export async function listLowStock() {
  await delay(60);
  return _drugs.filter((d) => stockState(d) !== "ok").map((d) => ({ ...d, state: stockState(d) }));
}

// Feed for Billing: every dispense as a priced charge.
export async function listBillableDispenses() {
  await delay(60);
  return _dispenses.map((r) => ({
    patientId: r.patientId,
    patientName: r.patientName,
    hospitalNo: r.hospitalNo,
    source: "Pharmacy",
    description: `${r.quantity} ${r.unit} · ${r.drugName}`,
    reference: r.ref,
    amount: r.total,
    at: r.at,
  }));
}
