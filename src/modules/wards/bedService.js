// Bed registry.
// Source of truth for wards, beds, and occupancy. Both the bed board and
// the ADT admit/transfer flows depend on this data being correct.
//
// PHASE 1 LIVE: seventh module migrated. Bed assignment during admit/
// transfer/discharge now happens server-side, coordinated directly inside
// the same Worker request as the patient status update (see
// routes/patients.js) — a real improvement over the old in-memory version,
// where the bed and the patient record were two separate function calls
// that could, in principle, get out of step. assignBed()/releaseBedFor()
// stay exported here for direct use, calling the same backend routes.
//
// TIERS (accommodation pricing) stays entirely client-side — same
// reasoning as every other pricing table in this app.

import { priceFor } from "../../engines/pricing";

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

// Accommodation tiers — the six categories from the architecture, each with a
// nightly rate. The tier drives bed charges, so a VIP suite bills differently
// from a general bed.
export const TIERS = {
  general:     { key: "general",     label: "General Ward",     rate: 15000 },
  "semi-private": { key: "semi-private", label: "Semi-Private",  rate: 35000 },
  private:     { key: "private",     label: "Private Room",     rate: 60000 },
  suite:       { key: "suite",       label: "Private Suite",    rate: 120000 },
  vip:         { key: "vip",         label: "VIP Suite",        rate: 220000 },
  executive:   { key: "executive",   label: "Executive Suite",  rate: 350000 },
  critical:    { key: "critical",    label: "Critical Care",    rate: 180000 },
};

export const TIER_LIST = Object.values(TIERS);

export const WARD_NAMES = [
  "Medical Ward A", "Medical Ward B", "Surgical Ward A", "Surgical Ward B",
  "Semi-Private Wing", "Private Rooms", "Private Suite", "VIP Suite",
  "Executive Suite", "ICU", "HDU", "Paediatric Ward", "Maternity Ward", "Isolation Unit",
];

export async function listWards() {
  const wards = await apiCall("/wards");
  return wards.map((w) => ({ ...w, tierLabel: TIERS[w.tier]?.label, rate: TIERS[w.tier]?.rate }));
}

export async function freeBedsForWard(wardName) {
  return apiCall(`/wards/free-beds?ward=${encodeURIComponent(wardName)}`);
}

// Assign a patient to a bed directly (outside the admit/transfer flow,
// which now does this coordination server-side on its own).
export async function assignBed(bedCode, occupantId, occupantName) {
  return apiCall("/wards/assign-bed", { method: "POST", body: { bedCode, occupantId, occupantName } });
}

export async function releaseBedFor(occupantId) {
  return apiCall(`/wards/release-bed/${encodeURIComponent(occupantId)}`, { method: "PATCH" });
}

// Feed for Billing: accommodation charges for currently occupied beds.
// Bills whole nights, minimum one, at the tier rate for that ward.
export async function listBillableBedNights() {
  const occupied = await apiCall("/wards/billable-bed-nights");
  return occupied.map((b) => {
    const nights = Math.max(1, Math.ceil((Date.now() - new Date(b.since)) / 86400000));
    const tier = TIERS[b.tier];
    const nightlyRate = priceFor("accommodation", b.tier, tier.rate);
    return {
      patientId: b.patientId,
      patientName: b.patientName,
      hospitalNo: b.hospitalNo,
      source: "Accommodation",
      description: `${tier.label} \u2014 ${b.ward} ${b.bedId} (${nights} night${nights > 1 ? "s" : ""})`,
      reference: b.bedId,
      amount: nightlyRate * nights,
      at: b.since,
    };
  });
}
