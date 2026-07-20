// VIP Services.
// The actual service differentiation a VIP patient expects beyond the
// accommodation tier itself: a named consultant of choice, a concierge
// contact, dietary preferences, and a privacy flag, tracked per admission.
//
// PHASE 1 LIVE, module 20.

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

export const VIP_TIERS = ["Private Suite", "VIP Suite", "Executive Suite"];
export const SERVICE_STATUS = ["active", "discharged"];

export async function listProfiles({ activeOnly = true } = {}) {
  return apiCall(`/vip-services/profiles?activeOnly=${activeOnly}`);
}

export async function createProfile({ patientName, hospitalNo, tier, bed, consultantOfChoice, conciergeContact, dietaryPreference, privacyFlag, notes }) {
  return apiCall("/vip-services/profiles", { method: "POST", body: { patientName, hospitalNo, tier, bed, consultantOfChoice, conciergeContact, dietaryPreference, privacyFlag, notes } });
}

export async function updateProfile(id, patch) {
  return apiCall(`/vip-services/profiles/${encodeURIComponent(id)}`, { method: "PATCH", body: patch });
}

export async function closeProfile(id) {
  return apiCall(`/vip-services/profiles/${encodeURIComponent(id)}/close`, { method: "PATCH" });
}

export async function vipSummary() {
  return apiCall("/vip-services/summary");
}
