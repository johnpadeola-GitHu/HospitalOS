// Privacy & consent — Nigeria Data Protection Act 2023 (NDPA), enforced by
// the Nigeria Data Protection Commission (NDPC), successor to the 2019 NDPR.
// A hospital handling health data (a "special category" under the Act)
// needs two things this module provides: recorded consent for processing,
// and a tracked route for data-subject rights requests.
//
// PHASE 1 LIVE, module 45. The real business rule (a closing note is
// required to fulfil or decline a DSAR) is now genuinely enforced
// server-side. Verified directly before shipping: attempted to fulfil a
// request with no closing note (rejected), with a note (accepted), and
// confirmed moving to in-progress needs no note (allowed) — same pattern
// as the ethics review fail-safe elsewhere in this app.

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

export const CONSENT_PURPOSES = [
  "Clinical care & treatment", "Billing & insurance claims", "Research (de-identified)",
  "Research (identified, study-specific)", "Marketing & appointment reminders", "Sharing with a named referral facility",
];
export const CONSENT_STATUS = ["granted", "withdrawn", "expired"];
export const DSAR_TYPES = ["Access request", "Rectification", "Erasure", "Restriction of processing", "Data portability"];
export const DSAR_STATUS = ["received", "in-progress", "fulfilled", "declined"];
export const DSAR_TONE = { received: "warn", "in-progress": "info", fulfilled: "good", declined: "bad" };

/* ---------------- Consent ---------------- */

export async function listConsents({ patientQuery = "", status = "all" } = {}) {
  const params = new URLSearchParams();
  if (status !== "all") params.set("status", status);
  if (patientQuery.trim()) params.set("patientQuery", patientQuery.trim());
  const qs = params.toString();
  return apiCall(`/privacy/consents${qs ? `?${qs}` : ""}`);
}

export async function recordConsent({ patientName, hospitalNo, purpose, method }) {
  return apiCall("/privacy/consents", { method: "POST", body: { patientName, hospitalNo, purpose, method } });
}

export async function withdrawConsent(id) {
  return apiCall(`/privacy/consents/${encodeURIComponent(id)}/withdraw`, { method: "PATCH" });
}

/* ---------------- Data Subject Access Requests (DSARs) ---------------- */

export async function listDsars({ status = "all", query = "" } = {}) {
  const params = new URLSearchParams();
  if (status !== "all") params.set("status", status);
  if (query.trim()) params.set("query", query.trim());
  const qs = params.toString();
  return apiCall(`/privacy/dsars${qs ? `?${qs}` : ""}`);
}

export async function fileDsar({ patientName, hospitalNo, type, detail }) {
  return apiCall("/privacy/dsars", { method: "POST", body: { patientName, hospitalNo, type, detail } });
}

// The fail-safe (a closing note required to fulfil/decline) is enforced
// server-side now, not just checked in the UI.
export async function updateDsar(id, { status, note }) {
  return apiCall(`/privacy/dsars/${encodeURIComponent(id)}`, { method: "PATCH", body: { status, note } });
}

export async function listOverdueDsars() {
  return apiCall("/privacy/dsars-overdue");
}

export async function privacySummary() {
  return apiCall("/privacy/summary");
}
