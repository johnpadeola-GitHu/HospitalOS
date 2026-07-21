// Outpatient (GOPD) visit queue.
// A visit is a patient's attendance at a clinic on a given day, moving
// through queue states. Reuses patientService for patient identity.
//
// PHASE 1 LIVE, module 34. Also called server-side by Referrals — an
// accepted inbound referral checks the patient into this SAME queue via
// the backend's internal helper, not a separate client-side call, so the
// "one active visit at a time" rule is enforced consistently regardless
// of which screen triggered the check-in.

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

export const CLINICS = [
  "General Outpatient (GOPD)", "Family Medicine", "Internal Medicine", "Paediatrics",
  "Obstetrics & Gynaecology", "Surgical Outpatient", "Specialist Clinics",
];

export const STAGES = ["waiting", "vitals", "with-doctor", "completed"];
export const STAGE_LABELS = { waiting: "Waiting", vitals: "Vitals", "with-doctor": "With doctor", completed: "Completed" };

export async function listVisits({ clinic = "all", includeCompleted = false } = {}) {
  return apiCall(`/outpatient/visits?clinic=${encodeURIComponent(clinic)}&includeCompleted=${includeCompleted}`);
}

export async function checkInVisit({ patientId, patientName, hospitalNo, clinic }) {
  return apiCall("/outpatient/visits", { method: "POST", body: { patientId, patientName, hospitalNo, clinic } });
}

export async function advanceVisit(id) {
  return apiCall(`/outpatient/visits/${encodeURIComponent(id)}/advance`, { method: "PATCH" });
}

export async function setVisitStage(id, stage) {
  return apiCall(`/outpatient/visits/${encodeURIComponent(id)}/stage`, { method: "PATCH", body: { stage } });
}

export function waitMinutes(checkedInAt) {
  return Math.max(0, Math.round((Date.now() - new Date(checkedInAt)) / 60000));
}
