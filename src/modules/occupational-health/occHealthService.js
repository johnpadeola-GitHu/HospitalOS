// Occupational Health — staff health, not patient care.
// Pre-employment screening, staff immunisation status, workplace injury
// logging, and fitness-to-work certification for hospital employees.
//
// PHASE 1 LIVE, module 29.

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

export const FITNESS_STATUS = ["Fit for duty", "Fit with restrictions", "Temporarily unfit", "Under review"];
export const STATUS_TONE = { "Fit for duty": "good", "Fit with restrictions": "warn", "Temporarily unfit": "bad", "Under review": "info" };
export const INJURY_TYPES = ["Needlestick injury", "Slip/fall", "Manual handling injury", "Chemical exposure", "Assault", "Other"];

export async function listStaff({ query = "" } = {}) {
  return apiCall(`/occupational-health/staff${query.trim() ? `?query=${encodeURIComponent(query.trim())}` : ""}`);
}

export async function registerStaff({ staffName, department }) {
  return apiCall("/occupational-health/staff", { method: "POST", body: { staffName, department } });
}

export async function updateFitness(id, status) {
  return apiCall(`/occupational-health/staff/${encodeURIComponent(id)}/fitness`, { method: "PATCH", body: { status } });
}

export async function listInjuries() {
  return apiCall("/occupational-health/injuries");
}

export async function reportInjury({ staffName, department, type, notes }) {
  return apiCall("/occupational-health/injuries", { method: "POST", body: { staffName, department, type, notes } });
}

export async function occHealthSummary() {
  return apiCall("/occupational-health/summary");
}
