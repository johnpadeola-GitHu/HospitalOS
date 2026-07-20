// Incident & Risk Management.
// Tracks adverse events, near-misses, and sentinel events as their own
// real records — distinct from the general audit trail, which logs WHO
// did WHAT for security purposes but was never meant to carry a
// root-cause analysis or a corrective action with an owner and due date.
//
// PHASE 1 LIVE, module 15. The safety fail-safe (an incident cannot be
// closed without a corrective action recorded) is now genuinely enforced
// server-side — previously client-side only, meaning a determined user
// could bypass it with browser devtools. Verified directly before
// shipping: attempted to close an incident with no corrective action,
// confirmed rejected; attempted with one recorded, confirmed allowed.

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

export const INCIDENT_TYPES = [
  "Medication error", "Patient fall", "Wrong-site/wrong-patient near-miss",
  "Equipment failure", "Healthcare-associated infection", "Communication failure",
  "Diagnostic error", "Other",
];

export const SEVERITY_LEVELS = ["Near-miss (no harm)", "Minor harm", "Moderate harm", "Severe harm", "Sentinel event"];
export const SEVERITY_TONE = {
  "Near-miss (no harm)": "muted", "Minor harm": "info", "Moderate harm": "warn",
  "Severe harm": "bad", "Sentinel event": "bad",
};
export const INCIDENT_STATUS = ["Reported", "Under investigation", "Corrective action", "Closed"];
export const STATUS_TONE = { Reported: "warn", "Under investigation": "info", "Corrective action": "info", Closed: "good" };

export async function listIncidents({ status = "all", severity = "all", query = "" } = {}) {
  const params = new URLSearchParams();
  if (status !== "all") params.set("status", status);
  if (severity !== "all") params.set("severity", severity);
  if (query.trim()) params.set("query", query.trim());
  const qs = params.toString();
  return apiCall(`/incidents${qs ? `?${qs}` : ""}`);
}

export async function reportIncident({ type, severity, patientName, hospitalNo, ward, description }) {
  return apiCall("/incidents", { method: "POST", body: { type, severity, patientName, hospitalNo, ward, description } });
}

export async function updateInvestigation(id, { rootCause, correctiveAction, actionOwner, actionDueDate }) {
  return apiCall(`/incidents/${encodeURIComponent(id)}/investigation`, { method: "PATCH", body: { rootCause, correctiveAction, actionOwner, actionDueDate } });
}

// The fail-safe (cannot close without a corrective action) is enforced
// server-side now — this call will genuinely fail with a clear error if
// that hasn't been recorded, not just show a client-side warning.
export async function advanceStatus(id, status) {
  return apiCall(`/incidents/${encodeURIComponent(id)}/status`, { method: "PATCH", body: { status } });
}

// Severe harm and sentinel events feed the hospital-wide alert system.
export async function listSeriousOpenIncidents() {
  const all = await listIncidents({});
  return all.filter((i) => (i.severity === "Severe harm" || i.severity === "Sentinel event") && i.status !== "Closed");
}

export async function incidentSummary() {
  const all = await listIncidents({});
  return {
    total: all.length,
    open: all.filter((i) => i.status !== "Closed").length,
    seriousOpen: all.filter((i) => (i.severity === "Severe harm" || i.severity === "Sentinel event") && i.status !== "Closed").length,
    closedThisPeriod: all.filter((i) => i.status === "Closed").length,
  };
}
