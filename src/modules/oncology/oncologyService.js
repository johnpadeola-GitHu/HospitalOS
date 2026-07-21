// Oncology service.
// A cancer patient registry with diagnosis + TNM stage, on a treatment
// pathway. Chemotherapy patients have a cycle count (n of total); a
// patient overdue for their next cycle feeds the Alerts screen.
//
// PHASE 1 LIVE, module 27.

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

export const CANCER_SITES = ["Breast", "Cervical", "Prostate", "Colorectal", "Liver", "Lung", "Lymphoma", "Leukaemia", "Head & Neck", "Ovarian"];
export const STAGES = ["I", "II", "III", "IV"];
export const MODALITIES = ["Chemotherapy", "Radiotherapy", "Surgery", "Palliative"];
export const PATHWAY_STATUS = ["active", "remission", "palliative"];
export const STATUS_LABELS = { active: "Active treatment", remission: "Remission", palliative: "Palliative" };

export async function listOncology({ status = "all" } = {}) {
  return apiCall(`/oncology/patients?status=${status}`);
}

export async function registerOncology({ patientName, hospitalNo, site, stage, modality, cyclesTotal }) {
  return apiCall("/oncology/patients", { method: "POST", body: { patientName, hospitalNo, site, stage, modality, cyclesTotal } });
}

export async function recordCycle(id) {
  return apiCall(`/oncology/patients/${encodeURIComponent(id)}/cycle`, { method: "PATCH" });
}

export async function setStatus(id, status) {
  return apiCall(`/oncology/patients/${encodeURIComponent(id)}/status`, { method: "PATCH", body: { status } });
}

// Feed for Alerts: chemo patients overdue for their next cycle.
export async function listOverdueChemo() {
  return apiCall("/oncology/overdue-chemo");
}
