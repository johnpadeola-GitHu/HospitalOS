// Dental & Oral Health.
// A clinic queue plus a procedure log per visit, since dental care is
// procedure-driven rather than diagnosis-driven the way a medical
// specialty clinic is.
//
// PHASE 1 LIVE, module 17. PROCEDURES catalogue stays client-side —
// static reference data.

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

export const PROCEDURES = [
  { code: "EXAM", name: "Oral examination", price: 3000 },
  { code: "SCALE", name: "Scaling & polishing", price: 8000 },
  { code: "FILL", name: "Filling (restoration)", price: 12000 },
  { code: "EXTR", name: "Extraction", price: 10000 },
  { code: "RCT", name: "Root canal treatment", price: 35000 },
  { code: "XRAY", name: "Dental X-ray", price: 5000 },
  { code: "CROWN", name: "Crown fitting", price: 60000 },
  { code: "DENT", name: "Denture fitting", price: 45000 },
];

export const QUEUE_STAGES = ["waiting", "in-chair", "completed"];

export async function listQueue({ includeCompleted = false } = {}) {
  return apiCall(`/dental/queue?includeCompleted=${includeCompleted}`);
}

export async function checkIn({ patientId, patientName, hospitalNo }) {
  return apiCall("/dental/checkin", { method: "POST", body: { patientId, patientName, hospitalNo } });
}

export async function advanceStage(id) {
  return apiCall(`/dental/visits/${encodeURIComponent(id)}/advance`, { method: "PATCH" });
}

export async function addProcedure(id, code) {
  return apiCall(`/dental/visits/${encodeURIComponent(id)}/procedure`, { method: "POST", body: { code } });
}

export async function dentalSummary() {
  return apiCall("/dental/summary");
}
