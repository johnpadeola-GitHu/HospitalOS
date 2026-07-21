// Rehabilitation & therapy service — physiotherapy, occupational, speech.
// Tracks therapy referrals and sessions completed vs planned.
//
// PHASE 1 LIVE, module 30.

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

export const THERAPIES = ["Physiotherapy", "Occupational Therapy", "Speech Therapy"];

export async function listRehab() {
  return apiCall("/rehab/referrals");
}

export async function logSession(id) {
  return apiCall(`/rehab/referrals/${encodeURIComponent(id)}/session`, { method: "PATCH" });
}

export async function addRehab({ patientName, hospitalNo, therapy, reason, sessionsPlanned }) {
  return apiCall("/rehab/referrals", { method: "POST", body: { patientName, hospitalNo, therapy, reason, sessionsPlanned } });
}
