// Sickle Cell Centre.
// A registry (genotype, baseline data), a crisis log (vaso-occlusive
// episodes), and a therapy tracker (hydroxyurea, routine transfusion
// programme).
//
// PHASE 1 LIVE, module 24.

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

export const GENOTYPES = ["SS", "SC", "S-beta thalassemia", "AS (trait, not disease)"];
export const CRISIS_TYPES = ["Vaso-occlusive (pain)", "Acute chest syndrome", "Splenic sequestration", "Aplastic crisis", "Priapism", "Stroke"];
export const CRISIS_SEVERITY = ["mild", "moderate", "severe"];
export const SEVERITY_TONE = { mild: "info", moderate: "warn", severe: "bad" };

export async function listPatients({ query = "" } = {}) {
  return apiCall(`/sickle-cell/patients${query.trim() ? `?query=${encodeURIComponent(query.trim())}` : ""}`);
}

export async function registerPatient({ patientName, hospitalNo, genotype }) {
  return apiCall("/sickle-cell/patients", { method: "POST", body: { patientName, hospitalNo, genotype } });
}

export async function toggleHydroxyurea(id) {
  return apiCall(`/sickle-cell/patients/${encodeURIComponent(id)}/hydroxyurea`, { method: "PATCH" });
}

export async function toggleTransfusionProgramme(id) {
  return apiCall(`/sickle-cell/patients/${encodeURIComponent(id)}/transfusion`, { method: "PATCH" });
}

export async function listCrises({ patientId, query = "" } = {}) {
  const params = new URLSearchParams();
  if (patientId) params.set("patientId", patientId);
  if (query.trim()) params.set("query", query.trim());
  const qs = params.toString();
  return apiCall(`/sickle-cell/crises${qs ? `?${qs}` : ""}`);
}

export async function logCrisis({ patientId, type, severity, notes }) {
  return apiCall("/sickle-cell/crises", { method: "POST", body: { patientId, type, severity, notes } });
}

export async function resolveCrisis(id, notes) {
  return apiCall(`/sickle-cell/crises/${encodeURIComponent(id)}/resolve`, { method: "PATCH", body: { notes } });
}

// Active (unresolved) severe crises feed the hospital-wide Alerts screen.
export async function listActiveSevereCrises() {
  return apiCall("/sickle-cell/severe-active");
}

export async function scdSummary() {
  return apiCall("/sickle-cell/summary");
}
