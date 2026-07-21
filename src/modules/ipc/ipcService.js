// Infection Prevention & Control (IPC).
// Internal — hospital-acquired infections, isolation precautions on the
// wards, and outbreak thresholds within the facility itself, distinct
// from Public Health's community-facing disease surveillance.
//
// PHASE 1 LIVE, module 26.

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

export const HAI_TYPES = [
  "Surgical site infection", "Catheter-associated UTI", "Central line-associated bloodstream infection",
  "Ventilator-associated pneumonia", "Clostridioides difficile", "MRSA colonisation/infection", "Other HAI",
];
export const PRECAUTION_TYPES = ["Standard", "Contact", "Droplet", "Airborne", "Contact + Droplet"];
export const HAI_STATUS = ["open", "under-investigation", "resolved"];
export const STATUS_TONE = { open: "warn", "under-investigation": "info", resolved: "good" };

export async function listHaiCases({ status = "all", query = "" } = {}) {
  const params = new URLSearchParams();
  if (status !== "all") params.set("status", status);
  if (query.trim()) params.set("query", query.trim());
  const qs = params.toString();
  return apiCall(`/ipc/hai-cases${qs ? `?${qs}` : ""}`);
}

export async function reportHai({ patientName, hospitalNo, type, ward, bed, notes }) {
  return apiCall("/ipc/hai-cases", { method: "POST", body: { patientName, hospitalNo, type, ward, bed, notes } });
}

export async function updateHaiStatus(id, status) {
  return apiCall(`/ipc/hai-cases/${encodeURIComponent(id)}/status`, { method: "PATCH", body: { status } });
}

export async function listIsolations({ activeOnly = true } = {}) {
  return apiCall(`/ipc/isolations?activeOnly=${activeOnly}`);
}

export async function startIsolation({ patientName, hospitalNo, ward, bed, precaution, reason }) {
  return apiCall("/ipc/isolations", { method: "POST", body: { patientName, hospitalNo, ward, bed, precaution, reason } });
}

export async function endIsolation(id) {
  return apiCall(`/ipc/isolations/${encodeURIComponent(id)}/end`, { method: "PATCH" });
}

export async function checkOutbreakThreshold() {
  return apiCall("/ipc/outbreaks");
}

export async function ipcSummary() {
  return apiCall("/ipc/summary");
}
