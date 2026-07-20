// Geriatric Unit — a dedicated inpatient ward. What makes geriatric care
// different from general admission is the Comprehensive Geriatric
// Assessment (CGA): falls risk, polypharmacy, cognitive screening, and
// frailty — captured on admission, not folded into a generic vitals chart.
//
// PHASE 1 LIVE, module 21.

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

export const FRAILTY_LEVELS = ["Very fit", "Well", "Managing well", "Vulnerable", "Mildly frail", "Moderately frail", "Severely frail"];
export const FRAILTY_TONE = {
  "Very fit": "good", Well: "good", "Managing well": "good",
  Vulnerable: "warn", "Mildly frail": "warn", "Moderately frail": "bad", "Severely frail": "bad",
};
export const COGNITIVE_SCREEN = ["Normal", "Mild impairment suspected", "Moderate-severe impairment suspected", "Not assessed"];

export async function listPatients() {
  return apiCall("/geriatric/patients");
}

export async function admitPatient({ patientName, hospitalNo, age, bed, fallsRiskScore, medicationCount, cognitiveScreen, frailty, notes }) {
  return apiCall("/geriatric/patients", { method: "POST", body: { patientName, hospitalNo, age, bed, fallsRiskScore, medicationCount, cognitiveScreen, frailty, notes } });
}

export async function updateAssessment(id, patch) {
  return apiCall(`/geriatric/patients/${encodeURIComponent(id)}`, { method: "PATCH", body: patch });
}

// High falls risk (score >= 4) or 5+ medications (polypharmacy) feed the
// hospital-wide alert feed — both are established geriatric risk flags.
export async function listHighRiskPatients() {
  return apiCall("/geriatric/high-risk");
}

export async function geriatricSummary() {
  return apiCall("/geriatric/summary");
}
