// Staff directory search — a narrow lookup, separate from the admin-only
// Users & Roles screen. Calls GET /staff/search, gated behind area
// "overview" on the backend so any signed-in clinical role can find a
// colleague, not just super-admin.

const API_URL = "https://hospitalos-api.johnpadeola.workers.dev";

function authHeaders() {
  const token = localStorage.getItem("hospitalos_session_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function searchStaff({ query = "", role = "" } = {}) {
  const params = new URLSearchParams();
  if (query.trim()) params.set("query", query.trim());
  if (role) params.set("role", role);
  let res, data;
  try {
    res = await fetch(`${API_URL}/staff/search?${params.toString()}`, {
      headers: { "Content-Type": "application/json", ...authHeaders() },
    });
    data = await res.json();
  } catch {
    return [];
  }
  if (!res.ok) return [];
  return data;
}
