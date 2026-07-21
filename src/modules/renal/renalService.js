// Renal & dialysis service.
// Two things a renal unit runs: a haemodialysis programme (patients on a
// recurring dialysis schedule, with per-session vitals and access-site
// tracking) and a CKD staging registry (patients being followed for
// chronic kidney disease, staged by eGFR, not yet or not on dialysis).
//
// PHASE 1 LIVE, module 25.

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

export const ACCESS_TYPES = ["AV Fistula", "AV Graft", "Tunnelled Catheter", "Temporary Catheter"];
export const CKD_STAGES = [
  { stage: "1", label: "Stage 1 \u2014 Normal/high eGFR with kidney damage", min: 90 },
  { stage: "2", label: "Stage 2 \u2014 Mild decrease", min: 60 },
  { stage: "3a", label: "Stage 3a \u2014 Mild-moderate decrease", min: 45 },
  { stage: "3b", label: "Stage 3b \u2014 Moderate-severe decrease", min: 30 },
  { stage: "4", label: "Stage 4 \u2014 Severe decrease", min: 15 },
  { stage: "5", label: "Stage 5 \u2014 Kidney failure (ESRD)", min: 0 },
];

export function stageForEgfr(egfr) {
  const v = parseFloat(egfr);
  if (!Number.isFinite(v)) return null;
  return CKD_STAGES.find((s) => v >= s.min) || CKD_STAGES[CKD_STAGES.length - 1];
}

export async function listDialysisPatients() {
  return apiCall("/renal/dialysis-patients");
}

export async function enrolDialysis({ patientName, hospitalNo, access, schedule, dryWeight }) {
  return apiCall("/renal/dialysis-patients", { method: "POST", body: { patientName, hospitalNo, access, schedule, dryWeight } });
}

export async function recordSession(patientId, { preWeight, postWeight, duration, ufGoal, bpPre, bpPost, complications }) {
  return apiCall(`/renal/dialysis-patients/${encodeURIComponent(patientId)}/session`, { method: "POST", body: { preWeight, postWeight, duration, ufGoal, bpPre, bpPost, complications } });
}

export async function listSessions({ patientId } = {}) {
  return apiCall(`/renal/sessions${patientId ? `?patientId=${encodeURIComponent(patientId)}` : ""}`);
}

// Feed for Alerts: dialysis overdue (missed a scheduled session).
export async function listOverdueDialysis() {
  return apiCall("/renal/overdue");
}

export async function listCkdRegistry() {
  return apiCall("/renal/ckd");
}

export async function addCkdEntry({ patientName, hospitalNo, egfr, followUp }) {
  return apiCall("/renal/ckd", { method: "POST", body: { patientName, hospitalNo, egfr, followUp } });
}

export async function renalSummary() {
  return apiCall("/renal/summary");
}
