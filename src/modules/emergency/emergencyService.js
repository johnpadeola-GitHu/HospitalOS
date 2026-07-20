// Emergency & observation service.
// Patients present, are triaged to an acuity level (1 = resuscitation .. 5 =
// non-urgent), and move through: waiting -> in-treatment -> observation ->
// disposition (admitted / discharged / transferred). The board orders by acuity
// first, then arrival time, so the sickest are surfaced.
//
// PHASE 1 LIVE: eleventh module migrated. Unregistered patients (e.g. a
// trauma arrival with no time to register first) are still genuinely
// supported \u2014 the server accepts a null patientId and stores the name as
// given, matching this file's original behaviour exactly.

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

// ESI-style acuity. Lower number = higher acuity.
export const ACUITY = {
  1: { label: "Resuscitation", color: "#B0281F", bg: "#F7E4E2" },
  2: { label: "Emergent", color: "#A35A2E", bg: "#FBEADB" },
  3: { label: "Urgent", color: "#8A5A17", bg: "#FBF0DC" },
  4: { label: "Less urgent", color: "#4A6329", bg: "#E6EFDF" },
  5: { label: "Non-urgent", color: "#3A5170", bg: "#E3ECF7" },
};

export const ED_STAGES = ["waiting", "in-treatment", "observation"];
export const STAGE_LABELS = {
  waiting: "Waiting",
  "in-treatment": "In treatment",
  observation: "Observation",
};

export const DISPOSITIONS = ["admitted", "discharged", "transferred"];

export async function listEncounters({ includeDisposed = false } = {}) {
  return apiCall(`/emergency/encounters?includeDisposed=${includeDisposed}`);
}

export async function presentPatient({ patientId, patientName, hospitalNo, complaint, acuity }) {
  return apiCall("/emergency/encounters", { method: "POST", body: { patientId, patientName, hospitalNo, complaint, acuity } });
}

export async function setStage(id, stage) {
  return apiCall(`/emergency/encounters/${encodeURIComponent(id)}/stage`, { method: "PATCH", body: { stage } });
}

export async function setAcuity(id, acuity) {
  return apiCall(`/emergency/encounters/${encodeURIComponent(id)}/acuity`, { method: "PATCH", body: { acuity } });
}

export async function disposePatient(id, disposition) {
  return apiCall(`/emergency/encounters/${encodeURIComponent(id)}/dispose`, { method: "PATCH", body: { disposition } });
}

export function edWaitMinutes(arrivedAt) {
  return Math.max(0, Math.round((Date.now() - new Date(arrivedAt)) / 60000));
}
