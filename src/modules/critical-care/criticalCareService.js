// Critical-care service (ICU / HDU).
// Layers vital signs on top of the occupied ICU/HDU beds from bedService. Each
// vital is flagged against critical thresholds; a bed with any critical vital is
// "unstable" and feeds the Alerts screen as a fifth source.
//
// PHASE 1 LIVE, twelfth module — and a genuine safety fix along the way:
// the in-memory version auto-fabricated a plausible vital-signs preset the
// first time a newly occupied ICU/HDU bed was viewed, purely so the demo
// board was never empty. That's dangerous in a real system — invented
// vitals could mislead staff into thinking a patient has been assessed
// when they haven't. The server now returns vitals: null for a bed with
// no real reading yet, and this file's flagVital()/bedIsUnstable() handle
// that null case explicitly rather than assuming data always exists.

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

export const CC_WARDS = ["ICU", "HDU"];

// Vital definitions with normal + critical ranges.
export const VITALS = [
  { key: "hr", label: "Heart rate", unit: "bpm", low: 60, high: 100, critLow: 40, critHigh: 130 },
  { key: "sbp", label: "Systolic BP", unit: "mmHg", low: 90, high: 140, critLow: 80, critHigh: 180 },
  { key: "spo2", label: "SpO\u2082", unit: "%", low: 94, high: 100, critLow: 88, critHigh: null },
  { key: "rr", label: "Resp. rate", unit: "/min", low: 12, high: 20, critLow: 8, critHigh: 30 },
  { key: "temp", label: "Temp", unit: "\u00b0C", low: 36, high: 37.8, critLow: 35, critHigh: 39.5 },
];

// Flag one vital value against its thresholds. Handles a missing value
// (no reading recorded yet) explicitly rather than assuming data exists.
export function flagVital(vital, value) {
  if (value === undefined || value === null) return "unrecorded";
  const v = parseFloat(value);
  if (Number.isNaN(v)) return "unrecorded";
  if (vital.critLow != null && v <= vital.critLow) return "critical";
  if (vital.critHigh != null && v >= vital.critHigh) return "critical";
  if (vital.low != null && v < vital.low) return "low";
  if (vital.high != null && v > vital.high) return "high";
  return "normal";
}

export function bedIsUnstable(vitals) {
  if (!vitals) return false;
  return VITALS.some((vd) => flagVital(vd, vitals[vd.key]) === "critical");
}

// Build the board: occupied ICU/HDU beds with their vitals (or null if
// none recorded yet — a real, honest empty state, not fabricated data).
export async function listCriticalCare() {
  return apiCall("/critical-care/board");
}

export async function updateVitals(occupantId, vitals) {
  for (const vd of VITALS) {
    if (Number.isNaN(parseFloat(vitals[vd.key]))) throw new Error(`Enter a value for ${vd.label}.`);
  }
  return apiCall(`/critical-care/vitals/${encodeURIComponent(occupantId)}`, { method: "PATCH", body: vitals });
}

// Feed for Alerts: unstable critical-care patients.
export async function listUnstablePatients() {
  const board = await listCriticalCare();
  return board.filter((r) => r.unstable);
}
