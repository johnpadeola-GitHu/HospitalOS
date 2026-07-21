// Maternity & neonatology service.
// Tracks mothers through labour -> delivered, records the delivery
// outcome and newborn(s). A newborn with a low Apgar score feeds the
// Alerts screen.
//
// PHASE 1 LIVE, module 28.

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

export const LABOUR_STAGES = ["admitted", "first-stage", "second-stage", "delivered"];
export const STAGE_LABELS = { admitted: "Admitted", "first-stage": "First stage", "second-stage": "Second stage", delivered: "Delivered" };
export const DELIVERY_MODES = ["Spontaneous vaginal", "Assisted vaginal", "Caesarean section"];

export async function listAdmissions({ includeDelivered = true } = {}) {
  return apiCall(`/maternity/admissions?includeDelivered=${includeDelivered}`);
}

export async function admitMother({ motherName, hospitalNo, gestation }) {
  return apiCall("/maternity/admissions", { method: "POST", body: { motherName, hospitalNo, gestation } });
}

export async function advanceLabour(id) {
  return apiCall(`/maternity/admissions/${encodeURIComponent(id)}/advance`, { method: "PATCH" });
}

export async function recordDelivery(id, { mode, newborns }) {
  return apiCall(`/maternity/admissions/${encodeURIComponent(id)}/delivery`, { method: "PATCH", body: { mode, newborns } });
}

// Feed for Alerts: newborns with a low 5-minute Apgar (< 7) need attention.
export async function listNeonatalAlerts() {
  return apiCall("/maternity/neonatal-alerts");
}
