// Biobanking service — long-term specimen repository, distinct from the
// active lab worklist. A specimen here has already been through routine
// testing and is retained for research, future testing, or medico-legal
// purposes, with a defined storage location and consent basis.
//
// PHASE 1 LIVE, module 31. STORAGE_UNITS stays client-side — static
// reference data with fixed capacities.

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

export const SPECIMEN_TYPES = ["Serum", "Plasma", "Whole blood", "Tissue (FFPE)", "DNA extract", "Urine"];
export const STORAGE_UNITS = [
  { key: "F1", label: "Freezer 1 (-20\u00b0C)", capacity: 200 },
  { key: "F2", label: "Freezer 2 (-80\u00b0C)", capacity: 200 },
  { key: "LN2", label: "Liquid Nitrogen Vault", capacity: 100 },
  { key: "RT", label: "Room Temperature Archive", capacity: 500 },
];
export const CONSENT_TYPES = ["Research use", "Future clinical use only", "No further use \u2014 retain per policy"];

export async function listSpecimens({ query = "", unit = "all" } = {}) {
  const params = new URLSearchParams();
  if (unit !== "all") params.set("unit", unit);
  if (query.trim()) params.set("query", query.trim());
  const qs = params.toString();
  return apiCall(`/biobank/specimens${qs ? `?${qs}` : ""}`);
}

export async function bankSpecimen({ patientName, hospitalNo, type, volume, unit, consent, study }) {
  return apiCall("/biobank/specimens", { method: "POST", body: { patientName, hospitalNo, type, volume, unit, consent, study } });
}

export async function storageUtilisation() {
  return apiCall("/biobank/utilisation");
}

export async function biobankSummary() {
  return apiCall("/biobank/summary");
}
