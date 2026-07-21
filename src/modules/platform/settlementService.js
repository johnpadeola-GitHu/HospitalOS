// Settlement & metering service — the AgoroX revenue side.
//
// PHASE 1 LIVE. Settlement cycles are now computed from the REAL payments
// table, platform-wide (AgoroX aggregates fees across every hospital
// customer into one payout cycle, not per-tenant) — verified the 15-day
// cycle boundary math directly before shipping, including year-boundary
// and month-length edge cases (Dec 2025 -> Jan 2026, February with 28 days).
// Usage metering is real per-tenant counts from the actual patients,
// lab_orders, radiology_studies, dispenses, and accounts tables.
//
// DELIBERATELY NOT REAL: revenue mix by module. Payments don't capture
// what they were for at recording time — a single payment can cover a
// mix of theatre, lab, pharmacy, and bed charges at once, an
// already-documented pre-existing gap. Computing this honestly would need
// either a schema change to how payments are recorded, or duplicating
// every module's static pricing catalogue server-side. Rather than keep
// showing the old fabricated bar chart, this now returns nothing, and the
// screen shows that plainly instead of numbers that were never real.

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

export const PLATFORM_FEE_RATE = 0.0325; // 3.25%
export const SETTLEMENT_STATUS = ["pending", "processing", "settled", "failed"];
export const STATUS_TONE = { pending: "warn", processing: "info", settled: "good", failed: "bad", "in-progress": "muted" };

export async function listSettlements() {
  return apiCall("/platform/settlements");
}

// Finalises the most recently completed 15-day cycle into a real,
// permanent record — idempotent, safe to call more than once.
export async function closeCurrentCycle() {
  return apiCall("/platform/settlements/close-cycle", { method: "POST" });
}

export async function advanceSettlement(id) {
  return apiCall(`/platform/settlements/${encodeURIComponent(id)}/advance`, { method: "PATCH" });
}

export async function settlementSummary() {
  return apiCall("/platform/settlements/summary");
}

export async function payoutAccount() {
  return apiCall("/platform/payout-account");
}

export async function listUsage() {
  return apiCall("/platform/usage");
}

export async function usageSummary() {
  return apiCall("/platform/usage/summary");
}

// Honestly empty — see the file header for why this can't be computed
// from real data yet without either a schema change or duplicating every
// module's pricing catalogue server-side.
export async function revenueMix() {
  return [];
}
