// System service — users, roles, permissions for Administration -> Users &
// roles. Phase 1 live: every function now calls the real deployed Worker
// instead of the in-memory accountsStore.js — a staff account created here
// is immediately, genuinely sign-in capable against the real database,
// scoped server-side to the acting admin's own tenant (never trusted from
// client input, the same principle as every other tenant-scoped route).
// Enforcement of what a role can actually do still lives in src/lib/rbac.js;
// this module manages who holds which role and whether their account is active.

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

// Permission keys align to nav groups (see navGroups.js) plus an admin key —
// used only for the descriptive "what can this role see" summary on this
// screen, not for enforcement. Kept as static client-side metadata since
// it never changes per-request and doesn't need a network round trip.
export const PERMISSIONS = [
  { key: "overview", label: "Overview & alerts" },
  { key: "patient-care", label: "Patient care" },
  { key: "diagnostics", label: "Diagnostics (lab, radiology)" },
  { key: "pharmacy", label: "Pharmacy" },
  { key: "finance", label: "Finance & billing" },
  { key: "operations", label: "Operations" },
  { key: "academic", label: "Academic" },
  { key: "public-health", label: "Public health" },
  { key: "intelligence", label: "Intelligence" },
  { key: "system", label: "System administration" },
];

const ALL = PERMISSIONS.map((p) => p.key);

export const ROLES = {
  "super-admin": { label: "Super Admin", permissions: [...ALL] },
  doctor: { label: "Doctor", permissions: ["overview", "patient-care", "diagnostics", "pharmacy"] },
  nurse: { label: "Nurse", permissions: ["overview", "patient-care"] },
  "lab-scientist": { label: "Lab Scientist", permissions: ["overview", "diagnostics"] },
  radiographer: { label: "Radiographer", permissions: ["overview", "diagnostics"] },
  pharmacist: { label: "Pharmacist", permissions: ["overview", "pharmacy"] },
  cashier: { label: "Cashier", permissions: ["overview", "finance"] },
  "records-officer": { label: "Records Officer", permissions: ["overview", "patient-care"] },
};

export function roleLabel(roleKey) {
  return ROLES[roleKey]?.label || roleKey;
}

export function permissionsFor(roleKey) {
  return ROLES[roleKey]?.permissions || [];
}

export async function listUsers({ query = "" } = {}) {
  // tenantId is deliberately no longer accepted as a parameter — the
  // server derives it from the caller's own verified session, never from
  // client input. Callers that used to pass { tenantId, query } can leave
  // tenantId off entirely now; it's silently ignored if still present.
  const q = query ? `?query=${encodeURIComponent(query)}` : "";
  return apiCall(`/users${q}`);
}

/**
 * Creates a REAL, sign-in-capable account against the live database.
 */
export async function createUser({ name, email, password, role }) {
  return apiCall("/users", { method: "POST", body: { name, email, password, role } });
}

export async function updateUserRole(id, role) {
  return apiCall(`/users/${encodeURIComponent(id)}/role`, { method: "PATCH", body: { role } });
}

export async function toggleUserActive(id) {
  // tenantId no longer needed as a parameter — same reasoning as listUsers.
  return apiCall(`/users/${encodeURIComponent(id)}/toggle-active`, { method: "PATCH" });
}

export async function roleSummary() {
  // Computed client-side from listUsers() rather than a dedicated route —
  // it's pure aggregation of data the client already has to fetch anyway,
  // so a second network round trip would add latency for no real benefit.
  const users = await listUsers({});
  const counts = {};
  for (const u of users) counts[u.role] = (counts[u.role] || 0) + 1;
  return Object.entries(ROLES).map(([key, r]) => ({ key, label: r.label, count: counts[key] || 0, permissions: r.permissions }));
}
