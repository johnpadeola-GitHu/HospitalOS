// Security & audit — reads the REAL server-side audit_log table via the
// backend, not the disconnected client-side in-memory log that used to
// live in src/lib/audit.js. That file's record()/listAudit() are still
// used internally by lib/audit.js for its own bookkeeping, but this
// service is what the Security screen now actually calls.
//
// PHASE 1 LIVE. This closes a real gap found during migration: the
// Security & Audit screen was showing a client-side log that grew ONLY
// from modules not yet migrated to the real backend — meaning as more of
// the app was moved to D1 over this whole effort, the screen showed LESS
// of the real activity over time, not more. The actual, comprehensive,
// tamper-evident trail was sitting in D1 the entire time, invisible to
// the one screen meant to show it.

const API_URL = "https://hospitalos-api.johnpadeola.workers.dev";

function authHeaders() {
  const token = localStorage.getItem("hospitalos_session_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiCall(path) {
  let res, data;
  try {
    res = await fetch(`${API_URL}${path}`, { headers: authHeaders() });
    data = await res.json();
  } catch {
    throw new Error("Couldn't reach the server. Check your connection and try again.");
  }
  if (!res.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

export async function listAuditEntries({ limit = 200, action = "all", actor = "all", query = "" } = {}) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (action !== "all") params.set("action", action);
  if (actor !== "all") params.set("actor", actor);
  if (query.trim()) params.set("query", query.trim());
  return apiCall(`/system/audit?${params.toString()}`);
}

export async function auditStats() {
  return apiCall("/system/audit/stats");
}

export async function auditActors() {
  return apiCall("/system/audit/actors");
}

export async function verifyChain() {
  return apiCall("/system/audit/verify");
}
