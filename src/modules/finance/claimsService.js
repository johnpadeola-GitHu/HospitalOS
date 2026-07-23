// Insurance & NHIA claims service.
// NHIA: National Health Insurance Authority (formerly NHIS), per the
// National Health Insurance Authority Act 2022.
// A claim is raised against a patient's charges to an insurer and moves:
// submitted -> approved | rejected -> paid (approved only).
//
// PHASE 1 LIVE, module 41. The lifecycle guards (only a submitted claim
// can be approved/rejected, only an approved claim can be marked paid)
// are now genuinely enforced server-side. Tested directly before
// shipping: tried marking a submitted claim paid without approval first
// (rejected), tried re-approving an already-approved claim (rejected),
// confirmed the normal submitted -> approved -> paid path works.

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

export const INSURERS = ["NHIA", "Hygeia HMO", "AXA Mansard", "Reliance HMO", "Avon HMO"];
export const CLAIM_STATUSES = ["submitted", "approved", "rejected", "paid"];
export const STATUS_LABELS = { submitted: "Submitted", approved: "Approved", rejected: "Rejected", paid: "Paid" };

export async function listClaims({ status = "all" } = {}) {
  return apiCall(`/finance/claims?status=${status}`);
}

export async function createClaim({ patientId, insurer, amount, copayAmount = 0 }) {
  return apiCall("/finance/claims", { method: "POST", body: { patientId, insurer, amount, copayAmount } });
}

export async function collectCopay(id, method = "Cash") {
  return apiCall(`/finance/claims/${encodeURIComponent(id)}/collect-copay`, { method: "POST", body: { method } });
}

export async function setClaimStatus(id, status) {
  return apiCall(`/finance/claims/${encodeURIComponent(id)}/status`, { method: "PATCH", body: { status } });
}

export async function claimsSummary() {
  return apiCall("/finance/claims/summary");
}
