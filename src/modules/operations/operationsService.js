// Operations service — support services.
// Three domains sharing one service module:
//  - CSSD: sterilization cycles (load -> sterilizing -> ready -> issued)
//  - Biomedical: equipment register with maintenance status
//  - Fleet: vehicles/ambulances with availability and service due
//
// PHASE 1 LIVE, module 43. Found and fixed the stuck-loading bug pattern
// (closed across dozens of instances a few rounds back) in all seven of
// this module's screens along the way — none had been touched yet since
// none were previously migrated.

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

export const CSSD_STAGES = ["loaded", "sterilizing", "ready", "issued"];
export const CSSD_LABELS = { loaded: "Loaded", sterilizing: "Sterilizing", ready: "Ready", issued: "Issued" };

export async function listCssd() {
  return apiCall("/operations/cssd");
}
export async function createCssdBatch({ contents, autoclave }) {
  return apiCall("/operations/cssd", { method: "POST", body: { contents, autoclave } });
}
export async function advanceCssd(id) {
  return apiCall(`/operations/cssd/${encodeURIComponent(id)}/advance`, { method: "PATCH" });
}

export const EQUIP_STATUS = {
  operational: { label: "Operational", color: "#4A6329", bg: "#E6EFDF" },
  "due-service": { label: "Service due", color: "#8A5A17", bg: "#FBF0DC" },
  "under-repair": { label: "Under repair", color: "#B0281F", bg: "#F7E4E2" },
};

export async function listEquipment() {
  return apiCall("/operations/equipment");
}
export async function createEquipment({ name, category, location, vendor, year }) {
  return apiCall("/operations/equipment", { method: "POST", body: { name, category, location, vendor, year } });
}
export async function setEquipmentStatus(id, status) {
  return apiCall(`/operations/equipment/${encodeURIComponent(id)}/status`, { method: "PATCH", body: { status } });
}

export const VEHICLE_STATUS = {
  available: { label: "Available", color: "#4A6329", bg: "#E6EFDF" },
  "on-call": { label: "On call", color: "#8A5A17", bg: "#FBF0DC" },
  "out-of-service": { label: "Out of service", color: "#B0281F", bg: "#F7E4E2" },
};

export async function listFleet() {
  return apiCall("/operations/fleet");
}
export async function createVehicle({ reg, type, model }) {
  return apiCall("/operations/fleet", { method: "POST", body: { reg, type, model } });
}
export async function setVehicleStatus(id, status) {
  return apiCall(`/operations/fleet/${encodeURIComponent(id)}/status`, { method: "PATCH", body: { status } });
}

// Feed for Alerts: equipment under repair or vehicles out of service.
export async function listOpsIssues() {
  return apiCall("/operations/issues");
}
