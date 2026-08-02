import { priceFor } from "../../engines/pricing";

// Pharmacy service.
// Holds the drug inventory (stock, reorder level, NAFDAC no.) and the dispense
// flow: dispensing to a patient decrements stock and records the event.
// A drug at/below its reorder level is low-stock; below 1 is out of stock.
//
// PHASE 1 LIVE: third module migrated to the real deployed Worker, after
// patients and lab. Unlike lab's test catalogue (universal reference data,
// kept client-side), drug stock is genuinely per-tenant, so this migration
// moved the whole inventory into D1, not just the transaction log.

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

export function stockState(drug) {
  if (drug.stock <= 0) return "out";
  if (drug.stock <= drug.reorder) return "low";
  return "ok";
}

export async function listDrugs({ query = "", onlyLow = false } = {}) {
  const params = new URLSearchParams();
  if (query.trim()) params.set("query", query.trim());
  if (onlyLow) params.set("onlyLow", "true");
  const qs = params.toString();
  return apiCall(`/pharmacy/drugs${qs ? `?${qs}` : ""}`);
}

export async function getDrug(id) {
  const all = await listDrugs({});
  return all.find((d) => d.id === id) || null;
}

// Dispense a quantity of a drug to a patient. Guards against overselling —
// enforced server-side now, not just by a client-side check that could be
// bypassed the way a disabled button always could be. The charge price is
// computed here (via the pricing engine's own override logic, unchanged)
// and sent to the server, since the pricing engine itself isn't migrated
// yet — this preserves per-tenant price overrides exactly as they worked
// before this migration, rather than silently reverting every dispense to
// the base catalogue price.
export async function dispense({ drugId, patientId, quantity }) {
  const drug = await getDrug(drugId);
  const unitPrice = drug ? priceFor("pharmacy", drugId, drug.price) : undefined;
  return apiCall("/pharmacy/dispense", { method: "POST", body: { drugId, patientId, quantity, unitPrice } });
}

export async function listDispenses({ limit = 20 } = {}) {
  return apiCall(`/pharmacy/dispenses?limit=${limit}`);
}

// Restock — now creates a BATCH with an optional batch number and expiry date.
export async function restock(drugId, { quantity, batchNo, expiry } = {}) {
  return apiCall(`/pharmacy/drugs/${encodeURIComponent(drugId)}/restock`, {
    method: "PATCH", body: { quantity, batchNo, expiry },
  });
}

// Batches held for a drug, FEFO order, with days-to-expiry.
export async function listBatches(drugId) {
  return apiCall(`/pharmacy/drugs/${encodeURIComponent(drugId)}/batches`);
}

// Expiry alerts: batches expired or expiring within `withinDays` (default 90).
export async function listExpiryAlerts({ withinDays = 90 } = {}) {
  return apiCall(`/pharmacy/expiry-alerts?withinDays=${withinDays}`);
}

// Feed for the Alerts screen: drugs at or below reorder level.
export async function listLowStock() {
  return listDrugs({ onlyLow: true });
}

// Feed for Billing: every dispense as a priced charge.
export async function listBillableDispenses() {
  const dispenses = await listDispenses({ limit: 1000 });
  return dispenses.map((r) => ({
    patientId: r.patientId,
    patientName: r.patientName,
    hospitalNo: r.hospitalNo,
    source: "Pharmacy",
    description: `${r.quantity} ${r.unit} \u00b7 ${r.drugName}`,
    reference: r.ref,
    amount: r.total,
    at: r.at,
  }));
}

// --- Prescription queue (doctor prescribes -> pharmacy fulfils) ---
export async function listPrescriptions(status = "pending") {
  return apiCall(`/pharmacy/prescriptions?status=${encodeURIComponent(status)}`);
}
export async function createPrescription({ patientId, drugId, quantity, dosage, notes }) {
  return apiCall("/pharmacy/prescriptions", { method: "POST", body: { patientId, drugId, quantity, dosage, notes } });
}
export async function fulfillPrescription(id) {
  return apiCall(`/pharmacy/prescriptions/${encodeURIComponent(id)}/fulfill`, { method: "POST" });
}
export async function cancelPrescription(id, reason) {
  return apiCall(`/pharmacy/prescriptions/${encodeURIComponent(id)}/cancel`, { method: "POST", body: { reason } });
}

// Check a candidate drug against the patient's current medications.
export async function checkInteractions(patientId, drugId) {
  return apiCall(`/pharmacy/check-interactions/${encodeURIComponent(patientId)}?drugId=${encodeURIComponent(drugId)}`);
}
