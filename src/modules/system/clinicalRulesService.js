// Clinical Decision Rules Engine — admin service.
// Same conventions as pharmacyService.js / theatreService.js exactly.

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

export const CATEGORIES = [
  "demographic", "pregnancy", "laboratory", "screening", "medication",
  "diagnostic", "procedure", "immunisation", "billing", "appointment",
];

// Only trigger events actually wired into a real backend route right now
// (Phase 2). Adding more here is safe to do ahead of the backend wiring —
// the rule will just sit inactive until its trigger event is called — but
// keeping this list honest avoids authoring rules that look live but aren't.
export const TRIGGER_EVENTS = [
  { value: "medication.prescribe", label: "Prescribing a medication", wired: true },
  { value: "procedure.schedule", label: "Scheduling a theatre case", wired: true },
  { value: "lab.order", label: "Ordering a lab test", wired: true },
  { value: "patient.mark_pregnant", label: "Marking a patient pregnant", wired: false },
  { value: "screening.recommend", label: "Screening recommendation", wired: false },
  { value: "billing.payment.post", label: "Posting a payment", wired: false },
];

export const FACTS_BY_TRIGGER = {
  "medication.prescribe": ["patient.sex", "patient.age_years", "medication.code", "medication.name", "medication.form"],
  "procedure.schedule": ["patient.sex", "patient.age_years", "procedure.code", "procedure.name"],
  "lab.order": ["patient.sex", "patient.age_years", "order.type", "order.department"],
};

export async function listRules({ category = "", enabled = "" } = {}) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (enabled !== "") params.set("enabled", enabled);
  const qs = params.toString();
  const data = await apiCall(`/clinical-rules${qs ? `?${qs}` : ""}`);
  return data.rules;
}

export async function getRule(id) {
  const data = await apiCall(`/clinical-rules/${encodeURIComponent(id)}`);
  return data.rule;
}

export async function createRule(payload) {
  return apiCall("/clinical-rules", { method: "POST", body: payload });
}

export async function updateRule(id, payload) {
  return apiCall(`/clinical-rules/${encodeURIComponent(id)}`, { method: "PUT", body: payload });
}

export async function getRuleHistory(id) {
  const data = await apiCall(`/clinical-rules/${encodeURIComponent(id)}/history`);
  return data.history;
}

export async function getEvaluationLog({ patientId = "", ruleId = "", from = "", to = "" } = {}) {
  const params = new URLSearchParams();
  if (patientId) params.set("patientId", patientId);
  if (ruleId) params.set("ruleId", ruleId);
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const qs = params.toString();
  const data = await apiCall(`/clinical-rules/evaluations${qs ? `?${qs}` : ""}`);
  return data.evaluations;
}
