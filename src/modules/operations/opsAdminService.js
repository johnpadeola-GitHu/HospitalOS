// Operations admin service — theatre/roster scheduling, facility & waste,
// support services (catering/laundry/mortuary), and visitor management.
// Lightweight registries to complete the Operations group.
//
// PHASE 1 LIVE, module 44.

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

/* -------- Scheduling & rosters -------- */

export async function listShifts() {
  return apiCall("/ops-admin/shifts");
}
export async function addShift({ unit, shift, staff }) {
  return apiCall("/ops-admin/shifts", { method: "POST", body: { unit, shift, staff } });
}

/* -------- Facility & waste -------- */

export async function listFacility() {
  return apiCall("/ops-admin/facility");
}
export async function setFacilityStatus(id, status) {
  return apiCall(`/ops-admin/facility/${encodeURIComponent(id)}/status`, { method: "PATCH", body: { status } });
}

/* -------- Support services -------- */

export async function listSupport() {
  return apiCall("/ops-admin/support");
}

/* -------- Visitor management -------- */

export async function listVisitors({ activeOnly = true } = {}) {
  return apiCall(`/ops-admin/visitors?activeOnly=${activeOnly}`);
}
export async function checkInVisitor({ name, visiting }) {
  return apiCall("/ops-admin/visitors", { method: "POST", body: { name, visiting } });
}
export async function checkOutVisitor(id) {
  return apiCall(`/ops-admin/visitors/${encodeURIComponent(id)}/check-out`, { method: "PATCH" });
}
