// System admin service — facilities/sites and hospital settings.
//
// PHASE 1 LIVE, module 46. Settings now reads/writes the REAL tenant
// row, not a separate settings blob — name, address, phone, email, and
// logo already lived on the tenant since the very first migration; this
// just extended it rather than creating a second, competing source of
// truth for the same hospital's identity.
//
// NOT carried forward: listDocs() and listIntegrations() — confirmed
// dead code, never imported by any screen in the app. The security audit
// log moved to its own module (see securityAuditService.js) since it
// reads the real audit_log table, not a sysAdmin registry.

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

export async function listSites() {
  return apiCall("/system/sites");
}

export async function createSite({ name, type, beds }) {
  return apiCall("/system/sites", { method: "POST", body: { name, type, beds } });
}

export async function toggleSite(id) {
  return apiCall(`/system/sites/${encodeURIComponent(id)}/toggle`, { method: "PATCH" });
}

export async function getSettings() {
  return apiCall("/system/settings");
}

export async function updateSettings(patch) {
  return apiCall("/system/settings", { method: "PATCH", body: patch });
}

export async function uploadLogo(file) {
  const token = localStorage.getItem("hospitalos_session_token");
  const formData = new FormData();
  formData.append("logo", file);
  let res, data;
  try {
    res = await fetch("https://hospitalos-api.johnpadeola.workers.dev/system/logo", {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    data = await res.json();
  } catch {
    throw new Error("Couldn't reach the server. Check your connection.");
  }
  if (!res.ok) throw new Error(data.error || "Upload failed.");
  return data; // { logoUrl }
}
