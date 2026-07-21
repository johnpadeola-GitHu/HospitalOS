// Referral system — the structural gap for a tertiary/teaching referral
// hospital. UCH-Ibadan-scale institutions exist within a referral network:
// primary and secondary facilities refer patients UP for specialist care,
// and this hospital refers patients DOWN or ACROSS for follow-up, step-down
// care, or a service it does not offer.
//
// Two flows:
//   INBOUND  — another facility refers a patient to us
//   OUTBOUND — we refer a patient to another facility
//
// PHASE 1 LIVE, module 35 — migrated together with Outpatient Visits
// deliberately: an accepted inbound referral checks the patient into
// today's Outpatient queue, a real integration on the server (not two
// independently-persisted lists) since checkInReferral there calls the
// same internal function the outpatient route itself uses.

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

export const CLINICS = [
  "General Outpatient (GOPD)", "Family Medicine", "Internal Medicine", "Paediatrics",
  "Obstetrics & Gynaecology", "Surgical Outpatient", "Specialist Clinics",
];

export const REFERRAL_STATUS = ["received", "accepted", "declined", "checked-in", "sent", "acknowledged"];
export const STATUS_TONE = {
  received: "warn", sent: "warn", accepted: "info", acknowledged: "good",
  declined: "bad", "checked-in": "good",
};

export const FACILITY_TIERS = [
  "Primary Health Centre (PHC)", "Secondary \u2014 General Hospital", "Secondary \u2014 Specialist Clinic",
  "Tertiary \u2014 Teaching/Referral Hospital", "Private Hospital/Clinic",
];

export const URGENCY = ["Routine", "Urgent", "Emergency"];

export async function listReferrals({ direction = "all", status = "all", query = "" } = {}) {
  const params = new URLSearchParams();
  if (direction !== "all") params.set("direction", direction);
  if (status !== "all") params.set("status", status);
  if (query.trim()) params.set("query", query.trim());
  const qs = params.toString();
  return apiCall(`/referrals${qs ? `?${qs}` : ""}`);
}

export async function receiveReferral({ fromFacility, fromTier, patientName, patientPhone, age, sex, reason, urgency, clinic }) {
  return apiCall("/referrals/inbound", { method: "POST", body: { fromFacility, fromTier, patientName, patientPhone, age, sex, reason, urgency, clinic } });
}

export async function acceptReferral(id) {
  return apiCall(`/referrals/inbound/${encodeURIComponent(id)}/accept`, { method: "PATCH" });
}

export async function declineReferral(id, { reason }) {
  return apiCall(`/referrals/inbound/${encodeURIComponent(id)}/decline`, { method: "PATCH", body: { reason } });
}

export async function checkInReferral(id) {
  return apiCall(`/referrals/inbound/${encodeURIComponent(id)}/check-in`, { method: "PATCH" });
}

export async function sendReferral({ toFacility, toTier, patientId, patientName, reason, urgency }) {
  return apiCall("/referrals/outbound", { method: "POST", body: { toFacility, toTier, patientId, patientName, reason, urgency } });
}

export async function acknowledgeOutboundReferral(id) {
  return apiCall(`/referrals/outbound/${encodeURIComponent(id)}/acknowledge`, { method: "PATCH" });
}

export async function referralsSummary() {
  return apiCall("/referrals/summary");
}
