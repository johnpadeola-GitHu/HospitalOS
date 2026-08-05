// Academic service — teaching-hospital registries: training programmes,
// clinical logbooks, CME activities, research projects, ethics submissions.
//
// PHASE 1 LIVE, module 38. Two real business rules in the ethics review
// lifecycle are now genuinely enforced server-side, not just checked in
// the UI: a decision (approved/rejected/revisions) requires a reviewer
// comment, and a submission that already has a final decision cannot be
// reopened. Verified directly before shipping: attempted an approval with
// no comment (rejected), with a comment (accepted), and attempted to
// reopen an already-approved submission (rejected).

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

/* ---------------- Training programmes ---------------- */

export async function listTraining() {
  return apiCall("/academic/training");
}
export async function addTrainingProgramme({ programme, level, lead }) {
  return apiCall("/academic/training", { method: "POST", body: { programme, level, lead } });
}
export async function enrollTrainee(id, { name, role } = {}) {
  return apiCall(`/academic/training/${encodeURIComponent(id)}/enroll`, { method: "PATCH", body: { name, role } });
}

export async function listTrainees(id) {
  return apiCall(`/academic/training/${encodeURIComponent(id)}/trainees`);
}

/* ---------------- Clinical logbooks ---------------- */

export async function listLogs() {
  return apiCall("/academic/logbooks");
}
export async function addLog({ trainee, procedure, supervisor }) {
  return apiCall("/academic/logbooks", { method: "POST", body: { trainee, procedure, supervisor } });
}

/* ---------------- CME activities ---------------- */

export async function listCME() {
  return apiCall("/academic/cme");
}
export async function addCmeActivity({ title, date, credits, category }) {
  return apiCall("/academic/cme", { method: "POST", body: { title, date, credits, category } });
}
export async function recordCmeAttendance(id) {
  return apiCall(`/academic/cme/${encodeURIComponent(id)}/attend`, { method: "PATCH" });
}

/* ---------------- Research projects ---------------- */

export const RESEARCH_STATUSES = ["recruiting", "ongoing", "analysis", "completed", "suspended"];

export async function listResearch() {
  return apiCall("/academic/research");
}
export async function registerResearch({ title, pi, dept }) {
  return apiCall("/academic/research", { method: "POST", body: { title, pi, dept } });
}
export async function updateResearchStatus(id, status) {
  return apiCall(`/academic/research/${encodeURIComponent(id)}/status`, { method: "PATCH", body: { status } });
}

/* ---------------- Ethics committee ---------------- */

export const ETHICS_STATUSES = ["submitted", "under-review", "revisions", "approved", "rejected"];
export const ETHICS_TINT = {
  submitted: { bg: "#E3ECF7", fg: "#3A5170", label: "Submitted" },
  "under-review": { bg: "#EDE7F5", fg: "#553A80", label: "Under review" },
  revisions: { bg: "#FBF0DC", fg: "#8A5A17", label: "Revisions requested" },
  approved: { bg: "#E6EFDF", fg: "#4A6329", label: "Approved" },
  rejected: { bg: "#F7E4E2", fg: "#B0281F", label: "Rejected" },
};
export const STUDY_TYPES = ["Observational", "Interventional", "Retrospective chart review", "Survey/Questionnaire", "Clinical trial"];

export async function listEthics({ status = "all" } = {}) {
  return apiCall(`/academic/ethics?status=${status}`);
}
export async function submitEthics({ title, type, pi, dept }) {
  return apiCall("/academic/ethics", { method: "POST", body: { title, type, pi, dept } });
}

// The fail-safes (comment required for a decision; no reopening a final
// decision) are enforced server-side now — this call genuinely fails with
// a clear error if violated, not just shows a client-side warning.
export async function decideEthics(id, { status, comment }) {
  return apiCall(`/academic/ethics/${encodeURIComponent(id)}/decide`, { method: "PATCH", body: { status, comment } });
}
