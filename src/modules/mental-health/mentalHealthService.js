// Mental Health Unit — a dedicated psychiatric ward. Inpatient psychiatric
// care has safety requirements a general ward record does not: admission
// status (voluntary/involuntary), risk flags, and an observation level
// that can change hour to hour, not just at admission.
//
// PHASE 1 LIVE, module 22.

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

export const ADMISSION_STATUS = ["Voluntary", "Involuntary (assessment)", "Involuntary (treatment order)"];
export const OBSERVATION_LEVELS = ["Routine (hourly)", "Close (15-minute)", "Constant (1:1)"];
export const OBS_TONE = { "Routine (hourly)": "good", "Close (15-minute)": "warn", "Constant (1:1)": "bad" };
export const RISK_FLAGS = ["Self-harm risk", "Suicide risk", "Risk to others", "Absconding risk", "Vulnerable to exploitation"];

export async function listPatients() {
  return apiCall("/mental-health/patients");
}

export async function admitPatient({ patientName, hospitalNo, bed, admissionStatus, observationLevel, riskFlags, notes }) {
  return apiCall("/mental-health/patients", { method: "POST", body: { patientName, hospitalNo, bed, admissionStatus, observationLevel, riskFlags, notes } });
}

export async function updateObservation(id, observationLevel) {
  return apiCall(`/mental-health/patients/${encodeURIComponent(id)}/observation`, { method: "PATCH", body: { observationLevel } });
}

export async function updateRiskFlags(id, riskFlags) {
  return apiCall(`/mental-health/patients/${encodeURIComponent(id)}/risk-flags`, { method: "PATCH", body: { riskFlags } });
}

// Constant (1:1) observation or any active risk flag feeds the hospital-wide
// alert feed — this is the highest-acuity population in the building.
export async function listHighAcuityPatients() {
  return apiCall("/mental-health/high-acuity");
}

export async function mhuSummary() {
  return apiCall("/mental-health/summary");
}
