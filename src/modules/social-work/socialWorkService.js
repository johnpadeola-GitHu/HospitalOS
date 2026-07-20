// Medical Social Services.
// Discharge planning and indigent patient welfare — tracks the non-clinical
// barriers to a safe discharge: no caregiver at home, no funds to settle a
// bill, no transport.
//
// PHASE 1 LIVE, module 19.

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

export const REFERRAL_REASONS = [
  "Discharge planning \u2014 no caregiver at home", "Indigent patient \u2014 unable to settle bill",
  "Safeguarding concern", "Transport/logistics support", "Long-term care placement", "Other psychosocial support",
];
export const CASE_STATUS = ["open", "in-progress", "resolved", "referred-out"];
export const STATUS_TONE = { open: "warn", "in-progress": "info", resolved: "good", "referred-out": "muted" };

export async function listCases({ status = "all", query = "" } = {}) {
  const params = new URLSearchParams();
  if (status !== "all") params.set("status", status);
  if (query.trim()) params.set("query", query.trim());
  const qs = params.toString();
  return apiCall(`/social-work/cases${qs ? `?${qs}` : ""}`);
}

export async function openCase({ patientName, hospitalNo, reason, notes }) {
  return apiCall("/social-work/cases", { method: "POST", body: { patientName, hospitalNo, reason, notes } });
}

export async function updateCase(id, { status, notes }) {
  return apiCall(`/social-work/cases/${encodeURIComponent(id)}`, { method: "PATCH", body: { status, notes } });
}

export async function socialWorkSummary() {
  return apiCall("/social-work/summary");
}
