// Public health service — disease surveillance, community outreach, and
// national reporting (IDSR-style). Immunisation coverage lives in its
// own, more sophisticated module (immunizationService.js) — the old
// aggregate coverage-bar data that used to live here was confirmed dead
// code (never imported anywhere) and was dropped during migration rather
// than carried forward.
//
// PHASE 1 LIVE, module 37.

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

export const NOTIFIABLE_DISEASES = ["Cholera", "Measles", "Lassa fever", "COVID-19", "Yellow fever", "Meningitis", "Diphtheria", "Mpox", "Other notifiable disease"];

export async function listSurveillance() {
  return apiCall("/public-health/surveillance");
}

export async function logCase({ disease, count, notifiable }) {
  return apiCall("/public-health/surveillance", { method: "POST", body: { disease, count, notifiable } });
}

// Feed for Alerts: notifiable diseases with a rising trend.
export async function listOutbreakSignals() {
  return apiCall("/public-health/outbreak-signals");
}

export async function listOutreach() {
  return apiCall("/public-health/outreach");
}

export async function planOutreach({ activity, date, team }) {
  return apiCall("/public-health/outreach", { method: "POST", body: { activity, date, team } });
}

export async function completeOutreach(id, reached) {
  return apiCall(`/public-health/outreach/${encodeURIComponent(id)}/complete`, { method: "PATCH", body: { reached } });
}

export const REPORT_TINT = {
  submitted: { bg: "#E6EFDF", fg: "#4A6329", label: "Submitted" },
  pending: { bg: "#FBF0DC", fg: "#8A5A17", label: "Pending" },
  overdue: { bg: "#F7E4E2", fg: "#B0281F", label: "Overdue" },
};

export async function listReports() {
  return apiCall("/public-health/reports");
}

export async function submitReport(id) {
  return apiCall(`/public-health/reports/${encodeURIComponent(id)}/submit`, { method: "PATCH" });
}
