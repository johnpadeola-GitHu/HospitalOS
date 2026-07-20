// Chaplaincy & Pastoral Care.
// Visit requests from patients or their families, logged and routed to a
// chaplain. Deliberately small and simple — this is a support service,
// not a clinical one.
//
// PHASE 1 LIVE, module 18.

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

export const REQUEST_STATUS = ["requested", "scheduled", "completed"];
export const STATUS_TONE = { requested: "warn", scheduled: "info", completed: "good" };

export async function listRequests({ status = "all" } = {}) {
  return apiCall(`/chaplaincy/requests?status=${status}`);
}

export async function requestVisit({ patientName, hospitalNo, ward, faithPreference, notes }) {
  return apiCall("/chaplaincy/requests", { method: "POST", body: { patientName, hospitalNo, ward, faithPreference, notes } });
}

export async function advanceRequest(id) {
  return apiCall(`/chaplaincy/requests/${encodeURIComponent(id)}/advance`, { method: "PATCH" });
}

export async function chaplaincySummary() {
  return apiCall("/chaplaincy/summary");
}
